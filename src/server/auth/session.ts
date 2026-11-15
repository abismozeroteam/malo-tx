import "server-only";
import type { Database } from "../db";
import { randomToken, sha256 } from "../tokens";

export const SESSION_MS = 12 * 3600_000;

export type SessionUser = { id: string; displayName: string };

const newSession = () => ({ token: randomToken(32), expiresAt: new Date(Date.now() + SESSION_MS) });

export async function signUp(db: Database, displayName: string) {
  const { token, expiresAt } = newSession();
  const [row] = await db.query<{ user_id: string }>(
    `WITH u AS (INSERT INTO users (display_name) VALUES ($1) RETURNING id)
     INSERT INTO sessions (token_hash, user_id, expires_at) SELECT $2, id, $3 FROM u
     RETURNING user_id`,
    [displayName, sha256(token), expiresAt],
  );
  return { userId: row.user_id, token, expiresAt };
}

export async function signInByPhone(db: Database, phone: string, displayName: string) {
  const { token, expiresAt } = newSession();
  const [row] = await db.query<{ user_id: string }>(
    `WITH u AS (
       INSERT INTO users (phone, display_name, last_inbound_at) VALUES ($1, $2, now())
       ON CONFLICT (phone) DO UPDATE SET last_inbound_at = now()
       RETURNING id
     )
     INSERT INTO sessions (token_hash, user_id, expires_at) SELECT $3, id, $4 FROM u
     RETURNING user_id`,
    [phone, displayName, sha256(token), expiresAt],
  );
  return { userId: row.user_id, token, expiresAt };
}

export async function findSessionUser(db: Database, token: string, now = new Date()): Promise<SessionUser | null> {
  const [row] = await db.query<{ id: string; display_name: string }>(
    `SELECT u.id, u.display_name
       FROM sessions s JOIN users u ON u.id = s.user_id
      WHERE s.token_hash = $1 AND s.revoked_at IS NULL AND s.expires_at > $2`,
    [sha256(token), now],
  );
  return row ? { id: row.id, displayName: row.display_name } : null;
}

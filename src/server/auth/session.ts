import "server-only";
import type { Database } from "../db";
import { randomToken, sha256 } from "../tokens";

export const SESSION_DAYS = 30;

export type SessionUser = { id: string; displayName: string };

export async function createUser(db: Database, displayName: string): Promise<string> {
  const [row] = await db.query<{ id: string }>("INSERT INTO users (display_name) VALUES ($1) RETURNING id", [displayName]);
  return row.id;
}

export async function createSession(db: Database, userId: string, now = new Date()) {
  const token = randomToken(32);
  const expiresAt = new Date(now.getTime() + SESSION_DAYS * 86_400_000);
  await db.query("INSERT INTO sessions (token_hash, user_id, created_at, expires_at) VALUES ($1, $2, $3, $4)", [
    sha256(token),
    userId,
    now,
    expiresAt,
  ]);
  return { token, expiresAt };
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

export async function revokeSession(db: Database, token: string) {
  await db.query("UPDATE sessions SET revoked_at = now() WHERE token_hash = $1 AND revoked_at IS NULL", [sha256(token)]);
}

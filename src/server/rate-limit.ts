import "server-only";
import type { Database } from "./db";

export const RATE_LIMITS = {
  gatePerIp: 10,
  debtsPerUser: 30,
  debtsPerIp: 60,
};

type Limit = { key: string; max: number };

export async function consume(db: Database, limits: Limit[], windowSeconds: number, now = Date.now()): Promise<boolean> {
  const window = Math.floor(now / 1000 / windowSeconds);
  const keyed = new Map(limits.map((l) => [`${l.key}:${window}`, l.max]));
  const rows = await db.query<{ key: string; count: number }>(
    `WITH pruned AS (DELETE FROM rate_limits WHERE expires_at < now())
     INSERT INTO rate_limits (key, count, expires_at)
     SELECT k, 1, to_timestamp($2) FROM unnest($1::text[]) AS k
     ON CONFLICT (key) DO UPDATE SET count = rate_limits.count + 1
     RETURNING key, count`,
    [[...keyed.keys()], (window + 1) * windowSeconds],
  );
  return rows.every((row) => row.count <= keyed.get(row.key)!);
}

export function clientIp(headers: Headers): string {
  return headers.get("x-real-ip") ?? headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

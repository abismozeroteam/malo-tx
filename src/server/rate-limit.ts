import "server-only";
import { PEY_CHECK_SECONDS } from "@/contracts/debtor-page";
import type { Database } from "./db";

const HOUR = 3600;
const DAY = 86_400;

export const RATE_LIMITS = {
  gatePerIp: { max: 10, seconds: 600 },
  debtsPerUser: { max: 30, seconds: HOUR },
  debtsPerIp: { max: 60, seconds: HOUR },
  qrPerLink: { max: 30, seconds: HOUR },
  qrPerIp: { max: 120, seconds: HOUR },
  pushesPerLinkMinute: { max: 1, seconds: 60 },
  pushesPerLink: { max: 3, seconds: DAY },
  pushesPerIp: { max: 20, seconds: DAY },
  answersPerIp: { max: 30, seconds: HOUR },
  peyChecksPerLink: { max: 1, seconds: PEY_CHECK_SECONDS },
};

export type Limit = { key: string; max: number; seconds: number };

export const limit = (key: string, rule: { max: number; seconds: number }): Limit => ({ key, ...rule });

export async function consume(db: Database, limits: Limit[], now = Date.now()): Promise<boolean> {
  const windows = limits.map((l) => {
    const window = Math.floor(now / 1000 / l.seconds);
    return { key: `${l.key}:${l.seconds}:${window}`, max: l.max, expiresAt: new Date((window + 1) * l.seconds * 1000) };
  });
  const rows = await db.query<{ key: string; count: number }>(
    `WITH pruned AS (DELETE FROM rate_limits WHERE expires_at < now())
     INSERT INTO rate_limits (key, count, expires_at)
     SELECT k, 1, e FROM unnest($1::text[], $2::timestamptz[]) AS t(k, e)
     ON CONFLICT (key) DO UPDATE SET count = rate_limits.count + 1
     RETURNING key, count`,
    [windows.map((w) => w.key), windows.map((w) => w.expiresAt)],
  );
  const max = new Map(windows.map((w) => [w.key, w.max]));
  return rows.every((row) => row.count <= max.get(row.key)!);
}

export function clientIp(headers: Headers): string {
  return headers.get("x-real-ip") ?? headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

export const ipKey = (action: string, headers: Headers) => `${action}:ip:${clientIp(headers)}`;

import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";

export function isTeamSecret(candidate: string | null | undefined): boolean {
  const expected = process.env.TEAM_SECRET;
  if (!expected || !candidate) return false;
  const a = createHash("sha256").update(candidate).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

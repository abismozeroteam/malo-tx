import "server-only";
import { timingSafeEqual } from "node:crypto";
import { sha256 } from "../tokens";

export function isTeamSecret(candidate: unknown): boolean {
  const expected = process.env.TEAM_SECRET;
  if (!expected || typeof candidate !== "string" || !candidate) return false;
  return timingSafeEqual(Buffer.from(sha256(candidate)), Buffer.from(sha256(expected)));
}

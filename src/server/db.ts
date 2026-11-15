import "server-only";
import { neon } from "@neondatabase/serverless";
import { requireEnv } from "./env";

let client: ReturnType<typeof neon> | null = null;

/** Neon HTTP client over the pooled connection string. Parameterized queries only. */
export function db() {
  client ??= neon(requireEnv("DATABASE_URL"));
  return client;
}

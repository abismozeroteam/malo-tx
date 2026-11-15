import "server-only";
import { neon } from "@neondatabase/serverless";
import { requireEnv } from "./env";

type Statement = { text: string; values: unknown[] };

export interface Database {
  query<T = Record<string, unknown>>(text: string, values?: unknown[]): Promise<T[]>;
  transaction(statements: Statement[]): Promise<void>;
}

let instance: Database | null = null;

export function db(): Database {
  if (instance) return instance;
  const sql = neon(requireEnv("DATABASE_URL"));
  instance = {
    query: async <T,>(text: string, values: unknown[] = []) => (await sql.query(text, values)) as T[],
    transaction: async (statements) => {
      await sql.transaction(statements.map((s) => sql.query(s.text, s.values)));
    },
  };
  return instance;
}

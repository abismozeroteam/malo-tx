import { PGlite } from "@electric-sql/pglite";
import { readMigrations } from "../scripts/migrations.mjs";
import type { Database } from "@/server/db";

export async function createTestDb(): Promise<Database> {
  const pg = new PGlite();
  for (const { statements } of await readMigrations()) {
    for (const statement of statements) await pg.query(statement);
  }
  return {
    query: async <T,>(text: string, values: unknown[] = []) => (await pg.query<T>(text, values)).rows,
    transaction: (statements) =>
      pg.transaction(async (tx) => {
        for (const s of statements) await tx.query(s.text, s.values);
      }),
  };
}

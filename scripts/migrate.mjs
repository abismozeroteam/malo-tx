import { neon } from "@neondatabase/serverless";
import { readMigrations } from "./migrations.mjs";

const url = process.env.DATABASE_URL;
if (!url) {
  console.log("[migrate] DATABASE_URL is not set, skipping migrations.");
  process.exit(0);
}
if (process.env.VERCEL_ENV && process.env.VERCEL_ENV !== "production") {
  console.log(`[migrate] ${process.env.VERCEL_ENV} build, skipping migrations.`);
  process.exit(0);
}

const sql = neon(url);

const [, appliedRows] = await sql.transaction([
  sql.query(
    "CREATE TABLE IF NOT EXISTS schema_migrations (name TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT now())",
  ),
  sql.query("SELECT name FROM schema_migrations"),
]);
const applied = new Set(appliedRows.map((r) => r.name));

for (const { name, statements } of await readMigrations()) {
  if (applied.has(name)) continue;
  await sql.transaction([
    ...statements.map((s) => sql.query(s)),
    sql.query("INSERT INTO schema_migrations (name) VALUES ($1)", [name]),
  ]);
  console.log(`[migrate] applied ${name}`);
}
console.log("[migrate] up to date.");

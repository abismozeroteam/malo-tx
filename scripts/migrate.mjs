import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { neon } from "@neondatabase/serverless";

const url = process.env.DATABASE_URL;
if (!url) {
  console.log("[migrate] DATABASE_URL is not set, skipping migrations.");
  process.exit(0);
}

const sql = neon(url);
const dir = path.join(process.cwd(), "db", "migrations");

await sql.query(
  "CREATE TABLE IF NOT EXISTS schema_migrations (name TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT now())",
);
const applied = new Set(
  (await sql.query("SELECT name FROM schema_migrations")).map((r) => r.name),
);

const files = (await readdir(dir)).filter((f) => f.endsWith(".sql")).sort();
for (const file of files) {
  if (applied.has(file)) continue;
  const body = await readFile(path.join(dir, file), "utf8");
  // The HTTP driver runs one statement per query.
  const statements = body
    .split(/;\s*(?:\r?\n|$)/)
    .map((s) => s.replace(/^\s*--.*$/gm, "").trim())
    .filter(Boolean);
  await sql.transaction([
    ...statements.map((s) => sql.query(s)),
    sql.query("INSERT INTO schema_migrations (name) VALUES ($1)", [file]),
  ]);
  console.log(`[migrate] applied ${file}`);
}
console.log("[migrate] up to date.");

import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

export async function readMigrations(dir = path.join(process.cwd(), "db", "migrations")) {
  const files = (await readdir(dir)).filter((f) => f.endsWith(".sql")).sort();
  return Promise.all(
    files.map(async (name) => ({
      name,
      statements: (await readFile(path.join(dir, name), "utf8"))
        .split(/;\s*(?:\r?\n|$)/)
        .map((s) => s.replace(/^\s*--.*$/gm, "").trim())
        .filter(Boolean),
    })),
  );
}

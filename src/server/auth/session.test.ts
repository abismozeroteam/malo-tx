import { beforeEach, describe, expect, it } from "vitest";
import { createTestDb } from "../../../test/db";
import type { Database } from "../db";
import { sha256 } from "../tokens";
import { findSessionUser, SESSION_MS, signUp } from "./session";

describe("sessions", () => {
  let db: Database;

  beforeEach(async () => {
    db = await createTestDb();
  });

  it("finds the user behind a valid token", async () => {
    const { userId, token } = await signUp(db, "Eduardo");
    expect(await findSessionUser(db, token)).toEqual({ id: userId, displayName: "Eduardo" });
  });

  it("stores only the token hash", async () => {
    const { token } = await signUp(db, "Eduardo");
    expect(await db.query("SELECT token_hash FROM sessions")).toEqual([{ token_hash: sha256(token) }]);
  });

  it("rejects unknown, expired and revoked tokens", async () => {
    expect(await findSessionUser(db, "nope")).toBeNull();

    const { token } = await signUp(db, "Eduardo");
    const later = new Date(Date.now() + SESSION_MS + 60_000);
    expect(await findSessionUser(db, token, later)).toBeNull();

    await db.query("UPDATE sessions SET revoked_at = now()");
    expect(await findSessionUser(db, token)).toBeNull();
  });
});


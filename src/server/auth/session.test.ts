import { beforeEach, describe, expect, it } from "vitest";
import { createTestDb } from "../../../test/db";
import type { Database } from "../db";
import { sha256 } from "../tokens";
import { createSession, createUser, findSessionUser, revokeSession, SESSION_DAYS } from "./session";

describe("sessions", () => {
  let db: Database;
  let userId: string;

  beforeEach(async () => {
    db = await createTestDb();
    userId = await createUser(db, "Eduardo");
  });

  it("finds the user behind a valid token", async () => {
    const { token } = await createSession(db, userId);
    expect(await findSessionUser(db, token)).toEqual({ id: userId, displayName: "Eduardo" });
  });

  it("stores only the token hash", async () => {
    const { token } = await createSession(db, userId);
    const rows = await db.query<{ token_hash: string }>("SELECT token_hash FROM sessions");
    expect(rows).toEqual([{ token_hash: sha256(token) }]);
  });

  it("rejects unknown, expired and revoked tokens", async () => {
    expect(await findSessionUser(db, "nope")).toBeNull();

    const { token } = await createSession(db, userId);
    const later = new Date(Date.now() + (SESSION_DAYS + 1) * 86_400_000);
    expect(await findSessionUser(db, token, later)).toBeNull();

    await revokeSession(db, token);
    expect(await findSessionUser(db, token)).toBeNull();
  });
});

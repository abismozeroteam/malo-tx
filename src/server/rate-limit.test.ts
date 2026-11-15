import { describe, expect, it } from "vitest";
import { createTestDb } from "../../test/db";
import { clientIp, consume } from "./rate-limit";

describe("consume", () => {
  it("allows up to the limit per key", async () => {
    const db = await createTestDb();
    const results = [];
    for (let i = 0; i < 4; i++) results.push(await consume(db, "k", 3, 60));
    expect(results).toEqual([true, true, true, false]);
    expect(await consume(db, "other", 3, 60)).toBe(true);
  });

  it("starts a new window once the old one ends", async () => {
    const db = await createTestDb();
    await consume(db, "k", 1, 60);
    await db.query("UPDATE rate_limits SET window_start = now() - interval '61 seconds'");
    expect(await consume(db, "k", 1, 60)).toBe(true);
  });
});

describe("clientIp", () => {
  it("prefers the platform header", () => {
    expect(clientIp(new Headers({ "x-real-ip": "1.1.1.1", "x-forwarded-for": "2.2.2.2" }))).toBe("1.1.1.1");
    expect(clientIp(new Headers({ "x-forwarded-for": "2.2.2.2, 3.3.3.3" }))).toBe("2.2.2.2");
    expect(clientIp(new Headers())).toBe("unknown");
  });
});

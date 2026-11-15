import { describe, expect, it } from "vitest";
import { createTestDb } from "../../test/db";
import { clientIp, consume } from "./rate-limit";

const now = Date.UTC(2026, 10, 15, 12, 0, 0);

describe("consume", () => {
  it("allows up to the limit per key", async () => {
    const db = await createTestDb();
    const results = [];
    for (let i = 0; i < 4; i++) results.push(await consume(db, [{ key: "k", max: 3, seconds: 60 }], now));
    expect(results).toEqual([true, true, true, false]);
    expect(await consume(db, [{ key: "other", max: 3, seconds: 60 }], now)).toBe(true);
  });

  it("fails when any of several limits is spent", async () => {
    const db = await createTestDb();
    const limits = [
      { key: "user", max: 5, seconds: 60 },
      { key: "ip", max: 1, seconds: 3600 },
    ];
    expect(await consume(db, limits, now)).toBe(true);
    expect(await consume(db, limits, now)).toBe(false);
  });

  it("starts over in the next window and prunes old rows", async () => {
    const db = await createTestDb();
    await consume(db, [{ key: "k", max: 1, seconds: 60 }], now);
    await db.query("UPDATE rate_limits SET expires_at = now() - interval '1 second'");
    expect(await consume(db, [{ key: "k", max: 1, seconds: 60 }], now + 60_000)).toBe(true);
    expect(await db.query("SELECT key FROM rate_limits")).toHaveLength(1);
  });
});

describe("clientIp", () => {
  it("prefers the platform header", () => {
    expect(clientIp(new Headers({ "x-real-ip": "1.1.1.1", "x-forwarded-for": "2.2.2.2" }))).toBe("1.1.1.1");
    expect(clientIp(new Headers({ "x-forwarded-for": "2.2.2.2, 3.3.3.3" }))).toBe("2.2.2.2");
    expect(clientIp(new Headers())).toBe("unknown");
  });
});

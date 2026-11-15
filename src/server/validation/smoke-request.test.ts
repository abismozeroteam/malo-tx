import { describe, expect, it } from "vitest";
import { smokeRequestSchema } from "./smoke-request";

describe("smokeRequestSchema", () => {
  it("normalizes the phone for a push", () => {
    expect(smokeRequestSchema.parse({ action: "push", phone: "55 1234 5678" })).toEqual({
      action: "push",
      phone: "5512345678",
    });
  });

  it("rejects a push without a valid phone", () => {
    expect(smokeRequestSchema.safeParse({ action: "push", phone: "123" }).success).toBe(false);
    expect(smokeRequestSchema.safeParse({ action: "push" }).success).toBe(false);
  });

  it.each(["../admin", "id with spaces", "x".repeat(65), ""])("rejects the lookup id %j", (id) => {
    expect(smokeRequestSchema.safeParse({ action: "tx-status", id }).success).toBe(false);
  });

  it("rejects unknown actions and empty bodies", () => {
    expect(smokeRequestSchema.safeParse({ action: "refund" }).success).toBe(false);
    expect(smokeRequestSchema.safeParse(null).success).toBe(false);
  });
});

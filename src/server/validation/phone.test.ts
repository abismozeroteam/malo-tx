import { describe, expect, it } from "vitest";
import { es } from "@/content/es";
import { phoneSchema } from "./phone";

describe("phoneSchema", () => {
  it("returns ten digits", () => {
    expect(phoneSchema.parse("+52 55 1234 5678")).toBe("5512345678");
  });

  it("explains the error in Spanish", () => {
    const result = phoneSchema.safeParse("123");
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe(es.common.invalidPhone);
  });

  it("rejects absurdly long input", () => {
    expect(phoneSchema.safeParse("5".repeat(40)).success).toBe(false);
  });
});

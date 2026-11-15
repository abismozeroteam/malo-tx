import { describe, expect, it } from "vitest";
import { phoneSchema, toTenDigitPhone } from "./phone";

describe("toTenDigitPhone", () => {
  it.each([
    ["5512345678", "5512345678"],
    ["55 1234 5678", "5512345678"],
    ["(55) 1234-5678", "5512345678"],
    ["+52 55 1234 5678", "5512345678"],
    ["+52 1 55 1234 5678", "5512345678"],
    ["5215512345678", "5512345678"],
  ])("reads %j as %s", (input, expected) => {
    expect(toTenDigitPhone(input)).toBe(expected);
  });

  it.each(["", "123", "551234567", "55123456789", "+1 415 555 0100 22", "abcdefghij"])(
    "rejects %j",
    (input) => {
      expect(toTenDigitPhone(input)).toBeNull();
    },
  );
});

describe("phoneSchema", () => {
  it("returns ten digits", () => {
    expect(phoneSchema.parse("+52 55 1234 5678")).toBe("5512345678");
  });

  it("explains the error in Spanish", () => {
    const result = phoneSchema.safeParse("123");
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe("El número debe tener 10 dígitos");
  });

  it("rejects absurdly long input", () => {
    expect(phoneSchema.safeParse("5".repeat(40)).success).toBe(false);
  });
});

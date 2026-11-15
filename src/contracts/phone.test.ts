import { describe, expect, it } from "vitest";
import { toTenDigitPhone } from "./phone";

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

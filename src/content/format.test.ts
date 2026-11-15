import { describe, expect, it } from "vitest";
import { centsFromInput, centsToInput, formatMoney } from "./format";

describe("centsFromInput", () => {
  it.each([
    ["1800", 180000],
    ["1,800.00", 180000],
    ["$ 1,800.5", 180050],
    ["0.01", 1],
    ["12.3", 1230],
  ])("reads %j as %i centavos", (input, cents) => {
    expect(centsFromInput(input)).toBe(cents);
  });

  it.each(["", "abc", "1.234", "-5", "1e3"])("rejects %j", (input) => {
    expect(centsFromInput(input)).toBeNull();
  });
});

describe("money display", () => {
  it("shows pesos with two decimals", () => {
    expect(formatMoney(180000)).toBe("$1,800.00");
    expect(formatMoney(1)).toBe("$0.01");
  });

  it("round-trips through the input format", () => {
    expect(centsFromInput(centsToInput(4550))).toBe(4550);
  });
});

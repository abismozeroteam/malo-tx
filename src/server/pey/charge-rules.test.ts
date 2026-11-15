import { describe, expect, it } from "vitest";
import { assertChargeAllowed, centsToPesos, ChargeNotAllowedError, chargeAmountCents, pesosToCents } from "./charge-rules";

describe("assertChargeAllowed", () => {
  it("allows exactly one centavo in demo mode", () => {
    expect(() => assertChargeAllowed(1, true)).not.toThrow();
  });

  it.each([2, 100, 15000])("refuses %i centavos in demo mode", (cents) => {
    expect(() => assertChargeAllowed(cents, true)).toThrow(ChargeNotAllowedError);
  });

  it("allows real amounts when demo mode is off", () => {
    expect(() => assertChargeAllowed(15000, false)).not.toThrow();
  });

  it.each([0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY])("refuses %s centavos in any mode", (cents) => {
    expect(() => assertChargeAllowed(cents, false)).toThrow(ChargeNotAllowedError);
    expect(() => assertChargeAllowed(cents, true)).toThrow(ChargeNotAllowedError);
  });
});

describe("money conversion", () => {
  it("converts centavos to pesos for pey", () => {
    expect(centsToPesos(1)).toBe(0.01);
    expect(centsToPesos(15050)).toBe(150.5);
  });

  it("converts pey pesos to whole centavos without float drift", () => {
    expect(pesosToCents(0.01)).toBe(1);
    expect(pesosToCents(0.1 + 0.2)).toBe(30);
    expect(pesosToCents(150)).toBe(15000);
  });
});

describe("chargeAmountCents", () => {
  it("charges one centavo in demo mode and the real amount otherwise", () => {
    expect(chargeAmountCents(15000, true)).toBe(1);
    expect(chargeAmountCents(15000, false)).toBe(15000);
  });
});

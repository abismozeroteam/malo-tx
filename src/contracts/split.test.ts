import { describe, expect, it } from "vitest";
import { splitEqually, splitGap } from "./split";

describe("splitEqually", () => {
  it("gives every share the same amount when it divides evenly", () => {
    expect(splitEqually(180000, 4)).toEqual([45000, 45000, 45000, 45000]);
  });

  it("gives the leftover centavos to the first share so the parts add up", () => {
    const parts = splitEqually(100, 3);
    expect(parts).toEqual([34, 33, 33]);
    expect(parts.reduce((a, b) => a + b, 0)).toBe(100);
  });

  it("returns the whole total for a single person", () => {
    expect(splitEqually(15000, 1)).toEqual([15000]);
  });

  it("returns nothing for no shares", () => {
    expect(splitEqually(15000, 0)).toEqual([]);
  });

  it("always adds up to the total", () => {
    for (const total of [1, 7, 99, 1001, 123457]) {
      for (const shares of [1, 2, 3, 6, 7]) {
        expect(splitEqually(total, shares).reduce((a, b) => a + b, 0)).toBe(total);
      }
    }
  });
});

describe("splitGap", () => {
  it("is positive when money is still missing", () => {
    expect(splitGap(180000, [45000, 45000, 40000, 45000])).toBe(5000);
  });

  it("is negative when the amounts go over the total", () => {
    expect(splitGap(180000, [50000, 45000, 45000, 45000])).toBe(-5000);
  });

  it("counts empty amounts as zero", () => {
    expect(splitGap(1000, [500, null])).toBe(500);
  });

  it("is zero when the amounts match", () => {
    expect(splitGap(1000, [400, 600])).toBe(0);
  });
});

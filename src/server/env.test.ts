import { afterEach, describe, expect, it, vi } from "vitest";
import { isDemoMode } from "./env";

afterEach(() => vi.unstubAllEnvs());

describe("isDemoMode", () => {
  it("is on unless DEMO_MODE is exactly false", () => {
    for (const value of ["true", "", "False", "0", "no"]) {
      vi.stubEnv("DEMO_MODE", value);
      expect(isDemoMode()).toBe(true);
    }
  });

  it("is on when DEMO_MODE is missing", () => {
    vi.stubEnv("DEMO_MODE", undefined);
    expect(isDemoMode()).toBe(true);
  });

  it("is off only with DEMO_MODE=false", () => {
    vi.stubEnv("DEMO_MODE", "false");
    expect(isDemoMode()).toBe(false);
  });
});

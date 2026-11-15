import { afterEach, describe, expect, it, vi } from "vitest";
import { isTeamSecret } from "./team-secret";

afterEach(() => vi.unstubAllEnvs());

describe("isTeamSecret", () => {
  it("accepts the exact secret", () => {
    vi.stubEnv("TEAM_SECRET", "correct horse battery staple");
    expect(isTeamSecret("correct horse battery staple")).toBe(true);
  });

  it.each(["", "correct horse", "correct horse battery staple ", "CORRECT HORSE BATTERY STAPLE"])(
    "rejects %j",
    (candidate) => {
      vi.stubEnv("TEAM_SECRET", "correct horse battery staple");
      expect(isTeamSecret(candidate)).toBe(false);
    },
  );

  it("rejects everything when no secret is configured", () => {
    vi.stubEnv("TEAM_SECRET", "");
    expect(isTeamSecret("")).toBe(false);
    expect(isTeamSecret("anything")).toBe(false);
    expect(isTeamSecret(null)).toBe(false);
  });
});

import { existsSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { LIMITS } from "@/contracts/debt-form-rules";
import { DEFAULT_MEME, MEME_CATALOG, PICKER_MEMES, resolveMeme } from "./memes";

describe("meme catalog", () => {
  it("offers a to e in order in the picker, never paid", () => {
    expect(PICKER_MEMES.map((meme) => meme.key)).toEqual(["a", "b", "c", "d", "e"]);
  });

  it("selects a by default", () => {
    expect(DEFAULT_MEME.key).toBe("a");
  });

  it.each(Object.values(MEME_CATALOG))("has a real, light image for $key", (meme) => {
    const file = join(process.cwd(), "public", meme.src);
    expect(existsSync(file)).toBe(true);
    expect(statSync(file).size).toBeLessThan(300_000);
  });

  it.each(Object.values(MEME_CATALOG))("has Spanish alt text and a short default caption for $key", (meme) => {
    expect(meme.alt.length).toBeGreaterThan(10);
    expect(meme.defaultCaption.length).toBeGreaterThan(0);
    expect(meme.defaultCaption.length).toBeLessThanOrEqual(LIMITS.caption);
  });

  it("puts captions where the table says", () => {
    expect(Object.fromEntries(Object.values(MEME_CATALOG).map((m) => [m.key, m.captionPosition]))).toEqual({
      a: "top",
      b: "bottom",
      c: "bottom",
      d: "top",
      e: "top",
      paid: "top",
    });
  });

  it("puts captions of uploaded images at the bottom", () => {
    expect(resolveMeme({ kind: "upload", src: "/x.jpg", caption: "Hola" }).captionPosition).toBe("bottom");
  });
});

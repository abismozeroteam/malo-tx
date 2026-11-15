import { existsSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { DEFAULT_MEME_KEY, PICKABLE_MEMES } from "@/contracts/common";
import { EMPTY_DEBT_FORM } from "@/contracts/debt-form";
import { LIMITS } from "@/contracts/debt-form-rules";
import { debtorPageFixtures } from "@/fixtures/debtor-page";
import { debtorPageMeme, finalMemeView, MEME_CATALOG, resolveMeme } from "./memes";

describe("meme catalog", () => {
  it("offers a to e in order in the picker, never paid", () => {
    expect(PICKABLE_MEMES).toEqual(["a", "b", "c", "d", "e"]);
  });

  it("starts new cobros with a selected", () => {
    expect(DEFAULT_MEME_KEY).toBe("a");
    expect(EMPTY_DEBT_FORM.meme).toEqual({ kind: "catalog", key: "a" });
  });

  it.each(Object.entries(MEME_CATALOG))("has a real, light WebP image for %s", (_, meme) => {
    const file = join(process.cwd(), "public", meme.src);
    expect(meme.src).toMatch(/\.webp$/);
    expect(existsSync(file)).toBe(true);
    expect(statSync(file).size).toBeLessThan(200_000);
  });

  it.each(Object.entries(MEME_CATALOG))("has Spanish alt text and a short default caption for %s", (_, meme) => {
    expect(meme.alt.length).toBeGreaterThan(10);
    expect(meme.defaultCaption.length).toBeGreaterThan(0);
    expect(meme.defaultCaption.length).toBeLessThanOrEqual(LIMITS.caption);
  });

  it("puts captions of uploaded images at the bottom", () => {
    expect(resolveMeme({ kind: "upload", src: "/x.webp", caption: "Hola" }).captionPosition).toBe("bottom");
  });
});

describe("finalMemeView", () => {
  it("uses the default caption when the creditor leaves it empty", () => {
    expect(finalMemeView({ kind: "catalog", key: "b" }, "  ").caption).toBe(MEME_CATALOG.b.defaultCaption);
  });

  it("keeps the creditor's caption, trimmed", () => {
    expect(finalMemeView({ kind: "catalog", key: "b" }, " Ya págame ").caption).toBe("Ya págame");
  });
});

describe("debtorPageMeme", () => {
  it("always shows paid once the debt is paid", () => {
    expect(debtorPageMeme(debtorPageFixtures.cobrado)).toMatchObject({ kind: "catalog", key: "paid" });
  });

  it("shows e when the cobro is gone", () => {
    expect(debtorPageMeme(debtorPageFixtures["cancelado o borrado"])).toMatchObject({ kind: "catalog", key: "e" });
  });

  it("shows the cobro's own meme while it is open", () => {
    expect(debtorPageMeme(debtorPageFixtures["en disputa"])).toMatchObject({ kind: "catalog", key: "d" });
  });
});

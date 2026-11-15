import { DEFAULT_MEME_KEY, type CaptionPosition, type CatalogMemeKey, type MemeView } from "@/contracts/common";
import { toMemeView, type MemeChoice } from "@/contracts/debt-form";
import type { DebtorPageData } from "@/contracts/debtor-page";
import { es } from "./es";

export type CatalogMeme = { src: string; alt: string; defaultCaption: string; captionPosition: CaptionPosition };

const entry = (key: CatalogMemeKey, captionPosition: CaptionPosition): CatalogMeme => ({
  src: `/memes/${key}.webp`,
  alt: es.memes.alt[key],
  defaultCaption: es.memes.defaultCaption[key],
  captionPosition,
});

export const MEME_CATALOG = {
  a: entry("a", "top"),
  b: entry("b", "bottom"),
  c: entry("c", "bottom"),
  d: entry("d", "top"),
  e: entry("e", "top"),
  paid: entry("paid", "top"),
} satisfies Record<CatalogMemeKey, CatalogMeme>;

export const REPORTED_FALLBACK_KEY = DEFAULT_MEME_KEY;

export const catalogMemeView = (key: CatalogMemeKey, caption = MEME_CATALOG[key].defaultCaption): MemeView =>
  toMemeView({ kind: "catalog", key }, caption);

export const defaultCaptionFor = (meme: MemeChoice | null) => (meme?.kind === "catalog" ? MEME_CATALOG[meme.key].defaultCaption : "");

export const finalMemeView = (meme: MemeChoice, caption: string) => toMemeView(meme, caption.trim() || defaultCaptionFor(meme));

export function debtorPageMeme(data: DebtorPageData): MemeView {
  if (data.state === "gone") return catalogMemeView("e", es.debtor.gone.caption);
  if (data.state === "paid") return catalogMemeView("paid");
  return data.meme;
}

export function resolveMeme(meme: MemeView): Omit<CatalogMeme, "defaultCaption"> {
  if (meme.kind === "upload") return { src: meme.src, alt: es.memes.uploadAlt, captionPosition: "bottom" };
  return MEME_CATALOG[meme.key];
}

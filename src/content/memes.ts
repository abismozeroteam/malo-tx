import { PICKABLE_MEMES, type CatalogMemeKey, type MemeView } from "@/contracts/common";
import type { MemeChoice } from "@/contracts/debt-form";
import { es } from "./es";

export type CaptionPosition = "top" | "bottom";

export type CatalogMeme = {
  key: CatalogMemeKey;
  src: string;
  alt: string;
  defaultCaption: string;
  captionPosition: CaptionPosition;
};

const positions: Record<CatalogMemeKey, CaptionPosition> = {
  a: "top",
  b: "bottom",
  c: "bottom",
  d: "top",
  e: "top",
  paid: "top",
};

const entry = (key: CatalogMemeKey): CatalogMeme => ({
  key,
  src: `/memes/${key}.jpg`,
  alt: es.memes.alt[key],
  defaultCaption: es.memes.defaultCaption[key],
  captionPosition: positions[key],
});

export const MEME_CATALOG = Object.fromEntries(
  ([...PICKABLE_MEMES, "paid"] as CatalogMemeKey[]).map((key) => [key, entry(key)]),
) as Record<CatalogMemeKey, CatalogMeme>;

export const PICKER_MEMES = PICKABLE_MEMES.map((key) => MEME_CATALOG[key]);

export const DEFAULT_MEME = MEME_CATALOG.a;

export const catalogMemeView = (key: CatalogMemeKey, caption = MEME_CATALOG[key].defaultCaption): MemeView => ({
  kind: "catalog",
  key,
  caption,
});

export function resolveMeme(meme: MemeView) {
  if (meme.kind === "upload") return { src: meme.src, alt: es.memes.uploadAlt, captionPosition: "bottom" as const };
  const { src, alt, captionPosition } = MEME_CATALOG[meme.key];
  return { src, alt, captionPosition };
}

export const defaultCaptionFor = (meme: MemeChoice | null) => (meme?.kind === "catalog" ? MEME_CATALOG[meme.key].defaultCaption : "");

export const captionFor = (meme: MemeChoice | null, caption: string) => caption.trim() || defaultCaptionFor(meme);

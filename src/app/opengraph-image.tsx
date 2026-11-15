import { DEFAULT_MEME_KEY } from "@/contracts/common";
import { catalogMemeView, MEME_CATALOG } from "@/content/memes";
import { memePreviewJpeg, OG_SIZE } from "@/server/og/meme-image";

export const alt = MEME_CATALOG[DEFAULT_MEME_KEY].alt;
export const size = OG_SIZE;
export const contentType = "image/jpeg";

export default async function Image() {
  const jpeg = await memePreviewJpeg(catalogMemeView(DEFAULT_MEME_KEY));
  return new Response(jpeg as BodyInit, { headers: { "Content-Type": contentType } });
}

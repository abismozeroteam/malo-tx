import { catalogMemeView, DEFAULT_MEME } from "@/content/memes";
import { memePreviewJpeg, OG_SIZE } from "@/server/og/meme-image";

export const alt = DEFAULT_MEME.alt;
export const size = OG_SIZE;
export const contentType = "image/jpeg";

export default function Image() {
  return memePreviewJpeg(catalogMemeView(DEFAULT_MEME.key));
}

import { catalogMemeView, DEFAULT_MEME } from "@/content/memes";
import { memeImageResponse } from "@/server/og/meme-image";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
  return memeImageResponse(catalogMemeView(DEFAULT_MEME.key, ""), size);
}

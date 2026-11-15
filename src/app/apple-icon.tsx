import { catalogMemeView, DEFAULT_MEME } from "@/content/memes";
import { memeImageResponse } from "@/server/og/meme-image";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return memeImageResponse(catalogMemeView(DEFAULT_MEME.key, ""), size);
}

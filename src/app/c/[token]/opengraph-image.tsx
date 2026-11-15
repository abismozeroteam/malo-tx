import { DEFAULT_MEME_KEY } from "@/contracts/common";
import { debtorPageMeme, MEME_CATALOG } from "@/content/memes";
import { loadDebtor, toDebtorPage } from "@/server/debtors/debtor-page";
import { isDemoMode } from "@/server/env";
import { memePreviewJpeg, OG_SIZE } from "@/server/og/meme-image";

export const alt = MEME_CATALOG[DEFAULT_MEME_KEY].alt;
export const size = OG_SIZE;
export const contentType = "image/jpeg";

export default async function Image({ params }: { params: Promise<{ token: string }> }) {
  const data = toDebtorPage(await loadDebtor((await params).token), isDemoMode());
  const jpeg = await memePreviewJpeg(debtorPageMeme(data));
  return new Response(jpeg as BodyInit, { headers: { "Content-Type": contentType, "Cache-Control": "public, s-maxage=300" } });
}

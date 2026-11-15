import { debtorPageMeme, MEME_CATALOG } from "@/content/memes";
import { DEFAULT_MEME_KEY } from "@/contracts/common";
import { db } from "@/server/db";
import { findDebtor, toDebtorPage } from "@/server/debtors/debtor-page";
import { memePreviewJpeg, OG_SIZE } from "@/server/og/meme-image";

export const alt = MEME_CATALOG[DEFAULT_MEME_KEY].alt;
export const size = OG_SIZE;
export const contentType = "image/jpeg";

export default async function Image({ params }: { params: Promise<{ token: string }> }) {
  const data = toDebtorPage(await findDebtor(db(), (await params).token), true);
  const jpeg = await memePreviewJpeg(debtorPageMeme(data));
  return new Response(jpeg as BodyInit, { headers: { "Content-Type": contentType } });
}

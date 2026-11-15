import "server-only";
import { readFile } from "node:fs/promises";
import { basename, join } from "node:path";
import { cacheLife } from "next/cache";
import { ImageResponse } from "next/og";
import sharp from "sharp";
import type { MemeView } from "@/contracts/common";
import { resolveMeme } from "@/content/memes";

export const OG_SIZE = { width: 1200, height: 630 };

const catalogFile = (src: string) => readFile(join(process.cwd(), "public", "memes", basename(src)));

const captionFont = () => readFile(join(process.cwd(), "assets", "fonts", "Geist-Black.ttf"));

async function imageAsPngDataUrl(meme: MemeView, src: string) {
  const source = meme.kind === "catalog" ? await catalogFile(src) : Buffer.from(await (await fetch(src)).arrayBuffer());
  const png = await sharp(source).png().toBuffer();
  return `data:image/png;base64,${png.toString("base64")}`;
}

export async function memePreviewJpeg(meme: MemeView): Promise<Uint8Array> {
  "use cache";
  cacheLife("max");
  const { src, captionPosition } = resolveMeme(meme);
  const fontSize = Math.round(OG_SIZE.width / 14);
  const image = new ImageResponse(
    (
      <div style={{ display: "flex", position: "relative", width: "100%", height: "100%", background: "#000" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={await imageAsPngDataUrl(meme, src)} alt="" width={OG_SIZE.width} height={OG_SIZE.height} style={{ objectFit: "cover" }} />
        {meme.caption && (
          <div
            style={{
              display: "flex",
              position: "absolute",
              left: 0,
              right: 0,
              [captionPosition]: 0,
              justifyContent: "center",
              padding: `${Math.round(fontSize * 0.5)}px ${Math.round(fontSize * 0.8)}px`,
              color: "#fff",
              fontFamily: "Geist",
              fontSize,
              lineHeight: 1.1,
              textAlign: "center",
              textTransform: "uppercase",
              WebkitTextStroke: `${Math.round(fontSize * 0.08)}px #000`,
              lineClamp: 3,
            }}
          >
            {meme.caption}
          </div>
        )}
      </div>
    ),
    { ...OG_SIZE, fonts: [{ name: "Geist", data: await captionFont(), weight: 900, style: "normal" }] },
  );
  const png = Buffer.from(await image.arrayBuffer());
  return new Uint8Array(await sharp(png).jpeg({ quality: 82 }).toBuffer());
}

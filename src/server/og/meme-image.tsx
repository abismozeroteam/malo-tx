import "server-only";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import sharp from "sharp";
import type { MemeView } from "@/contracts/common";
import { resolveMeme } from "@/content/memes";

export const OG_SIZE = { width: 1200, height: 630 };

const fontData = readFile(join(process.cwd(), "assets/fonts/Geist-Black.ttf"));

async function catalogImageDataUrl(src: string) {
  const bytes = await readFile(join(process.cwd(), "public", src));
  return `data:image/jpeg;base64,${bytes.toString("base64")}`;
}

const outline = [-4, 0, 4]
  .flatMap((x) => [-4, 0, 4].map((y) => `${x}px ${y}px 0 #000`))
  .join(", ");

export async function memeImageResponse(meme: MemeView, size: { width: number; height: number } = OG_SIZE) {
  const { src, captionPosition } = resolveMeme(meme);
  const image = meme.kind === "catalog" ? await catalogImageDataUrl(src) : src;
  const fontSize = Math.round(size.width / 14);
  return new ImageResponse(
    (
      <div style={{ display: "flex", position: "relative", width: "100%", height: "100%", background: "#000" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image} alt="" width={size.width} height={size.height} style={{ objectFit: "cover", width: "100%", height: "100%" }} />
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
              textShadow: outline,
              lineClamp: 3,
            }}
          >
            {meme.caption}
          </div>
        )}
      </div>
    ),
    { ...size, fonts: [{ name: "Geist", data: await fontData, weight: 900, style: "normal" }] },
  );
}

export async function memePreviewJpeg(meme: MemeView) {
  const png = Buffer.from(await (await memeImageResponse(meme)).arrayBuffer());
  const jpeg = await sharp(png).jpeg({ quality: 80, mozjpeg: true }).toBuffer();
  return new Response(new Uint8Array(jpeg), {
    headers: { "Content-Type": "image/jpeg", "Cache-Control": "public, max-age=86400, immutable" },
  });
}

import Image from "next/image";
import type { MemeView } from "@/contracts/common";
import { resolveMeme } from "@/content/memes";
import { cx } from "./cx";

type Size = "hero" | "tile" | "thumb";

const frames: Record<Size, string> = {
  hero: "h-75 w-full rounded-hero",
  tile: "aspect-square w-full rounded-small",
  thumb: "size-12 rounded-small",
};

const imageSizes: Record<Size, string> = {
  hero: "(max-width: 430px) 100vw, 430px",
  tile: "140px",
  thumb: "48px",
};

const captionText: Record<Size, string | null> = {
  hero: "text-meme px-4.5 py-5",
  tile: null,
  thumb: null,
};

export function MemeCard({ meme, size = "hero", important = false }: { meme: MemeView; size?: Size; important?: boolean }) {
  const { src, alt, captionPosition } = resolveMeme(meme);
  const caption = captionText[size];
  return (
    <figure className={cx("relative shrink-0 overflow-hidden bg-neutral-soft", frames[size])}>
      <Image src={src} alt={alt} fill sizes={imageSizes[size]} fetchPriority={important ? "high" : "auto"} loading={important ? "eager" : "lazy"} className="object-cover" />
      {caption && meme.caption && (
        <figcaption
          className={cx(
            "meme-caption absolute inset-x-0 line-clamp-3 text-center font-black leading-meme text-on-brand",
            captionPosition === "top" ? "top-0" : "bottom-0",
            caption,
          )}
        >
          {meme.caption}
        </figcaption>
      )}
    </figure>
  );
}

import type { CatalogMemeKey, MemeView } from "@/contracts/common";
import { es } from "@/content/es";
import { cx } from "./cx";

const placeholder: Record<CatalogMemeKey, string> = {
  a: "bg-meme-a",
  b: "bg-meme-b",
  c: "bg-meme-c",
  d: "bg-meme-d",
  e: "bg-meme-e",
  paid: "bg-meme-paid",
};

type Size = "hero" | "banner" | "tile" | "thumb";

const frames: Record<Size, string> = {
  hero: "h-75 w-full rounded-hero",
  banner: "h-30 w-full rounded-button",
  tile: "aspect-square w-full rounded-small",
  thumb: "size-12 rounded-small",
};

const captions: Record<Size, string> = {
  hero: "text-meme px-4.5 pb-5",
  banner: "text-lead px-3 pb-3",
  tile: "hidden",
  thumb: "hidden",
};

export function MemeCard({ meme, size = "hero", className }: { meme: MemeView; size?: Size; className?: string }) {
  const background = meme.kind === "catalog" ? placeholder[meme.key] : "bg-ink";
  const alt = meme.kind === "catalog" ? es.memes.alt[meme.key] : es.memes.uploadAlt;
  return (
    <figure className={cx("relative shrink-0 overflow-hidden", frames[size], background, className)}>
      {meme.kind === "upload" && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={meme.src} alt={alt} className="absolute inset-0 size-full object-cover" />
      )}
      {meme.kind === "catalog" && <span className="sr-only">{alt}</span>}
      <figcaption
        className={cx(
          "meme-caption absolute inset-x-0 bottom-0 text-center font-bold leading-meme text-on-brand",
          captions[size],
        )}
      >
        {meme.caption}
      </figcaption>
    </figure>
  );
}

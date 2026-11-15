import { es } from "@/content/es";
import { cx } from "./cx";

export function Wordmark({ className }: { className?: string }) {
  return (
    <p className={cx("font-heading text-wordmark leading-ui text-ink", className)} aria-label={es.brand.name}>
      Malo<span className="text-brand">TX</span>
    </p>
  );
}


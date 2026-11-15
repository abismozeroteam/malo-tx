import { cx } from "./cx";

export function Wordmark({ className }: { className?: string }) {
  return (
    <p className={cx("font-heading text-wordmark leading-ui text-ink", className)} aria-label="MALOTX">
      Malo<span className="text-brand">TX</span>
    </p>
  );
}

import type { ReactNode } from "react";
import { cx } from "./cx";

export type Tone = "warning" | "danger" | "success" | "neutral" | "brand";

const tones: Record<Tone, string> = {
  warning: "bg-warning-soft text-warning-ink",
  danger: "bg-danger-soft text-danger-ink",
  success: "bg-success-soft text-success-ink",
  neutral: "bg-neutral-soft text-neutral-ink",
  brand: "bg-brand-soft text-brand-ink",
};

export function Notice({ tone = "warning", children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <p role={tone === "danger" ? "alert" : undefined} className={cx("w-full rounded-notice px-3.5 py-2.75 text-small font-semibold leading-ui", tones[tone], className)}>
      {children}
    </p>
  );
}

export function Tag({ tone, children }: { tone: Tone; children: ReactNode }) {
  return (
    <span className={cx("inline-flex shrink-0 items-center rounded-tag px-2.5 py-1.25 text-caption font-semibold leading-ui", tones[tone])}>
      {children}
    </span>
  );
}

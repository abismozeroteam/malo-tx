import type { ReactNode } from "react";
import { cx } from "./cx";

type CardTone = "surface" | "outlined" | "brand" | "neutral";

const tones: Record<CardTone, string> = {
  surface: "bg-surface",
  outlined: "border border-line bg-surface",
  brand: "bg-brand-soft",
  neutral: "bg-neutral-soft",
};

export function Card({ children, tone = "surface", className }: { children: ReactNode; tone?: CardTone; className?: string }) {
  return <section className={cx("flex w-full flex-col gap-3 rounded-card p-4 leading-ui", tones[tone], className)}>{children}</section>;
}

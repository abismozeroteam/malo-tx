import type { ReactNode } from "react";
import { cx } from "./cx";

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={cx("w-full rounded-card bg-surface p-4", className)}>{children}</section>;
}

import type { ReactNode } from "react";
import { cx } from "./cx";

export function Screen({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <main className={cx("mx-auto flex w-full max-w-phone flex-1 flex-col gap-4 bg-page px-6 pt-8 pb-8", className)}>
      {children}
    </main>
  );
}

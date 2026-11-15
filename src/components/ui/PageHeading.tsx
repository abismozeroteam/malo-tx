import type { ReactNode } from "react";
import { cx } from "./cx";

export function PageHeading({ title, lead, size = "title" }: { title: ReactNode; lead?: ReactNode; size?: "title" | "hero" }) {
  return (
    <div className="flex flex-col gap-1">
      <h1 className={cx("font-bold leading-heading", size === "hero" ? "text-hero" : "text-title")}>{title}</h1>
      {lead && <p className={cx("leading-ui text-muted", size === "hero" ? "text-lead" : "text-body")}>{lead}</p>}
    </div>
  );
}

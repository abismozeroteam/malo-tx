import type { ReactNode } from "react";
import { cx } from "./cx";

type Size = "subtitle" | "title" | "hero";

const titleSize: Record<Size, string> = { subtitle: "text-heading-sm", title: "text-heading-md", hero: "text-heading-lg" };

const leadSize: Record<Size, string> = { subtitle: "text-body", title: "text-body", hero: "text-lead" };

export function PageHeading({
  title,
  lead,
  size = "title",
  className,
}: {
  title: ReactNode;
  lead?: ReactNode;
  size?: Size;
  className?: string;
}) {
  return (
    <div className={cx("flex flex-col gap-1", className)}>
      <h1 className={cx("heading", titleSize[size])}>{title}</h1>
      {lead && <p className={cx("leading-ui text-muted", leadSize[size])}>{lead}</p>}
    </div>
  );
}

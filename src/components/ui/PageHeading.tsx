import type { ReactNode } from "react";
import { cx } from "./cx";

type Size = "sm" | "md" | "lg";

const titleSize: Record<Size, string> = { sm: "text-heading-sm", md: "text-heading-md", lg: "text-heading-lg" };

const leadSize: Record<Size, string> = { sm: "text-body", md: "text-body", lg: "text-lead" };

export function PageHeading({
  title,
  lead,
  size = "md",
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

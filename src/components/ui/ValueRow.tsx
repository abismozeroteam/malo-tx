import type { ReactNode } from "react";

export function ValueRow({ label, value }: { label: ReactNode; value: ReactNode }) {
  return (
    <p className="flex items-center justify-between gap-3 text-body leading-ui">
      <span className="text-muted">{label}</span>
      <span className="font-semibold">{value}</span>
    </p>
  );
}

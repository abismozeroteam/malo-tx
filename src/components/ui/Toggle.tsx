import { cx } from "./cx";

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (checked: boolean) => void; label: string }) {
  return (
    <label className="flex w-full cursor-pointer items-center justify-between gap-3 text-body font-semibold leading-ui text-ink">
      {label}
      <input type="checkbox" role="switch" className="peer sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span
        aria-hidden
        className={cx(
          "relative h-7 w-12 shrink-0 rounded-full transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-brand",
          checked ? "bg-brand" : "bg-line",
        )}
      >
        <span className={cx("absolute top-1 size-5 rounded-full bg-surface transition-all", checked ? "left-6" : "left-1")} />
      </span>
    </label>
  );
}

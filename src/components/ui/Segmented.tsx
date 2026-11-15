import { cx } from "./cx";

type Option<T extends string> = { value: T; label: string };

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
  label: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex w-full gap-1 rounded-control bg-neutral-soft p-1">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={option.value === value}
          onClick={() => onChange(option.value)}
          className={cx(
            "h-10 flex-1 rounded-small text-body font-semibold leading-ui",
            option.value === value ? "bg-surface text-ink" : "text-muted",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

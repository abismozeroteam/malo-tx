import type { InputHTMLAttributes, ReactNode } from "react";
import { cx } from "./cx";

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
  error?: string | null;
  prefix?: ReactNode;
  suffix?: ReactNode;
};

export function TextField({ label, hint, error, prefix, suffix, id, className, ...input }: TextFieldProps) {
  const fieldId = id ?? input.name;
  const describedBy = error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined;
  return (
    <div className={cx("flex w-full flex-col gap-2", className)}>
      <label htmlFor={fieldId} className="text-body font-medium leading-ui text-ink">
        {label}
      </label>
      <div
        className={cx(
          "flex h-14 w-full items-center gap-3 rounded-field border bg-surface px-3.75",
          error ? "border-danger-ink" : "border-line",
        )}
      >
        {prefix && <span className="text-button text-ink">{prefix}</span>}
        <input
          id={fieldId}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className="min-w-0 flex-1 bg-transparent text-button text-ink outline-none placeholder:text-muted"
          {...input}
        />
        {suffix && <span className="text-small text-muted">{suffix}</span>}
      </div>
      {error ? (
        <p id={`${fieldId}-error`} className="text-small leading-ui text-danger-ink">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${fieldId}-hint`} className="text-caption leading-ui text-muted">
            {hint}
          </p>
        )
      )}
    </div>
  );
}

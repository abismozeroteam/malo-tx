import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cx } from "./cx";

type Variant = "primary" | "secondary";
type Size = "lg" | "md" | "sm";

const variants: Record<Variant, string> = {
  primary: "bg-brand text-on-brand",
  secondary: "border border-line bg-surface text-ink",
};

const sizes: Record<Size, string> = {
  lg: "h-13.5 rounded-button text-button",
  md: "h-11 rounded-control text-body",
  sm: "h-9.5 rounded-small text-small",
};

export function buttonClass(variant: Variant = "primary", size: Size = "lg", className?: string) {
  return cx(
    "flex w-full items-center justify-center px-4.5 font-semibold leading-ui transition-opacity disabled:opacity-50",
    variants[variant],
    sizes[size],
    className,
  );
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
};

export function Button({ variant, size, className, type = "button", ...props }: ButtonProps) {
  return <button type={type} className={buttonClass(variant, size, className)} {...props} />;
}

type LinkButtonProps = {
  href: string;
  variant?: Variant;
  size?: Size;
  className?: string;
  external?: boolean;
  download?: string;
  children: ReactNode;
};

export function LinkButton({ href, variant, size, className, external, download, children }: LinkButtonProps) {
  return (
    <a
      href={href}
      className={buttonClass(variant, size, className)}
      download={download}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      {children}
    </a>
  );
}

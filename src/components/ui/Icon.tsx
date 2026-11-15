import { cx } from "./cx";

const paths = {
  back: ["M15 18l-6-6 6-6"],
  forward: ["M5 12h14", "M13 6l6 6-6 6"],
  edit: ["M4 20h4L19 9a2.83 2.83 0 0 0-4-4L4 16v4z", "M13.5 6.5l4 4"],
};

export type IconName = keyof typeof paths;

export function Icon({ name, className }: { name: IconName; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={cx("size-5 shrink-0", className)}
    >
      {paths[name].map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}

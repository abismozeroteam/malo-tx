import { es } from "@/content/es";
import { cx } from "./cx";

export function BottomNav({ active }: { active: "debts" | "profile" }) {
  const items = [
    { key: "debts", label: es.dashboard.nav.debts, href: "/cobros" },
    { key: "profile", label: es.dashboard.nav.profile, href: "/perfil" },
  ] as const;
  return (
    <nav className="sticky bottom-0 mt-auto flex w-full border-t border-line bg-surface">
      {items.map((item) => (
        <a
          key={item.key}
          href={item.href}
          aria-current={item.key === active ? "page" : undefined}
          className={cx("flex h-14 flex-1 items-center justify-center text-small font-semibold", item.key === active ? "text-brand" : "text-muted")}
        >
          {item.label}
        </a>
      ))}
    </nav>
  );
}

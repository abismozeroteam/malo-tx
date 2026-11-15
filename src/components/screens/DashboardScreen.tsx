"use client";

import { useState } from "react";
import type { DashboardActions, DashboardData, DashboardFilter, DebtCard as DebtCardData } from "@/contracts/dashboard";
import { routes } from "@/contracts/routes";
import { catalogMemeView } from "@/content/memes";
import { es } from "@/content/es";
import { formatDayMonth, formatMoney } from "@/content/format";
import { BottomNav } from "@/components/ui/BottomNav";
import { Button, LinkButton } from "@/components/ui/Button";
import { MemeCard } from "@/components/ui/MemeCard";
import { PageHeading } from "@/components/ui/PageHeading";
import { Tag, type Tone } from "@/components/ui/Notice";
import { Screen } from "@/components/ui/Screen";
import { cx } from "@/components/ui/cx";

const t = es.dashboard;

const statusTone: Record<DebtCardData["status"], Tone> = { pending: "warning", paid: "success", overdue: "danger" };

const filters: DashboardFilter[] = ["all", "pending", "paid", "overdue"];

export function DashboardScreen({ data, actions }: { data: DashboardData; actions: DashboardActions }) {
  const [filter, setFilter] = useState<DashboardFilter>("all");
  const visible = data.debts.filter((debt) => filter === "all" || debt.status === filter);

  return (
    <>
      <Screen className="pb-4">
        <Greeting name={data.userName} startEditing={data.suggestRename} rename={actions.rename} />
        <section className="flex w-full flex-col gap-3 rounded-hero bg-brand p-5 text-on-brand leading-ui">
          <p className="text-caption font-semibold text-on-brand-muted">{t.owed}</p>
          <p className="flex items-baseline justify-between">
            <span className="text-amount font-semibold">{formatMoney(data.owedCents)}</span>
            <span className="text-small text-on-brand-muted">{es.common.currency}</span>
          </p>
          <p className="text-small text-on-brand-muted">
            {t.received} · <span className="font-semibold text-on-brand">{formatMoney(data.receivedCents)}</span>
          </p>
        </section>
        <LinkButton href={routes.newDebt}>{t.create}</LinkButton>

        {data.debts.length === 0 ? (
          <section className="flex flex-col items-center gap-3 py-6 text-center">
            <MemeCard meme={catalogMemeView("e", "")} />
            <h2 className="text-subtitle font-bold">{t.emptyTitle}</h2>
            <p className="text-body leading-ui text-muted">{t.emptyHint}</p>
          </section>
        ) : (
          <>
            <h2 className="text-subtitle font-bold">{t.listTitle}</h2>
            <div className="flex gap-2 overflow-x-auto">
              {filters.map((key) => (
                <button
                  key={key}
                  type="button"
                  aria-pressed={filter === key}
                  onClick={() => setFilter(key)}
                  className={cx(
                    "h-9 shrink-0 rounded-full px-4 text-small font-semibold",
                    filter === key ? "bg-ink text-on-brand" : "border border-line bg-surface text-ink",
                  )}
                >
                  {key === "all" ? `${t.filters.all} · ${data.debts.length}` : t.filters[key]}
                </button>
              ))}
            </div>
            <ul className="flex flex-col gap-2.5">
              {visible.map((debt) => (
                <li key={debt.href}>
                  <DebtRow debt={debt} />
                </li>
              ))}
            </ul>
            {visible.length === 0 && <p className="text-center text-body text-muted">{t.emptyFilter}</p>}
          </>
        )}
      </Screen>
      <BottomNav active="debts" />
    </>
  );
}

function DebtRow({ debt }: { debt: DebtCardData }) {
  const who = debt.onlyDebtorName ?? t.paidOf(debt.paidCount, debt.peopleCount);
  const when =
    debt.dueDate === null ? null : debt.status === "overdue" ? t.overdueSince(formatDayMonth(debt.dueDate)) : t.until(formatDayMonth(debt.dueDate));
  return (
    <a href={debt.href} className="flex items-center gap-3 rounded-control bg-surface p-3 leading-ui">
      <MemeCard meme={debt.meme} size="thumb" />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-body font-semibold">{debt.name}</span>
        <span className="truncate text-caption text-muted">{who}</span>
      </span>
      <span className="flex flex-col items-end gap-1">
        <span className="text-body font-semibold">{formatMoney(debt.amountCents)}</span>
        <Tag tone={statusTone[debt.status]}>{t.status[debt.status]}</Tag>
        {when && <span className="text-micro text-muted">{when}</span>}
      </span>
    </a>
  );
}

function Greeting({ name, startEditing, rename }: { name: string; startEditing: boolean; rename: DashboardActions["rename"] }) {
  const [editing, setEditing] = useState(startEditing);
  const [value, setValue] = useState(name);
  const [current, setCurrent] = useState(name);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    const result = await rename(value.trim());
    if (result.ok) {
      setCurrent(value.trim());
      setEditing(false);
    }
  }

  return (
    <header className="flex flex-col gap-1">
      {editing ? (
        <form onSubmit={save} className="flex items-center gap-2">
          <input
            aria-label={t.editName}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            maxLength={30}
            autoFocus
            className="heading min-w-0 flex-1 rounded-control border border-line bg-surface px-3 py-2 text-title"
          />
          <Button size="sm" type="submit" className="w-auto px-4">
            {t.saveName}
          </Button>
        </form>
      ) : (
        <div className="flex items-start gap-2">
          <PageHeading title={t.greeting(current)} lead={t.subtitle} />
          <button type="button" onClick={() => setEditing(true)} aria-label={t.editName} className="text-lead text-muted">
            ✎
          </button>
        </div>
      )}
      {editing && <p className="text-body text-muted">{t.subtitle}</p>}
    </header>
  );
}

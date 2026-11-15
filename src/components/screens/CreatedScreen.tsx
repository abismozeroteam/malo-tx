"use client";

import { useState } from "react";
import type { CreatedDebt } from "@/contracts/debt-form";
import { routes } from "@/contracts/routes";
import { es } from "@/content/es";
import { formatDate, formatMoney } from "@/content/format";
import { Button, LinkButton } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { PageHeading } from "@/components/ui/PageHeading";
import { Screen } from "@/components/ui/Screen";
import { DebtPreview } from "./DebtFormScreen";

const t = es.created;

export function CreatedScreen({ debt, creditorName }: { debt: CreatedDebt; creditorName: string }) {
  const split = debt.links.length > 1;
  const details = [split && t.partOf(formatMoney(debt.totalCents)), debt.dueDate && t.due(formatDate(debt.dueDate))].filter(Boolean).join(" · ");
  return (
    <Screen>
      <p className="text-lead font-semibold">{t.title}</p>
      <PageHeading title={t.heading} lead={t.lead} />
      <ul className="flex flex-col gap-4">
        {debt.links.map((link) => (
          <li key={link.url} className="flex flex-col gap-3">
            <p className="text-small font-semibold text-brand-ink">{t.to(link.firstName)}</p>
            <DebtPreview
              meme={debt.meme}
              name={debt.name}
              rows={
                <>
                  <p className="text-body text-muted">{t.youOwe(creditorName)}</p>
                  <p className="text-amount font-semibold">{formatMoney(link.amountCents)}</p>
                  {details && <p className="text-small text-muted">{details}</p>}
                </>
              }
            />
            <LinkButton href={link.whatsappUrl} external>
              {t.share}
            </LinkButton>
            <CopyButton url={link.url} />
          </li>
        ))}
      </ul>
      <LinkButton href={routes.debts} variant="link" className="inline-flex items-center justify-center gap-1 text-body">
        {t.toDashboard}
        <Icon name="forward" className="size-4" />
      </LinkButton>
    </Screen>
  );
}

function CopyButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      variant="secondary"
      onClick={async () => {
        await navigator.clipboard.writeText(url);
        setCopied(true);
      }}
    >
      {copied ? t.copied : t.copy}
    </Button>
  );
}

"use client";

import { useState } from "react";
import type { CreatedDebt } from "@/contracts/debt-form";
import { es } from "@/content/es";
import { formatDate, formatMoney } from "@/content/format";
import { Button, LinkButton } from "@/components/ui/Button";
import { MemeCard } from "@/components/ui/MemeCard";
import { Screen } from "@/components/ui/Screen";

const t = es.created;

export function CreatedScreen({ debt, creditorName }: { debt: CreatedDebt; creditorName: string }) {
  const meme =
    debt.meme.kind === "catalog"
      ? { kind: "catalog" as const, key: debt.meme.key, caption: debt.caption }
      : { kind: "upload" as const, src: debt.meme.src, caption: debt.caption };
  return (
    <Screen>
      <p className="text-lead font-semibold">{t.title}</p>
      <div className="flex flex-col gap-1">
        <h1 className="text-title font-bold leading-heading">{t.heading}</h1>
        <p className="text-body text-muted">{t.lead}</p>
      </div>
      <ul className="flex flex-col gap-4">
        {debt.links.map((link) => (
          <li key={link.url} className="flex flex-col gap-3 rounded-hero border border-line bg-surface p-3 leading-ui">
            <p className="text-small font-semibold text-brand-ink">{t.to(link.firstName)}</p>
            <MemeCard meme={meme} size="banner" />
            <p className="text-lead font-semibold">{debt.name}</p>
            <p className="text-body text-muted">{t.youOwe(creditorName)}</p>
            <p className="text-amount font-semibold">{formatMoney(link.amountCents)}</p>
            <p className="text-small text-muted">
              {debt.links.length > 1 && t.partOf(formatMoney(debt.totalCents))}
              {debt.links.length > 1 && debt.dueDate && " · "}
              {debt.dueDate && t.due(formatDate(debt.dueDate))}
            </p>
            <LinkButton href={link.whatsappUrl} external>
              {t.share}
            </LinkButton>
            <CopyButton url={link.url} />
          </li>
        ))}
      </ul>
      <a href="/cobros" className="text-center text-body font-semibold text-brand-ink">
        {t.toDashboard}
      </a>
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

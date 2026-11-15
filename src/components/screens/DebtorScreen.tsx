"use client";

import { useEffect, useState } from "react";
import type { ActionError, ActionResult } from "@/contracts/common";
import type { CodiQr, DebtorPageActions, DebtorPageData } from "@/contracts/debtor-page";
import { routes } from "@/contracts/routes";
import { catalogMemeView, debtorPageMeme, REPORTED_FALLBACK_KEY } from "@/content/memes";
import { es } from "@/content/es";
import { formatDate, formatDateTime, formatMoney } from "@/content/format";
import { Button, LinkButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { MemeCard } from "@/components/ui/MemeCard";
import { Notice, Tag } from "@/components/ui/Notice";
import { PageHeading } from "@/components/ui/PageHeading";
import { Screen } from "@/components/ui/Screen";
import { TextField } from "@/components/ui/TextField";
import { ValueRow } from "@/components/ui/ValueRow";
import { Wordmark } from "@/components/ui/Wordmark";

const t = es.debtor;

type OpenData = Extract<DebtorPageData, { state: "open" }>;
type PaidData = Extract<DebtorPageData, { state: "paid" }>;

export function DebtorScreen({ data, actions }: { data: DebtorPageData; actions: DebtorPageActions }) {
  if (data.state === "gone") return <GoneView />;
  if (data.state === "paid") return <PaidView data={data} />;
  return <OpenView data={data} actions={actions} />;
}

function Header({ demoMode, banner }: { demoMode: boolean; banner?: string }) {
  return (
    <>
      <Wordmark className="self-center" />
      {demoMode && <Notice>{es.demo.banner}</Notice>}
      {banner && <Notice tone="brand">{banner}</Notice>}
    </>
  );
}

function OpenView({ data, actions }: { data: OpenData; actions: DebtorPageActions }) {
  const [view, setView] = useState<"main" | "push">("main");
  const [showPay, setShowPay] = useState(data.status !== "disputed");
  const [answered, setAnswered] = useState(!data.canAnswer);
  const [reported, setReported] = useState(false);
  const [error, setError] = useState<ActionError | null>(null);
  const qr = useFreshQr(data.qr, actions.requestQr);

  const meme = reported ? catalogMemeView(REPORTED_FALLBACK_KEY, data.meme.caption) : debtorPageMeme(data);
  const amount = formatMoney(data.amountCents);

  if (view === "push") {
    return <PushView data={data} meme={meme} onBack={() => setView("main")} sendPush={actions.sendPush} />;
  }

  async function run(action: () => Promise<ActionResult>, onDone: () => void) {
    setError(null);
    const result = await action();
    if (result.ok) onDone();
    else setError(result.error);
  }

  const banner =
    data.status === "claims_paid"
      ? t.claimsPaid.notice(data.creditorName)
      : data.status === "disputed"
        ? t.disputed.notice(data.creditorName)
        : undefined;

  return (
    <Screen>
      <Header demoMode={data.demoMode} banner={banner} />
      <MemeCard meme={meme} important />

      {data.status === "pending" && (
        <>
          <h1 className="text-title leading-heading">{t.owesTo(data.debtorName, data.creditorName)}</h1>
          <p className="flex flex-wrap items-center gap-2 text-body leading-ui text-muted">
            {data.debtName}
            {data.dueDate && ` · ${t.payBefore(formatDate(data.dueDate))}`}
            {data.overdue && <Tag tone="danger">{t.overdue}</Tag>}
          </p>
          <OwedCard data={data} />
        </>
      )}
      {data.status === "claims_paid" && (
        <PageHeading title={t.claimsPaid.heading(data.debtorName, data.creditorName)} lead={t.claimsPaid.meta(data.debtName, amount)} />
      )}
      {data.status === "disputed" && (
        <>
          <PageHeading title={t.disputed.heading(data.debtorName)} lead={t.disputed.meta(data.debtName, amount, data.creditorName)} />
          {!showPay && (
            <>
              <Button onClick={() => setShowPay(true)}>{t.disputed.payAnyway}</Button>
              <p className="text-center text-caption leading-ui text-muted">{t.disputed.hint(data.creditorName)}</p>
            </>
          )}
        </>
      )}

      {showPay && (
        <>
          <PayCard
            qr={qr}
            title={data.status === "claims_paid" ? t.claimsPaid.stillPay : t.payWithCodi}
            hint={data.status === "claims_paid" ? t.claimsPaid.qrHint : t.scanHint}
          />
          <Button onClick={() => setView("push")}>{t.sendToBank}</Button>
          <p className="text-center text-caption leading-ui text-muted">{t.sendToBankHint}</p>
        </>
      )}

      {error && <Notice tone="danger">{es.actionErrors[error]}</Notice>}

      {data.status === "pending" && !answered && (
        <AnswerButtons
          onClaimPaid={() => run(actions.claimPaid, () => setAnswered(true))}
          onDispute={() => run(actions.dispute, () => setAnswered(true))}
        />
      )}

      {data.canReport && data.meme.kind === "upload" && !reported && (
        <button type="button" className="text-center text-caption font-medium text-muted" onClick={() => run(actions.report, () => setReported(true))}>
          {t.report}
        </button>
      )}
      {reported && <p className="text-center text-caption text-muted">{t.reported}</p>}

      <p className="text-center text-micro leading-ui text-muted">{t.footer}</p>
    </Screen>
  );
}

function OwedCard({ data }: { data: OpenData }) {
  return (
    <section className="flex w-full flex-col gap-1 rounded-hero bg-brand-soft p-4.5 leading-ui">
      <p className="text-caption font-semibold text-brand-ink">{t.whatYouOwe}</p>
      <p className="flex items-center justify-between">
        <span className="text-amount font-semibold text-ink">{formatMoney(data.amountCents)}</span>
        <span className="text-small text-muted">{es.common.currency}</span>
      </p>
      {data.totalCents !== null && <p className="text-small text-brand-ink">{t.partOf(formatMoney(data.totalCents), data.debtName)}</p>}
    </section>
  );
}

function PayCard({ qr, title, hint }: { qr: CodiQr | null; title: string; hint: string }) {
  return (
    <section className="flex w-full flex-col items-center gap-3 rounded-hero border border-line bg-surface p-4.5 text-center leading-ui">
      <h2 className="text-button font-semibold text-ink">{title}</h2>
      {qr ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qr.imageSrc} alt={t.qrAlt} className="size-47 bg-surface" />
          <p className="text-small text-muted">{hint}</p>
          <LinkButton href={qr.imageSrc} download="cobro-malotx-qr.png" variant="secondary">
            {t.saveQr}
          </LinkButton>
        </>
      ) : (
        <p className="text-small text-muted">{t.qrUnavailable}</p>
      )}
    </section>
  );
}

function AnswerButtons({ onClaimPaid, onDispute }: { onClaimPaid: () => void; onDispute: () => void }) {
  const [confirming, setConfirming] = useState<"paid" | "dispute" | null>(null);
  if (confirming) {
    return (
      <Card tone="outlined">
        <p className="text-body leading-ui text-ink">{confirming === "paid" ? t.confirmAlreadyPaid : t.confirmNotMine}</p>
        <div className="flex gap-3">
          <Button size="md" onClick={() => (confirming === "paid" ? onClaimPaid() : onDispute())}>
            {t.confirm}
          </Button>
          <Button size="md" variant="secondary" onClick={() => setConfirming(null)}>
            {t.keep}
          </Button>
        </div>
      </Card>
    );
  }
  return (
    <div className="flex w-full gap-3">
      <Button size="md" variant="secondary" onClick={() => setConfirming("paid")}>
        {t.alreadyPaid}
      </Button>
      <Button size="md" variant="secondary" onClick={() => setConfirming("dispute")}>
        {t.notMine}
      </Button>
    </div>
  );
}

function PushView({
  data,
  meme,
  onBack,
  sendPush,
}: {
  data: OpenData;
  meme: OpenData["meme"];
  onBack: () => void;
  sendPush: DebtorPageActions["sendPush"];
}) {
  const [phone, setPhone] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<ActionError | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSending(true);
    setError(null);
    const result = await sendPush(phone);
    setSending(false);
    if (result.ok) setSent(true);
    else setError(result.error);
  }

  return (
    <Screen>
      <Header demoMode={data.demoMode} />
      <MemeCard meme={meme} />
      <PageHeading title={t.push.heading} lead={t.push.lead(formatMoney(data.amountCents))} />
      <form onSubmit={submit} className="flex w-full flex-col gap-4">
        <TextField
          name="phone"
          label={t.push.label}
          placeholder={es.common.phonePlaceholder}
          inputMode="numeric"
          autoComplete="tel-national"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          hint={t.push.privacy}
          error={error ? es.actionErrors[error] : null}
        />
        {sent && <Notice tone="success">{t.push.sent}</Notice>}
        <Button type="submit" disabled={sending || phone.trim() === ""}>
          {sending ? t.push.sending : t.push.submit}
        </Button>
      </form>
      <Button variant="secondary" onClick={onBack}>
        {t.push.backToQr}
      </Button>
      <p className="text-center text-micro leading-ui text-muted">{t.push.help}</p>
    </Screen>
  );
}

function PaidView({ data }: { data: PaidData }) {
  return (
    <Screen>
      <Wordmark className="self-center" />
      <MemeCard meme={debtorPageMeme(data)} />
      <PageHeading size="hero" title={t.paid.heading} lead={t.paid.lead(data.debtorName, data.creditorName)} />
      <Card tone="outlined">
        <p className="flex items-center justify-between gap-3">
          <span className="text-button font-semibold">{data.debtName}</span>
          <Tag tone="success">{t.paid.tag}</Tag>
        </p>
        <ValueRow label={t.paid.yourPart} value={`${formatMoney(data.amountCents)} ${es.common.currency}`} />
        <ValueRow label={t.paid.paidAt} value={formatDateTime(data.paidAt)} />
      </Card>
      {data.demoMode && <Notice>{es.demo.paidBanner}</Notice>}
      <LinkButton href={routes.home}>{t.ctaOwn}</LinkButton>
    </Screen>
  );
}

function GoneView() {
  return (
    <Screen>
      <Wordmark className="self-center" />
      <MemeCard meme={debtorPageMeme({ state: "gone" })} />
      <PageHeading title={t.gone.heading} lead={t.gone.lead} />
      <LinkButton href={routes.home}>{t.ctaOwn}</LinkButton>
    </Screen>
  );
}

function useFreshQr(initial: CodiQr | null, requestQr: DebtorPageActions["requestQr"]) {
  const [qr, setQr] = useState(initial);
  useEffect(() => {
    const wait = qr ? new Date(qr.expiresAt).getTime() - Date.now() : 0;
    const timer = setTimeout(async () => {
      const result = await requestQr();
      if (result.ok) setQr(result.qr);
    }, Math.max(wait, 0));
    return () => clearTimeout(timer);
  }, [qr, requestQr]);
  return qr;
}

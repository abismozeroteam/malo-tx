"use client";

import { useState } from "react";
import { toTenDigitPhone } from "@/contracts/phone";
import type { SignInActions, SignInData } from "@/contracts/sign-in";
import { es } from "@/content/es";
import { Button, LinkButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Notice } from "@/components/ui/Notice";
import { PageHeading } from "@/components/ui/PageHeading";
import { Screen } from "@/components/ui/Screen";
import { TextField } from "@/components/ui/TextField";
import { Wordmark } from "@/components/ui/Wordmark";

const t = es.signIn;

export function SignInScreen({ data, actions }: { data: SignInData; actions: SignInActions }) {
  const [state, setState] = useState<SignInData>(data);

  if (state.step === "done") {
    return (
      <Screen className="justify-center text-center">
        <Wordmark className="self-center" />
        <h1 className="text-title">{t.done}</h1>
        <p className="text-body text-muted">{t.doneHint}</p>
      </Screen>
    );
  }

  if (state.step === "code") {
    return <CodeStep data={state} actions={actions} onChangeNumber={() => setState({ step: "phone", error: null })} onDone={() => setState({ step: "done" })} />;
  }

  return <PhoneStep error={state.error} start={actions.start} onStarted={(whatsappUrl, phoneLast4) => setState({ step: "code", whatsappUrl, phoneLast4, error: null, attemptsLeft: 5 })} />;
}

function PhoneStep({
  error,
  start,
  onStarted,
}: {
  error: "invalid_phone" | null;
  start: SignInActions["start"];
  onStarted: (whatsappUrl: string, phoneLast4: string) => void;
}) {
  const [phone, setPhone] = useState("");
  const [failed, setFailed] = useState(error !== null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const result = await start(phone);
    if (!result.ok) return setFailed(true);
    window.open(result.whatsappUrl, "_blank", "noopener,noreferrer");
    onStarted(result.whatsappUrl, toTenDigitPhone(phone)?.slice(-4) ?? "");
  }

  return (
    <Screen>
      <Wordmark className="self-center" />
      <section className="flex flex-1 flex-col justify-center gap-2 text-center">
        <h1 className="text-subtitle leading-ui">{es.landing.headline}</h1>
        <p className="text-lead leading-ui">{es.landing.lead}</p>
      </section>
      <form onSubmit={submit} className="flex w-full flex-col gap-4">
        <TextField
          name="phone"
          label={t.phoneLabel}
          prefix={es.common.countryCode}
          placeholder={es.common.phonePlaceholder}
          inputMode="numeric"
          autoComplete="tel-national"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          hint={t.startHint}
          error={failed ? es.common.invalidPhone : null}
        />
        <Button type="submit">{t.start}</Button>
      </form>
      <p className="text-center text-micro text-muted">{t.safe}</p>
    </Screen>
  );
}

function CodeStep({
  data,
  actions,
  onChangeNumber,
  onDone,
}: {
  data: Extract<SignInData, { step: "code" }>;
  actions: SignInActions;
  onChangeNumber: () => void;
  onDone: () => void;
}) {
  const [code, setCode] = useState("");
  const [error, setError] = useState(data.error);
  const [attemptsLeft, setAttemptsLeft] = useState(data.attemptsLeft);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const result = await actions.verify(code);
    if (result.ok) return onDone();
    setError(result.error);
    setAttemptsLeft(result.attemptsLeft);
  }

  return (
    <Screen>
      <Wordmark className="self-center" />
      <PageHeading title={t.codeTitle} lead={t.codeLead(data.phoneLast4)} />
      <LinkButton href={data.whatsappUrl} variant="secondary" external>
        {t.openWhatsapp}
      </LinkButton>
      <Button variant="link" onClick={onChangeNumber} className="self-start">
        {t.changeNumber}
      </Button>
      <form onSubmit={submit} className="flex w-full flex-col gap-4">
        <TextField
          name="code"
          label={t.codeLabel}
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          className="[&_input]:tracking-widest"
        />
        {error && (
          <Notice tone="danger">
            {t.codeError[error]} {error === "wrong_code" && t.attemptsLeft(attemptsLeft)}
          </Notice>
        )}
        <Button type="submit" disabled={code.length !== 6 || error === "too_many"}>
          {t.verify}
        </Button>
      </form>
      <LinkButton href={data.whatsappUrl} variant="link" external className="text-center">
        {t.resend}
      </LinkButton>
      <Card tone="neutral" className="mt-auto gap-1">
        <p className="text-body font-semibold">{t.noPasswords}</p>
        <p className="text-small text-muted">{t.noPasswordsHint}</p>
      </Card>
    </Screen>
  );
}

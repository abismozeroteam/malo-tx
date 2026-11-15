"use client";

import { useState } from "react";
import type { CatalogMemeKey } from "@/contracts/common";
import {
  type CreatedDebt,
  type DebtFormActions,
  type DebtFormData,
  type DebtFormErrors,
  type DebtFormStep,
  type DebtFormValues,
  type MemeChoice,
} from "@/contracts/debt-form";
import { debtorAmounts, hasErrors, LIMITS, myShare, remainingToSplit, validateDebtForm } from "@/contracts/debt-form-rules";
import { es } from "@/content/es";
import { centsFromInput, centsToInput, formatMoney } from "@/content/format";
import { Button } from "@/components/ui/Button";
import { MemeCard } from "@/components/ui/MemeCard";
import { Notice } from "@/components/ui/Notice";
import { Screen } from "@/components/ui/Screen";
import { Segmented } from "@/components/ui/Segmented";
import { StepHeader } from "@/components/ui/StepHeader";
import { TextField } from "@/components/ui/TextField";
import { Toggle } from "@/components/ui/Toggle";
import { cx } from "@/components/ui/cx";
import { CreatedScreen } from "./CreatedScreen";

const t = es.debtForm;
const CATALOG: CatalogMemeKey[] = ["a", "b", "c", "d", "e"];
const STEP_NUMBER = { what: 1, who: 2, style: 3 } as const;

const memeView = (choice: MemeChoice, caption: string) =>
  choice.kind === "catalog" ? { kind: "catalog" as const, key: choice.key, caption } : { kind: "upload" as const, src: choice.src, caption };

export function DebtFormScreen({
  data,
  actions,
  cancelHref = "/cobros",
}: {
  data: DebtFormData;
  actions: DebtFormActions;
  cancelHref?: string;
}) {
  const [step, setStep] = useState<DebtFormStep>(data.step);
  const [values, setValues] = useState<DebtFormValues>(data.values);
  const [errors, setErrors] = useState<DebtFormErrors>(data.errors);
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState<CreatedDebt | null>(null);

  if (created) return <CreatedScreen debt={created} creditorName={data.creditorName} />;

  const update = (patch: Partial<DebtFormValues>) => setValues((current) => ({ ...current, ...patch }));
  const cancel = () => window.location.assign(cancelHref);

  function next(from: DebtFormStep, to: DebtFormStep) {
    const found = validateDebtForm(values, from);
    setErrors(found);
    if (!hasErrors(found)) setStep(to);
  }

  async function submit() {
    setSubmitting(true);
    const result = await actions.submit(values);
    setSubmitting(false);
    if (result.ok) return setCreated(result.debt);
    setErrors(result.errors);
    setStep(result.errors.name || result.errors.total || result.errors.meme ? "what" : "who");
  }

  return (
    <Screen>
      <StepHeader
        title={t.title[step]}
        step={STEP_NUMBER[step]}
        onBack={() => (step === "what" ? cancel() : setStep(step === "style" ? "who" : "what"))}
        onCancel={cancel}
      />
      {step === "what" && <WhatStep values={values} errors={errors} uploads={data.uploads} update={update} onNext={() => next("what", "who")} />}
      {step === "who" && <WhoStep values={values} errors={errors} creditorName={data.creditorName} update={update} onNext={() => next("who", "style")} />}
      {step === "style" && <StyleStep values={values} update={update} submitting={submitting} onSubmit={submit} />}
    </Screen>
  );
}

type StepProps = {
  values: DebtFormValues;
  errors: DebtFormErrors;
  update: (patch: Partial<DebtFormValues>) => void;
  onNext: () => void;
};

const errorText = (error: DebtFormErrors[keyof DebtFormErrors] | undefined) => (typeof error === "string" ? t.errors[error] : null);

function MoneyInput({ cents, onChange, ...props }: { cents: number | null; onChange: (cents: number | null) => void } & Omit<React.ComponentProps<typeof TextField>, "onChange" | "value">) {
  const [text, setText] = useState(centsToInput(cents));
  return (
    <TextField
      {...props}
      inputMode="decimal"
      suffix={t.currency}
      value={text}
      onChange={(e) => {
        setText(e.target.value);
        onChange(centsFromInput(e.target.value));
      }}
    />
  );
}

function WhatStep({ values, errors, uploads, update, onNext }: StepProps & { uploads: DebtFormData["uploads"] }) {
  const pick = (meme: MemeChoice) =>
    update({ meme, caption: meme.kind === "catalog" && !values.caption ? es.memes.defaultCaption[meme.key] : values.caption });
  const isPicked = (meme: MemeChoice) =>
    values.meme?.kind === meme.kind && (meme.kind === "catalog" ? values.meme.kind === "catalog" && values.meme.key === meme.key : values.meme.kind === "upload" && values.meme.id === meme.id);

  return (
    <>
      <div className="flex flex-col gap-1">
        <h1 className="text-title font-bold leading-heading">{t.what.heading}</h1>
        <p className="text-body text-muted">{t.what.lead}</p>
      </div>
      <TextField
        name="name"
        label={`${t.what.name} *`}
        placeholder={t.what.namePlaceholder}
        maxLength={LIMITS.name}
        value={values.name}
        onChange={(e) => update({ name: e.target.value })}
        error={errorText(errors.name)}
      />
      <TextField
        name="description"
        label={t.what.description}
        placeholder={t.what.descriptionPlaceholder}
        maxLength={LIMITS.description}
        value={values.description}
        onChange={(e) => update({ description: e.target.value })}
      />
      <MoneyInput name="total" label={`${t.what.total} *`} placeholder="0.00" cents={values.totalCents} onChange={(totalCents) => update({ totalCents })} error={errorText(errors.total)} />
      <TextField name="dueDate" type="date" label={t.what.dueDate} value={values.dueDate} onChange={(e) => update({ dueDate: e.target.value })} />

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-2 text-body font-medium">{`${t.what.meme} *`}</legend>
        {uploads.length > 0 && <p className="text-small font-semibold text-muted">{t.what.myMemes}</p>}
        <div className="grid grid-cols-3 gap-2">
          {uploads.map((upload) => {
            const meme: MemeChoice = { kind: "upload", id: upload.id, src: upload.src };
            return <MemeOption key={upload.id} meme={meme} picked={isPicked(meme)} onPick={pick} />;
          })}
        </div>
        <p className="text-small font-semibold text-muted">{t.what.catalog}</p>
        <div className="grid grid-cols-3 gap-2">
          {CATALOG.map((key) => {
            const meme: MemeChoice = { kind: "catalog", key };
            return <MemeOption key={key} meme={meme} picked={isPicked(meme)} onPick={pick} label={es.memes.shortName[key]} />;
          })}
        </div>
        {errors.meme && <p className="text-small text-danger-ink">{t.errors[errors.meme]}</p>}
      </fieldset>

      <Button onClick={onNext}>{t.what.next}</Button>
    </>
  );
}

function MemeOption({ meme, picked, onPick, label }: { meme: MemeChoice; picked: boolean; onPick: (meme: MemeChoice) => void; label?: string }) {
  return (
    <button
      type="button"
      aria-pressed={picked}
      onClick={() => onPick(meme)}
      className={cx("flex flex-col items-center gap-1 rounded-control p-1", picked ? "ring-2 ring-brand" : "ring-1 ring-line")}
    >
      <MemeCard meme={memeView(meme, "")} size="tile" />
      {label && <span className="text-caption text-muted">{label}</span>}
    </button>
  );
}

function WhoStep({ values, errors, creditorName, update, onNext }: StepProps & { creditorName: string }) {
  const many = values.people.length > 1 || values.includeMe;
  const amounts = debtorAmounts(values);
  const gap = values.split === "custom" ? remainingToSplit(values) : 0;
  const mine = myShare(values);

  const setPerson = (index: number, patch: Partial<DebtFormValues["people"][number]>) =>
    update({ people: values.people.map((p, i) => (i === index ? { ...p, ...patch } : p)) });
  const addPerson = () => update({ people: [...values.people, { firstName: "", phone: "", customCents: null }] });
  const removePerson = (index: number) => update({ people: values.people.filter((_, i) => i !== index) });

  return (
    <>
      <div className="flex flex-col gap-1">
        <h1 className="text-title font-bold leading-heading">{many ? t.who.headingMany : t.who.heading}</h1>
        <p className="text-body text-muted">{t.who.lead}</p>
      </div>
      <Segmented
        label={t.who.heading}
        value={many ? "many" : "one"}
        onChange={(mode) => (mode === "one" ? update({ people: values.people.slice(0, 1), includeMe: false }) : addPerson())}
        options={[
          { value: "one", label: t.who.one },
          { value: "many", label: t.who.many },
        ]}
      />

      {many && (
        <>
          <section className="flex justify-between rounded-card bg-surface p-4 leading-ui">
            <span className="text-body text-muted">{t.who.totalToSplit}</span>
            <span className="text-lead font-semibold">{formatMoney(values.totalCents ?? 0)}</span>
          </section>
          <Segmented
            label={t.who.splitMode}
            value={values.split}
            onChange={(split) => update({ split })}
            options={[
              { value: "equal", label: t.who.equal },
              { value: "custom", label: t.who.custom },
            ]}
          />
          {values.split === "equal" && (
            <p className="text-small text-muted">
              {t.who.equalSummary(values.people.length + (values.includeMe ? 1 : 0), formatMoney(amounts[amounts.length - 1] ?? 0))}
            </p>
          )}
        </>
      )}

      <ul className="flex flex-col gap-3">
        {values.people.map((person, index) => (
          <li key={index} className="flex flex-col gap-3 rounded-card bg-surface p-4">
            <div className="flex items-start gap-3">
              <TextField
                name={`person-${index}-name`}
                label={`${t.who.firstName} *`}
                placeholder={t.who.firstNamePlaceholder}
                maxLength={LIMITS.firstName}
                value={person.firstName}
                onChange={(e) => setPerson(index, { firstName: e.target.value })}
                error={errors.personNames?.includes(index) ? t.errors.required : null}
              />
              {many && (
                <button type="button" onClick={() => removePerson(index)} className="mt-8 text-small font-semibold text-muted">
                  {t.who.removePerson}
                </button>
              )}
            </div>
            <TextField
              name={`person-${index}-phone`}
              label={t.who.phone}
              prefix="+52"
              placeholder={t.who.phonePlaceholder}
              inputMode="numeric"
              value={person.phone}
              onChange={(e) => setPerson(index, { phone: e.target.value })}
              error={errors.personPhones?.includes(index) ? t.errors.invalid_phone : null}
            />
            {many && values.split === "custom" ? (
              <MoneyInput name={`person-${index}-amount`} label={formatMoney(person.customCents ?? 0)} cents={person.customCents} onChange={(customCents) => setPerson(index, { customCents })} />
            ) : (
              <p className="flex justify-between text-body">
                <span className="text-muted">{t.who.owesYou(person.firstName)}</span>
                <span className="font-semibold">{formatMoney(amounts[index] ?? 0)}</span>
              </p>
            )}
          </li>
        ))}
      </ul>

      {many && (
        <>
          <button type="button" onClick={addPerson} className="self-start text-body font-semibold text-brand-ink">
            {t.who.addPerson}
          </button>
          <Toggle label={t.who.includeMe} checked={values.includeMe} onChange={(includeMe) => update({ includeMe })} />
          {values.includeMe && (
            <section className="flex flex-col gap-2 rounded-card bg-brand-soft p-4 leading-ui">
              <p className="flex justify-between text-body font-semibold">
                <span>{t.who.meRow(creditorName)}</span>
                {values.split === "equal" && <span>{formatMoney(mine ?? 0)}</span>}
              </p>
              <p className="text-small text-brand-ink">{t.who.meHint}</p>
              {values.split === "custom" && (
                <MoneyInput name="my-amount" label={t.who.meRow(creditorName)} cents={values.myCustomCents} onChange={(myCustomCents) => update({ myCustomCents })} />
              )}
            </section>
          )}
          {values.split === "custom" && gap !== 0 && (
            <Notice tone={gap > 0 ? "warning" : "danger"}>{gap > 0 ? t.who.missing(formatMoney(gap)) : t.who.over(formatMoney(-gap))}</Notice>
          )}
          <p className="text-small text-muted">{t.who.eachOwnLink}</p>
        </>
      )}

      {errors.split && <Notice tone="danger">{t.errors[errors.split]}</Notice>}
      <Button onClick={onNext}>{t.who.next}</Button>
      <p className="text-center text-caption text-muted">{t.who.ownWhatsapp}</p>
    </>
  );
}

function StyleStep({
  values,
  update,
  submitting,
  onSubmit,
}: {
  values: DebtFormValues;
  update: (patch: Partial<DebtFormValues>) => void;
  submitting: boolean;
  onSubmit: () => void;
}) {
  const first = values.people[0];
  const amounts = debtorAmounts(values);
  return (
    <>
      <div className="flex flex-col gap-1">
        <h1 className="text-title font-bold leading-heading">{t.style.heading}</h1>
        <p className="text-body text-muted">{t.style.lead}</p>
      </div>
      <section className="flex flex-col gap-3 rounded-hero border border-line bg-surface p-3 leading-ui">
        {values.meme && <MemeCard meme={memeView(values.meme, values.caption)} />}
        <p className="text-lead font-semibold">{values.name}</p>
        <p className="flex justify-between text-body">
          <span className="text-muted">{t.style.yourPart(first?.firstName ?? "")}</span>
          <span className="font-semibold">
            {formatMoney(amounts[0] ?? 0)} {t.currency}
          </span>
        </p>
      </section>
      <TextField
        name="caption"
        label={t.style.caption}
        maxLength={LIMITS.caption}
        value={values.caption}
        onChange={(e) => update({ caption: e.target.value })}
      />
      <Button onClick={onSubmit} disabled={submitting}>
        {submitting ? t.style.submitting : t.style.submit}
      </Button>
    </>
  );
}

"use client";

import { useState } from "react";
import { PICKABLE_MEMES, type ActionError } from "@/contracts/common";
import {
  memeChoiceId,
  toMemeView,
  type CreatedDebt,
  type DebtFormActions,
  type DebtFormData,
  type DebtFormError,
  type DebtFormErrors,
  type DebtFormStep,
  type DebtFormValues,
  type MemeChoice,
} from "@/contracts/debt-form";
import {
  DEBT_FORM_STEPS,
  debtorAmounts,
  firstStepWithErrors,
  hasErrors,
  LIMITS,
  myShare,
  remainingToSplit,
  validateDebtForm,
} from "@/contracts/debt-form-rules";
import { routes } from "@/contracts/routes";
import { es } from "@/content/es";
import { centsFromInput, centsToInput, formatMoney } from "@/content/format";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { MemeCard } from "@/components/ui/MemeCard";
import { Notice } from "@/components/ui/Notice";
import { PageHeading } from "@/components/ui/PageHeading";
import { Screen } from "@/components/ui/Screen";
import { Segmented } from "@/components/ui/Segmented";
import { StepHeader } from "@/components/ui/StepHeader";
import { TextField } from "@/components/ui/TextField";
import { Toggle } from "@/components/ui/Toggle";
import { ValueRow } from "@/components/ui/ValueRow";
import { cx } from "@/components/ui/cx";
import { CreatedScreen } from "./CreatedScreen";

const t = es.debtForm;

type Update = (patch: Partial<DebtFormValues>) => void;

export function DebtFormScreen({ data, actions }: { data: DebtFormData; actions: DebtFormActions }) {
  const [step, setStep] = useState<DebtFormStep>(data.step);
  const [values, setValues] = useState<DebtFormValues>(data.values);
  const [errors, setErrors] = useState<DebtFormErrors>(data.errors);
  const [failure, setFailure] = useState<ActionError | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState<CreatedDebt | null>(null);

  if (created) return <CreatedScreen debt={created} creditorName={data.creditorName} />;

  const index = DEBT_FORM_STEPS.indexOf(step);
  const update: Update = (patch) => setValues((current) => ({ ...current, ...patch }));
  const cancel = () => window.location.assign(routes.debts);

  function next() {
    const found = validateDebtForm(values, step);
    setErrors(found);
    if (!hasErrors(found)) setStep(DEBT_FORM_STEPS[index + 1]);
  }

  async function submit() {
    setSubmitting(true);
    setFailure(null);
    const result = await actions.submit(values);
    setSubmitting(false);
    if (result.ok) return setCreated(result.debt);
    if ("error" in result) return setFailure(result.error);
    setErrors(result.errors);
    setStep(firstStepWithErrors(result.errors));
  }

  return (
    <Screen>
      <StepHeader
        title={t.title[step]}
        step={(index + 1) as 1 | 2 | 3}
        onBack={() => (index === 0 ? cancel() : setStep(DEBT_FORM_STEPS[index - 1]))}
        onCancel={cancel}
      />
      {step === "what" && <WhatStep values={values} errors={errors} uploads={data.uploads} update={update} onNext={next} />}
      {step === "who" && <WhoStep values={values} errors={errors} creditorName={data.creditorName} update={update} onNext={next} />}
      {step === "style" && <StyleStep values={values} update={update} submitting={submitting} failure={failure} onSubmit={submit} />}
    </Screen>
  );
}

type StepProps = {
  values: DebtFormValues;
  errors: DebtFormErrors;
  update: Update;
  onNext: () => void;
};

const errorText = (error: DebtFormError | undefined) => (error ? t.errors[error] : null);

function MoneyInput({
  cents,
  onChange,
  ...props
}: { cents: number | null; onChange: (cents: number | null) => void } & Omit<React.ComponentProps<typeof TextField>, "onChange" | "value">) {
  const [text, setText] = useState(centsToInput(cents));
  return (
    <TextField
      {...props}
      inputMode="decimal"
      suffix={es.common.currency}
      value={text}
      onChange={(e) => {
        setText(e.target.value);
        onChange(centsFromInput(e.target.value));
      }}
    />
  );
}

function WhatStep({ values, errors, uploads, update, onNext }: StepProps & { uploads: DebtFormData["uploads"] }) {
  const pickedId = values.meme ? memeChoiceId(values.meme) : null;
  const pick = (meme: MemeChoice) =>
    update({ meme, caption: meme.kind === "catalog" && !values.caption ? es.memes.defaultCaption[meme.key] : values.caption });

  return (
    <>
      <PageHeading title={t.what.heading} lead={t.what.lead} />
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
      <TextField name="dueDate" type="date" label={t.what.dueDate} value={values.dueDate} onChange={(e) => update({ dueDate: e.target.value })} error={errorText(errors.dueDate)} />

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-2 text-body font-medium">{`${t.what.meme} *`}</legend>
        {uploads.length > 0 && (
          <>
            <p className="text-small font-semibold text-muted">{t.what.myMemes}</p>
            <MemeGrid options={uploads.map((upload) => ({ kind: "upload", id: upload.id, src: upload.src }))} pickedId={pickedId} onPick={pick} />
          </>
        )}
        <p className="text-small font-semibold text-muted">{t.what.catalog}</p>
        <MemeGrid options={PICKABLE_MEMES.map((key) => ({ kind: "catalog", key }))} pickedId={pickedId} onPick={pick} />
        {errors.meme && <p className="text-small text-danger-ink">{t.errors[errors.meme]}</p>}
      </fieldset>

      <Button onClick={onNext}>{t.what.next}</Button>
    </>
  );
}

function MemeGrid({ options, pickedId, onPick }: { options: MemeChoice[]; pickedId: string | null; onPick: (meme: MemeChoice) => void }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {options.map((meme) => {
        const id = memeChoiceId(meme);
        return (
          <button
            key={id}
            type="button"
            aria-pressed={id === pickedId}
            onClick={() => onPick(meme)}
            className={cx("flex flex-col items-center gap-1 rounded-control p-1", id === pickedId ? "ring-2 ring-brand" : "ring-1 ring-line")}
          >
            <MemeCard meme={toMemeView(meme, "")} size="tile" />
            {meme.kind === "catalog" && <span className="text-caption text-muted">{es.memes.shortName[meme.key]}</span>}
          </button>
        );
      })}
    </div>
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
      <PageHeading title={many ? t.who.headingMany : t.who.heading} lead={t.who.lead} />
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
          <Card>
            <ValueRow label={t.who.totalToSplit} value={formatMoney(values.totalCents ?? 0)} />
          </Card>
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
              {t.who.equalSummary(values.people.length + (values.includeMe ? 1 : 0), formatMoney(amounts.at(-1) ?? 0))}
            </p>
          )}
        </>
      )}

      <ul className="flex flex-col gap-3">
        {values.people.map((person, index) => (
          <li key={index}>
            <Card>
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
                prefix={es.common.countryCode}
                placeholder={es.common.phonePlaceholder}
                inputMode="numeric"
                value={person.phone}
                onChange={(e) => setPerson(index, { phone: e.target.value })}
                error={errors.personPhones?.includes(index) ? t.errors.invalid_phone : null}
              />
              {many && values.split === "custom" ? (
                <MoneyInput
                  name={`person-${index}-amount`}
                  label={t.who.owesYou(person.firstName)}
                  cents={person.customCents}
                  onChange={(customCents) => setPerson(index, { customCents })}
                />
              ) : (
                <ValueRow label={t.who.owesYou(person.firstName)} value={formatMoney(amounts[index] ?? 0)} />
              )}
            </Card>
          </li>
        ))}
      </ul>

      {many && (
        <>
          <Button variant="link" onClick={addPerson} className="self-start text-body">
            {t.who.addPerson}
          </Button>
          <Toggle label={t.who.includeMe} checked={values.includeMe} onChange={(includeMe) => update({ includeMe })} />
          {values.includeMe && (
            <Card tone="brand">
              <ValueRow label={t.who.meRow(creditorName)} value={values.split === "equal" ? formatMoney(mine ?? 0) : null} />
              <p className="text-small text-brand-ink">{t.who.meHint}</p>
              {values.split === "custom" && (
                <MoneyInput name="my-amount" label={t.who.meRow(creditorName)} cents={values.myCustomCents} onChange={(myCustomCents) => update({ myCustomCents })} />
              )}
            </Card>
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
  failure,
  onSubmit,
}: Pick<StepProps, "values" | "update"> & { submitting: boolean; failure: ActionError | null; onSubmit: () => void }) {
  const amounts = debtorAmounts(values);
  return (
    <>
      <PageHeading title={t.style.heading} lead={t.style.lead} />
      {values.meme && (
        <DebtPreview
          meme={toMemeView(values.meme, values.caption)}
          name={values.name}
          rows={<ValueRow label={t.style.yourPart(values.people[0]?.firstName ?? "")} value={`${formatMoney(amounts[0] ?? 0)} ${es.common.currency}`} />}
        />
      )}
      <TextField name="caption" label={t.style.caption} maxLength={LIMITS.caption} value={values.caption} onChange={(e) => update({ caption: e.target.value })} />
      {failure && <Notice tone="danger">{es.actionErrors[failure]}</Notice>}
      <Button onClick={onSubmit} disabled={submitting}>
        {submitting ? t.style.submitting : t.style.submit}
      </Button>
    </>
  );
}

export function DebtPreview({ meme, name, rows }: { meme: ReturnType<typeof toMemeView>; name: string; rows: React.ReactNode }) {
  return (
    <Card tone="outlined" className="rounded-hero p-3">
      <MemeCard meme={meme} />
      <p className="text-lead font-semibold">{name}</p>
      {rows}
    </Card>
  );
}

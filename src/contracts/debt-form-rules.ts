import type { Cents } from "./common";
import type { DebtFormErrors, DebtFormField, DebtFormStep, DebtFormValues } from "./debt-form";
import { toTenDigitPhone } from "./phone";
import { splitEqually, splitGap } from "./split";

export const LIMITS = {
  name: 60,
  description: 140,
  firstName: 30,
  caption: 80,
  people: 20,
  maxTotalCents: 100_000_000,
};

export const DEBT_FORM_STEPS: DebtFormStep[] = ["what", "who", "style"];

const FIELD_STEP: Record<DebtFormField, DebtFormStep> = {
  name: "what",
  total: "what",
  meme: "what",
  dueDate: "what",
  people: "who",
  split: "who",
};

export function firstStepWithErrors(errors: DebtFormErrors): DebtFormStep {
  const steps = new Set<DebtFormStep>();
  for (const field of Object.keys(errors)) steps.add(field in FIELD_STEP ? FIELD_STEP[field as DebtFormField] : "who");
  return DEBT_FORM_STEPS.find((step) => steps.has(step)) ?? "style";
}

const equalShares = (values: DebtFormValues) =>
  splitEqually(values.totalCents ?? 0, values.people.length + (values.includeMe ? 1 : 0));

export function debtorAmounts(values: DebtFormValues): Cents[] {
  if (values.split === "custom") return values.people.map((person) => person.customCents ?? 0);
  return equalShares(values).slice(0, values.people.length);
}

export function myShare(values: DebtFormValues): Cents | null {
  if (!values.includeMe) return null;
  if (values.split === "custom") return values.myCustomCents ?? 0;
  return equalShares(values).at(-1) ?? 0;
}

export function remainingToSplit(values: DebtFormValues): Cents {
  const amounts = values.people.map((person) => person.customCents);
  return splitGap(values.totalCents ?? 0, values.includeMe ? [...amounts, values.myCustomCents] : amounts);
}

function validateWhat(values: DebtFormValues, errors: DebtFormErrors) {
  const name = values.name.trim();
  if (!name) errors.name = "required";
  else if (name.length > LIMITS.name) errors.name = "too_long";
  const total = values.totalCents;
  if (total === null) errors.total = "required";
  else if (!Number.isSafeInteger(total) || total <= 0 || total > LIMITS.maxTotalCents) errors.total = "invalid_amount";
  if (!values.meme) errors.meme = "required";
}

function validateWho(values: DebtFormValues, errors: DebtFormErrors) {
  if (values.people.length === 0 || values.people.length > LIMITS.people) errors.people = "required";
  const personNames = values.people.flatMap((p, i) => (!p.firstName.trim() || p.firstName.trim().length > LIMITS.firstName ? [i] : []));
  const personPhones = values.people.flatMap((p, i) => (p.phone.trim() && !toTenDigitPhone(p.phone) ? [i] : []));
  if (personNames.length) errors.personNames = personNames;
  if (personPhones.length) errors.personPhones = personPhones;
  const shares = debtorAmounts(values);
  const invalidShare = shares.some((cents) => !Number.isSafeInteger(cents) || cents <= 0);
  if (values.split === "custom" && remainingToSplit(values) !== 0) errors.split = "split_mismatch";
  else if (invalidShare) errors.split = "invalid_amount";
}

export function validateDebtForm(values: DebtFormValues, step: DebtFormStep | "all" = "all"): DebtFormErrors {
  const errors: DebtFormErrors = {};
  if (step === "what" || step === "all") validateWhat(values, errors);
  if (step === "who" || step === "all") validateWho(values, errors);
  return errors;
}

export const hasErrors = (errors: DebtFormErrors) => Object.keys(errors).length > 0;

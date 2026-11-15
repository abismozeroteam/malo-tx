import type { CatalogMemeKey, Cents, IsoDate } from "./common";

export type MemeChoice =
  | { kind: "catalog"; key: CatalogMemeKey }
  | { kind: "upload"; id: string; src: string };

export type SplitMode = "equal" | "custom";

export type DebtFormPerson = { firstName: string; phone: string; customCents: Cents | null };

export type DebtFormValues = {
  name: string;
  description: string;
  dueDate: IsoDate | "";
  totalCents: Cents | null;
  meme: MemeChoice | null;
  caption: string;
  people: DebtFormPerson[];
  split: SplitMode;
  includeMe: boolean;
  myCustomCents: Cents | null;
};

export type DebtFormField = "name" | "total" | "meme" | "people" | "split" | "dueDate";

export type DebtFormError = "required" | "too_long" | "invalid_amount" | "invalid_phone" | "split_mismatch";

export type DebtFormErrors = Partial<Record<DebtFormField, DebtFormError>> & {
  personNames?: number[];
  personPhones?: number[];
};

export type DebtFormStep = "what" | "who" | "style";

export type UploadedMeme = { id: string; src: string };

export type DebtFormData = {
  step: DebtFormStep;
  creditorName: string;
  values: DebtFormValues;
  errors: DebtFormErrors;
  uploads: UploadedMeme[];
};

export type CreatedLink = {
  firstName: string;
  amountCents: Cents;
  url: string;
  whatsappUrl: string;
};

export type CreatedDebt = {
  name: string;
  totalCents: Cents;
  dueDate: IsoDate | null;
  meme: MemeChoice;
  caption: string;
  links: CreatedLink[];
};

export type DebtFormActions = {
  submit(values: DebtFormValues): Promise<{ ok: true; debt: CreatedDebt } | { ok: false; errors: DebtFormErrors }>;
};

export const EMPTY_DEBT_FORM: DebtFormValues = {
  name: "",
  description: "",
  dueDate: "",
  totalCents: null,
  meme: null,
  caption: "",
  people: [{ firstName: "", phone: "", customCents: null }],
  split: "equal",
  includeMe: false,
  myCustomCents: null,
};

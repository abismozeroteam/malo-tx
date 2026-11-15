import { EMPTY_DEBT_FORM, type CreatedDebt, type DebtFormData, type DebtFormValues } from "@/contracts/debt-form";
import { finalMemeView } from "@/content/memes";

const filled: DebtFormValues = {
  ...EMPTY_DEBT_FORM,
  name: "Cena del viernes",
  description: "Cena en La Terraza. Incluye comida, bebidas y propina.",
  dueDate: "2026-11-20",
  totalCents: 180000,
  meme: { kind: "catalog", key: "b" },
  caption: "",
  people: [
    { firstName: "Ana", phone: "55 2345 6789", customCents: null },
    { firstName: "Pedro", phone: "", customCents: null },
    { firstName: "Lucía", phone: "55 4567 8901", customCents: null },
  ],
  includeMe: true,
};

const base = { creditorName: "Pam", errors: {}, uploads: [] };

export const debtFormFixtures: Record<string, DebtFormData> = {
  "vacío": { ...base, step: "what", values: EMPTY_DEBT_FORM },
  "lleno · paso 1 con mis memes": { ...base, step: "what", values: filled, uploads: [{ id: "u1", src: "/memes/c.jpg" }] },
  "con errores · paso 1": { ...base, step: "what", values: EMPTY_DEBT_FORM, errors: { name: "required", total: "required" } },
  "paso 2 · una persona": { ...base, step: "who", values: { ...filled, people: [{ firstName: "Carlos", phone: "", customCents: null }], includeMe: false } },
  "paso 2 · partes iguales": { ...base, step: "who", values: filled },
  "paso 2 · personalizado con faltante": {
    ...base,
    step: "who",
    values: {
      ...filled,
      split: "custom",
      myCustomCents: 45000,
      people: filled.people.map((p, i) => ({ ...p, customCents: i === 2 ? 40000 : 45000 })),
    },
  },
  "paso 2 · con errores": {
    ...base,
    step: "who",
    values: { ...filled, people: [{ firstName: "", phone: "123", customCents: null }, ...filled.people.slice(1)] },
    errors: { personNames: [0], personPhones: [0] },
  },
  "paso 3 · personalizar": { ...base, step: "style", values: filled },
};

export const createdDebtFixture: CreatedDebt = {
  ref: "fixture",
  name: filled.name,
  totalCents: filled.totalCents!,
  dueDate: filled.dueDate || null,
  meme: finalMemeView(filled.meme!, filled.caption),
  links: [
    { firstName: "Ana", amountCents: 45000, url: "https://malotx.app/c/ejemplo-ana", whatsappUrl: "https://wa.me/525523456789" },
    { firstName: "Pedro", amountCents: 45000, url: "https://malotx.app/c/ejemplo-pedro", whatsappUrl: "https://wa.me/" },
  ],
};

import { EMPTY_DEBT_FORM } from "@/contracts/debt-form";
import type { Database } from "@/server/db";
import { signUp } from "@/server/auth/session";
import { createDebt } from "@/server/debts/create-debt";
import type { ValidDebtForm } from "@/server/validation/debt-form";

export const sampleDebtForm: ValidDebtForm = {
  ...EMPTY_DEBT_FORM,
  meme: { kind: "catalog", key: "b" },
  name: "Tacos",
  totalCents: 30_000,
  people: [
    { firstName: "Ana", phone: "", customCents: null },
    { firstName: "Beto", phone: "", customCents: null },
  ],
};

export async function seedDebt(db: Database, values: Partial<ValidDebtForm> = {}) {
  const creditorId = (await signUp(db, "Pam")).userId;
  const debt = await createDebt(db, creditorId, { ...sampleDebtForm, ...values }, "https://malo.test");
  const tokens = (await db.query<{ token: string }>("SELECT token FROM debtors ORDER BY position")).map((r) => r.token);
  return { creditorId, debt, tokens };
}

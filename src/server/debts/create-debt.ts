import "server-only";
import { randomUUID } from "node:crypto";
import type { CatalogMemeKey } from "@/contracts/common";
import type { CreatedDebt, DebtFormValues } from "@/contracts/debt-form";
import { debtorAmounts, myShare } from "@/contracts/debt-form-rules";
import { toTenDigitPhone } from "@/contracts/phone";
import { es } from "@/content/es";
import { catalogMemeView, finalMemeView } from "@/content/memes";
import type { Database } from "../db";
import { randomToken } from "../tokens";

export const debtorUrl = (baseUrl: string, token: string) => `${baseUrl}/c/${token}`;

export function whatsappShareUrl(phone: string | null, text: string) {
  const to = phone ? `52${phone}` : "";
  return `https://wa.me/${to}?text=${encodeURIComponent(text)}`;
}

export async function createDebt(
  db: Database,
  creditorId: string,
  values: DebtFormValues,
  baseUrl: string,
): Promise<CreatedDebt> {
  if (!values.meme || values.totalCents === null) throw new Error("Validated values are required");
  const debtId = randomUUID();
  const ref = randomToken();
  const meme = finalMemeView(values.meme, values.caption);
  const amounts = debtorAmounts(values);
  const people = values.people.map((person, position) => ({
    position,
    firstName: person.firstName.trim(),
    phone: person.phone.trim() ? toTenDigitPhone(person.phone) : null,
    amountCents: amounts[position],
    token: randomToken(),
  }));

  await db.transaction([
    {
      text: `INSERT INTO debts
               (id, ref, creditor_id, name, description, due_date, meme_kind, meme_key, caption, total_cents, creditor_share_cents)
             VALUES ($1, $2, $3, $4, $5, $6, 'catalog', $7, $8, $9, $10)`,
      values: [
        debtId,
        ref,
        creditorId,
        values.name.trim(),
        values.description.trim(),
        values.dueDate || null,
        meme.kind === "catalog" ? meme.key : null,
        meme.caption,
        values.totalCents,
        myShare(values),
      ],
    },
    ...people.map((p) => ({
      text: `INSERT INTO debtors (debt_id, position, first_name, phone, amount_cents, token)
             VALUES ($1, $2, $3, $4, $5, $6)`,
      values: [debtId, p.position, p.firstName, p.phone, p.amountCents, p.token],
    })),
  ]);

  const created = await loadCreatedDebt(db, creditorId, ref, baseUrl);
  if (!created) throw new Error("Created debt not found");
  return created;
}

type DebtRow = { id: string; name: string; due_date: string | null; meme_key: CatalogMemeKey; caption: string; total_cents: number };
type DebtorRow = { first_name: string; phone: string | null; amount_cents: number; token: string };

export async function loadCreatedDebt(
  db: Database,
  creditorId: string,
  ref: string,
  baseUrl: string,
): Promise<CreatedDebt | null> {
  const [debt] = await db.query<DebtRow>(
    `SELECT id, name, to_char(due_date, 'YYYY-MM-DD') AS due_date, meme_key, caption, total_cents
       FROM debts WHERE ref = $1 AND creditor_id = $2 AND deleted_at IS NULL`,
    [ref, creditorId],
  );
  if (!debt) return null;
  const debtors = await db.query<DebtorRow>(
    "SELECT first_name, phone, amount_cents, token FROM debtors WHERE debt_id = $1 ORDER BY position",
    [debt.id],
  );
  return {
    ref,
    name: debt.name,
    totalCents: debt.total_cents,
    dueDate: debt.due_date,
    meme: catalogMemeView(debt.meme_key, debt.caption),
    links: debtors.map((d) => {
      const url = debtorUrl(baseUrl, d.token);
      return {
        firstName: d.first_name,
        amountCents: d.amount_cents,
        url,
        whatsappUrl: whatsappShareUrl(d.phone, es.created.shareText(d.first_name, url)),
      };
    }),
  };
}

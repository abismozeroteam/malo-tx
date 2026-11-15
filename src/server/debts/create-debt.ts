import "server-only";
import { randomUUID } from "node:crypto";
import type { CatalogMemeKey } from "@/contracts/common";
import type { CreatedDebt, CreatedLink } from "@/contracts/debt-form";
import { debtorAmounts, myShare } from "@/contracts/debt-form-rules";
import { toTenDigitPhone, toWhatsappNumber } from "@/contracts/phone";
import { routes } from "@/contracts/routes";
import { es } from "@/content/es";
import { catalogMemeView, finalMemeView } from "@/content/memes";
import type { Database } from "../db";
import { randomToken } from "../tokens";
import type { ValidDebtForm } from "../validation/debt-form";

type Debtor = { firstName: string; phone: string | null; amountCents: number; token: string };

export function whatsappShareUrl(phone: string | null, text: string) {
  return `https://wa.me/${phone ? toWhatsappNumber(phone) : ""}?text=${encodeURIComponent(text)}`;
}

function toLink(baseUrl: string, debtor: Debtor): CreatedLink {
  const url = `${baseUrl}${routes.debtor(debtor.token)}`;
  return {
    firstName: debtor.firstName,
    amountCents: debtor.amountCents,
    url,
    whatsappUrl: whatsappShareUrl(debtor.phone, es.created.shareText(debtor.firstName, url)),
  };
}

export async function createDebt(db: Database, creditorId: string, values: ValidDebtForm, baseUrl: string): Promise<CreatedDebt> {
  const debtId = randomUUID();
  const ref = randomToken();
  const name = values.name.trim();
  const dueDate = values.dueDate || null;
  const meme = finalMemeView(values.meme, values.caption);
  const amounts = debtorAmounts(values);
  const debtors: Debtor[] = values.people.map((person, i) => ({
    firstName: person.firstName.trim(),
    phone: toTenDigitPhone(person.phone),
    amountCents: amounts[i],
    token: randomToken(),
  }));

  await db.transaction([
    {
      text: `INSERT INTO debts
               (id, ref, creditor_id, name, description, due_date, meme_kind, meme_key, caption, total_cents, creditor_share_cents)
             VALUES ($1, $2, $3, $4, $5, $6, 'catalog', $7, $8, $9, $10)`,
      values: [debtId, ref, creditorId, name, values.description.trim(), dueDate, values.meme.key, meme.caption, values.totalCents, myShare(values)],
    },
    ...debtors.map((d, position) => ({
      text: `INSERT INTO debtors (debt_id, position, first_name, phone, amount_cents, token) VALUES ($1, $2, $3, $4, $5, $6)`,
      values: [debtId, position, d.firstName, d.phone, d.amountCents, d.token],
    })),
  ]);

  return { ref, name, totalCents: values.totalCents, dueDate, meme, links: debtors.map((d) => toLink(baseUrl, d)) };
}

type CreatedDebtRow = {
  name: string;
  due_date: string | null;
  meme_key: CatalogMemeKey;
  caption: string;
  total_cents: number;
  debtors: { first_name: string; phone: string | null; amount_cents: number; token: string }[];
};

export async function loadCreatedDebt(db: Database, creditorId: string, ref: string, baseUrl: string): Promise<CreatedDebt | null> {
  const [row] = await db.query<CreatedDebtRow>(
    `SELECT d.name, to_char(d.due_date, 'YYYY-MM-DD') AS due_date, d.meme_key, d.caption, d.total_cents,
            json_agg(json_build_object('first_name', p.first_name, 'phone', p.phone, 'amount_cents', p.amount_cents, 'token', p.token)
                     ORDER BY p.position) AS debtors
       FROM debts d JOIN debtors p ON p.debt_id = d.id
      WHERE d.ref = $1 AND d.creditor_id = $2 AND d.deleted_at IS NULL
      GROUP BY d.id`,
    [ref, creditorId],
  );
  if (!row) return null;
  return {
    ref,
    name: row.name,
    totalCents: row.total_cents,
    dueDate: row.due_date,
    meme: catalogMemeView(row.meme_key, row.caption),
    links: row.debtors.map((d) =>
      toLink(baseUrl, { firstName: d.first_name, phone: d.phone, amountCents: d.amount_cents, token: d.token }),
    ),
  };
}

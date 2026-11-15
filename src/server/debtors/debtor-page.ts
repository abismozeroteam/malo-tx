import "server-only";
import { cache } from "react";
import type { CatalogMemeKey } from "@/contracts/common";
import type { DebtorPageData, DebtorStatus } from "@/contracts/debtor-page";
import { todayInMexicoCity } from "@/content/format";
import { catalogMemeView } from "@/content/memes";
import { db, type Database } from "../db";
import { freshQr } from "./qr";

const ISO = `'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'`;

export type DebtorRow = {
  id: string;
  token: string;
  first_name: string;
  amount_cents: number;
  status: DebtorStatus;
  qr_expires_at: string | null;
  paid_at: string | null;
  debt_name: string;
  due_date: string | null;
  meme_key: CatalogMemeKey;
  caption: string;
  total_cents: number;
  shared: boolean;
  deleted: boolean;
  creditor_name: string;
};

export async function findDebtor(db: Database, token: string): Promise<DebtorRow | null> {
  if (token.length > 64) return null;
  const [row] = await db.query<DebtorRow>(
    `SELECT p.id, p.token, p.first_name, p.amount_cents, p.status,
            to_char(p.qr_expires_at AT TIME ZONE 'UTC', ${ISO}) AS qr_expires_at,
            to_char(p.paid_at AT TIME ZONE 'UTC', ${ISO}) AS paid_at,
            d.name AS debt_name, to_char(d.due_date, 'YYYY-MM-DD') AS due_date, d.meme_key, d.caption, d.total_cents,
            EXISTS (SELECT 1 FROM debtors q WHERE q.debt_id = d.id AND q.id <> p.id) AS shared,
            d.deleted_at IS NOT NULL AS deleted, u.display_name AS creditor_name
       FROM debtors p JOIN debts d ON d.id = p.debt_id JOIN users u ON u.id = d.creditor_id
      WHERE p.token = $1`,
    [token],
  );
  return row ?? null;
}

export const loadDebtor = cache((token: string) => findDebtor(db(), token));

export const isOpen = (row: DebtorRow) => !row.deleted && row.status !== "paid" && row.status !== "cancelled";

export async function findOpenDebtor(db: Database, token: unknown): Promise<DebtorRow | null> {
  if (typeof token !== "string") return null;
  const row = await findDebtor(db, token);
  return row && isOpen(row) ? row : null;
}

export function toDebtorPage(row: DebtorRow | null, demoMode: boolean, now = new Date()): DebtorPageData {
  if (!row || row.deleted || row.status === "cancelled") return { state: "gone" };
  const base = {
    debtorName: row.first_name,
    creditorName: row.creditor_name,
    debtName: row.debt_name,
    amountCents: row.amount_cents,
    demoMode,
  };
  if (row.status === "paid") return { ...base, state: "paid", paidAt: row.paid_at ?? now.toISOString() };
  return {
    ...base,
    state: "open",
    status: row.status,
    meme: catalogMemeView(row.meme_key, row.caption),
    totalCents: row.shared ? row.total_cents : null,
    dueDate: row.due_date,
    overdue: row.due_date !== null && row.due_date < todayInMexicoCity(now),
    canAnswer: row.status === "pending",
    canReport: false,
    qr: freshQr(row.token, row.qr_expires_at, now),
  };
}

import "server-only";
import type { CatalogMemeKey } from "@/contracts/common";
import type { CodiQr, DebtorPageData, DebtorStatus } from "@/contracts/debtor-page";
import { catalogMemeView } from "@/content/memes";
import type { Database } from "../db";

export const QR_SECONDS = 600;
const QR_MIN_LEFT_MS = 60_000;

export type DebtorRow = {
  id: string;
  first_name: string;
  amount_cents: number;
  status: DebtorStatus;
  qr_image: string | null;
  qr_expires_at: Date | null;
  paid_at: Date | null;
  debt_name: string;
  due_date: string | null;
  meme_key: CatalogMemeKey;
  caption: string;
  total_cents: number;
  people: number;
  deleted: boolean;
  creditor_name: string;
};

export async function findDebtor(db: Database, token: string): Promise<DebtorRow | null> {
  if (token.length > 64) return null;
  const [row] = await db.query<DebtorRow>(
    `SELECT p.id, p.first_name, p.amount_cents, p.status, p.qr_image, p.qr_expires_at, p.paid_at,
            d.name AS debt_name, to_char(d.due_date, 'YYYY-MM-DD') AS due_date, d.meme_key, d.caption, d.total_cents,
            (SELECT count(*)::int FROM debtors q WHERE q.debt_id = d.id) AS people,
            d.deleted_at IS NOT NULL AS deleted, u.display_name AS creditor_name
       FROM debtors p JOIN debts d ON d.id = p.debt_id JOIN users u ON u.id = d.creditor_id
      WHERE p.token = $1`,
    [token],
  );
  return row ?? null;
}

export const isOpen = (row: DebtorRow) => !row.deleted && row.status !== "paid" && row.status !== "cancelled";

export function storedQr(row: Pick<DebtorRow, "qr_image" | "qr_expires_at">, now = new Date()): CodiQr | null {
  if (!row.qr_image || !row.qr_expires_at) return null;
  const expiresAt = new Date(row.qr_expires_at);
  if (expiresAt.getTime() - now.getTime() < QR_MIN_LEFT_MS) return null;
  return { imageSrc: `data:image/png;base64,${row.qr_image}`, expiresAt: expiresAt.toISOString() };
}

const mexicoCityDate = (now: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Mexico_City" }).format(now);

export function toDebtorPage(row: DebtorRow | null, demoMode: boolean, now = new Date()): DebtorPageData {
  if (!row || row.deleted || row.status === "cancelled") return { state: "gone" };
  const base = {
    debtorName: row.first_name,
    creditorName: row.creditor_name,
    debtName: row.debt_name,
    amountCents: row.amount_cents,
    demoMode,
  };
  if (row.status === "paid") return { ...base, state: "paid", paidAt: new Date(row.paid_at ?? now).toISOString() };
  return {
    ...base,
    state: "open",
    status: row.status,
    meme: catalogMemeView(row.meme_key, row.caption),
    totalCents: row.people > 1 ? row.total_cents : null,
    dueDate: row.due_date,
    overdue: row.due_date !== null && row.due_date < mexicoCityDate(now),
    canAnswer: row.status === "pending",
    canReport: false,
    qr: storedQr(row, now),
  };
}

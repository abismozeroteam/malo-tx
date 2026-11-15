import "server-only";
import { randomInt } from "node:crypto";
import { OPEN_DEBTOR_STATUSES, type CodiQr, type DebtorAnswer, type DebtorStatus } from "@/contracts/debtor-page";
import type { Database } from "../db";
import { chargeAmountCents, DEMO_MAX_CENTS, pesosToCents, peyDate } from "../pey/charge-rules";
import { createCodiPush, createCodiQr, getQrTransactions, getTransaction } from "../pey/client";
import { DEBTOR_ID_KEY } from "../pey/webhook-event";
import type { Phone } from "../validation/phone";
import type { DebtorRow } from "./debtor-page";
import { freshQr, QR_SECONDS } from "./qr";

export type PeyCharges = {
  createQr: typeof createCodiQr;
  createPush: typeof createCodiPush;
  qrTransactions: typeof getQrTransactions;
  transaction: typeof getTransaction;
};

export const peyCharges: PeyCharges = {
  createQr: createCodiQr,
  createPush: createCodiPush,
  qrTransactions: getQrTransactions,
  transaction: getTransaction,
};

const OPEN_SQL = `status IN (${OPEN_DEBTOR_STATUSES.map((s) => `'${s}'`).join(", ")})`;

const charge = (row: DebtorRow, demoMode: boolean) => ({
  amountCents: chargeAmountCents(row.amount_cents, demoMode),
  concept: row.debt_name.slice(0, 40),
  expirationSeconds: QR_SECONDS,
  numRef: String(randomInt(1, 10_000_000)),
  metadata: { [DEBTOR_ID_KEY]: row.id },
});

export async function ensureQr(db: Database, pey: PeyCharges, row: DebtorRow, demoMode: boolean, now = new Date()): Promise<CodiQr> {
  const existing = freshQr(row.token, row.qr_expires_at, now);
  if (existing) return existing;

  const qr = await pey.createQr(charge(row, demoMode));
  if (!qr.qrImage) throw new Error("pey returned no QR image");
  const expiresAt = new Date(now.getTime() + QR_SECONDS * 1000).toISOString();
  await db.query("UPDATE debtors SET qr_id = $2, qr_image = $3, qr_expires_at = $4 WHERE id = $1", [row.id, qr.id, qr.qrImage, expiresAt]);
  return freshQr(row.token, expiresAt, now)!;
}

export async function sendPush(db: Database, pey: PeyCharges, row: DebtorRow, phone: Phone, demoMode: boolean) {
  const { transactionId } = await pey.createPush({ ...charge(row, demoMode), phoneNumber: phone });
  await db.query("UPDATE debtors SET push_transaction_id = $2 WHERE id = $1", [row.id, transactionId]);
}

export async function answer(db: Database, debtorId: string, status: DebtorAnswer): Promise<boolean> {
  const rows = await db.query(
    "UPDATE debtors SET status = $2, updated_at = now() WHERE id = $1 AND status = 'pending' RETURNING id",
    [debtorId, status],
  );
  return rows.length === 1;
}

export async function qrImage(db: Database, token: string): Promise<Buffer | null> {
  const [row] = await db.query<{ qr_image: string }>(
    `SELECT qr_image FROM debtors WHERE token = $1 AND qr_expires_at > now() AND ${OPEN_SQL}`,
    [token],
  );
  return row ? Buffer.from(row.qr_image, "base64") : null;
}

export const demoChargeCents = (demoMode: boolean) => (demoMode ? DEMO_MAX_CENTS : null);

export const markPaidSql = (p: { id: string; paidCents: string; paidAt: string; demoCents: string }) =>
  `UPDATE debtors SET status = 'paid', settlement = 'codi', paid_at = coalesce(${p.paidAt}, now()), updated_at = now()
    WHERE id = ${p.id} AND ${OPEN_SQL} AND ${p.paidCents} >= coalesce(${p.demoCents}, amount_cents)
      AND NOT EXISTS (SELECT 1 FROM debts d WHERE d.id = debtors.debt_id AND d.deleted_at IS NOT NULL)
    RETURNING debtors.id`;

export async function markPaid(db: Database, debtorId: string, paidCents: number, paidAt: Date | null, demoMode: boolean) {
  const rows = await db.query(markPaidSql({ id: "$1", paidCents: "$2", paidAt: "$3", demoCents: "$4" }), [
    debtorId,
    paidCents,
    paidAt,
    demoChargeCents(demoMode),
  ]);
  return rows.length === 1;
}

type PaymentRefs = { id: string; qr_id: string | null; push_transaction_id: string | null };

export async function markPaidFromPey(db: Database, pey: PeyCharges, refs: PaymentRefs, demoMode: boolean) {
  const [push, qr] = await Promise.all([
    refs.push_transaction_id ? pey.transaction(refs.push_transaction_id).then((t) => [t]) : [],
    refs.qr_id ? pey.qrTransactions(refs.qr_id).then((r) => r.items) : [],
  ]);
  const paid = [...push, ...qr].find((t) => t.status === "PAID");
  if (!paid) return false;
  return markPaid(db, refs.id, pesosToCents(paid.amount), peyDate(paid.datePaid), demoMode);
}

export async function paymentStatus(db: Database, token: string) {
  const [row] = await db.query<PaymentRefs & { status: DebtorStatus }>(
    "SELECT id, status, qr_id, push_transaction_id FROM debtors WHERE token = $1",
    [token],
  );
  return row ?? null;
}

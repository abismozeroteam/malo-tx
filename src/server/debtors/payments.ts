import "server-only";
import { randomInt } from "node:crypto";
import type { CodiQr, DebtorAnswer } from "@/contracts/debtor-page";
import type { Database } from "../db";
import { chargeAmountCents } from "../pey/charge-rules";
import { createCodiPush, createCodiQr } from "../pey/client";
import type { Phone } from "../validation/phone";
import type { DebtorRow } from "./debtor-page";
import { freshQr, QR_SECONDS } from "./qr";

export type PeyCharges = { createQr: typeof createCodiQr; createPush: typeof createCodiPush };

export const peyCharges: PeyCharges = { createQr: createCodiQr, createPush: createCodiPush };

const charge = (row: DebtorRow, demoMode: boolean) => ({
  amountCents: chargeAmountCents(row.amount_cents, demoMode),
  concept: row.debt_name.slice(0, 40),
  expirationSeconds: QR_SECONDS,
  numRef: String(randomInt(1, 10_000_000)),
  metadata: { debtorId: row.id },
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

export async function sendPush(pey: PeyCharges, row: DebtorRow, phone: Phone, demoMode: boolean) {
  await pey.createPush({ ...charge(row, demoMode), phoneNumber: phone });
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
    "SELECT qr_image FROM debtors WHERE token = $1 AND qr_expires_at > now() AND status IN ('pending', 'claims_paid', 'disputed')",
    [token],
  );
  return row ? Buffer.from(row.qr_image, "base64") : null;
}

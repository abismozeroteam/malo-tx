import "server-only";
import { randomInt } from "node:crypto";
import type { CodiQr } from "@/contracts/debtor-page";
import type { Database } from "../db";
import { createCodiPush, createCodiQr } from "../pey/client";
import type { Phone } from "../validation/phone";
import { isOpen, QR_SECONDS, storedQr, type DebtorRow } from "./debtor-page";

export type PeyCharges = { createQr: typeof createCodiQr; createPush: typeof createCodiPush };

export const peyCharges: PeyCharges = { createQr: createCodiQr, createPush: createCodiPush };

function charge(row: DebtorRow, demoMode: boolean) {
  return {
    amountCents: demoMode ? 1 : row.amount_cents,
    concept: row.debt_name.slice(0, 40),
    expirationSeconds: QR_SECONDS,
    numRef: String(randomInt(1, 10_000_000)),
    metadata: { debtorId: row.id },
  };
}

export async function ensureQr(db: Database, pey: PeyCharges, row: DebtorRow, demoMode: boolean, now = new Date()): Promise<CodiQr | null> {
  if (!isOpen(row)) return null;
  const existing = storedQr(row, now);
  if (existing) return existing;

  const qr = await pey.createQr(charge(row, demoMode));
  if (!qr.qrImage) throw new Error("pey returned no QR image");
  const expiresAt = new Date(now.getTime() + QR_SECONDS * 1000);
  await db.query("UPDATE debtors SET qr_id = $2, qr_image = $3, qr_expires_at = $4 WHERE id = $1", [row.id, qr.id, qr.qrImage, expiresAt]);
  return storedQr({ qr_image: qr.qrImage, qr_expires_at: expiresAt }, now);
}

export async function sendPush(pey: PeyCharges, row: DebtorRow, phone: Phone, demoMode: boolean): Promise<boolean> {
  if (!isOpen(row)) return false;
  await pey.createPush({ ...charge(row, demoMode), phoneNumber: phone });
  return true;
}

export async function answer(db: Database, debtorId: string, status: "claims_paid" | "disputed"): Promise<boolean> {
  const rows = await db.query(
    "UPDATE debtors SET status = $2, answered_at = now(), updated_at = now() WHERE id = $1 AND status = 'pending' RETURNING id",
    [debtorId, status],
  );
  return rows.length === 1;
}

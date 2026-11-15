"use server";

import { headers } from "next/headers";
import type { ActionResult } from "@/contracts/common";
import type { DebtorAnswer, QrResult } from "@/contracts/debtor-page";
import { db } from "../db";
import { findOpenDebtor } from "../debtors/debtor-page";
import { answer, ensureQr, markPaidFromPey, paymentStatus, peyCharges, sendPush } from "../debtors/payments";
import { isDemoMode } from "../env";
import { logFailure } from "../log";
import { consume, ipKey, limit, RATE_LIMITS } from "../rate-limit";
import { phoneSchema } from "../validation/phone";

export async function requestQrAction(token: unknown): Promise<QrResult> {
  const row = await findOpenDebtor(db(), token);
  if (!row) return { ok: false, error: "not_allowed" };
  const limits = [limit(`qr:debtor:${row.id}`, RATE_LIMITS.qrPerLink), limit(ipKey("qr", await headers()), RATE_LIMITS.qrPerIp)];
  if (!(await consume(db(), limits))) return { ok: false, error: "rate_limited" };
  try {
    return { ok: true, qr: await ensureQr(db(), peyCharges, row, isDemoMode()) };
  } catch (error) {
    logFailure("qr", error);
    return { ok: false, error: "network" };
  }
}

export async function sendPushAction(token: unknown, phoneInput: unknown): Promise<ActionResult> {
  const phone = phoneSchema.safeParse(phoneInput);
  if (!phone.success) return { ok: false, error: "invalid_phone" };
  const row = await findOpenDebtor(db(), token);
  if (!row) return { ok: false, error: "not_allowed" };
  const limits = [
    limit(`push:debtor:${row.id}`, RATE_LIMITS.pushesPerLinkMinute),
    limit(`push:debtor:${row.id}`, RATE_LIMITS.pushesPerLink),
    limit(ipKey("push", await headers()), RATE_LIMITS.pushesPerIp),
  ];
  if (!(await consume(db(), limits))) return { ok: false, error: "rate_limited" };
  try {
    await sendPush(db(), peyCharges, row, phone.data, isDemoMode());
    return { ok: true };
  } catch (error) {
    logFailure("push", error);
    return { ok: false, error: "push_failed" };
  }
}

async function answerAction(token: unknown, status: DebtorAnswer): Promise<ActionResult> {
  const [row, allowed] = await Promise.all([
    findOpenDebtor(db(), token),
    headers().then((h) => consume(db(), [limit(ipKey("answer", h), RATE_LIMITS.answersPerIp)])),
  ]);
  if (!row) return { ok: false, error: "not_allowed" };
  if (!allowed) return { ok: false, error: "rate_limited" };
  return (await answer(db(), row.id, status)) ? { ok: true } : { ok: false, error: "already_answered" };
}

export async function claimPaidAction(token: unknown): Promise<ActionResult> {
  return answerAction(token, "claims_paid");
}

export async function disputeAction(token: unknown): Promise<ActionResult> {
  return answerAction(token, "disputed");
}

export async function reportAction(): Promise<ActionResult> {
  return { ok: false, error: "not_allowed" };
}

export async function checkPaidAction(token: unknown, askPey: unknown): Promise<boolean> {
  if (typeof token !== "string" || token.length > 64) return false;
  const row = await paymentStatus(db(), token);
  if (!row || row.status === "cancelled") return false;
  if (row.status === "paid") return true;
  if (askPey !== true || (!row.qr_id && !row.push_transaction_id)) return false;
  if (!(await consume(db(), [limit(`pey-check:${row.id}`, RATE_LIMITS.peyChecksPerLink)]))) return false;
  try {
    return await markPaidFromPey(db(), peyCharges, row, isDemoMode());
  } catch (error) {
    logFailure("pey-check", error);
    return false;
  }
}

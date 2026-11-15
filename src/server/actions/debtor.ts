"use server";

import { headers } from "next/headers";
import type { ActionResult } from "@/contracts/common";
import type { DebtorPageActions } from "@/contracts/debtor-page";
import { db } from "../db";
import { findDebtor, isOpen } from "../debtors/debtor-page";
import { answer, ensureQr, peyCharges, sendPush } from "../debtors/payments";
import { isDemoMode } from "../env";
import { clientIp, consume, RATE_LIMITS } from "../rate-limit";
import { phoneSchema } from "../validation/phone";

type QrResult = Awaited<ReturnType<DebtorPageActions["requestQr"]>>;

async function openDebtor(token: unknown) {
  if (typeof token !== "string") return null;
  const row = await findDebtor(db(), token);
  return row && isOpen(row) ? row : null;
}

const ipKey = async (action: string) => `${action}:ip:${clientIp(await headers())}`;

const failed = (action: string, error: unknown) =>
  console.error(`[${action}] failed:`, error instanceof Error ? error.message : "unknown error");

export async function requestQrAction(token: string): Promise<QrResult> {
  const row = await openDebtor(token);
  if (!row) return { ok: false, error: "not_allowed" };
  const limits = [
    { key: `qr:debtor:${row.id}`, max: RATE_LIMITS.qrPerLink },
    { key: await ipKey("qr"), max: RATE_LIMITS.qrPerIp },
  ];
  if (!(await consume(db(), limits, 3600))) return { ok: false, error: "rate_limited" };
  try {
    const qr = await ensureQr(db(), peyCharges, row, isDemoMode());
    return qr ? { ok: true, qr } : { ok: false, error: "not_allowed" };
  } catch (error) {
    failed("qr", error);
    return { ok: false, error: "network" };
  }
}

export async function sendPushAction(token: string, phoneInput: unknown): Promise<ActionResult> {
  const phone = phoneSchema.safeParse(phoneInput);
  if (!phone.success) return { ok: false, error: "invalid_phone" };
  const row = await openDebtor(token);
  if (!row) return { ok: false, error: "not_allowed" };
  const allowed =
    (await consume(db(), [{ key: `push:minute:${row.id}`, max: 1 }], 60)) &&
    (await consume(db(), [{ key: `push:debtor:${row.id}`, max: RATE_LIMITS.pushesPerLink }, { key: await ipKey("push"), max: RATE_LIMITS.pushesPerIp }], 86_400));
  if (!allowed) return { ok: false, error: "rate_limited" };
  try {
    return (await sendPush(peyCharges, row, phone.data, isDemoMode())) ? { ok: true } : { ok: false, error: "not_allowed" };
  } catch (error) {
    failed("push", error);
    return { ok: false, error: "push_failed" };
  }
}

async function answerAction(token: unknown, status: "claims_paid" | "disputed"): Promise<ActionResult> {
  const row = await openDebtor(token);
  if (!row) return { ok: false, error: "not_allowed" };
  if (!(await consume(db(), [{ key: await ipKey("answer"), max: RATE_LIMITS.answersPerIp }], 3600))) return { ok: false, error: "rate_limited" };
  return (await answer(db(), row.id, status)) ? { ok: true } : { ok: false, error: "already_answered" };
}

export async function claimPaidAction(token: string): Promise<ActionResult> {
  return answerAction(token, "claims_paid");
}

export async function disputeAction(token: string): Promise<ActionResult> {
  return answerAction(token, "disputed");
}

export async function reportAction(): Promise<ActionResult> {
  return { ok: false, error: "not_allowed" };
}

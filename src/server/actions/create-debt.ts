"use server";

import { headers } from "next/headers";
import type { DebtFormActions } from "@/contracts/debt-form";
import { hasErrors, validateDebtForm } from "@/contracts/debt-form-rules";
import { getCurrentUser } from "../auth/current-user";
import { db } from "../db";
import { createDebt } from "../debts/create-debt";
import { clientIp, consume, RATE_LIMITS } from "../rate-limit";
import { siteUrl } from "../site-url";
import { debtFormSchema } from "../validation/debt-form";

type SubmitResult = Awaited<ReturnType<DebtFormActions["submit"]>>;

export async function createDebtAction(input: unknown): Promise<SubmitResult> {
  const parsed = debtFormSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "not_allowed" };
  const errors = validateDebtForm(parsed.data, "all");
  if (hasErrors(errors)) return { ok: false, errors };

  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "not_allowed" };

  const ip = clientIp(await headers());
  const limits = [
    { key: `debt:user:${user.id}`, max: RATE_LIMITS.debtsPerUser },
    { key: `debt:ip:${ip}`, max: RATE_LIMITS.debtsPerIp },
  ];
  if (!(await consume(db(), limits, 3600))) return { ok: false, error: "rate_limited" };

  try {
    return { ok: true, debt: await createDebt(db(), user.id, parsed.data, siteUrl()) };
  } catch (error) {
    console.error("[create-debt] failed:", error instanceof Error ? error.message : "unknown error");
    return { ok: false, error: "network" };
  }
}

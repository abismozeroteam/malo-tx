"use server";

import { headers } from "next/headers";
import type { DebtFormActions } from "@/contracts/debt-form";
import { hasErrors, validateDebtForm } from "@/contracts/debt-form-rules";
import { getCurrentUser } from "../auth/current-user";
import { db } from "../db";
import { createDebt } from "../debts/create-debt";
import { clientIp, consume } from "../rate-limit";
import { siteUrl } from "../site-url";
import { debtFormSchema } from "../validation/debt-form";

type SubmitResult = Awaited<ReturnType<DebtFormActions["submit"]>>;

export async function createDebtAction(input: unknown): Promise<SubmitResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "not_allowed" };

  const parsed = debtFormSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "not_allowed" };
  const errors = validateDebtForm(parsed.data, "all");
  if (hasErrors(errors)) return { ok: false, errors };

  const ip = clientIp(await headers());
  const allowed =
    (await consume(db(), `debt:user:${user.id}`, 30, 3600)) && (await consume(db(), `debt:ip:${ip}`, 60, 3600));
  if (!allowed) return { ok: false, error: "rate_limited" };

  try {
    return { ok: true, debt: await createDebt(db(), user.id, parsed.data, siteUrl()) };
  } catch (error) {
    console.error("[create-debt] failed:", error instanceof Error ? error.message : "unknown error");
    return { ok: false, error: "network" };
  }
}

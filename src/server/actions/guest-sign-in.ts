"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { LIMITS } from "@/contracts/debt-form-rules";
import { routes } from "@/contracts/routes";
import type { GuestEntryState } from "@/contracts/guest-entry";
import { signUpWithCookie } from "../auth/current-user";
import { db } from "../db";
import { consume, ipKey, limit, RATE_LIMITS } from "../rate-limit";

const nameSchema = z.string().trim().min(1).max(LIMITS.firstName);

export async function guestSignIn(_state: GuestEntryState, form: FormData): Promise<GuestEntryState> {
  if (!(await consume(db(), [limit(ipKey("sign-in", await headers()), RATE_LIMITS.signInsPerIp)]))) return { error: "rate_limited" };
  const name = nameSchema.safeParse(form.get("name"));
  if (!name.success) return { error: "invalid_name" };

  await signUpWithCookie(name.data);
  redirect(routes.debts);
}

"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { LIMITS } from "@/contracts/debt-form-rules";
import { routes } from "@/contracts/routes";
import type { TeamGateState } from "@/contracts/team-gate";
import { signUpWithCookie } from "../auth/current-user";
import { isTeamSecret } from "../auth/team-secret";
import { db } from "../db";
import { clientIp, consume, RATE_LIMITS } from "../rate-limit";

const nameSchema = z.string().trim().min(1).max(LIMITS.firstName);

export async function teamSignIn(_state: TeamGateState, form: FormData): Promise<TeamGateState> {
  const ip = clientIp(await headers());
  if (!(await consume(db(), [{ key: `gate:ip:${ip}`, max: RATE_LIMITS.gatePerIp }], 600))) return { error: "rate_limited" };
  if (!isTeamSecret(form.get("secret"))) return { error: "wrong_secret" };
  const name = nameSchema.safeParse(form.get("name"));
  if (!name.success) return { error: "invalid_name" };

  await signUpWithCookie(name.data);
  redirect(routes.debts);
}

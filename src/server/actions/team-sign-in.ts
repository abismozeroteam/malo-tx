"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { LIMITS } from "@/contracts/debt-form-rules";
import { routes } from "@/contracts/routes";
import type { TeamGateState } from "@/contracts/team-gate";
import { startSession } from "../auth/current-user";
import { createUser } from "../auth/session";
import { isTeamSecret } from "../auth/team-secret";
import { db } from "../db";
import { clientIp, consume } from "../rate-limit";

const nameSchema = z.string().trim().min(1).max(LIMITS.firstName);

export async function teamSignIn(_state: TeamGateState, form: FormData): Promise<TeamGateState> {
  const ip = clientIp(await headers());
  if (!(await consume(db(), `gate:ip:${ip}`, 10, 600))) return { error: "rate_limited" };

  const secret = form.get("secret");
  if (typeof secret !== "string" || !isTeamSecret(secret)) return { error: "wrong_secret" };
  const name = nameSchema.safeParse(form.get("name"));
  if (!name.success) return { error: "invalid_name" };

  await startSession(await createUser(db(), name.data));
  redirect(routes.newDebt);
}

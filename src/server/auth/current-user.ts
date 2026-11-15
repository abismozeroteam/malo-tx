import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { routes } from "@/contracts/routes";
import { db } from "../db";
import { findSessionUser, signUp, type SessionUser } from "./session";

const COOKIE = "malotx_session";

export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const token = (await cookies()).get(COOKIE)?.value;
  return token ? findSessionUser(db(), token) : null;
});

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect(routes.signIn);
  return user;
}

export async function signUpWithCookie(displayName: string) {
  const { token, expiresAt } = await signUp(db(), displayName);
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

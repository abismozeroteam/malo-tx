import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { routes } from "@/contracts/routes";
import { db } from "../db";
import { findSessionUser, signInByPhone, signUp, type SessionUser } from "./session";

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

// No expiry on the cookie: it ends with the browser session.
async function setSessionCookie(token: string) {
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
}

export async function signUpWithCookie(displayName: string) {
  await setSessionCookie((await signUp(db(), displayName)).token);
}

export async function signInByPhoneWithCookie(phone: string, displayName: string) {
  await setSessionCookie((await signInByPhone(db(), phone, displayName)).token);
}

import "server-only";
import { cookies } from "next/headers";
import { db } from "../db";
import { createSession, findSessionUser, type SessionUser } from "./session";

const COOKIE = "malotx_session";

export async function getCurrentUser(): Promise<SessionUser | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  return token ? findSessionUser(db(), token) : null;
}

export async function startSession(userId: string) {
  const { token, expiresAt } = await createSession(db(), userId);
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

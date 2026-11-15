import "server-only";
import { QR_MIN_LEFT_MS, type CodiQr } from "@/contracts/debtor-page";
import { routes } from "@/contracts/routes";

export const QR_SECONDS = 600;

export function freshQr(token: string, expiresAt: string | null, now = new Date()): CodiQr | null {
  if (!expiresAt) return null;
  const expires = new Date(expiresAt);
  if (expires.getTime() - now.getTime() < QR_MIN_LEFT_MS) return null;
  return { imageSrc: routes.debtorQr(token, expires.getTime()), expiresAt: expires.toISOString() };
}

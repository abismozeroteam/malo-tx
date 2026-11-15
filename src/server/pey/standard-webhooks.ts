import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

const MAX_DELIVERY_AGE_SECONDS = 5 * 60;

export type VerifyResult =
  | { ok: true; webhookId: string }
  | { ok: false; reason: string };

export function verifyStandardWebhook(
  rawBody: string,
  headers: Headers,
  secret: string,
  nowSeconds = Math.floor(Date.now() / 1000),
): VerifyResult {
  const id = headers.get("webhook-id");
  const timestamp = headers.get("webhook-timestamp");
  const signatureHeader = headers.get("webhook-signature");
  if (!id || !timestamp || !signatureHeader) {
    return { ok: false, reason: "missing headers" };
  }

  const ts = Number(timestamp);
  if (!Number.isInteger(ts) || Math.abs(nowSeconds - ts) > MAX_DELIVERY_AGE_SECONDS) {
    return { ok: false, reason: "timestamp out of tolerance" };
  }

  const key = Buffer.from(secret.replace(/^whsec_/, ""), "base64");
  const expected = createHmac("sha256", key)
    .update(`${id}.${timestamp}.${rawBody}`)
    .digest();

  const matches = v1Signatures(signatureHeader).some(
    (given) => given.length === expected.length && timingSafeEqual(given, expected),
  );
  return matches ? { ok: true, webhookId: id } : { ok: false, reason: "no matching signature" };
}

// Header format: "v1,<base64> v1,<base64>"
function v1Signatures(header: string): Buffer[] {
  return header
    .split(" ")
    .map((part) => part.split(",", 2))
    .filter(([version, signature]) => version === "v1" && signature)
    .map(([, signature]) => Buffer.from(signature, "base64"));
}

import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

/** Max age of a delivery, as in the Standard Webhooks reference libraries. */
const TOLERANCE_SECONDS = 5 * 60;

export type VerifyResult =
  | { ok: true; webhookId: string }
  | { ok: false; reason: string };

/**
 * Verifies a Standard Webhooks signature (https://www.standardwebhooks.com)
 * over the raw request body.
 */
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
  if (!Number.isInteger(ts) || Math.abs(nowSeconds - ts) > TOLERANCE_SECONDS) {
    return { ok: false, reason: "timestamp out of tolerance" };
  }

  const key = Buffer.from(secret.replace(/^whsec_/, ""), "base64");
  const expected = createHmac("sha256", key)
    .update(`${id}.${timestamp}.${rawBody}`)
    .digest();

  // The header is a space-separated list of "v1,<base64 signature>".
  for (const part of signatureHeader.split(" ")) {
    const [version, signature] = part.split(",", 2);
    if (version !== "v1" || !signature) continue;
    const given = Buffer.from(signature, "base64");
    if (given.length === expected.length && timingSafeEqual(given, expected)) {
      return { ok: true, webhookId: id };
    }
  }
  return { ok: false, reason: "no matching signature" };
}

import { createHmac } from "node:crypto";

export const PAYER_CLABE = "012180001234567891";

export const qrPaymentEvent = {
  amount: 0.01,
  apiKeyId: "01M3QMMR6X9CBVDY1SF3G8QWNW",
  codiQrId: "35a13c183a",
  concept: "Malo Tx prueba",
  datePaid: 1790724818,
  metadata: {
    clabe: PAYER_CLABE,
    bankCode: 40012,
    trackingKey: "0192191042",
    externalMetadata: { debtorId: "abc", test: "smoke" },
  },
  numRef: "1",
  transactionId: "01M3QR8H0RH0XBCKYYD242YXNV",
  type: "codi.qr.payment_received",
};

export function webhookSecret(key: Buffer) {
  return "whsec_" + key.toString("base64");
}

export function signedHeaders(input: { key: Buffer; id: string; timestamp: number; body: string }) {
  const signature = createHmac("sha256", input.key)
    .update(`${input.id}.${input.timestamp}.${input.body}`)
    .digest("base64");
  return new Headers({
    "webhook-id": input.id,
    "webhook-timestamp": String(input.timestamp),
    "webhook-signature": `v1,${signature}`,
  });
}

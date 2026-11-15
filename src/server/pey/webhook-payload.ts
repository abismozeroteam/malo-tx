import "server-only";

export type PeyPaymentEvent = {
  type: "codi.qr.payment_received" | "codi.pn.payment_received" | string;
  amount?: number;
  transactionId?: string;
  codiQrId?: string;
  datePaid?: number;
  metadata?: {
    clabe?: string;
    externalMetadata?: Record<string, string>;
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

const mask = (value: unknown, keep = 4) => {
  const s = String(value ?? "");
  return s.length <= keep ? "*".repeat(s.length) : "*".repeat(s.length - keep) + s.slice(-keep);
};

/** Copy of the payload with the payer's bank details masked, safe to store. */
export function maskPayload(event: PeyPaymentEvent): PeyPaymentEvent {
  const copy: PeyPaymentEvent = structuredClone(event);
  if (copy.metadata) {
    if (copy.metadata.clabe) copy.metadata.clabe = mask(copy.metadata.clabe, 3);
    if (copy.metadata.trackingKey) copy.metadata.trackingKey = mask(copy.metadata.trackingKey);
  }
  return copy;
}

/** pey sends amounts in pesos; we store integer centavos. */
export const pesosToCents = (pesos: unknown) =>
  typeof pesos === "number" && Number.isFinite(pesos) ? Math.round(pesos * 100) : null;

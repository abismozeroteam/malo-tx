import { describe, expect, it } from "vitest";
import { maskEvent, peyEventSchema } from "./webhook-event";

const qrEvent = {
  amount: 0.01,
  apiKeyId: "01M3QMMR6X9CBVDY1SF3G8QWNW",
  codiQrId: "35a13c183a",
  concept: "Malo Tx prueba",
  datePaid: 1790724818,
  metadata: {
    clabe: "012180001234567891",
    bankCode: 40012,
    trackingKey: "0192191042",
    externalMetadata: { debtorId: "abc", test: "smoke" },
  },
  numRef: "1",
  transactionId: "01M3QR8H0RH0XBCKYYD242YXNV",
  type: "codi.qr.payment_received",
};

describe("peyEventSchema", () => {
  it("accepts pey's QR payment payload and keeps unknown fields", () => {
    const parsed = peyEventSchema.parse(qrEvent);
    expect(parsed.apiKeyId).toBe(qrEvent.apiKeyId);
    expect(parsed.metadata?.externalMetadata).toEqual({ debtorId: "abc", test: "smoke" });
  });

  it("rejects a payment event without a transaction id", () => {
    expect(peyEventSchema.safeParse({ ...qrEvent, transactionId: undefined }).success).toBe(false);
  });

  it("rejects a payment event without an amount", () => {
    expect(peyEventSchema.safeParse({ ...qrEvent, amount: undefined }).success).toBe(false);
  });

  it("rejects a negative amount", () => {
    expect(peyEventSchema.safeParse({ ...qrEvent, amount: -1 }).success).toBe(false);
  });

  it("rejects external metadata that is not text", () => {
    const metadata = { ...qrEvent.metadata, externalMetadata: { debtorId: 7 } };
    expect(peyEventSchema.safeParse({ ...qrEvent, metadata }).success).toBe(false);
  });

  it("accepts other event types without payment fields", () => {
    expect(peyEventSchema.safeParse({ type: "payment_link.status_updated" }).success).toBe(true);
  });
});

describe("maskEvent", () => {
  it("hides the payer's CLABE and tracking key", () => {
    const masked = maskEvent(peyEventSchema.parse(qrEvent));
    expect(masked.metadata?.clabe).toBe("***************891");
    expect(masked.metadata?.trackingKey).toBe("******1042");
    expect(JSON.stringify(masked)).not.toContain("012180001234567891");
  });

  it("keeps the fields we need and leaves the original untouched", () => {
    const event = peyEventSchema.parse(qrEvent);
    const masked = maskEvent(event);
    expect(masked.transactionId).toBe(qrEvent.transactionId);
    expect(masked.metadata?.externalMetadata).toEqual(qrEvent.metadata.externalMetadata);
    expect(event.metadata?.clabe).toBe(qrEvent.metadata.clabe);
  });
});

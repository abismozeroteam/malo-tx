import { describe, expect, it } from "vitest";
import { PAYER_CLABE, qrPaymentEvent as qrEvent } from "../../../test/pey";
import { isPaymentEvent, maskEvent, peyEventSchema } from "./webhook-event";


describe("peyEventSchema", () => {
  it("accepts pey's QR payment payload and keeps unknown fields", () => {
    const parsed = peyEventSchema.parse(qrEvent);
    expect(parsed.apiKeyId).toBe(qrEvent.apiKeyId);
    expect(isPaymentEvent(parsed) && parsed.metadata?.externalMetadata).toEqual({ debtorId: "abc", test: "smoke" });
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
    const parsed = peyEventSchema.parse({ type: "payment_link.status_updated" });
    expect(isPaymentEvent(parsed)).toBe(false);
  });
});

describe("maskEvent", () => {
  it("leaves events without bank details as they are", () => {
    const event = peyEventSchema.parse({ type: "payment_link.status_updated" });
    expect(maskEvent(event)).toBe(event);
  });

  it("hides the payer's CLABE and tracking key", () => {
    const masked = maskEvent(peyEventSchema.parse(qrEvent));
    expect(masked).toMatchObject({ metadata: { clabe: "***************891", trackingKey: "******1042" } });
    expect(JSON.stringify(masked)).not.toContain(PAYER_CLABE);
  });

  it("keeps the fields we need and leaves the original untouched", () => {
    const event = peyEventSchema.parse(qrEvent);
    const masked = maskEvent(event);
    expect(masked).toMatchObject({
      transactionId: qrEvent.transactionId,
      metadata: { externalMetadata: qrEvent.metadata.externalMetadata },
    });
    expect(event).toMatchObject({ metadata: { clabe: PAYER_CLABE } });
  });
});

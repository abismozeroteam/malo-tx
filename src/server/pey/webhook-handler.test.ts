import { describe, expect, it } from "vitest";
import { PAYER_CLABE, qrPaymentEvent, signedHeaders, webhookSecret } from "../../../test/pey";
import { handlePeyWebhook, type PeyEventStore, type StoredPeyEvent } from "./webhook-handler";

const key = Buffer.from("test-webhook-key");
const secret = webhookSecret(key);
const now = 1790724900;
const body = JSON.stringify(qrPaymentEvent);

const signed = (rawBody: string, id = "msg_1") => signedHeaders({ key, id, timestamp: now, body: rawBody });

function memoryStore() {
  const saved = new Map<string, StoredPeyEvent>();
  const store: PeyEventStore = {
    async save(e) {
      if (saved.has(e.webhookId)) return "duplicate";
      saved.set(e.webhookId, e);
      return "stored";
    },
  };
  return { store, saved };
}

const handle = (rawBody: string, headers: Headers, store: PeyEventStore) =>
  handlePeyWebhook({ rawBody, headers, secret, store, nowSeconds: now });

describe("handlePeyWebhook", () => {
  it("stores a signed payment once, in centavos, with bank details masked", async () => {
    const { store, saved } = memoryStore();
    const result = await handle(body, signed(body), store);

    expect(result.status).toBe(200);
    expect(result.body).toEqual({ received: true, duplicate: false });
    const stored = saved.get("msg_1")!;
    expect(stored.amountCents).toBe(1);
    expect(stored.transactionId).toBe(qrPaymentEvent.transactionId);
    expect(stored.datePaid?.toISOString()).toBe(new Date(qrPaymentEvent.datePaid * 1000).toISOString());
    expect(JSON.stringify(stored.payload)).not.toContain(PAYER_CLABE);
  });

  it("answers 200 to a repeated delivery without storing it again", async () => {
    const { store, saved } = memoryStore();
    await handle(body, signed(body), store);
    const replay = await handle(body, signed(body), store);

    expect(replay.status).toBe(200);
    expect(replay.body).toEqual({ received: true, duplicate: true });
    expect(saved.size).toBe(1);
  });

  it("stores other event types without payment fields", async () => {
    const { store, saved } = memoryStore();
    const other = JSON.stringify({ type: "payment_link.status_updated" });
    const result = await handle(other, signed(other), store);
    expect(result.status).toBe(200);
    expect(saved.get("msg_1")).toMatchObject({ transactionId: null, amountCents: null, datePaid: null });
  });

  it("rejects an unsigned request and stores nothing", async () => {
    const { store, saved } = memoryStore();
    const result = await handle(body, new Headers(), store);
    expect(result.status).toBe(401);
    expect(saved.size).toBe(0);
  });

  it("rejects a forged amount even with a valid-looking signature", async () => {
    const { store, saved } = memoryStore();
    const forged = body.replace('"amount":0.01', '"amount":500');
    const result = await handle(forged, signed(body), store);
    expect(result.status).toBe(401);
    expect(saved.size).toBe(0);
  });

  it("refuses to work without a webhook secret", async () => {
    const { store, saved } = memoryStore();
    const result = await handlePeyWebhook({ rawBody: body, headers: signed(body), secret: undefined, store });
    expect(result.status).toBe(500);
    expect(saved.size).toBe(0);
  });

  it("rejects signed bodies that are not JSON", async () => {
    const { store, saved } = memoryStore();
    const result = await handle("not json", signed("not json"), store);
    expect(result.status).toBe(400);
    expect(saved.size).toBe(0);
  });

  it("rejects signed payment events missing required fields", async () => {
    const { store, saved } = memoryStore();
    const incomplete = JSON.stringify({ ...qrPaymentEvent, transactionId: undefined });
    const result = await handle(incomplete, signed(incomplete), store);
    expect(result.status).toBe(400);
    expect(saved.size).toBe(0);
  });

  it("never puts the CLABE in the log line", async () => {
    const { store } = memoryStore();
    const result = await handle(body, signed(body), store);
    expect(result.log).not.toContain(PAYER_CLABE);
  });
});

describe("debtor id", () => {
  it("is read from externalMetadata only when it is a uuid", async () => {
    const debtorId = "6f1c1d2e-8a4b-4c3d-9e2f-0a1b2c3d4e5f";
    const withId = JSON.stringify({ ...qrPaymentEvent, metadata: { ...qrPaymentEvent.metadata, externalMetadata: { debtorId } } });
    const { store, saved } = memoryStore();
    await handle(withId, signed(withId, "a"), store);
    await handle(body, signed(body, "b"), store);
    expect(saved.get("a")?.debtorId).toBe(debtorId);
    expect(saved.get("b")?.debtorId).toBeNull();
  });
});

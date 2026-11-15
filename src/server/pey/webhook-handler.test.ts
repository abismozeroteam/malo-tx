import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { handlePeyWebhook, type PeyEventStore, type StoredPeyEvent } from "./webhook-handler";

const key = Buffer.from("test-webhook-key");
const secret = "whsec_" + key.toString("base64");
const now = 1790724900;

const event = {
  amount: 0.01,
  codiQrId: "35a13c183a",
  datePaid: 1790724818,
  metadata: { clabe: "012180001234567891", externalMetadata: { test: "smoke" } },
  transactionId: "01M3QR8H0RH0XBCKYYD242YXNV",
  type: "codi.qr.payment_received",
};

function signedRequest(body: string, webhookId = "msg_1") {
  const signature = createHmac("sha256", key).update(`${webhookId}.${now}.${body}`).digest("base64");
  return new Headers({
    "webhook-id": webhookId,
    "webhook-timestamp": String(now),
    "webhook-signature": `v1,${signature}`,
  });
}

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

const handle = (rawBody: string, headers: Headers, store: PeyEventStore, key = secret) =>
  handlePeyWebhook({ rawBody, headers, secret: key, store, nowSeconds: now });

describe("handlePeyWebhook", () => {
  it("stores a signed payment once, in centavos, with bank details masked", async () => {
    const { store, saved } = memoryStore();
    const body = JSON.stringify(event);
    const result = await handle(body, signedRequest(body), store);

    expect(result.status).toBe(200);
    expect(result.body).toEqual({ received: true, duplicate: false });
    const stored = saved.get("msg_1")!;
    expect(stored.amountCents).toBe(1);
    expect(stored.transactionId).toBe(event.transactionId);
    expect(stored.datePaid?.toISOString()).toBe(new Date(event.datePaid * 1000).toISOString());
    expect(JSON.stringify(stored.payload)).not.toContain("012180001234567891");
  });

  it("answers 200 to a repeated delivery without storing it again", async () => {
    const { store, saved } = memoryStore();
    const body = JSON.stringify(event);
    await handle(body, signedRequest(body), store);
    const replay = await handle(body, signedRequest(body), store);

    expect(replay.status).toBe(200);
    expect(replay.body).toEqual({ received: true, duplicate: true });
    expect(saved.size).toBe(1);
  });

  it("rejects an unsigned request and stores nothing", async () => {
    const { store, saved } = memoryStore();
    const result = await handle(JSON.stringify(event), new Headers(), store);
    expect(result.status).toBe(401);
    expect(saved.size).toBe(0);
  });

  it("rejects a forged amount even with a valid-looking signature", async () => {
    const { store, saved } = memoryStore();
    const body = JSON.stringify(event);
    const forged = body.replace('"amount":0.01', '"amount":500');
    const result = await handle(forged, signedRequest(body), store);
    expect(result.status).toBe(401);
    expect(saved.size).toBe(0);
  });

  it("refuses to work without a webhook secret", async () => {
    const { store, saved } = memoryStore();
    const body = JSON.stringify(event);
    const result = await handlePeyWebhook({ rawBody: body, headers: signedRequest(body), secret: undefined, store });
    expect(result.status).toBe(500);
    expect(saved.size).toBe(0);
  });

  it("rejects signed bodies that are not JSON", async () => {
    const { store, saved } = memoryStore();
    const result = await handle("not json", signedRequest("not json"), store);
    expect(result.status).toBe(400);
    expect(saved.size).toBe(0);
  });

  it("rejects signed payment events missing required fields", async () => {
    const { store, saved } = memoryStore();
    const body = JSON.stringify({ ...event, transactionId: undefined });
    const result = await handle(body, signedRequest(body), store);
    expect(result.status).toBe(400);
    expect(saved.size).toBe(0);
  });

  it("never puts the CLABE in the log line", async () => {
    const { store } = memoryStore();
    const body = JSON.stringify(event);
    const result = await handle(body, signedRequest(body), store);
    expect(result.log).not.toContain("012180001234567891");
  });
});

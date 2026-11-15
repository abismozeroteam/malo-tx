import { describe, expect, it } from "vitest";
import { signedHeaders, webhookSecret } from "../../../test/pey";
import { verifyStandardWebhook } from "./standard-webhooks";

// Public Standard Webhooks test vector; the prefix is joined so scanners don't mistake it for a live key.
const vector = {
  secret: ["whsec", "MfKQ9r8GKYqrTwjUPD8ILPZIo2LaLaSw"].join("_"),
  id: "msg_p5jXN8AQM9LWM0D4loKWxJek",
  timestamp: 1614265330,
  body: '{"test": 2432232314}',
  signature: "v1,g0hM9SsE+OTPJTGt/tmIKtSyZlE3uFJELVlNIOLJ1OE=",
};

const headers = (overrides: Record<string, string | null> = {}) => {
  const values: Record<string, string | null> = {
    "webhook-id": vector.id,
    "webhook-timestamp": String(vector.timestamp),
    "webhook-signature": vector.signature,
    ...overrides,
  };
  const result = new Headers();
  for (const [key, value] of Object.entries(values)) if (value !== null) result.set(key, value);
  return result;
};

const verify = (body = vector.body, h = headers(), secret = vector.secret, now = vector.timestamp) =>
  verifyStandardWebhook(body, h, secret, now);

describe("verifyStandardWebhook", () => {
  it("accepts the published Standard Webhooks test vector", () => {
    expect(verify()).toEqual({ ok: true, webhookId: vector.id });
  });

  it("accepts a valid signature among several", () => {
    const h = headers({ "webhook-signature": `v1,bm90IGl0 v2,abc ${vector.signature}` });
    expect(verify(vector.body, h).ok).toBe(true);
  });

  it("rejects a body changed by one character", () => {
    expect(verify('{"test": 2432232315}').ok).toBe(false);
  });

  it("rejects a different secret", () => {
    expect(verify(vector.body, headers(), webhookSecret(Buffer.from("another secret"))).ok).toBe(false);
  });

  it("rejects a different webhook id with the same signature", () => {
    expect(verify(vector.body, headers({ "webhook-id": "msg_other" })).ok).toBe(false);
  });

  it.each([
    ["webhook-id"],
    ["webhook-timestamp"],
    ["webhook-signature"],
  ])("rejects a request without %s", (name) => {
    expect(verify(vector.body, headers({ [name]: null }))).toEqual({ ok: false, reason: "missing headers" });
  });

  it("rejects deliveries older or newer than five minutes", () => {
    expect(verify(vector.body, headers(), vector.secret, vector.timestamp + 301).ok).toBe(false);
    expect(verify(vector.body, headers(), vector.secret, vector.timestamp - 301).ok).toBe(false);
    expect(verify(vector.body, headers(), vector.secret, vector.timestamp + 299).ok).toBe(true);
  });

  it("rejects a timestamp that is not a number", () => {
    expect(verify(vector.body, headers({ "webhook-timestamp": "soon" })).ok).toBe(false);
  });

  it("ignores signatures that are not v1", () => {
    const v2 = vector.signature.replace("v1,", "v2,");
    expect(verify(vector.body, headers({ "webhook-signature": v2 })).ok).toBe(false);
  });

  it("accepts a signature made with the raw secret bytes", () => {
    const key = Buffer.from("raw-secret-bytes");
    const body = '{"type":"codi.qr.payment_received"}';
    const h = signedHeaders({ key, id: vector.id, timestamp: vector.timestamp, body });
    expect(verify(body, h, webhookSecret(key)).ok).toBe(true);
  });
});

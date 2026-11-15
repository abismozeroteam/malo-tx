import { pesosToCents } from "./charge-rules";
import { verifyStandardWebhook } from "./standard-webhooks";
import { isPaymentEvent, maskEvent, peyEventSchema, type PeyEvent } from "./webhook-event";

export type StoredPeyEvent = {
  webhookId: string;
  eventType: string;
  transactionId: string | null;
  amountCents: number | null;
  datePaid: Date | null;
  payload: PeyEvent;
};

export interface PeyEventStore {
  save(event: StoredPeyEvent): Promise<"stored" | "duplicate">;
}

type WebhookResult = { status: number; body: Record<string, unknown>; log: string };

export async function handlePeyWebhook(input: {
  rawBody: string;
  headers: Headers;
  secret: string | undefined;
  store: PeyEventStore;
  nowSeconds?: number;
}): Promise<WebhookResult> {
  if (!input.secret) {
    return { status: 500, body: { error: "Not configured" }, log: "PEY_WEBHOOK_SECRET is not set" };
  }

  const verified = verifyStandardWebhook(input.rawBody, input.headers, input.secret, input.nowSeconds);
  if (!verified.ok) {
    return { status: 401, body: { error: "Invalid signature" }, log: `rejected: ${verified.reason}` };
  }

  let json: unknown;
  try {
    json = JSON.parse(input.rawBody);
  } catch {
    return { status: 400, body: { error: "Invalid JSON" }, log: `invalid JSON webhookId=${verified.webhookId}` };
  }

  const parsed = peyEventSchema.safeParse(json);
  if (!parsed.success) {
    return { status: 400, body: { error: "Invalid event" }, log: `invalid event webhookId=${verified.webhookId}` };
  }

  const event = parsed.data;
  const payment = isPaymentEvent(event) ? event : null;
  const outcome = await input.store.save({
    webhookId: verified.webhookId,
    eventType: event.type,
    transactionId: payment?.transactionId ?? null,
    amountCents: payment ? pesosToCents(payment.amount) : null,
    datePaid: payment?.datePaid ? new Date(payment.datePaid * 1000) : null,
    payload: maskEvent(event),
  });

  return {
    status: 200,
    body: { received: true, duplicate: outcome === "duplicate" },
    log: `${outcome} type=${event.type} webhookId=${verified.webhookId} transactionId=${payment?.transactionId ?? "-"}`,
  };
}

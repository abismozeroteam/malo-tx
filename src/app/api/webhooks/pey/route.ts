import { db } from "@/server/db";
import { verifyStandardWebhook } from "@/server/pey/standard-webhooks";
import {
  maskPayload,
  pesosToCents,
  type PeyPaymentEvent,
} from "@/server/pey/webhook-payload";

/**
 * pey webhook receiver. Verifies the Standard Webhooks signature on the raw
 * body, then stores each delivery once (keyed by webhook-id) with bank
 * details masked. Repeated deliveries return 200 and change nothing.
 */
export async function POST(request: Request) {
  const secret = process.env.PEY_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[pey-webhook] PEY_WEBHOOK_SECRET is not configured");
    return new Response("Not configured", { status: 500 });
  }

  const rawBody = await request.text();
  const verified = verifyStandardWebhook(rawBody, request.headers, secret);
  if (!verified.ok) {
    console.warn(`[pey-webhook] rejected: ${verified.reason}`);
    return new Response("Invalid signature", { status: 401 });
  }

  let event: PeyPaymentEvent;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const datePaid =
    typeof event.datePaid === "number" ? new Date(event.datePaid * 1000) : null;

  const rows = (await db().query(
    `INSERT INTO pey_webhook_events
       (webhook_id, event_type, transaction_id, amount_cents, date_paid, payload)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (webhook_id) DO NOTHING
     RETURNING id`,
    [
      verified.webhookId,
      String(event.type ?? "unknown"),
      event.transactionId ?? null,
      pesosToCents(event.amount),
      datePaid,
      JSON.stringify(maskPayload(event)),
    ],
  )) as { id: number }[];

  const duplicate = rows.length === 0;
  const delay = datePaid ? Math.round((Date.now() - datePaid.getTime()) / 1000) : null;
  console.log(
    `[pey-webhook] ${duplicate ? "duplicate" : "stored"} type=${event.type} ` +
      `webhookId=${verified.webhookId} transactionId=${event.transactionId ?? "-"} ` +
      `delaySinceDatePaid=${delay ?? "-"}s`,
  );

  return Response.json({ received: true, duplicate });
}

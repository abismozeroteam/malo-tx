import "server-only";
import { db } from "../db";
import type { PeyEventStore } from "./webhook-handler";

export const peyEventStore: PeyEventStore = {
  async save(event) {
    const rows = await db().query<{ id: string }>(
      `INSERT INTO pey_webhook_events
         (webhook_id, event_type, transaction_id, amount_cents, date_paid, payload)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (webhook_id) DO NOTHING
       RETURNING id`,
      [
        event.webhookId,
        event.eventType,
        event.transactionId,
        event.amountCents,
        event.datePaid,
        JSON.stringify(event.payload),
      ],
    );
    return rows.length === 0 ? "duplicate" : "stored";
  },
};

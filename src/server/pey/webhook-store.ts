import "server-only";
import { db, type Database } from "../db";
import { demoChargeCents, markPaidSql } from "../debtors/payments";
import { isDemoMode } from "../env";
import type { PeyEventStore, StoredPeyEvent } from "./webhook-handler";

export async function saveEvent(db: Database, event: StoredPeyEvent, demoMode: boolean): Promise<"stored" | "duplicate"> {
  const [row] = await db.query<{ stored: boolean }>(
    `WITH stored AS (
       INSERT INTO pey_webhook_events (webhook_id, event_type, transaction_id, amount_cents, date_paid, payload)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (webhook_id) DO NOTHING
       RETURNING id
     ), paid AS (${markPaidSql({ id: "$7::uuid", paidCents: "$4", paidAt: "$5", demoCents: "$8" })})
     SELECT EXISTS (SELECT 1 FROM stored) AS stored`,
    [
      event.webhookId,
      event.eventType,
      event.transactionId,
      event.amountCents,
      event.datePaid,
      JSON.stringify(event.payload),
      event.debtorId,
      demoChargeCents(demoMode),
    ],
  );
  return row.stored ? "stored" : "duplicate";
}

export const peyEventStore: PeyEventStore = { save: (event) => saveEvent(db(), event, isDemoMode()) };

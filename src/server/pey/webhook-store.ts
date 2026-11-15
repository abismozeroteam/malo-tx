import "server-only";
import { db, type Database } from "../db";
import { isDemoMode } from "../env";
import { DEMO_MAX_CENTS } from "./charge-rules";
import type { PeyEventStore, StoredPeyEvent } from "./webhook-handler";

const OPEN = `('pending', 'claims_paid', 'disputed')`;

export async function saveEvent(db: Database, event: StoredPeyEvent, demoMode: boolean): Promise<"stored" | "duplicate"> {
  const [row] = await db.query<{ stored: boolean }>(
    `WITH stored AS (
       INSERT INTO pey_webhook_events (webhook_id, event_type, transaction_id, amount_cents, date_paid, payload)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (webhook_id) DO NOTHING
       RETURNING id
     ), paid AS (
       UPDATE debtors SET status = 'paid', paid_at = coalesce($5, now()), updated_at = now()
        WHERE id = $7::uuid AND status IN ${OPEN} AND EXISTS (SELECT 1 FROM stored)
          AND $4 >= coalesce($8, amount_cents)
       RETURNING id
     )
     SELECT EXISTS (SELECT 1 FROM stored) AS stored`,
    [
      event.webhookId,
      event.eventType,
      event.transactionId,
      event.amountCents,
      event.datePaid,
      JSON.stringify(event.payload),
      event.debtorId,
      demoMode ? DEMO_MAX_CENTS : null,
    ],
  );
  return row.stored ? "stored" : "duplicate";
}

export const peyEventStore: PeyEventStore = { save: (event) => saveEvent(db(), event, isDemoMode()) };

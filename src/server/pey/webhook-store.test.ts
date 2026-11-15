import { beforeEach, describe, expect, it } from "vitest";
import { createTestDb } from "../../../test/db";
import { seedDebt } from "../../../test/debts";
import type { Database } from "../db";
import type { StoredPeyEvent } from "./webhook-handler";
import { saveEvent } from "./webhook-store";

const status = async (db: Database) =>
  (await db.query<{ status: string; paid: boolean }>("SELECT status, paid_at IS NOT NULL AS paid FROM debtors ORDER BY position"))[0];

describe("saveEvent", () => {
  let db: Database;
  let debtorId: string;
  const event = (patch: Partial<StoredPeyEvent> = {}): StoredPeyEvent => ({
    webhookId: "msg_1",
    eventType: "codi.qr.payment_received",
    transactionId: "tx_1",
    debtorId,
    amountCents: 1,
    datePaid: new Date("2026-11-15T16:00:00Z"),
    payload: { type: "codi.qr.payment_received" } as StoredPeyEvent["payload"],
    ...patch,
  });

  beforeEach(async () => {
    db = await createTestDb();
    await seedDebt(db);
    debtorId = (await db.query<{ id: string }>("SELECT id FROM debtors ORDER BY position"))[0].id;
  });

  it("marks the debtor paid by CoDi when a demo payment arrives", async () => {
    expect(await saveEvent(db, event(), true)).toBe("stored");
    expect(await status(db)).toEqual({ status: "paid", paid: true });
    expect(await db.query("SELECT settlement FROM debtors WHERE id = $1", [debtorId])).toEqual([{ settlement: "codi" }]);
  });

  it("wins over a claim or a dispute", async () => {
    await db.query("UPDATE debtors SET status = 'disputed' WHERE id = $1", [debtorId]);
    await saveEvent(db, event(), true);
    expect((await status(db)).status).toBe("paid");
  });

  it("does not mark paid when less than the charge arrives", async () => {
    await saveEvent(db, event(), false);
    expect((await status(db)).status).toBe("pending");
  });

  it("does nothing without a debtor", async () => {
    await saveEvent(db, event({ debtorId: null }), true);
    expect((await status(db)).status).toBe("pending");
  });

  it("reports a repeated delivery and still settles the debtor", async () => {
    await saveEvent(db, event({ debtorId: null }), true);
    expect(await saveEvent(db, event(), true)).toBe("duplicate");
    expect((await status(db)).status).toBe("paid");
  });

  it("ignores payments for deleted debts", async () => {
    await db.query("UPDATE debts SET deleted_at = now()");
    await saveEvent(db, event(), true);
    expect((await status(db)).status).toBe("pending");
  });

  it("never revives a cancelled debtor", async () => {
    await db.query("UPDATE debtors SET status = 'cancelled' WHERE id = $1", [debtorId]);
    await saveEvent(db, event(), true);
    expect((await status(db)).status).toBe("cancelled");
  });
});

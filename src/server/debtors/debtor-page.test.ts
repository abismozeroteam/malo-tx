import { beforeEach, describe, expect, it, vi } from "vitest";
import { createTestDb } from "../../../test/db";
import { seedDebt } from "../../../test/debts";
import type { Database } from "../db";
import type { Phone } from "../validation/phone";
import { findDebtor, findOpenDebtor, toDebtorPage } from "./debtor-page";
import { answer, ensureQr, markPaidFromPey, paymentStatus, qrImage, sendPush, type PeyCharges } from "./payments";

const now = new Date("2026-11-15T15:00:00Z");

function fakePey() {
  return {
    createQr: vi.fn(async () => ({ id: "qr_1", qrString: "codi", qrImage: "iVBORw0KGgo=" })),
    createPush: vi.fn(async () => ({ transactionId: "tx_1", codiId: "c1" })),
    qrTransactions: vi.fn(async () => ({ items: [] as Awaited<ReturnType<PeyCharges["qrTransactions"]>>["items"], nextToken: null })),
    transaction: vi.fn(async (): ReturnType<PeyCharges["transaction"]> => ({ id: "tx_1", status: "PENDING", amount: 0.01 })),
  } satisfies PeyCharges;
}

describe("debtor page", () => {
  let db: Database;
  let token: string;

  beforeEach(async () => {
    db = await createTestDb();
    token = (await seedDebt(db, { dueDate: "2026-11-10" })).tokens[0];
  });

  it("shows the debtor's share, the creditor and an overdue tag", async () => {
    expect(toDebtorPage(await findDebtor(db, token), true, now)).toMatchObject({
      state: "open",
      status: "pending",
      debtorName: "Ana",
      creditorName: "Pam",
      debtName: "Tacos",
      amountCents: 15_000,
      totalCents: 30_000,
      overdue: true,
      canAnswer: true,
      qr: null,
    });
  });

  it("is gone for unknown links and deleted debts", async () => {
    expect(toDebtorPage(await findDebtor(db, "nope"), true)).toEqual({ state: "gone" });
    await db.query("UPDATE debts SET deleted_at = now()");
    expect(toDebtorPage(await findDebtor(db, token), true)).toEqual({ state: "gone" });
  });

  it("creates one QR with the debtor id, charges $0.01 in demo mode, and reuses it", async () => {
    const pey = fakePey();
    const row = (await findOpenDebtor(db, token))!;
    const qr = await ensureQr(db, pey, row, true, now);
    expect(qr).toEqual({ imageSrc: `/c/${token}/qr?v=${Date.parse("2026-11-15T15:10:00Z")}`, expiresAt: "2026-11-15T15:10:00.000Z" });
    expect(pey.createQr).toHaveBeenCalledWith(expect.objectContaining({ amountCents: 1, expirationSeconds: 600, metadata: { debtorId: row.id } }));

    const again = await ensureQr(db, pey, (await findOpenDebtor(db, token))!, true, new Date(now.getTime() + 60_000));
    expect(again).toEqual(qr);
    expect(pey.createQr).toHaveBeenCalledTimes(1);
    expect(toDebtorPage(await findDebtor(db, token), true, now)).toMatchObject({ qr });
  });

  it("charges the real amount outside demo mode", async () => {
    const pey = fakePey();
    await ensureQr(db, pey, (await findOpenDebtor(db, token))!, false, now);
    expect(pey.createQr).toHaveBeenCalledWith(expect.objectContaining({ amountCents: 15_000 }));
  });

  it("sends a push, keeps its transaction id and never stores the phone", async () => {
    const pey = fakePey();
    await sendPush(db, pey, (await findOpenDebtor(db, token))!, "5512345678" as Phone, true);
    expect(pey.createPush).toHaveBeenCalledWith(expect.objectContaining({ phoneNumber: "5512345678", amountCents: 1 }));
    expect(await db.query("SELECT 1 FROM debtors WHERE phone = '5512345678'")).toEqual([]);
    expect(await paymentStatus(db, token)).toMatchObject({ push_transaction_id: "tx_1" });
  });

  it("serves the QR image only while it is valid", async () => {
    await ensureQr(db, fakePey(), (await findOpenDebtor(db, token))!, true);
    expect(await qrImage(db, token)).toEqual(Buffer.from("iVBORw0KGgo=", "base64"));
    await db.query("UPDATE debtors SET qr_expires_at = now() - interval '1 second'");
    expect(await qrImage(db, token)).toBeNull();
  });

  it("treats paid links as closed", async () => {
    await db.query("UPDATE debtors SET status = 'paid', paid_at = now()");
    expect(await findOpenDebtor(db, token)).toBeNull();
    expect(toDebtorPage(await findDebtor(db, token), true)).toMatchObject({ state: "paid" });
  });

  it("lets the debtor answer once", async () => {
    const row = (await findOpenDebtor(db, token))!;
    expect(await answer(db, row.id, "claims_paid")).toBe(true);
    expect(await answer(db, row.id, "disputed")).toBe(false);
    expect(toDebtorPage(await findDebtor(db, token), true, now)).toMatchObject({ status: "claims_paid", canAnswer: false });
  });
});

describe("markPaidFromPey", () => {
  it("marks paid when pey reports the QR or the push as paid", async () => {
    const db = await createTestDb();
    const [qrToken, pushToken] = (await seedDebt(db)).tokens;
    const pey = fakePey();
    await db.query("UPDATE debtors SET qr_id = 'qr_1' WHERE token = $1", [qrToken]);
    await sendPush(db, pey, (await findOpenDebtor(db, pushToken))!, "5512345678" as Phone, true);

    expect(await markPaidFromPey(db, pey, (await paymentStatus(db, qrToken))!, true)).toBe(false);

    pey.qrTransactions.mockResolvedValueOnce({ items: [{ id: "t", status: "PAID", amount: 0.01, datePaid: 1794760000 }], nextToken: null });
    expect(await markPaidFromPey(db, pey, (await paymentStatus(db, qrToken))!, true)).toBe(true);
    expect(toDebtorPage(await findDebtor(db, qrToken), true)).toMatchObject({ state: "paid", paidAt: "2026-11-15T16:26:40.000Z" });

    pey.transaction.mockResolvedValueOnce({ id: "tx_1", status: "PAID", amount: 0.01 });
    expect(await markPaidFromPey(db, pey, (await paymentStatus(db, pushToken))!, true)).toBe(true);
    expect(pey.transaction).toHaveBeenCalledWith("tx_1");
  });
});

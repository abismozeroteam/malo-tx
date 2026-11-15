import { beforeEach, describe, expect, it, vi } from "vitest";
import { createTestDb } from "../../../test/db";
import { seedDebt } from "../../../test/debts";
import type { Database } from "../db";
import type { Phone } from "../validation/phone";
import { findDebtor, findOpenDebtor, toDebtorPage } from "./debtor-page";
import { answer, ensureQr, markPaidFromQr, qrImage, sendPush, type PeyCharges } from "./payments";

const now = new Date("2026-11-15T15:00:00Z");

function fakePey() {
  return {
    createQr: vi.fn(async () => ({ id: "qr_1", qrString: "codi", qrImage: "iVBORw0KGgo=" })),
    createPush: vi.fn(async () => ({ transactionId: "tx_1", codiId: "c1" })),
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

  it("sends a push without storing the phone", async () => {
    const pey = fakePey();
    await sendPush(pey, (await findOpenDebtor(db, token))!, "5512345678" as Phone, true);
    expect(pey.createPush).toHaveBeenCalledWith(expect.objectContaining({ phoneNumber: "5512345678", amountCents: 1 }));
    expect(await db.query("SELECT 1 FROM debtors WHERE phone = '5512345678'")).toEqual([]);
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

describe("markPaidFromQr", () => {
  it("marks paid when pey reports a paid transaction for the QR", async () => {
    const db = await createTestDb();
    const token = (await seedDebt(db)).tokens[0];
    await ensureQr(db, fakePey(), (await findOpenDebtor(db, token))!, true);
    const row = (await findOpenDebtor(db, token))!;

    const pending = async () => ({ items: [{ id: "t", status: "PENDING" as const, amount: 0.01 }], nextToken: null });
    expect(await markPaidFromQr(db, pending, row, true)).toBe(false);

    const paid = async () => ({ items: [{ id: "t", status: "PAID" as const, amount: 0.01, datePaid: 1794760000 }], nextToken: null });
    expect(await markPaidFromQr(db, paid, row, true)).toBe(true);
    expect(toDebtorPage(await findDebtor(db, token), true)).toMatchObject({ state: "paid", paidAt: "2026-11-15T16:26:40.000Z" });
  });
});

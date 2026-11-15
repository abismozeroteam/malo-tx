import { beforeEach, describe, expect, it, vi } from "vitest";
import { createTestDb } from "../../../test/db";
import { EMPTY_DEBT_FORM } from "@/contracts/debt-form";
import type { Database } from "../db";
import { signUp } from "../auth/session";
import { createDebt } from "../debts/create-debt";
import type { ValidDebtForm } from "../validation/debt-form";
import { findDebtor, toDebtorPage } from "./debtor-page";
import { answer, ensureQr, sendPush, type PeyCharges } from "./payments";
import type { Phone } from "../validation/phone";

const values: ValidDebtForm = {
  ...EMPTY_DEBT_FORM,
  meme: { kind: "catalog", key: "b" },
  name: "Tacos",
  dueDate: "2026-11-10",
  totalCents: 30_000,
  people: [
    { firstName: "Ana", phone: "", customCents: null },
    { firstName: "Beto", phone: "", customCents: null },
  ],
};

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
    const owner = (await signUp(db, "Pam")).userId;
    const debt = await createDebt(db, owner, values, "https://malo.test");
    token = debt.links[0].url.split("/c/")[1];
  });

  it("shows the debtor's share, the creditor and an overdue tag", async () => {
    const data = toDebtorPage(await findDebtor(db, token), true, now);
    expect(data).toMatchObject({
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

  it("creates one QR, charges $0.01 in demo mode with the debtor id, and reuses it", async () => {
    const pey = fakePey();
    const row = (await findDebtor(db, token))!;
    const qr = await ensureQr(db, pey, row, true, now);
    expect(qr).toEqual({ imageSrc: "data:image/png;base64,iVBORw0KGgo=", expiresAt: "2026-11-15T15:10:00.000Z" });
    expect(pey.createQr).toHaveBeenCalledWith(expect.objectContaining({ amountCents: 1, expirationSeconds: 600, metadata: { debtorId: row.id } }));

    const again = await ensureQr(db, pey, (await findDebtor(db, token))!, true, new Date(now.getTime() + 60_000));
    expect(again).toEqual(qr);
    expect(pey.createQr).toHaveBeenCalledTimes(1);
    expect(toDebtorPage(await findDebtor(db, token), true, now)).toMatchObject({ qr });
  });

  it("charges the real amount outside demo mode", async () => {
    const pey = fakePey();
    await ensureQr(db, pey, (await findDebtor(db, token))!, false, now);
    expect(pey.createQr).toHaveBeenCalledWith(expect.objectContaining({ amountCents: 15_000 }));
  });

  it("never charges a paid debtor", async () => {
    const pey = fakePey();
    await db.query("UPDATE debtors SET status = 'paid', paid_at = now()");
    const row = (await findDebtor(db, token))!;
    expect(await ensureQr(db, pey, row, true, now)).toBeNull();
    expect(await sendPush(pey, row, "5512345678" as Phone, true)).toBe(false);
    expect(pey.createQr).not.toHaveBeenCalled();
    expect(pey.createPush).not.toHaveBeenCalled();
    expect(toDebtorPage(row, true)).toMatchObject({ state: "paid" });
  });

  it("lets the debtor answer once", async () => {
    const row = (await findDebtor(db, token))!;
    expect(await answer(db, row.id, "claims_paid")).toBe(true);
    expect(await answer(db, row.id, "disputed")).toBe(false);
    expect(toDebtorPage(await findDebtor(db, token), true, now)).toMatchObject({ status: "claims_paid", canAnswer: false });
  });
});

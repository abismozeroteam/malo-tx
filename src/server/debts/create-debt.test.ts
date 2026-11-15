import { beforeEach, describe, expect, it } from "vitest";
import { createTestDb } from "../../../test/db";
import { EMPTY_DEBT_FORM } from "@/contracts/debt-form";
import type { ValidDebtForm } from "../validation/debt-form";
import type { Database } from "../db";
import { signUp } from "../auth/session";
import { createDebt, loadCreatedDebt, whatsappShareUrl } from "./create-debt";

const values: ValidDebtForm = {
  ...EMPTY_DEBT_FORM,
  meme: { kind: "catalog", key: "a" },
  name: " Tacos del viernes ",
  totalCents: 30_000,
  includeMe: true,
  people: [
    { firstName: " Ana ", phone: "55 1234 5678", customCents: null },
    { firstName: "Beto", phone: "", customCents: null },
  ],
};

describe("createDebt", () => {
  let db: Database;
  let creditorId: string;

  beforeEach(async () => {
    db = await createTestDb();
    creditorId = (await signUp(db, "Eduardo")).userId;
  });

  it("saves the debt and one debtor per person", async () => {
    const debt = await createDebt(db, creditorId, values, "https://malo.test");

    const [row] = await db.query<{ name: string; total_cents: number; creditor_share_cents: number; meme_key: string; caption: string }>(
      "SELECT name, total_cents, creditor_share_cents, meme_key, caption FROM debts",
    );
    expect(row).toMatchObject({ name: "Tacos del viernes", total_cents: 30_000, creditor_share_cents: 10_000, meme_key: "a" });
    expect(row.caption).toBe(debt.meme.caption);

    const debtors = await db.query<{ first_name: string; phone: string | null; amount_cents: number; status: string }>(
      "SELECT first_name, phone, amount_cents, status FROM debtors ORDER BY position",
    );
    expect(debtors).toEqual([
      { first_name: "Ana", phone: "5512345678", amount_cents: 10_000, status: "pending" },
      { first_name: "Beto", phone: null, amount_cents: 10_000, status: "pending" },
    ]);
  });

  it("returns one unguessable link per person", async () => {
    const debt = await createDebt(db, creditorId, values, "https://malo.test");
    const tokens = await db.query<{ token: string }>("SELECT token FROM debtors ORDER BY position");

    expect(debt.links.map((l) => l.url)).toEqual(tokens.map((t) => `https://malo.test/c/${t.token}`));
    for (const { token } of tokens) expect(token).toMatch(/^[A-Za-z0-9_-]{22}$/);
    expect(new Set(tokens.map((t) => t.token)).size).toBe(2);
  });

  it("addresses WhatsApp to the person's phone when there is one", async () => {
    const [ana, beto] = (await createDebt(db, creditorId, values, "https://malo.test")).links;
    expect(ana.whatsappUrl.startsWith("https://wa.me/525512345678?text=")).toBe(true);
    expect(beto.whatsappUrl.startsWith("https://wa.me/?text=")).toBe(true);
    expect(decodeURIComponent(ana.whatsappUrl.split("text=")[1])).toContain(ana.url);
  });

  it("saves nothing when a debtor insert fails", async () => {
    const broken = { ...values, people: [values.people[0], { ...values.people[1], firstName: "x".repeat(10) }] };
    await db.query("ALTER TABLE debtors ADD CONSTRAINT short_name CHECK (length(first_name) < 5)");
    await expect(createDebt(db, creditorId, broken, "https://malo.test")).rejects.toThrow();
    expect(await db.query("SELECT 1 FROM debts")).toEqual([]);
  });
});

describe("whatsappShareUrl", () => {
  it("encodes the message", () => {
    expect(whatsappShareUrl(null, "hola & adiós")).toBe("https://wa.me/?text=hola%20%26%20adi%C3%B3s");
  });
});

describe("loadCreatedDebt", () => {
  it("returns the creditor's own debt only", async () => {
    const db = await createTestDb();
    const owner = (await signUp(db, "Eduardo")).userId;
    const stranger = (await signUp(db, "Otro")).userId;
    const created = await createDebt(db, owner, values, "https://malo.test");

    expect(await loadCreatedDebt(db, owner, created.ref, "https://malo.test")).toEqual(created);
    expect(await loadCreatedDebt(db, stranger, created.ref, "https://malo.test")).toBeNull();
  });

  it("keeps the due date as a plain date", async () => {
    const db = await createTestDb();
    const owner = (await signUp(db, "Eduardo")).userId;
    const created = await createDebt(db, owner, { ...values, dueDate: "2026-11-30" }, "https://malo.test");
    expect(created.dueDate).toBe("2026-11-30");
  });
});

import { describe, expect, it } from "vitest";
import { EMPTY_DEBT_FORM } from "@/contracts/debt-form";
import { debtFormSchema } from "./debt-form";

const filled = { ...EMPTY_DEBT_FORM, name: "Tacos", totalCents: 30_000 };

describe("debtFormSchema", () => {
  it("accepts a filled form", () => {
    expect(debtFormSchema.safeParse(filled).success).toBe(true);
  });

  it.each([
    ["no total", { totalCents: null }],
    ["no meme", { meme: null }],
    ["an uploaded meme", { meme: { kind: "upload", id: "x", src: "https://evil.test/a.png" } }],
    ["a meme outside the picker", { meme: { kind: "catalog", key: "paid" } }],
    ["fractional cents", { totalCents: 10.5 }],
    ["no people", { people: [] }],
    ["too many people", { people: Array(21).fill(EMPTY_DEBT_FORM.people[0]) }],
    ["a bad date", { dueDate: "mañana" }],
  ])("rejects %s", (_, patch) => {
    expect(debtFormSchema.safeParse({ ...filled, ...patch }).success).toBe(false);
  });
});

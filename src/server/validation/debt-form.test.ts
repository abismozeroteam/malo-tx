import { describe, expect, it } from "vitest";
import { EMPTY_DEBT_FORM } from "@/contracts/debt-form";
import { debtFormSchema } from "./debt-form";

describe("debtFormSchema", () => {
  it("accepts the form's own values", () => {
    expect(debtFormSchema.safeParse(EMPTY_DEBT_FORM).success).toBe(true);
  });

  it.each([
    ["an uploaded meme", { meme: { kind: "upload", id: "x", src: "https://evil.test/a.png" } }],
    ["a meme outside the picker", { meme: { kind: "catalog", key: "paid" } }],
    ["fractional cents", { totalCents: 10.5 }],
    ["no people", { people: [] }],
    ["too many people", { people: Array(21).fill(EMPTY_DEBT_FORM.people[0]) }],
    ["a bad date", { dueDate: "mañana" }],
  ])("rejects %s", (_, patch) => {
    expect(debtFormSchema.safeParse({ ...EMPTY_DEBT_FORM, ...patch }).success).toBe(false);
  });
});

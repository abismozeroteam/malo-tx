import { describe, expect, it } from "vitest";
import { EMPTY_DEBT_FORM, type DebtFormValues } from "./debt-form";
import { debtorAmounts, firstStepWithErrors, hasErrors, myShare, remainingToSplit, validateDebtForm } from "./debt-form-rules";

const person = (firstName: string, customCents: number | null = null, phone = "") => ({ firstName, phone, customCents });

const filled: DebtFormValues = {
  ...EMPTY_DEBT_FORM,
  name: "Cena del viernes",
  totalCents: 180000,
  meme: { kind: "catalog", key: "a" },
  caption: "Págame o me porto mal.",
  people: [person("Ana"), person("Pedro"), person("Lucía")],
};

describe("debtorAmounts", () => {
  it("charges the whole total to a single person", () => {
    expect(debtorAmounts({ ...filled, people: [person("Carlos")] })).toEqual([180000]);
  });

  it("splits evenly and gives leftover centavos to the first person", () => {
    expect(debtorAmounts({ ...filled, totalCents: 100 })).toEqual([34, 33, 33]);
  });

  it("counts the creditor's share but never charges it", () => {
    const values = { ...filled, includeMe: true };
    expect(debtorAmounts(values)).toEqual([45000, 45000, 45000]);
    expect(myShare(values)).toBe(45000);
  });

  it("uses the typed amounts for a custom split", () => {
    expect(debtorAmounts({ ...filled, split: "custom", people: [person("Ana", 100000), person("Pedro", 80000)] })).toEqual([100000, 80000]);
  });
});

describe("remainingToSplit", () => {
  it("reports what is missing or left over in a custom split", () => {
    const base = { ...filled, split: "custom" as const };
    expect(remainingToSplit({ ...base, people: [person("Ana", 100000), person("Pedro", 75000)] })).toBe(5000);
    expect(remainingToSplit({ ...base, people: [person("Ana", 100000), person("Pedro", 85000)] })).toBe(-5000);
  });

  it("includes the creditor's own amount when they are in the split", () => {
    const values = { ...filled, split: "custom" as const, includeMe: true, myCustomCents: 30000, people: [person("Ana", 150000)] };
    expect(remainingToSplit(values)).toBe(0);
  });
});

describe("validateDebtForm", () => {
  it("accepts a complete form", () => {
    expect(validateDebtForm(filled)).toEqual({});
  });

  it("requires name, amount and image on the first step", () => {
    expect(validateDebtForm(EMPTY_DEBT_FORM, "what")).toEqual({ name: "required", total: "required", meme: "required" });
  });

  it.each([0, -100, 1.5, 100_000_001])("rejects a total of %s centavos", (totalCents) => {
    expect(validateDebtForm({ ...filled, totalCents }, "what").total).toBe("invalid_amount");
  });

  it("points at people without a name or with a bad phone", () => {
    const errors = validateDebtForm({ ...filled, people: [person(""), person("Pedro", null, "123")] }, "who");
    expect(errors.personNames).toEqual([0]);
    expect(errors.personPhones).toEqual([1]);
  });

  it("accepts a valid optional phone", () => {
    expect(validateDebtForm({ ...filled, people: [person("Pedro", null, "55 1234 5678")] }, "who")).toEqual({});
  });

  it("blocks a custom split that does not add up", () => {
    const values = { ...filled, split: "custom" as const, people: [person("Ana", 100000), person("Pedro", 10000)] };
    expect(validateDebtForm(values, "who").split).toBe("split_mismatch");
  });

  it("blocks an equal split that leaves someone at zero", () => {
    expect(validateDebtForm({ ...filled, totalCents: 2 }, "who").split).toBe("invalid_amount");
  });

  it("only checks the requested step", () => {
    expect(hasErrors(validateDebtForm({ ...EMPTY_DEBT_FORM, people: [person("Ana")] }, "who"))).toBe(true);
    expect(hasErrors(validateDebtForm({ ...filled, people: [] }, "what"))).toBe(false);
  });
});

describe("firstStepWithErrors", () => {
  it("sends the user to the earliest step that has a problem", () => {
    expect(firstStepWithErrors({ split: "split_mismatch", total: "required" })).toBe("what");
    expect(firstStepWithErrors({ personNames: [0] })).toBe("who");
    expect(firstStepWithErrors({ dueDate: "required" })).toBe("what");
  });

  it("stays on the last step when there are no field errors", () => {
    expect(firstStepWithErrors({})).toBe("style");
  });
});

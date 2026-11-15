import { z } from "zod";
import { PICKABLE_MEMES } from "@/contracts/common";
import { LIMITS } from "@/contracts/debt-form-rules";
import type { DebtFormValues } from "@/contracts/debt-form";

const cents = z.number().int().nullable();

export const debtFormSchema = z.object({
  name: z.string().max(LIMITS.name * 2),
  description: z.string().max(LIMITS.description * 2),
  dueDate: z.union([z.literal(""), z.iso.date()]),
  totalCents: cents,
  meme: z.object({ kind: z.literal("catalog"), key: z.enum(PICKABLE_MEMES) }).nullable(),
  caption: z.string().max(LIMITS.caption * 2),
  people: z
    .array(z.object({ firstName: z.string().max(LIMITS.firstName * 2), phone: z.string().max(32), customCents: cents }))
    .min(1)
    .max(LIMITS.people),
  split: z.enum(["equal", "custom"]),
  includeMe: z.boolean(),
  myCustomCents: cents,
}) satisfies z.ZodType<DebtFormValues>;

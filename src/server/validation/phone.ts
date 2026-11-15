import { z } from "zod";

export function toTenDigitPhone(input: string): string | null {
  const digits = input.replace(/\D/g, "");
  const local = digits.length > 10 ? digits.replace(/^521?/, "") : digits;
  return /^\d{10}$/.test(local) ? local : null;
}

export const phoneSchema = z
  .string()
  .max(32)
  .transform((value, ctx) => {
    const phone = toTenDigitPhone(value);
    if (!phone) ctx.addIssue({ code: "custom", message: "El número debe tener 10 dígitos" });
    return phone ?? z.NEVER;
  })
  .brand<"Phone">();

export type Phone = z.infer<typeof phoneSchema>;

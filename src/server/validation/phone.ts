import { z } from "zod";
import { toTenDigitPhone } from "@/contracts/phone";

export { toTenDigitPhone };

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

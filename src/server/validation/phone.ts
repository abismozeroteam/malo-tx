import { z } from "zod";
import { toTenDigitPhone } from "@/contracts/phone";
import { es } from "@/content/es";

export const phoneSchema = z
  .string()
  .max(32)
  .transform((value, ctx) => {
    const phone = toTenDigitPhone(value);
    if (!phone) ctx.addIssue({ code: "custom", message: es.common.invalidPhone });
    return phone ?? z.NEVER;
  })
  .brand<"Phone">();

export type Phone = z.infer<typeof phoneSchema>;

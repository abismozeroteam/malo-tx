// Temporary: remove in step 1.
import { z } from "zod";
import { peyIdSchema } from "./pey-id";
import { phoneSchema } from "./phone";

export const smokeRequestSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("qr") }),
  z.object({ action: z.literal("push"), phone: phoneSchema }),
  z.object({ action: z.literal("qr-status"), id: peyIdSchema }),
  z.object({ action: z.literal("tx-status"), id: peyIdSchema }),
  z.object({ action: z.literal("events") }),
]);

export type SmokeRequest = z.infer<typeof smokeRequestSchema>;

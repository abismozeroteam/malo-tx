import { z } from "zod";

export const PAYMENT_EVENT_TYPES = ["codi.qr.payment_received", "codi.pn.payment_received"];

export const peyEventSchema = z
  .looseObject({
    type: z.string().min(1),
    amount: z.number().nonnegative().optional(),
    transactionId: z.string().min(1).optional(),
    codiQrId: z.string().optional(),
    datePaid: z.number().int().positive().optional(),
    metadata: z
      .looseObject({
        clabe: z.string().optional(),
        trackingKey: z.string().optional(),
        externalMetadata: z.record(z.string(), z.string()).optional(),
      })
      .optional(),
  })
  .refine(
    (event) =>
      !PAYMENT_EVENT_TYPES.includes(event.type) ||
      (event.transactionId !== undefined && event.amount !== undefined),
    { message: "Payment events need transactionId and amount" },
  );

export type PeyEvent = z.infer<typeof peyEventSchema>;

const maskAllButLast = (value: string, visible: number) =>
  value.length <= visible ? "*".repeat(value.length) : "*".repeat(value.length - visible) + value.slice(-visible);

export function maskEvent(event: PeyEvent): PeyEvent {
  const masked = structuredClone(event);
  if (masked.metadata?.clabe) masked.metadata.clabe = maskAllButLast(masked.metadata.clabe, 3);
  if (masked.metadata?.trackingKey) masked.metadata.trackingKey = maskAllButLast(masked.metadata.trackingKey, 4);
  return masked;
}

import { z } from "zod";

const PAYMENT_EVENT_TYPES = ["codi.qr.payment_received", "codi.pn.payment_received"] as const;

const isPaymentType = (type: string) => (PAYMENT_EVENT_TYPES as readonly string[]).includes(type);

export const peyMetadataSchema = z.record(z.string(), z.string());

export type PeyMetadata = z.infer<typeof peyMetadataSchema>;

const paymentEventSchema = z.looseObject({
  type: z.enum(PAYMENT_EVENT_TYPES),
  amount: z.number().nonnegative(),
  transactionId: z.string().min(1),
  codiQrId: z.string().optional(),
  datePaid: z.number().int().positive().optional(),
  metadata: z
    .looseObject({
      clabe: z.string().optional(),
      trackingKey: z.string().optional(),
      externalMetadata: peyMetadataSchema.optional(),
    })
    .optional(),
});

const otherEventSchema = z.looseObject({
  type: z.string().min(1).refine((type) => !isPaymentType(type)),
});

export const peyEventSchema = z.union([paymentEventSchema, otherEventSchema]);

export type PeyEvent = z.infer<typeof peyEventSchema>;

export type PaymentEvent = z.infer<typeof paymentEventSchema>;

export const isPaymentEvent = (event: PeyEvent): event is PaymentEvent => isPaymentType(event.type);

const maskAllButLast = (value: string, visible: number) =>
  value.length <= visible ? "*".repeat(value.length) : value.slice(-visible).padStart(value.length, "*");

export function maskEvent(event: PeyEvent): PeyEvent {
  if (!isPaymentEvent(event) || !event.metadata) return event;
  const { clabe, trackingKey } = event.metadata;
  return {
    ...event,
    metadata: {
      ...event.metadata,
      ...(clabe && { clabe: maskAllButLast(clabe, 3) }),
      ...(trackingKey && { trackingKey: maskAllButLast(trackingKey, 4) }),
    },
  };
}

export const DEBTOR_ID_KEY = "debtorId";

export const debtorIdOf = (event: PaymentEvent) =>
  z.uuid().safeParse(event.metadata?.externalMetadata?.[DEBTOR_ID_KEY]).data ?? null;

import "server-only";
import { isDemoMode, requireEnv } from "../env";
import { assertChargeAllowed, centsToPesos } from "./charge-rules";

const BASE_URL = "https://api.pey.mx";

export class PeyError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly type?: string,
    readonly requestId?: string,
  ) {
    super(message);
  }
}

type Metadata = Record<string, string | number | boolean | null>;

async function peyFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${requireEnv("PEY_API_KEY")}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
    cache: "no-store",
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = body?.error ?? {};
    throw new PeyError(
      err.message ?? `pey request failed (${res.status})`,
      res.status,
      err.type,
      err.requestId,
    );
  }
  return body as T;
}

export type CreateQrResult = { id: string; qrString: string; qrImage?: string | null };

export function createCodiQr(input: {
  amountCents: number;
  concept: string;
  expirationSeconds: number;
  numRef: string;
  metadata: Metadata;
  generateImage?: boolean;
}): Promise<CreateQrResult> {
  assertChargeAllowed(input.amountCents, isDemoMode());
  return peyFetch("/codi/qr", {
    method: "POST",
    body: JSON.stringify({
      amount: centsToPesos(input.amountCents),
      concept: input.concept,
      expiration: input.expirationSeconds,
      numRef: input.numRef,
      generateImage: input.generateImage ?? true,
      metadata: input.metadata,
    }),
  });
}

export type CreatePushResult = { transactionId: string; codiId: string };

export function createCodiPush(input: {
  amountCents: number;
  phoneNumber: string;
  concept: string;
  expirationSeconds: number;
  numRef: string;
  metadata: Metadata;
}): Promise<CreatePushResult> {
  assertChargeAllowed(input.amountCents, isDemoMode());
  if (!/^[0-9]{10}$/.test(input.phoneNumber)) {
    throw new Error("Phone number must be exactly 10 digits");
  }
  return peyFetch("/codi/pn", {
    method: "POST",
    body: JSON.stringify({
      amount: centsToPesos(input.amountCents),
      phoneNumber: input.phoneNumber,
      concept: input.concept,
      expiration: input.expirationSeconds,
      numRef: input.numRef,
      metadata: input.metadata,
    }),
  });
}

export type PeyTransaction = {
  id: string;
  status: "PENDING" | "PAID";
  amount: number;
  datePaid?: number;
  payableType?: string;
  payableId?: string;
};

export function getTransaction(id: string): Promise<PeyTransaction> {
  return peyFetch(`/transaction/${encodeURIComponent(id)}`);
}

export function getQrTransactions(
  qrId: string,
): Promise<{ items: PeyTransaction[]; nextToken: string | null }> {
  return peyFetch(`/transaction/codi/qr/${encodeURIComponent(qrId)}`);
}

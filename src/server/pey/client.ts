import "server-only";
import type { Phone } from "../validation/phone";
import { isDemoMode, requireEnv } from "../env";
import { assertChargeAllowed, centsToPesos } from "./charge-rules";
import type { PeyMetadata } from "./webhook-event";

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

type Charge = {
  amountCents: number;
  concept: string;
  expirationSeconds: number;
  numRef: string;
  metadata: PeyMetadata;
};

function postCharge<T>(path: string, charge: Charge, extra: Record<string, unknown>): Promise<T> {
  assertChargeAllowed(charge.amountCents, isDemoMode());
  return peyFetch(path, {
    method: "POST",
    body: JSON.stringify({
      amount: centsToPesos(charge.amountCents),
      concept: charge.concept,
      expiration: charge.expirationSeconds,
      numRef: charge.numRef,
      metadata: charge.metadata,
      ...extra,
    }),
  });
}

export function createCodiQr(
  charge: Charge,
): Promise<{ id: string; qrString: string; qrImage?: string | null }> {
  return postCharge("/codi/qr", charge, { generateImage: true });
}

export function createCodiPush(
  charge: Charge & { phoneNumber: Phone },
): Promise<{ transactionId: string; codiId: string }> {
  const { phoneNumber, ...rest } = charge;
  return postCharge("/codi/pn", rest, { phoneNumber });
}

type PeyTransaction = {
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

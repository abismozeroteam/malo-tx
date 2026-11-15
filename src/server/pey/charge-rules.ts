export const DEMO_MAX_CENTS = 1;

export class ChargeNotAllowedError extends Error {}

export function assertChargeAllowed(amountCents: number, demoMode: boolean) {
  if (!Number.isSafeInteger(amountCents) || amountCents <= 0) {
    throw new ChargeNotAllowedError("Amount must be a positive whole number of centavos");
  }
  if (demoMode && amountCents > DEMO_MAX_CENTS) {
    throw new ChargeNotAllowedError("Demo mode only charges $0.01");
  }
}

export const chargeAmountCents = (amountCents: number, demoMode: boolean) => (demoMode ? DEMO_MAX_CENTS : amountCents);

export const centsToPesos = (cents: number) => cents / 100;

export const peyDate = (seconds?: number) => (seconds ? new Date(seconds * 1000) : null);

export const pesosToCents = (pesos: number) => Math.round(pesos * 100);

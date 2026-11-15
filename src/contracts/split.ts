import type { Cents } from "./common";

export function splitEqually(totalCents: Cents, shares: number): Cents[] {
  if (shares <= 0) return [];
  const base = Math.floor(totalCents / shares);
  const leftover = totalCents - base * shares;
  return Array.from({ length: shares }, (_, index) => (index === 0 ? base + leftover : base));
}

export function splitGap(totalCents: Cents, amounts: (Cents | null)[]): Cents {
  return totalCents - amounts.reduce<number>((sum, cents) => sum + (cents ?? 0), 0);
}

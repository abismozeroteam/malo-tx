import type { Cents, IsoDate, IsoDateTime } from "@/contracts/common";

const TIME_ZONE = "America/Mexico_City";

const money = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", currencyDisplay: "narrowSymbol" });
const shortDate = new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const dayMonth = new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "short", timeZone: "UTC" });
const dateTime = new Intl.DateTimeFormat("es-MX", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: TIME_ZONE,
});

const isoDay = new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE });

export const todayInMexicoCity = (now = new Date()): IsoDate => isoDay.format(now);

const tidy = (value: string) => value.replace(/\./g, "").replace(/\s+/g, " ");

export const formatMoney = (cents: Cents) => money.format(cents / 100);

export const formatDate = (date: IsoDate) => tidy(shortDate.format(new Date(`${date}T00:00:00Z`)));

export const formatDayMonth = (date: IsoDate) => tidy(dayMonth.format(new Date(`${date}T00:00:00Z`)));

export const formatDateTime = (value: IsoDateTime) => dateTime.format(new Date(value));

export function centsFromInput(value: string): Cents | null {
  const clean = value.replace(/[,\s$]/g, "");
  if (!/^\d+(\.\d{0,2})?$/.test(clean)) return null;
  const [pesos, decimals = ""] = clean.split(".");
  return Number(pesos) * 100 + Number(decimals.padEnd(2, "0"));
}

export const centsToInput = (cents: Cents | null) => (cents === null ? "" : (cents / 100).toFixed(2));

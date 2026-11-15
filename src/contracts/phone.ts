export const COUNTRY_CODE = "52";

export const toWhatsappNumber = (tenDigits: string) => `${COUNTRY_CODE}${tenDigits}`;

export function toTenDigitPhone(input: string): string | null {
  const digits = input.replace(/\D/g, "");
  const local = digits.length > 10 ? digits.replace(/^521?/, "") : digits;
  return /^\d{10}$/.test(local) ? local : null;
}

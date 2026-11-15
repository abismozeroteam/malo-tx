import type { SignInData } from "@/contracts/sign-in";

const waiting = {
  step: "code" as const,
  phoneLast4: "5678",
  whatsappUrl: "https://wa.me/15550000000?text=Quiero%20entrar%20a%20Malo%20Tx",
  attemptsLeft: 5,
};

export const signInFixtures: Record<string, SignInData> = {
  "escribir número": { step: "phone", error: null },
  "número inválido": { step: "phone", error: "invalid_phone" },
  "esperando código": { ...waiting, error: null },
  "código incorrecto": { ...waiting, error: "wrong_code", attemptsLeft: 4 },
  "código vencido": { ...waiting, error: "expired" },
  "demasiados intentos": { ...waiting, error: "too_many", attemptsLeft: 0 },
  listo: { step: "done" },
};

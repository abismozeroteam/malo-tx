export type SignInCodeError = "wrong_code" | "expired" | "too_many";

export type SignInData =
  | { step: "phone"; error: "invalid_phone" | null }
  | {
      step: "code";
      phoneLast4: string;
      whatsappUrl: string;
      error: SignInCodeError | null;
      attemptsLeft: number;
    }
  | { step: "done" };

export type SignInActions = {
  start(phone: string): Promise<{ ok: true; whatsappUrl: string } | { ok: false; error: "invalid_phone" | "rate_limited" }>;
  verify(code: string): Promise<{ ok: true } | { ok: false; error: SignInCodeError; attemptsLeft: number }>;
};

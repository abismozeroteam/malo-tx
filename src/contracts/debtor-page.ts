import type { ActionError, ActionResult, Cents, IsoDate, IsoDateTime, MemeView } from "./common";

export type DebtorStatus = "pending" | "claims_paid" | "disputed" | "paid" | "cancelled";

export const OPEN_DEBTOR_STATUSES = ["pending", "claims_paid", "disputed"] as const satisfies DebtorStatus[];

export type CodiQr = { imageSrc: string; expiresAt: IsoDateTime };

export const QR_MIN_LEFT_MS = 60_000;

export const PEY_CHECK_SECONDS = 30;

export const isTokenShape = (token: unknown): token is string => typeof token === "string" && token.length <= 64;

export type DebtorAnswer = Extract<DebtorStatus, "claims_paid" | "disputed">;

export type QrResult = { ok: true; qr: CodiQr } | { ok: false; error: ActionError };

type DebtorPageBase = {
  debtorName: string;
  creditorName: string;
  debtName: string;
  amountCents: Cents;
  demoMode: boolean;
};

export type DebtorPageData =
  | { state: "gone" }
  | (DebtorPageBase & {
      state: "open";
      status: "pending" | "claims_paid" | "disputed";
      meme: MemeView;
      totalCents: Cents | null;
      dueDate: IsoDate | null;
      overdue: boolean;
      canAnswer: boolean;
      canReport: boolean;
      qr: CodiQr | null;
    })
  | (DebtorPageBase & { state: "paid"; paidAt: IsoDateTime });

export type DebtorPageActions = {
  requestQr(): Promise<QrResult>;
  sendPush(phone: string): Promise<ActionResult>;
  claimPaid(): Promise<ActionResult>;
  dispute(): Promise<ActionResult>;
  report(): Promise<ActionResult>;
  checkPaid(askPey: boolean): Promise<boolean>;
};

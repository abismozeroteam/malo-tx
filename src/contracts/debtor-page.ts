import type { ActionError, ActionResult, Cents, IsoDate, IsoDateTime, MemeView } from "./common";

export type DebtorStatus = "pending" | "claims_paid" | "disputed" | "paid" | "cancelled";

export type CodiQr = { imageSrc: string; expiresAt: IsoDateTime };

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
  requestQr(): Promise<{ ok: true; qr: CodiQr } | { ok: false; error: ActionError }>;
  sendPush(phone: string): Promise<ActionResult>;
  claimPaid(): Promise<ActionResult>;
  dispute(): Promise<ActionResult>;
  report(): Promise<ActionResult>;
};

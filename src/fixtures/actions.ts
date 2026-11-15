import type { ActionResult } from "@/contracts/common";
import type { DashboardActions } from "@/contracts/dashboard";
import type { DebtFormActions } from "@/contracts/debt-form";
import type { DebtorPageActions } from "@/contracts/debtor-page";
import type { SignInActions } from "@/contracts/sign-in";
import { createdDebtFixture } from "./debt-form";

const ok = async (): Promise<ActionResult> => ({ ok: true });

export const debtorActionsFixture: DebtorPageActions = {
  requestQr: async () => ({ ok: false, error: "network" }),
  sendPush: ok,
  claimPaid: ok,
  dispute: ok,
  report: ok,
};

export const dashboardActionsFixture: DashboardActions = { rename: ok };

export const signInActionsFixture: SignInActions = {
  start: async () => ({ ok: true, whatsappUrl: "#" }),
  verify: async () => ({ ok: false, error: "wrong_code", attemptsLeft: 3 }),
};

export const debtFormActionsFixture: DebtFormActions = {
  submit: async () => ({ ok: true, debt: createdDebtFixture }),
};

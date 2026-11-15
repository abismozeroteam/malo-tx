import type { ActionResult, Cents, IsoDate, MemeView } from "./common";

export type DebtSummaryStatus = "pending" | "paid" | "overdue";

export type DebtCard = {
  href: string;
  name: string;
  meme: MemeView;
  peopleCount: number;
  paidCount: number;
  onlyDebtorName: string | null;
  amountCents: Cents;
  status: DebtSummaryStatus;
  dueDate: IsoDate | null;
};

export type DashboardFilter = "all" | "pending" | "paid" | "overdue";

export type DashboardData = {
  userName: string;
  suggestRename: boolean;
  owedCents: Cents;
  receivedCents: Cents;
  debts: DebtCard[];
};

export type DashboardActions = {
  rename(name: string): Promise<ActionResult>;
};

import type { Metadata } from "next";
import { es } from "@/content/es";
import { DebtorScreen } from "@/components/screens/DebtorScreen";
import { claimPaidAction, disputeAction, reportAction, requestQrAction, sendPushAction } from "@/server/actions/debtor";
import { loadDebtor, toDebtorPage } from "@/server/debtors/debtor-page";
import { isDemoMode } from "@/server/env";

export async function generateMetadata({ params }: PageProps<"/c/[token]">): Promise<Metadata> {
  const row = await loadDebtor((await params).token);
  const title = row ? es.debtor.owesTo(row.first_name, row.creditor_name) : es.brand.name;
  return { title, robots: { index: false, follow: false }, openGraph: { title, description: es.brand.tagline } };
}

export default async function DebtorPage({ params }: PageProps<"/c/[token]">) {
  const { token } = await params;
  const data = toDebtorPage(await loadDebtor(token), isDemoMode());
  return (
    <DebtorScreen
      data={data}
      actions={{
        requestQr: requestQrAction.bind(null, token),
        sendPush: sendPushAction.bind(null, token),
        claimPaid: claimPaidAction.bind(null, token),
        dispute: disputeAction.bind(null, token),
        report: reportAction,
      }}
    />
  );
}

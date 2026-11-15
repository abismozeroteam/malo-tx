import { Suspense } from "react";
import { redirect } from "next/navigation";
import { EMPTY_DEBT_FORM } from "@/contracts/debt-form";
import { routes } from "@/contracts/routes";
import { es } from "@/content/es";
import { DebtFormScreen } from "@/components/screens/DebtFormScreen";
import { createDebtAction } from "@/server/actions/create-debt";
import { getCurrentUser } from "@/server/auth/current-user";

export const metadata = { title: `${es.debtForm.title.what} · ${es.brand.name}` };

export default function NewDebtPage() {
  return (
    <Suspense>
      <NewDebt />
    </Suspense>
  );
}

async function NewDebt() {
  const user = await getCurrentUser();
  if (!user) redirect(routes.signIn);
  return (
    <DebtFormScreen
      data={{ step: "what", creditorName: user.displayName, values: EMPTY_DEBT_FORM, errors: {}, uploads: [] }}
      actions={{ submit: createDebtAction }}
    />
  );
}

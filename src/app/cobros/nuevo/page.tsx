import { EMPTY_DEBT_FORM } from "@/contracts/debt-form";
import { es } from "@/content/es";
import { DebtFormScreen } from "@/components/screens/DebtFormScreen";
import { createDebtAction } from "@/server/actions/create-debt";
import { requireUser } from "@/server/auth/current-user";

export const metadata = { title: es.debtForm.title.what };

export default async function NewDebtPage() {
  const user = await requireUser();
  return (
    <DebtFormScreen
      data={{ step: "what", creditorName: user.displayName, values: EMPTY_DEBT_FORM, errors: {}, uploads: [] }}
      actions={{ submit: createDebtAction }}
    />
  );
}

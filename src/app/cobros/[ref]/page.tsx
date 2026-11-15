import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { routes } from "@/contracts/routes";
import { es } from "@/content/es";
import { CreatedScreen } from "@/components/screens/CreatedScreen";
import { getCurrentUser } from "@/server/auth/current-user";
import { db } from "@/server/db";
import { loadCreatedDebt } from "@/server/debts/create-debt";
import { siteUrl } from "@/server/site-url";

export const metadata = { title: `${es.created.title} · ${es.brand.name}` };

export default function DebtPage({ params }: PageProps<"/cobros/[ref]">) {
  return (
    <Suspense>
      <Debt params={params} />
    </Suspense>
  );
}

async function Debt({ params }: Pick<PageProps<"/cobros/[ref]">, "params">) {
  const user = await getCurrentUser();
  if (!user) redirect(routes.signIn);
  const { ref } = await params;
  const debt = /^[A-Za-z0-9_-]{22}$/.test(ref) ? await loadCreatedDebt(db(), user.id, ref, siteUrl()) : null;
  if (!debt) notFound();
  return <CreatedScreen debt={debt} creditorName={user.displayName} />;
}

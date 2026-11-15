import { notFound } from "next/navigation";
import { es } from "@/content/es";
import { CreatedScreen } from "@/components/screens/CreatedScreen";
import { requireUser } from "@/server/auth/current-user";
import { db } from "@/server/db";
import { loadCreatedDebt } from "@/server/debts/create-debt";
import { siteUrl } from "@/server/site-url";

export const metadata = { title: es.created.title };

export default async function DebtPage({ params }: PageProps<"/cobros/[ref]">) {
  const user = await requireUser();
  const debt = await loadCreatedDebt(db(), user.id, (await params).ref, siteUrl());
  if (!debt) notFound();
  return <CreatedScreen debt={debt} creditorName={user.displayName} />;
}

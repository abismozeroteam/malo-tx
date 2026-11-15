import { redirect } from "next/navigation";
import { routes } from "@/contracts/routes";
import { es } from "@/content/es";
import { GuestEntryScreen } from "@/components/screens/GuestEntryScreen";
import { guestSignIn } from "@/server/actions/guest-sign-in";
import { getCurrentUser } from "@/server/auth/current-user";

export const metadata = { title: es.guestEntry.title };

export default async function SignInPage() {
  if (await getCurrentUser()) redirect(routes.debts);
  return <GuestEntryScreen action={guestSignIn} />;
}

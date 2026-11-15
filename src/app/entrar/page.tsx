import { redirect } from "next/navigation";
import { routes } from "@/contracts/routes";
import { es } from "@/content/es";
import { TeamGateScreen } from "@/components/screens/TeamGateScreen";
import { teamSignIn } from "@/server/actions/team-sign-in";
import { getCurrentUser } from "@/server/auth/current-user";

export const metadata = { title: es.teamGate.title };

export default async function SignInPage() {
  if (await getCurrentUser()) redirect(routes.debts);
  return <TeamGateScreen action={teamSignIn} />;
}

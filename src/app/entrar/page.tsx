import { Suspense } from "react";
import { redirect } from "next/navigation";
import { routes } from "@/contracts/routes";
import { es } from "@/content/es";
import { TeamGateScreen } from "@/components/screens/TeamGateScreen";
import { teamSignIn } from "@/server/actions/team-sign-in";
import { getCurrentUser } from "@/server/auth/current-user";

export const metadata = { title: `${es.teamGate.title} · ${es.brand.name}` };

export default function SignInPage() {
  return (
    <Suspense>
      <Gate />
    </Suspense>
  );
}

async function Gate() {
  if (await getCurrentUser()) redirect(routes.newDebt);
  return <TeamGateScreen action={teamSignIn} />;
}

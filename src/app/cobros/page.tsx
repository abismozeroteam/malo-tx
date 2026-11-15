import { redirect } from "next/navigation";
import { routes } from "@/contracts/routes";

export default function DebtsPage() {
  redirect(routes.newDebt);
}

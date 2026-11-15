// TEMPORARY step 0 page. Remove once step 1 exists.
import type { Metadata } from "next";
import { SmokePanel } from "./smoke-panel";

export const metadata: Metadata = {
  title: "Smoke test",
  robots: { index: false, follow: false },
};

export default function SmokePage() {
  return <SmokePanel />;
}

// Temporary: remove in step 1.
import type { Metadata } from "next";
import { SmokePanel } from "./smoke-panel";

export const metadata: Metadata = {
  title: "Smoke test",
  robots: { index: false, follow: false },
};

export default function SmokePage() {
  return <SmokePanel />;
}

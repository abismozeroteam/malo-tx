"use client";

import { useState, type ReactNode } from "react";
import type { ActionResult } from "@/contracts/common";
import { es } from "@/content/es";
import { CreatedScreen } from "@/components/screens/CreatedScreen";
import { DashboardScreen } from "@/components/screens/DashboardScreen";
import { DebtFormScreen } from "@/components/screens/DebtFormScreen";
import { DebtorScreen } from "@/components/screens/DebtorScreen";
import { LandingScreen } from "@/components/screens/LandingScreen";
import { SignInScreen } from "@/components/screens/SignInScreen";
import { dashboardFixtures } from "@/fixtures/dashboard";
import { createdDebtFixture, debtFormFixtures } from "@/fixtures/debt-form";
import { debtorPageFixtures } from "@/fixtures/debtor-page";
import { signInFixtures } from "@/fixtures/sign-in";

const ok = async (): Promise<ActionResult> => ({ ok: true });

const debtorActions = { sendPush: ok, claimPaid: ok, dispute: ok, report: ok };
const dashboardActions = { rename: ok };
const signInActions = {
  start: async () => ({ ok: true as const, whatsappUrl: "#" }),
  verify: async () => ({ ok: false as const, error: "wrong_code" as const, attemptsLeft: 3 }),
};
const debtFormActions = { submit: async () => ({ ok: true as const, debt: createdDebtFixture }) };

const sections: { title: string; entries: [string, () => ReactNode][] }[] = [
  { title: "Landing", entries: [["landing", () => <LandingScreen />]] },
  {
    title: "Entrar",
    entries: Object.entries(signInFixtures).map(([name, data]) => [name, () => <SignInScreen data={data} actions={signInActions} />]),
  },
  {
    title: "Mis cobros",
    entries: Object.entries(dashboardFixtures).map(([name, data]) => [name, () => <DashboardScreen data={data} actions={dashboardActions} />]),
  },
  {
    title: "Crear cobro",
    entries: [
      ...Object.entries(debtFormFixtures).map(([name, data]): [string, () => ReactNode] => [name, () => <DebtFormScreen data={data} actions={debtFormActions} cancelHref="#" />]),
      ["cobro listo", () => <CreatedScreen debt={createdDebtFixture} creditorName="Pam" />],
    ],
  },
  {
    title: "Página del deudor",
    entries: Object.entries(debtorPageFixtures).map(([name, data]) => [name, () => <DebtorScreen data={data} actions={debtorActions} />]),
  },
];

export function Gallery() {
  const [width, setWidth] = useState(390);
  return (
    <div className="flex flex-col gap-8 bg-neutral-soft p-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-title font-bold">{es.gallery.title}</h1>
        <p className="text-body text-muted">{es.gallery.lead}</p>
        <div className="flex gap-2">
          {[360, 390, 430].map((w) => (
            <button key={w} type="button" onClick={() => setWidth(w)} className="rounded-small border border-line bg-surface px-3 py-1 text-small" aria-pressed={width === w}>
              {w}px
            </button>
          ))}
        </div>
        <nav className="flex flex-wrap gap-3 text-small font-semibold text-brand-ink">
          {sections.map((section) => (
            <a key={section.title} href={`#${section.title}`}>
              {section.title}
            </a>
          ))}
        </nav>
      </header>
      {sections.map((section) => (
        <section key={section.title} id={section.title} className="flex flex-col gap-4">
          <h2 className="text-subtitle font-bold">{section.title}</h2>
          <div className="flex gap-6 overflow-x-auto pb-4">
            {section.entries.map(([name, render]) => (
              <figure key={name} className="flex shrink-0 flex-col gap-2">
                <figcaption className="text-small font-semibold text-muted">{name}</figcaption>
                <div className="flex min-h-211 flex-col overflow-hidden rounded-hero border border-line bg-page" style={{ width }}>
                  {render()}
                </div>
              </figure>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

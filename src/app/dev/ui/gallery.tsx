"use client";

import { useState, type ReactNode } from "react";
import { es } from "@/content/es";
import { CreatedScreen } from "@/components/screens/CreatedScreen";
import { DashboardScreen } from "@/components/screens/DashboardScreen";
import { DebtFormScreen } from "@/components/screens/DebtFormScreen";
import { DebtorScreen } from "@/components/screens/DebtorScreen";
import { LandingScreen } from "@/components/screens/LandingScreen";
import { SignInScreen } from "@/components/screens/SignInScreen";
import { PageHeading } from "@/components/ui/PageHeading";
import { dashboardActionsFixture, debtFormActionsFixture, debtorActionsFixture, signInActionsFixture } from "@/fixtures/actions";
import { dashboardFixtures } from "@/fixtures/dashboard";
import { createdDebtFixture, debtFormFixtures } from "@/fixtures/debt-form";
import { debtorPageFixtures } from "@/fixtures/debtor-page";
import { signInFixtures } from "@/fixtures/sign-in";

const titles = es.gallery.sections;

const entries = <T,>(fixtures: Record<string, T>, render: (data: T) => ReactNode): [string, () => ReactNode][] =>
  Object.entries(fixtures).map(([name, data]) => [name, () => render(data)]);

const sections: { title: string; entries: [string, () => ReactNode][] }[] = [
  { title: titles.landing, entries: [[titles.landing, () => <LandingScreen />]] },
  { title: titles.signIn, entries: entries(signInFixtures, (data) => <SignInScreen data={data} actions={signInActionsFixture} />) },
  { title: titles.dashboard, entries: entries(dashboardFixtures, (data) => <DashboardScreen data={data} actions={dashboardActionsFixture} />) },
  {
    title: titles.debtForm,
    entries: [
      ...entries(debtFormFixtures, (data) => <DebtFormScreen data={data} actions={debtFormActionsFixture} />),
      [titles.created, () => <CreatedScreen debt={createdDebtFixture} creditorName="Pam" />],
    ],
  },
  { title: titles.debtor, entries: entries(debtorPageFixtures, (data) => <DebtorScreen data={data} actions={debtorActionsFixture} />) },
];

export function Gallery() {
  const [width, setWidth] = useState(390);
  return (
    <div className="flex flex-col gap-8 bg-neutral-soft p-6">
      <header className="flex flex-col gap-2">
        <PageHeading title={es.gallery.title} lead={es.gallery.lead} />
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

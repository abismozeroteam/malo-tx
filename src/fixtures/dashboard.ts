import type { DashboardData } from "@/contracts/dashboard";
import { catalogMemeView } from "@/content/memes";

export const dashboardFixtures: Record<string, DashboardData> = {
  "sin cobros": { userName: "María", suggestRename: false, owedCents: 0, receivedCents: 0, debts: [] },
  "nombre por revisar": { userName: "Cobrador", suggestRename: true, owedCents: 0, receivedCents: 0, debts: [] },
  mixto: {
    userName: "María",
    suggestRename: false,
    owedCents: 485000,
    receivedCents: 1240000,
    debts: [
      {
        href: "#cena",
        name: "Cena del viernes",
        meme: catalogMemeView("a"),
        peopleCount: 3,
        paidCount: 1,
        onlyDebtorName: null,
        amountCents: 120000,
        status: "pending",
        dueDate: "2026-11-20",
      },
      {
        href: "#renta",
        name: "Renta de noviembre",
        meme: catalogMemeView("d"),
        peopleCount: 1,
        paidCount: 0,
        onlyDebtorName: "Carlos",
        amountCents: 365000,
        status: "overdue",
        dueDate: "2026-11-12",
      },
      {
        href: "#concierto",
        name: "Entradas al concierto",
        meme: catalogMemeView("c"),
        peopleCount: 1,
        paidCount: 1,
        onlyDebtorName: "Lucía",
        amountCents: 90000,
        status: "paid",
        dueDate: null,
      },
    ],
  },
};

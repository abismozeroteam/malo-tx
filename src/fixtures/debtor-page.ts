import type { DebtorPageData } from "@/contracts/debtor-page";
import { catalogMemeView } from "@/content/memes";
import { sampleQrImage } from "./qr";

const base = {
  debtorName: "Pedro",
  creditorName: "Pam",
  debtName: "Cena del viernes",
  amountCents: 60000,
  demoMode: true,
};

const open = {
  ...base,
  state: "open" as const,
  meme: catalogMemeView("a"),
  totalCents: 180000,
  dueDate: "2026-11-20",
  overdue: false,
  canAnswer: true,
  canReport: false,
  qr: { imageSrc: sampleQrImage, expiresAt: "2026-11-15T18:10:00Z" },
};

export const debtorPageFixtures: Record<string, DebtorPageData> = {
  pending: { ...open, status: "pending" },
  "pending · sin modo demo, una sola persona": { ...open, status: "pending", demoMode: false, totalCents: null, dueDate: null },
  "pending · vencido": { ...open, status: "pending", dueDate: "2026-11-12", overdue: true },
  "pending · meme subido": {
    ...open,
    status: "pending",
    canReport: true,
    meme: { kind: "upload", src: "/memes/c.jpg", caption: "Te vi en el Oxxo." },
  },
  "pending · sin QR": { ...open, status: "pending", qr: null },
  "dice que ya pagó": { ...open, status: "claims_paid", canAnswer: false, meme: catalogMemeView("e") },
  "en disputa": { ...open, status: "disputed", canAnswer: false, meme: catalogMemeView("d") },
  cobrado: {
    ...base,
    state: "paid",
    paidAt: "2026-11-14T23:42:00Z",
  },
  "cancelado o borrado": { state: "gone" },
};

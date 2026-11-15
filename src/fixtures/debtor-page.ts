import type { DebtorPageData } from "@/contracts/debtor-page";
import { es } from "@/content/es";
import { sampleQrImage } from "./qr";

const base = {
  debtorName: "Pedro",
  creditorName: "Pam",
  debtName: "Cena del viernes",
  amountCents: 60000,
  demoMode: true,
  meme: { kind: "catalog" as const, key: "a" as const, caption: es.memes.defaultCaption.a },
};

const open = {
  ...base,
  state: "open" as const,
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
    meme: { kind: "upload", src: sampleQrImage, caption: "Te vi en el Oxxo." },
  },
  "pending · sin QR": { ...open, status: "pending", qr: null },
  "dice que ya pagó": { ...open, status: "claims_paid", canAnswer: false, meme: { ...base.meme, key: "e", caption: es.memes.defaultCaption.e } },
  "en disputa": { ...open, status: "disputed", canAnswer: false, meme: { ...base.meme, key: "d", caption: es.memes.defaultCaption.d } },
  cobrado: {
    ...base,
    state: "paid",
    paidAt: "2026-11-14T23:42:00Z",
    meme: { kind: "catalog", key: "paid", caption: es.memes.defaultCaption.paid },
  },
  "cancelado o borrado": { state: "gone" },
};

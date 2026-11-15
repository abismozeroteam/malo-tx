import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Gallery } from "./gallery";

export const metadata: Metadata = { title: "UI · MALOTX", robots: { index: false, follow: false } };

export default function GalleryPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <Gallery />;
}

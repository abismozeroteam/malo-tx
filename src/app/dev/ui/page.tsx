import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Gallery } from "./gallery";

export const metadata: Metadata = { title: "UI" };

export default function GalleryPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <Gallery />;
}

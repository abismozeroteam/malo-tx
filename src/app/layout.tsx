import { Suspense } from "react";
import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { es } from "@/content/es";
import { siteUrl } from "@/server/site-url";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: es.brand.name, template: `%s · ${es.brand.name}` },
  description: es.brand.tagline,
  openGraph: { siteName: es.brand.name, locale: "es_MX", type: "website" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es-MX" className={`${geistSans.variable} h-full antialiased`}>
      <head>
        <link rel="preconnect" href="https://use.typekit.net" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://p.typekit.net" crossOrigin="anonymous" />
        <link rel="stylesheet" href="https://use.typekit.net/xkl4qwt.css" />
      </head>
      <body className="min-h-full flex flex-col">
        <Suspense>{children}</Suspense>
      </body>
    </html>
  );
}

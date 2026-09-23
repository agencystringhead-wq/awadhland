import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SITE_URL } from "@/lib/i18n";
import { fontClassNameEn } from "../fonts";
import "../globals.css";

// Root layout for the English tree. Per-page titles, descriptions and hreflang come from each route's generateMetadata.
// Devanagari here is incidental -- nameHi and the language toggle -- so it loads without blocking
// the hero's paint. See app/fonts.ts.
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Awadhland",
};

export default function EnglishRootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en-IN" className={fontClassNameEn}>
      <body>{children}</body>
    </html>
  );
}

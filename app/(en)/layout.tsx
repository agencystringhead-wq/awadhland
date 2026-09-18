import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SITE_URL } from "@/lib/i18n";
import { fontClassName } from "../fonts";
import "../globals.css";

// Root layout for the English tree. Per-page titles, descriptions and hreflang come from each route's generateMetadata.
// Every font variable is set so Devanagari names in English pages (nameHi) render in Noto.
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Awadhland",
};

export default function EnglishRootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en-IN" className={fontClassName}>
      <body>{children}</body>
    </html>
  );
}

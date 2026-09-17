import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SITE_URL } from "@/lib/i18n";
import "../globals.css";

// Root layout for the Hindi tree. Noto Sans Devanagari (self-hosted) arrives with styling in step 2.
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "अवधलैंड",
};

export default function HindiRootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="hi-IN">
      <body>{children}</body>
    </html>
  );
}

import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SITE_URL } from "@/lib/i18n";
import "../globals.css";

// Root layout for the English tree. Per-page titles, descriptions and hreflang arrive in step 6.
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Awadhland",
};

export default function EnglishRootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en-IN">
      <body>{children}</body>
    </html>
  );
}

import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SITE_URL } from "@/lib/i18n";
import { inter, notoDevanagari } from "../fonts";
import "../globals.css";

// Root layout for the Hindi tree. Body 17px and Noto Sans Devanagari come from globals.css via lang.
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "अवधलैंड",
};

export default function HindiRootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="hi-IN" className={`${inter.variable} ${notoDevanagari.variable}`}>
      <body>{children}</body>
    </html>
  );
}

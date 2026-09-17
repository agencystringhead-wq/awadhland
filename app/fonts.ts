/**
 * Self-hosted fonts. The woff2 files come from the fontsource packages in node_modules and are
 * copied into the static export by next/font, so no request ever leaves the site for a font.
 * Inter 600 for headings (CLAUDE.md), Noto Sans Devanagari for the Hindi tree.
 */
import localFont from "next/font/local";

export const inter = localFont({
  src: [
    { path: "../node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2", style: "normal" },
    { path: "../node_modules/@fontsource-variable/inter/files/inter-latin-ext-wght-normal.woff2", style: "normal" },
  ],
  weight: "100 900",
  variable: "--font-inter",
  display: "swap",
});

/** Devanagari subset only. Latin glyphs in Hindi copy (digits, English names) fall back to Inter. */
export const notoDevanagari = localFont({
  src: "../node_modules/@fontsource-variable/noto-sans-devanagari/files/noto-sans-devanagari-devanagari-wght-normal.woff2",
  weight: "100 900",
  variable: "--font-devanagari",
  display: "swap",
});

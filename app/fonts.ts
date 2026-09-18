/**
 * Self-hosted fonts. The woff2 files come from the fontsource packages in node_modules and are
 * copied into the static export by next/font, so no request ever leaves the site for a font.
 *
 * Latin budget (docs/DESIGN-REFERENCE.md §2, Phase B): Fraunces roman 36 KB (weight axis only;
 * the optical-size and SOFT axes would cost 120 KB), Instrument Serif italic 24 KB for every
 * italic accent, JetBrains Mono 40 KB for eyebrows and labels, Inter 48 KB for body and UI.
 * Noto Sans Devanagari loads for the Hindi tree and for Devanagari names on English pages.
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

/** Display serif for headings, ledes, card titles and stat numbers. */
export const fraunces = localFont({
  src: "../node_modules/@fontsource-variable/fraunces/files/fraunces-latin-wght-normal.woff2",
  weight: "100 900",
  variable: "--font-fraunces",
  display: "swap",
  // Georgia sized to Fraunces so the swap does not shift layout (reference does the same).
  fallback: ["Georgia", "serif"],
  adjustFontFallback: "Times New Roman",
});

/** The italic accent inside headings and the italic notes. */
export const instrumentSerif = localFont({
  src: "../node_modules/@fontsource/instrument-serif/files/instrument-serif-latin-400-italic.woff2",
  weight: "400",
  style: "italic",
  variable: "--font-instrument",
  display: "swap",
  fallback: ["Georgia", "serif"],
  adjustFontFallback: "Times New Roman",
});

/** Eyebrows, form labels, stat captions, footer column heads. */
export const jetbrainsMono = localFont({
  src: "../node_modules/@fontsource-variable/jetbrains-mono/files/jetbrains-mono-latin-wght-normal.woff2",
  weight: "100 800",
  variable: "--font-jetbrains",
  display: "optional",
});

/** Devanagari subset only. Latin glyphs in Hindi copy (digits, English names) fall back to Inter. */
export const notoDevanagari = localFont({
  src: "../node_modules/@fontsource-variable/noto-sans-devanagari/files/noto-sans-devanagari-devanagari-wght-normal.woff2",
  weight: "100 900",
  variable: "--font-devanagari",
  display: "swap",
});

/** Every font variable, for the <html> element of both trees. */
export const fontClassName = [inter, fraunces, instrumentSerif, jetbrainsMono, notoDevanagari].map((f) => f.variable).join(" ");

/**
 * Self-hosted fonts. The woff2 files come from the fontsource packages in node_modules and are
 * copied into the static export by next/font, so no request ever leaves the site for a font.
 *
 * Latin budget (docs/DESIGN-REFERENCE.md §2, Phase B): Fraunces roman 36 KB (weight axis only;
 * the optical-size and SOFT axes would cost 120 KB), Instrument Serif italic 24 KB for every
 * italic accent, JetBrains Mono 40 KB for eyebrows and labels, Inter 48 KB for body and UI.
 * Noto Sans Devanagari is declared per tree: a real swapped font on Hindi, where the page is set
 * in it, and `optional` on English, where it is seven strings and must not delay the hero.
 */
import localFont from "next/font/local";

/**
 * Latin subset only. The latin-ext file is 83 KB and next/font cannot scope it by unicode-range,
 * so it would preload on every page; the few glyphs outside latin (₹) fall back to the system font.
 */
export const inter = localFont({
  src: "../node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2",
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
  // Eyebrows and captions only: not worth a render-blocking preload on mobile.
  preload: false,
});

/*
 * The Devanagari face is declared twice, once per tree. The src path is repeated in both because
 * next/font only accepts literals -- a shared constant fails the build with "Font loader values
 * must be explicitly written literals".
 *
 * next/font emits a separate file per declaration, so the export carries the same 121 KB twice
 * under different names, and a reader who crosses from English to Hindi downloads it twice. That
 * is the price of the two display strategies. It buys every English page a hero that no longer
 * waits behind a font it barely uses, and it costs a duplicate only to the minority who cross.
 */

/**
 * Devanagari for the Hindi tree, where every heading and paragraph is set in it. Devanagari subset
 * only; Latin glyphs in Hindi copy (digits, English names) fall back to Inter.
 */
export const notoDevanagari = localFont({
  src: "../node_modules/@fontsource-variable/noto-sans-devanagari/files/noto-sans-devanagari-devanagari-wght-normal.woff2",
  weight: "100 900",
  variable: "--font-devanagari",
  display: "swap",
});

/**
 * The same face for the English tree, where Devanagari is not the page -- it is the "हिंदी" toggle,
 * the broker's name and three city names, seven distinct strings in all.
 *
 * At 119 KB this is the largest asset on an English page, and `swap` made the browser fetch it at
 * high priority alongside Fraunces (36 KB) and Inter (47 KB), which set the hero. The hero lede is
 * the LCP element: it paints early in the metric-matched fallback, then repaints when its real
 * font arrives, and that repaint is what LCP records. Competing with Devanagari for bandwidth
 * pushed that repaint out.
 *
 * `optional` gives this face no say in that. It lets the browser skip the download outright on a
 * first visit, and measured against the export it does: an English page now requests no Devanagari
 * at all, 264 KB of fonts down to 145 KB. The seven strings render in the system Devanagari font --
 * Nirmala UI on Windows, Noto on Android. The Hindi tree is untouched and still gets the real face.
 */
export const notoDevanagariIncidental = localFont({
  src: "../node_modules/@fontsource-variable/noto-sans-devanagari/files/noto-sans-devanagari-devanagari-wght-normal.woff2",
  weight: "100 900",
  variable: "--font-devanagari",
  display: "optional",
  preload: false,
});

const latin = [inter, fraunces, instrumentSerif, jetbrainsMono];

/** Font variables for <html> in the English tree. */
export const fontClassNameEn = [...latin, notoDevanagariIncidental].map((f) => f.variable).join(" ");

/** Font variables for <html> in the Hindi tree. */
export const fontClassNameHi = [...latin, notoDevanagari].map((f) => f.variable).join(" ");

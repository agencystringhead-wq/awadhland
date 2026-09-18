/**
 * npm run og (runs in prebuild after validate)
 *
 * Renders one Open Graph image per page in both trees (spec "SEO and schema": locality name,
 * price band and city on the brand background) into public/og/<locale>/<slug>-<hash>.png with
 * satori + resvg, using the same fonts as the site. The hash comes from the text, so an unchanged
 * page is skipped and a changed title gets a new URL. public/og/ is gitignored and rebuilt on CI.
 */
import fs from "node:fs";
import path from "node:path";
import { Resvg } from "@resvg/resvg-js";
import satori from "satori";
import { getAllPages, type PageEntry } from "../lib/pages";

const W = 1200;
const H = 630;
const root = process.cwd();
const outDir = path.join(root, "public", "og");
const font = (p: string) => fs.readFileSync(path.join(root, "node_modules", p));

const fonts = [
  { name: "Fraunces", data: font("@fontsource/fraunces/files/fraunces-latin-500-normal.woff"), weight: 500 as const, style: "normal" as const },
  { name: "Inter", data: font("@fontsource/inter/files/inter-latin-500-normal.woff"), weight: 500 as const, style: "normal" as const },
  { name: "Noto Sans Devanagari", data: font("@fontsource/noto-sans-devanagari/files/noto-sans-devanagari-devanagari-600-normal.woff"), weight: 600 as const, style: "normal" as const },
];

/* Tokens from app/globals.css, as hex for satori */
const cream = "#f6f1e8";
const sand = "#efe7d7";
const ink = "#1f1a14";
const inkSoft = "#3b342a";
const muted = "#6b6053";
const rule = "#d9cdb6";
const accent = "#2c6a4e";
const accentSoft = "#d4e6da";

function markup(p: PageEntry) {
  const hi = p.locale === "hi";
  const display = hi ? "Noto Sans Devanagari" : "Fraunces";
  const titleSize = p.og.title.length > 34 ? 60 : p.og.title.length > 22 ? 72 : 84;
  return {
    type: "div",
    props: {
      style: {
        width: W,
        height: H,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "64px 72px",
        background: `linear-gradient(160deg, ${cream} 0%, ${sand} 100%)`,
        color: ink,
        fontFamily: hi ? "Noto Sans Devanagari, Inter" : "Inter",
      },
      children: [
        {
          type: "div",
          props: {
            style: { display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 26, color: muted, letterSpacing: 2, textTransform: "uppercase" },
            children: [
              { type: "span", props: { children: "awadhland.com" } },
              p.og.chip
                ? {
                    type: "span",
                    props: {
                      style: { padding: "10px 22px", borderRadius: 999, background: accentSoft, color: accent, fontSize: 24, letterSpacing: 1, border: `1px solid ${rule}` },
                      children: p.og.chip,
                    },
                  }
                : { type: "span", props: { children: "" } },
            ],
          },
        },
        {
          type: "div",
          props: {
            style: { display: "flex", flexDirection: "column", gap: 22 },
            children: [
              {
                type: "div",
                props: {
                  style: { fontFamily: display, fontSize: titleSize, fontWeight: hi ? 600 : 500, lineHeight: 1.05, letterSpacing: hi ? 0 : -2, maxWidth: 1000, display: "flex" },
                  children: p.og.title,
                },
              },
              { type: "div", props: { style: { fontSize: 32, color: inkSoft, lineHeight: 1.3, display: "flex" }, children: p.og.subtitle } },
            ],
          },
        },
        {
          type: "div",
          props: {
            style: { display: "flex", alignItems: "center", gap: 14, borderTop: `1px solid ${rule}`, paddingTop: 22, fontSize: 24, color: muted },
            children: [
              { type: "span", props: { style: { width: 12, height: 12, borderRadius: 999, background: accent }, children: "" } },
              { type: "span", props: { children: hi ? "हर आँकड़ा स्रोत और तारीख़ के साथ · यूपी रेरा पंजीकृत ब्रोकर" : "Every figure sourced and dated · UP RERA-registered broker" } },
            ],
          },
        },
      ],
    },
  };
}

async function main() {
  const pages = getAllPages();
  let rendered = 0;
  let skipped = 0;
  const keep = new Set<string>();
  for (const p of pages) {
    const file = path.join(root, "public", p.ogPath);
    keep.add(file);
    if (fs.existsSync(file)) {
      skipped++;
      continue;
    }
    fs.mkdirSync(path.dirname(file), { recursive: true });
    // satori's element type is React-shaped; the plain object tree above matches it structurally.
    const svg = await satori(markup(p) as never, { width: W, height: H, fonts });
    const png = new Resvg(svg, { fitTo: { mode: "width", value: W } }).render().asPng();
    fs.writeFileSync(file, png);
    rendered++;
  }
  // Drop stale images from earlier titles so the export never carries orphans.
  let removed = 0;
  if (fs.existsSync(outDir)) {
    for (const locale of fs.readdirSync(outDir)) {
      const dir = path.join(outDir, locale);
      if (!fs.statSync(dir).isDirectory()) continue;
      for (const f of fs.readdirSync(dir)) {
        const full = path.join(dir, f);
        if (!keep.has(full)) {
          fs.unlinkSync(full);
          removed++;
        }
      }
    }
  }
  console.log(`ok   og images: ${rendered} rendered, ${skipped} unchanged, ${removed} stale removed (${pages.length} pages)`);
}

main().catch((e) => {
  console.error(`FAIL generate-og: ${(e as Error).stack ?? e}`);
  process.exit(1);
});

/**
 * XML sitemaps and llms.txt (spec "SEO and schema"): sitemap-index.xml → sitemap-en.xml,
 * sitemap-hi.xml, sitemap-updates.xml, lastmod from updatedAt. Served by the route handlers in
 * app/*.xml and app/llms.txt, prerendered at build. Localities that fail the thin-page guard are
 * not in lib/pages.ts, so they never reach a sitemap.
 */
import { SITE_URL } from "./i18n";
import { getIndexablePages as getPages, type PageEntry } from "./pages";

const getAllPages = () => [...getPages("en"), ...getPages("hi")];

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function urlset(pages: PageEntry[]): string {
  const rows = pages.map((p) => {
    const alts = [{ lang: p.locale === "en" ? "en-IN" : "hi-IN", href: p.url }];
    if (!p.alternate.missing) alts.push({ lang: p.locale === "en" ? "hi-IN" : "en-IN", href: `${SITE_URL}${p.alternate.href}` });
    const en = alts.find((a) => a.lang === "en-IN");
    if (en) alts.push({ lang: "x-default", href: en.href });
    const links = alts.map((a) => `    <xhtml:link rel="alternate" hreflang="${a.lang}" href="${esc(a.href)}"/>`).join("\n");
    return `  <url>\n    <loc>${esc(p.url)}</loc>\n    <lastmod>${p.lastmod}</lastmod>\n${links}\n  </url>`;
  });
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${rows.join("\n")}\n</urlset>\n`;
}

export const sitemapEn = () => urlset(getPages("en").filter((p) => p.kind !== "update"));
export const sitemapHi = () => urlset(getPages("hi").filter((p) => p.kind !== "update"));
export const sitemapUpdates = () => urlset(getAllPages().filter((p) => p.kind === "update"));

export function sitemapIndex(): string {
  const maps = [
    { file: "sitemap-en.xml", pages: getPages("en").filter((p) => p.kind !== "update") },
    { file: "sitemap-hi.xml", pages: getPages("hi").filter((p) => p.kind !== "update") },
    { file: "sitemap-updates.xml", pages: getAllPages().filter((p) => p.kind === "update") },
  ];
  const rows = maps.map((m) => {
    const lastmod = m.pages.map((p) => p.lastmod).sort().at(-1);
    return `  <sitemap>\n    <loc>${SITE_URL}/${m.file}</loc>${lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ""}\n  </sitemap>`;
  });
  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${rows.join("\n")}\n</sitemapindex>\n`;
}

export const robotsTxt = () => `User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: ${SITE_URL}/sitemap-index.xml\n`;

/** Plain index of the site for AI crawlers, regenerated at build. */
export function llmsTxt(): string {
  const kinds: { kind: PageEntry["kind"]; en: string; hi: string }[] = [
    { kind: "home", en: "Home", hi: "होम" },
    { kind: "city", en: "Cities", hi: "शहर" },
    { kind: "locality", en: "Localities", hi: "इलाक़े" },
    { kind: "circle-rates", en: "Circle rates", hi: "सर्किल रेट" },
    { kind: "rate-tehsil", en: "Circle rates by tehsil", hi: "तहसीलवार सर्किल रेट" },
    { kind: "rate-village", en: "Circle rates by village", hi: "गाँववार सर्किल रेट" },
    { kind: "project", en: "Government projects", hi: "सरकारी प्रोजेक्ट" },
    { kind: "guide", en: "Guides", hi: "गाइड" },
    { kind: "tool", en: "Tools", hi: "टूल्स" },
    { kind: "updates", en: "Updates", hi: "अपडेट" },
    { kind: "update", en: "Update entries", hi: "अपडेट एंट्री" },
    { kind: "about", en: "About", hi: "हमारे बारे में" },
  ];
  const lines: string[] = [
    "# Awadhland",
    "",
    "> Land in Ayodhya, Lucknow and Gorakhpur (Uttar Pradesh, India): circle rates, asking prices, distances, government projects and buying guides, every figure with a source and a date. English at the root, Hindi under /hi/. A UP RERA-registered broker answers on WhatsApp.",
    "",
    `Sitemap: ${SITE_URL}/sitemap-index.xml`,
    "",
  ];
  for (const locale of ["en", "hi"] as const) {
    lines.push(`## ${locale === "en" ? "English" : "Hindi (हिंदी)"}`, "");
    for (const k of kinds) {
      const pages = getPages(locale).filter((p) => p.kind === k.kind);
      if (pages.length === 0) continue;
      lines.push(`### ${locale === "en" ? k.en : k.hi}`, "");
      for (const p of pages) lines.push(`- [${p.title}](${p.url}): ${p.description}`);
      lines.push("");
    }
  }
  return `${lines.join("\n").trimEnd()}\n`;
}

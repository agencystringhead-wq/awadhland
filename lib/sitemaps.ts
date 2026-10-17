/**
 * XML sitemaps and llms.txt (spec "SEO and schema"): sitemap-index.xml → sitemap-en.xml,
 * sitemap-hi.xml, sitemap-updates.xml, lastmod from updatedAt. Served by the route handlers in
 * app/*.xml and app/llms.txt, prerendered at build. Localities that fail the thin-page guard are
 * not in lib/pages.ts, so they never reach a sitemap.
 */
import { getCities } from "./data";
import { entityDescription } from "./entity";
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

/**
 * Crawlers named explicitly so the intent is on the record: search engines, AI search and AI
 * assistants, and the user-triggered fetchers behind them. Everything public is allowed; /api/ holds
 * only form and feed endpoints. The crawlers share one group, so each gets the same rules (a bot
 * with its own group ignores the "*" group, so /api/ is repeated here rather than left to it).
 */
export const ALLOWED_CRAWLERS = [
  "Googlebot",
  "Bingbot",
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-SearchBot",
  "Claude-User",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "Applebot",
  "Applebot-Extended",
] as const;

export const robotsTxt = () =>
  [
    ...ALLOWED_CRAWLERS.map((bot) => `User-agent: ${bot}`),
    "Allow: /",
    "Disallow: /api/",
    "",
    "User-agent: *",
    "Allow: /",
    "Disallow: /api/",
    "",
    `Sitemap: ${SITE_URL}/sitemap-index.xml`,
    "",
  ].join("\n");

/**
 * llms.txt: a short markdown summary for AI systems (llmstxt.org shape): what AwadhLand is, the
 * cities, and the key pages in both languages. The complete page index is /llms-full.txt.
 */
export function llmsTxt(): string {
  const find = (locale: "en" | "hi", kind: PageEntry["kind"], sitePath?: string) =>
    getPages(locale).find((p) => p.kind === kind && (!sitePath || p.sitePath === sitePath));
  const cities = getCities();
  const bullet = (p: PageEntry | undefined, label: string, note: string) => (p ? `- [${label}](${p.url}): ${note}` : null);
  const section = (locale: "en" | "hi") => {
    const hi = locale === "hi";
    const cityLinks = cities.map((c) => bullet(find(locale, "city", `/${c.id}/`), hi ? c.nameHi : c.name, hi ? `${c.nameHi} में ज़मीन, सर्किल रेट और इलाक़े` : `Land, circle rates and localities in ${c.name}`));
    return [
      `## ${hi ? "हिंदी" : "English"}`,
      "",
      bullet(find(locale, "home"), hi ? "होम" : "Home", hi ? "अयोध्या, लखनऊ और गोरखपुर में ज़मीन" : "Land in Ayodhya, Lucknow and Gorakhpur"),
      bullet(find(locale, "about"), hi ? "हमारे बारे में" : "About", hi ? "AwadhLand क्या है, किसकी मदद करता है, संपर्क" : "What AwadhLand is, who it helps, how to contact it"),
      ...cityLinks,
      bullet(find(locale, "updates"), hi ? "अपडेट" : "Updates", hi ? "ज़मीन को हिलाने वाली हर सरकारी सूचना और रिपोर्ट" : "Government notices and market reports that move land in Awadh"),
      bullet(find(locale, "contact"), hi ? "संपर्क" : "Contact", hi ? "फ़ोन, व्हाट्सऐप और ईमेल" : "Phone, WhatsApp and email"),
      "",
    ].filter((l): l is string => l !== null);
  };
  return `${[
    "# AwadhLand",
    "",
    `> ${entityDescription.en}`,
    "",
    `Hindi: ${entityDescription.hi}`,
    "",
    "AwadhLand covers Ayodhya, Lucknow and Gorakhpur in Uttar Pradesh. Every rate, distance and project on the site carries its source and the date it was last updated. English pages are at the root, Hindi pages under /hi/.",
    "",
    ...section("en"),
    ...section("hi"),
    "## Optional",
    "",
    `- [Full page index](${SITE_URL}/llms-full.txt): every indexable page in both languages`,
    `- [Sitemap](${SITE_URL}/sitemap-index.xml)`,
    "",
  ].join("\n").trimEnd()}\n`;
}

/** The complete page index (the earlier llms.txt): every indexable page, both languages, with its description. */
export function llmsFullTxt(): string {
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
    { kind: "contact", en: "Contact", hi: "संपर्क" },
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

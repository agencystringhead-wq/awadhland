/**
 * Navigation model (Step 3): the eight tier-3 cells with their sublabels and the content of each
 * mega panel, assembled from the data loaders at build time per locale. Counts are computed, never
 * typed. The Header, MegaMenu, mobile menu and Footer all read from here.
 */
import { getBroker, getBuildableLocalities, getCities, getCurrentCircleRateSchedule, getProjects, getReviews, getUpdates } from "./data";
import { getGuides, heroImageSrc } from "./guides";
import { formatDate, formatNumber, localePath, pick, type Locale } from "./i18n";
import type { City, TeamMember } from "./schemas";
import { TOOL_SLUGS } from "./tools";
import { homeCopy, toolCopy } from "./content";
import { updateTypeLabels } from "@/components/UpdateRow";

export type NavLink = { label: string; href: string; meta?: string; chip?: string };
export type NavColumn = { title: string; links: NavLink[]; more?: NavLink };
export type NavImage = { src: string; alt: string; caption: string; href: string };

export type NavPanel =
  | { kind: "columns"; columns: NavColumn[]; image?: NavImage }
  | { kind: "tools"; tools: { href: string; title: string; body: string; slug: string }[]; more: string }
  | { kind: "about"; broker: Pick<TeamMember, "name" | "nameHi" | "reraNumber" | "reraUrl" | "photo" | "phone" | "whatsapp">; links: NavLink[] };

export type NavKey = string;

export type NavItem = {
  key: NavKey;
  label: string;
  sub: string;
  href: string;
  panel: NavPanel;
};

export type NavCopy = {
  strip: { taking: string; hours: string; sourced: string; rera: string; years: string };
  brand: { est: string; whatsappLabel: string; call: string; whatsapp: string; menu: string };
  cells: { localities: (n: number) => string; circleRates: string; circleRatesSub: (n: number) => string; guides: string; guidesSub: (n: number) => string; tools: string; toolsSub: string; updates: string; updatesSub: string; about: string; aboutSub: (first: string) => string };
  panel: { top: string; byArea: string; projectsRates: string; all: (n: number) => string; seeAll: string; allProjects: string; circleRatesOf: (c: string) => string; fullTable: string; calculator: string; revisions: string; how: string; effective: string; buying: string; legal: string; investment: string; allGuides: string; tryIt: string; allUpdates: string; byCity: string; byType: string; methodology: string; howWeWork: string; reviews: string; contact: string; updated: string };
};

export const navCopy: Record<Locale, NavCopy> = {
  en: {
    strip: { taking: "Taking enquiries · replies within the hour", hours: "Mon–Sat 9a–7p IST", sourced: "Every rate sourced, every page dated", rera: "UP RERA registered", years: "years" },
    brand: { est: "EST · AYODHYA · UP", whatsappLabel: "WhatsApp · replies within the hour", call: "Call", whatsapp: "WhatsApp →", menu: "Menu" },
    cells: {
      localities: (n) => `${n} ${n === 1 ? "locality" : "localities"}`,
      circleRates: "Circle rates",
      circleRatesSub: (n) => `${n} ${n === 1 ? "city" : "cities"}, sourced`,
      guides: "Guides",
      guidesSub: (n) => `${n} written`,
      tools: "Tools",
      toolsSub: "Free, no signup",
      updates: "Updates",
      updatesSub: "Every notice",
      about: "About",
      aboutSub: (first) => `Meet ${first}`,
    },
    panel: {
      top: "Top localities",
      byArea: "By area",
      projectsRates: "Projects & rates",
      all: (n) => `All ${n} localities →`,
      seeAll: "See all →",
      allProjects: "All projects →",
      circleRatesOf: (c) => `Circle rates ${c}`,
      fullTable: "Full table",
      calculator: "Stamp duty calculator",
      revisions: "Revision history",
      how: "How circle rates work",
      effective: "Effective",
      buying: "Buying",
      legal: "Legal & checks",
      investment: "Investment & comparison",
      allGuides: "All guides →",
      tryIt: "Try it →",
      allUpdates: "All updates →",
      byCity: "By city",
      byType: "By type",
      methodology: "Methodology",
      howWeWork: "How we work",
      reviews: "Reviews",
      contact: "Contact",
      updated: "updated",
    },
  },
  hi: {
    strip: { taking: "पूछताछ जारी · एक घंटे में जवाब", hours: "सोम–शनि 9–7 (IST)", sourced: "हर रेट का स्रोत, हर पेज की तारीख़", rera: "यूपी रेरा पंजीकृत", years: "वर्ष" },
    brand: { est: "स्थापित · अयोध्या · यूपी", whatsappLabel: "व्हाट्सऐप · एक घंटे में जवाब", call: "कॉल", whatsapp: "व्हाट्सऐप →", menu: "मेन्यू" },
    cells: {
      localities: (n) => `${n} इलाक़े`,
      circleRates: "सर्किल रेट",
      circleRatesSub: (n) => `${n} शहर, स्रोत सहित`,
      guides: "गाइड",
      guidesSub: (n) => `${n} लिखी`,
      tools: "टूल्स",
      toolsSub: "मुफ़्त, बिना साइनअप",
      updates: "अपडेट",
      updatesSub: "हर सूचना",
      about: "हमारे बारे में",
      aboutSub: (first) => `${first} से मिलें`,
    },
    panel: {
      top: "प्रमुख इलाक़े",
      byArea: "क्षेत्र के अनुसार",
      projectsRates: "प्रोजेक्ट और रेट",
      all: (n) => `सभी ${n} इलाक़े →`,
      seeAll: "सभी देखें →",
      allProjects: "सभी प्रोजेक्ट →",
      circleRatesOf: (c) => `${c} सर्किल रेट`,
      fullTable: "पूरी सूची",
      calculator: "स्टाम्प ड्यूटी कैलकुलेटर",
      revisions: "संशोधन इतिहास",
      how: "सर्किल रेट कैसे काम करता है",
      effective: "लागू",
      buying: "ख़रीदना",
      legal: "क़ानूनी और जाँच",
      investment: "निवेश और तुलना",
      allGuides: "सभी गाइड →",
      tryIt: "आज़माएँ →",
      allUpdates: "सभी अपडेट →",
      byCity: "शहर से",
      byType: "प्रकार से",
      methodology: "पद्धति",
      howWeWork: "हम कैसे काम करते हैं",
      reviews: "समीक्षाएँ",
      contact: "संपर्क",
      updated: "अपडेट",
    },
  },
};

/** Guide tags → the three panel columns. Unknown tags fall into Buying. */
const GUIDE_GROUPS: { key: "buying" | "legal" | "investment"; tags: string[] }[] = [
  { key: "buying", tags: ["buying-process", "first-plot", "nri", "conversion"] },
  { key: "investment", tags: ["investment", "comparison", "master-plan", "commercial"] },
  { key: "legal", tags: ["legal-checks", "fraud", "registry", "rera", "power-of-attorney"] },
];

const cache = new Map<Locale, NavItem[]>();

export function getNav(locale: Locale): NavItem[] {
  const hit = cache.get(locale);
  if (hit) return hit;
  const c = navCopy[locale];
  const cities = getCities();
  const built = getBuildableLocalities(locale).buildable;
  const projects = getProjects();
  const guides = getGuides(locale);
  const updates = getUpdates();
  const broker = getBroker();
  const p = (path: string) => localePath(locale, path);
  const items: NavItem[] = [];

  /* City cells */
  for (const city of cities) {
    const name = pick(locale, city.name, city.nameHi);
    const ls = built.filter((l) => l.cityId === city.id);
    const top = [...ls].sort((a, b) => (b.score ?? 0) - (a.score ?? 0)).slice(0, 8);
    const byArea = new Map<string, typeof ls>();
    for (const l of ls) byArea.set(l.tehsil ?? "—", [...(byArea.get(l.tehsil ?? "—") ?? []), l]);
    const areaLinks: NavLink[] = [];
    for (const [tehsil, list] of [...byArea.entries()].sort((a, b) => b[1].length - a[1].length)) {
      for (const l of list.slice(0, 4)) areaLinks.push({ label: pick(locale, l.name, l.nameHi), href: p(`/${city.id}/${l.id}/`), meta: tehsil });
      if (areaLinks.length >= 10) break;
    }
    const cityProjects = projects.filter((x) => x.cityId === city.id).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 5);
    const ranges = ls.flatMap((l) => (l.askingRange ? [l.askingRange] : []));
    const range = ranges.length ? `₹${formatNumber(Math.min(...ranges.map((r) => r.low)))}–${formatNumber(Math.max(...ranges.map((r) => r.high)))}` : null;
    const lastmod = [city.updatedAt, ...ls.map((l) => l.updatedAt)].sort().at(-1)!;
    items.push({
      key: city.id,
      label: name,
      sub: c.cells.localities(ls.length),
      href: p(`/${city.id}/`),
      panel: {
        kind: "columns",
        columns: [
          {
            title: c.panel.top,
            links: top.map((l) => ({ label: pick(locale, l.name, l.nameHi), href: p(`/${city.id}/${l.id}/`), chip: l.score !== undefined ? String(l.score) : undefined })),
            more: { label: c.panel.all(ls.length), href: p(`/${city.id}/`) },
          },
          { title: c.panel.byArea, links: areaLinks.slice(0, 10), more: { label: c.panel.seeAll, href: p(`/${city.id}/`) } },
          {
            title: c.panel.projectsRates,
            links: [
              { label: c.panel.circleRatesOf(name), href: p(`/${city.id}/circle-rates/`) },
              ...cityProjects.map((x) => ({ label: pick(locale, x.name, x.nameHi), href: p(`/projects/${x.id}/`), meta: x.status.replace(/-/g, " ") })),
            ],
            more: { label: c.panel.allProjects, href: p(`/${city.id}/`) },
          },
        ],
        image: {
          src: `/images/cities/${city.id}.webp`,
          alt: name,
          caption: `${range ? `${range} ${locale === "hi" ? "प्रति वर्ग फ़ुट" : "per sq ft"} · ` : ""}${c.cells.localities(ls.length)} · ${c.panel.updated} ${formatDate(lastmod, locale)}`,
          href: p(`/${city.id}/`),
        },
      },
    });
  }

  /* Circle rates */
  const withSchedule = cities.flatMap((city) => {
    const s = getCurrentCircleRateSchedule(city.id);
    return s ? [{ city, s }] : [];
  });
  items.push({
    key: "circle-rates",
    label: c.cells.circleRates,
    sub: c.cells.circleRatesSub(withSchedule.length),
    href: p(`/${cities[0]?.id ?? "ayodhya"}/circle-rates/`),
    panel: {
      kind: "columns",
      columns: withSchedule.map(({ city, s }) => ({
        title: pick(locale, city.name, city.nameHi),
        links: [
          { label: c.panel.fullTable, href: p(`/${city.id}/circle-rates/`), meta: `${c.panel.effective} ${formatDate(s.effectiveFrom, locale)}` },
          { label: c.panel.calculator, href: `${p(`/${city.id}/circle-rates/`)}#stamp-duty` },
          { label: c.panel.revisions, href: `${p(`/${city.id}/circle-rates/`)}#revisions` },
          { label: c.panel.how, href: `${p(`/${city.id}/circle-rates/`)}#how` },
        ],
      })),
    },
  });

  /* Guides */
  const grouped = { buying: [] as typeof guides, legal: [] as typeof guides, investment: [] as typeof guides };
  for (const g of guides) {
    const group = GUIDE_GROUPS.find((gr) => g.frontmatter.tags.some((t) => gr.tags.includes(t)))?.key ?? "buying";
    grouped[group].push(g);
  }
  const guideLink = (g: (typeof guides)[number]): NavLink => ({ label: g.frontmatter.title, href: p(`/guides/${g.frontmatter.slug}/`), meta: `${g.readTimeMin} ${locale === "hi" ? "मिनट" : "min"}` });
  const latest = guides[0];
  const guideColumns: NavColumn[] = [
    { title: c.panel.buying, links: grouped.buying.slice(0, 6).map(guideLink) },
    { title: c.panel.legal, links: grouped.legal.slice(0, 6).map(guideLink) },
    { title: c.panel.investment, links: grouped.investment.slice(0, 6).map(guideLink) },
  ].filter((col) => col.links.length > 0);
  if (guideColumns.length > 0) guideColumns[guideColumns.length - 1].more = { label: c.panel.allGuides, href: `${p("/")}#guides` };
  items.push({
    key: "guides",
    label: c.cells.guides,
    sub: c.cells.guidesSub(guides.length),
    href: `${p("/")}#guides`,
    panel: {
      kind: "columns",
      columns: guideColumns,
      image: latest && heroImageSrc(latest.frontmatter.heroImage)
        ? {
            src: heroImageSrc(latest.frontmatter.heroImage)!,
            alt: latest.frontmatter.title,
            caption: `${latest.frontmatter.title} · ${formatDate(latest.frontmatter.updatedAt, locale)}`,
            href: p(`/guides/${latest.frontmatter.slug}/`),
          }
        : undefined,
    },
  });

  /* Tools */
  const toolCards = homeCopy[locale].tools.map((t) => ({
    slug: t.slug,
    title: (TOOL_SLUGS as readonly string[]).includes(t.slug) ? toolCopy[locale][t.slug as (typeof TOOL_SLUGS)[number]].title : t.title,
    body: t.body,
    href: p(`/tools/${t.slug}/`),
  }));
  items.push({ key: "tools", label: c.cells.tools, sub: c.cells.toolsSub, href: `${p("/")}#tools`, panel: { kind: "tools", tools: toolCards, more: c.panel.tryIt } });

  /* Updates */
  const types = [...new Set(updates.map((u) => u.type))];
  items.push({
    key: "updates",
    label: c.cells.updates,
    sub: c.cells.updatesSub,
    href: p("/updates/"),
    panel: {
      kind: "columns",
      columns: [
        {
          title: c.cells.updates,
          links: updates.slice(0, 6).map((u) => ({
            label: pick(locale, u.title, u.titleHi),
            href: p(`/updates/${u.id}/`),
            meta: formatDate(u.date, locale),
            chip: u.agency === "other" ? u.agencyName : u.agency,
          })),
          more: { label: c.panel.allUpdates, href: p("/updates/") },
        },
        { title: c.panel.byCity, links: cities.map((city) => ({ label: pick(locale, city.name, city.nameHi), href: `${p("/updates/")}?city=${city.id}` })) },
        { title: c.panel.byType, links: types.map((t) => ({ label: updateTypeLabels[t][locale], href: `${p("/updates/")}?type=${t}` })) },
      ],
    },
  });

  /* About */
  const first = pick(locale, broker.name, broker.nameHi).split(" ")[0];
  items.push({
    key: "about",
    label: c.cells.about,
    sub: c.cells.aboutSub(first),
    href: p("/about/"),
    panel: {
      kind: "about",
      broker,
      links: [
        { label: c.panel.methodology, href: p("/methodology/") },
        { label: c.panel.howWeWork, href: `${p("/about/")}#how-we-work` },
        { label: c.panel.reviews, href: `${p("/about/")}#reviews`, meta: `${getReviews().rating.toFixed(1)} ★` },
        { label: c.panel.contact, href: p("/contact/") },
      ],
    },
  });

  cache.set(locale, items);
  return items;
}

/** Which cell is active for a site path (no locale prefix), for aria-current on the tile. */
export function activeNavKey(sitePath: string, cities: Pick<City, "id">[], projectCityById: (id: string) => string | undefined): NavKey | undefined {
  const [first, second] = sitePath.split("/").filter(Boolean);
  if (!first) return undefined;
  if (cities.some((c) => c.id === first)) return second === "circle-rates" ? "circle-rates" : first;
  if (first === "projects" && second) return projectCityById(second);
  if (["guides", "tools", "updates", "about"].includes(first)) return first;
  return undefined;
}

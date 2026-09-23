/**
 * Written page content for every row of the Ayodhya 2025 rate list.
 *
 * content/villages/village-content-ayodhya-2025-06-07/ holds one record per rate row: the slug and
 * English name, and an `en` / `hi` block of title, meta description, h1, lede, rate paragraphs,
 * worked plot examples, rules, FAQ and source line. Every figure in it was checked against the row
 * it describes before this was wired — the opening land rate, shop, office, godown and
 * agricultural figures all match across 1,630 records, and `agriText` is present exactly when the
 * row carries an agricultural rate.
 *
 * Two things the content and the rate file disagree about, both handled here rather than pushed
 * onto callers:
 *
 * - Slugs. The content carries a hand-checked romanisation, and it wins over the transliteration
 *   lib/devanagari.ts produced at import. Where they differ the old URL gets a redirect
 *   (scripts/build-village-redirects.ts), so nothing that was linked breaks.
 * - Road segment ids. The content numbers segments `<sro>-p<page>-<index>` while the rate file
 *   keys them per segment and village. They map by (sro, page, index of the distinct segment on
 *   that page): 84 of the 85 ids the content uses resolve that way. The one that does not,
 *   sadar-p70-3, points past the end of a page that carries two segments; its village keeps the
 *   four links that do resolve. Unresolvable ids are dropped rather than linked, so a mismatch
 *   can never become a dead link.
 */
import content from "../content/villages/village-content-ayodhya-2025-06-07/ayodhya-villages-2025-06-07.json";
import indexable from "../content/villages/village-content-ayodhya-2025-06-07/indexable.json";
import schedule from "../data/rates/ayodhya-2025-06-07.json";
import type { Locale } from "./schemas";

export type VillageFaq = { q: string; a: string };
export type PlotExample = { label: string; narrow: string; wide: string };

export type VillageCopy = {
  title: string;
  metaDescription: string;
  h1: string;
  lede: string;
  ratesText: string[];
  commercialText: string;
  agriText: string | null;
  plotExamples: PlotExample[];
  plotExamplesNote: string;
  roadSegmentsText: string | null;
  rulesText: string[];
  faq: VillageFaq[];
  sourceLine: string;
};

export type VillageContent = {
  rateRowId: string;
  sro: string;
  slug: string;
  nameEn: string;
  nameHi: string;
  category: string;
  roadSegmentIds: string[];
  rankInTehsil: number;
  tehsilCount: number;
  en: VillageCopy;
  hi: VillageCopy;
};

const villages = content.villages as unknown as VillageContent[];

const byRowId = new Map(villages.map((v) => [v.rateRowId, v]));
const indexableIds = new Set((indexable as { rateRowIds: string[] }).rateRowIds);

export const getVillageContent = (rateRowId: string) => byRowId.get(rateRowId);
export const getAllVillageContent = () => villages;
export const villageContentIndexableIds = () => indexableIds;
export const villageCopy = (v: VillageContent, locale: Locale): VillageCopy => (locale === "hi" ? v.hi : v.en);

/**
 * The content's segment ids resolved against the rate file, per row.
 *
 * Built once: for each (sro, page) the distinct segments in file order, so the content's index
 * into that page picks the same stretch. The value is the set of rate-file segment row ids that
 * belong to it, which is what a link on the tehsil page needs.
 */
const segmentsByContentId = (() => {
  const map = new Map<string, string[]>();
  const pages = new Map<string, { segmentHi: string; rowIds: string[] }[]>();
  const segments = schedule.roadSegments as { id: string; sro: string; page: string; segmentHi: string }[];
  for (const s of segments) {
    const key = `${s.sro}-p${s.page}`;
    if (!pages.has(key)) pages.set(key, []);
    const onPage = pages.get(key)!;
    let entry = onPage.find((x) => x.segmentHi === s.segmentHi);
    if (!entry) {
      entry = { segmentHi: s.segmentHi, rowIds: [] };
      onPage.push(entry);
    }
    entry.rowIds.push(s.id);
  }
  for (const [key, onPage] of pages) {
    onPage.forEach((entry, i) => map.set(`${key}-${i}`, entry.rowIds));
  }
  return map;
})();

/** Rate-file segment row ids for a village, skipping content ids that do not resolve. */
export function resolvedSegmentIds(v: VillageContent): string[] {
  return [...new Set(v.roadSegmentIds.flatMap((id) => segmentsByContentId.get(id) ?? []))];
}

/** Content ids that point at no segment in the rate file, for the build-time report. */
export function unresolvedSegmentIds(): string[] {
  const all = new Set(villages.flatMap((v) => v.roadSegmentIds));
  return [...all].filter((id) => !segmentsByContentId.has(id));
}

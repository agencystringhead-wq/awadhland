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
 * - Road segment ids. The content writes them `<sro>-p<page>-<n>`, where n is the ordinal of the
 *   stretch among the ones that village appears in — not an index into the page. Chowk's ids run
 *   p67-0, p67-1, p68-2, p70-3, p75-4: the counter climbs across pages, which is what gives the
 *   scheme away. So they are not a mapping to resolve. The rate file already records which village
 *   each segment row belongs to, and the ids restate it.
 *
 *   What they are good for is checking that restatement. checkSegmentAgreement() confirms that for
 *   every village the count, the order and the printed page all match what we transcribed; all 214
 *   agree, which is independent confirmation of the segment side of the transcription.
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

/** Segment rows per village, from the rate file's own rateRowId — the relationship the ids restate. */
const segmentsByRow = (() => {
  const map = new Map<string, { id: string; page: string }[]>();
  const segments = schedule.roadSegments as { id: string; rateRowId: string | null; page: string }[];
  for (const s of segments) {
    if (!s.rateRowId) continue;
    if (!map.has(s.rateRowId)) map.set(s.rateRowId, []);
    map.get(s.rateRowId)!.push({ id: s.id, page: s.page });
  }
  return map;
})();

/**
 * Where the content's segment ids disagree with the transcribed rate file.
 *
 * Each id encodes the village's nth stretch and the page it was printed on, so the count, the
 * order and the page are all checkable against what we transcribed. A disagreement means one of
 * the two is wrong about the source and is worth a person looking, which is why validate reports
 * it rather than the site quietly rendering one reading or the other.
 */
export function checkSegmentAgreement(): string[] {
  const problems: string[] = [];
  for (const v of villages) {
    const ids = v.roadSegmentIds;
    if (ids.length === 0) continue;
    const ours = segmentsByRow.get(v.rateRowId) ?? [];
    if (ours.length !== ids.length) {
      problems.push(`${v.rateRowId} (${v.nameEn}): content names ${ids.length} stretch(es), the rate file has ${ours.length}`);
      continue;
    }
    ids.forEach((id, k) => {
      const m = /^(.+)-p(.+)-(\d+)$/.exec(id);
      if (!m) {
        problems.push(`${v.rateRowId}: segment id "${id}" is not <sro>-p<page>-<n>`);
        return;
      }
      if (m[2] !== String(ours[k].page) || Number(m[3]) !== k) {
        problems.push(`${v.rateRowId}: ${id} vs transcribed stretch ${k} on page ${ours[k].page}`);
      }
    });
  }
  return problems;
}

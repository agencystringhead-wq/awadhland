/**
 * Tool registry (spec Template 7) and the build-time data each tool's client component receives.
 * A tool is listed here only once it exists; the homepage links to the spec's four slugs, and
 * links to unbuilt tools stay 404 until their step lands.
 */
import { getBuildableLocalities, getCities, getCurrentCircleRateSchedule, getLocalitiesByCity, getStampDutyRules } from "./data";
import { localePath, pick, type Locale } from "./i18n";
import { frontageChunkPath, getFrontageCities, getFrontageOnlySros, getFrontageVillages, glossNote, isAllAbadi } from "./frontage";
import { getTehsil } from "./rates";
import type { StampDutyRule } from "./schemas";

export const TOOL_SLUGS = ["stamp-duty-calculator", "khasra-frontage-check", "circle-rate-lookup", "plot-yield-calculator"] as const;
export type ToolSlug = (typeof TOOL_SLUGS)[number];

export const isToolSlug = (s: string): s is ToolSlug => (TOOL_SLUGS as readonly string[]).includes(s);

/**
 * Where a homepage / Tools-menu card links, as a site path, or null while the tool is unbuilt.
 * The land safety checklist is a guide page with a download rather than a tool
 * (/guides/land-safety-checklist/), so its card points there.
 */
export function toolCardPath(slug: string): string | null {
  if (isToolSlug(slug)) return `/tools/${slug}/`;
  if (slug === "land-safety-checklist") return "/guides/land-safety-checklist/";
  return null;
}

/* --------------------------------------------------- stamp duty calculator */

export type CalculatorLocality = {
  id: string;
  name: string;
  tehsil: string;
  residential: number;
  commercial: number;
  agricultural: number;
  /** locality page in this locale, or null when the locality is not built */
  href: string | null;
};

export type CalculatorCity = {
  id: string;
  name: string;
  effectiveFrom: string;
  sourceUrl: string;
  circleRatesHref: string;
  localities: CalculatorLocality[];
};

export type StampDutyCalculatorData = { cities: CalculatorCity[]; rules: StampDutyRule[] };

/** Current schedule per city with display names, for the client calculator. Cities without a schedule are omitted. */
export function stampDutyCalculatorData(locale: Locale, cityId?: string): StampDutyCalculatorData {
  const built = new Set(getBuildableLocalities(locale).buildable.map((l) => l.id));
  const cities = getCities()
    .filter((c) => !cityId || c.id === cityId)
    .flatMap((c) => {
      const schedule = getCurrentCircleRateSchedule(c.id);
      if (!schedule) return [];
      const names = Object.fromEntries(getLocalitiesByCity(c.id).map((l) => [l.id, pick(locale, l.name, l.nameHi)]));
      const localities: CalculatorLocality[] = schedule.rates
        .map((r) => ({
          id: r.localityId,
          name: names[r.localityId] ?? r.localityId,
          tehsil: r.tehsil,
          residential: r.residential,
          commercial: r.commercial,
          agricultural: r.agricultural,
          href: built.has(r.localityId) ? localePath(locale, `/${c.id}/${r.localityId}/`) : null,
        }))
        .sort((a, b) => a.name.localeCompare(b.name, locale));
      return [
        {
          id: c.id,
          name: pick(locale, c.name, c.nameHi),
          effectiveFrom: schedule.effectiveFrom,
          sourceUrl: schedule.sourceUrl,
          circleRatesHref: localePath(locale, `/${c.id}/circle-rates/`),
          localities,
        },
      ];
    });
  return { cities, rules: getStampDutyRules() };
}

/* ------------------------------------------------- khasra frontage check */

export type FrontageCheckVillage = {
  slug: string;
  /** name in this locale, then the other script */
  name: string;
  other: string;
  /** village page in this locale */
  href: string;
  /** per-village chunk, public/frontage/… */
  chunk: string;
  /** the list says almost every plot has abadi around it */
  allAbadi: boolean;
  /** the list's remarks, printed Hindi, with an English gloss where one is known */
  notes: { hi: string; en: string | null }[];
};

export type FrontageCheckSro = { id: string; name: string; href: string; villages: FrontageCheckVillage[] };
export type FrontageCheckCity = { id: string; name: string; sros: FrontageCheckSro[] };
export type FrontageCheckData = { cities: FrontageCheckCity[] };

export const FRONTAGE_TOOL_SLUG = "khasra-frontage-check" satisfies ToolSlug;

/** The tool's own URL, optionally preselecting an SRO and village (read client-side from the query). */
export const frontageToolHref = (locale: Locale, sro?: string, village?: string) =>
  `${localePath(locale, `/tools/${FRONTAGE_TOOL_SLUG}/`)}${sro ? `?sro=${sro}${village ? `&village=${village}` : ""}` : ""}`;

/**
 * Village lists for the tool's two pickers: 465 names and slugs, a few KB. The khasra numbers
 * themselves are never in here; the tool fetches one village's chunk when it is picked.
 */
export function frontageCheckData(locale: Locale): FrontageCheckData {
  const cities = getCities().filter((c) => getFrontageCities().includes(c.id));
  return {
    cities: cities.map((c) => ({
      id: c.id,
      name: pick(locale, c.name, c.nameHi),
      sros: getFrontageOnlySros(c.id).map((sro) => {
        const t = getTehsil(c.id, sro)!;
        return {
          id: sro,
          name: pick(locale, t.name, t.nameHi),
          href: localePath(locale, `/${c.id}/circle-rates/${sro}/`),
          villages: getFrontageVillages(c.id, sro)
            .map((v) => ({
              slug: v.slug,
              name: pick(locale, v.nameEn, v.nameHi),
              other: pick(locale, v.nameHi, v.nameEn),
              href: localePath(locale, `/${c.id}/circle-rates/${sro}/${v.slug}/`),
              chunk: frontageChunkPath(c.id, sro, v.slug),
              allAbadi: isAllAbadi(v),
              notes: v.notesHi.map((hi) => ({ hi, en: locale === "en" ? glossNote(hi) : null })),
            }))
            .sort((a, b) => a.name.localeCompare(b.name, locale)),
        };
      }),
    })),
  };
}

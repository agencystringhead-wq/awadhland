/**
 * Tool registry (spec Template 7) and the build-time data each tool's client component receives.
 * A tool is listed here only once it exists; the homepage links to the spec's four slugs, and
 * links to unbuilt tools stay 404 until their step lands.
 */
import { getBuildableLocalities, getCities, getCurrentCircleRateSchedule, getLocalitiesByCity, getStampDutyRules } from "./data";
import { localePath, pick, type Locale } from "./i18n";
import type { StampDutyRule } from "./schemas";

export const TOOL_SLUGS = ["stamp-duty-calculator"] as const;
export type ToolSlug = (typeof TOOL_SLUGS)[number];

export const isToolSlug = (s: string): s is ToolSlug => (TOOL_SLUGS as readonly string[]).includes(s);

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

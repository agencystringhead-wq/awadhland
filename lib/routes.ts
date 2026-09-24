/**
 * generateStaticParams sources and cross-tree links. Both route trees call these with their
 * own locale, so /app/(en) and /app/hi always build from the same rules.
 */
import { getAllCircleRateSchedules, getBrokerRecord, getBuildableLocalities, getBuildableProjects, getCircleRateSchedules, getCities, getUpdates } from "./data";
import { logBrokerPlaceholders, logSkippedLocalities, logSkippedProjects, logWithheldSchedules } from "./guards";
import { logScoreCoverage } from "./scoring";
import { getGuides } from "./guides";
import { getCitiesWithRateList, getRowsByTehsil, getTehsilsByCity } from "./rates";
import { getFrontageCities, getFrontageOnlySros, getFrontageVillages } from "./frontage";
import { localePath, otherLocale, type Locale } from "./i18n";
import { TOOL_SLUGS } from "./tools";

/**
 * With output: 'export', Next fails an empty generateStaticParams with a misleading
 * "missing generateStaticParams()" error. Fail with the real reason instead of shipping a placeholder page.
 */
function nonEmpty<T>(route: string, params: T[]): T[] {
  if (params.length === 0) {
    throw new Error(
      `${route} has no pages to build: every record was filtered out or none exist. ` +
        `Add at least one complete record, or remove the route until content exists.`,
    );
  }
  return params;
}

export const cityParams = () =>
  nonEmpty(
    "/[city]/",
    getCities().map((c) => ({ city: c.id })),
  );

/** Applies the thin-page guard and logs skipped ids for this locale. */
export function localityParams(locale: Locale) {
  const { buildable, skipped } = getBuildableLocalities(locale);
  logSkippedLocalities(locale, skipped);
  logScoreCoverage(buildable);
  return nonEmpty(
    `${localePath(locale, "/")}[city]/[locality]/ (thin-page guard)`,
    buildable.map((l) => ({ city: l.cityId, locality: l.id })),
  );
}

/**
 * Cities with a sourced locality-level schedule, or a transcribed मूल्यांकन सूची, or both.
 *
 * Lucknow has only the second: its circleRates.json entry is seed data and withheld, while its
 * 1,449 transcribed rows are real. Keying this on the narrow schedule alone would drop the hub and
 * orphan every Lucknow village page under it. Must stay in step with the same condition in
 * lib/pages.ts, or the page is linked and not built.
 */
export const circleRateParams = () =>
  nonEmpty(
    "/[city]/circle-rates/",
    [...new Set([...getCircleRateSchedules().map((s) => s.cityId), ...getCitiesWithRateList()])].map((city) => ({ city })),
  );

/**
 * /[city]/circle-rates/[tehsil]/ — one per tehsil that has rows in the current schedule, plus one
 * per SRO that has only a khasra frontage list so far.
 */
export const rateTehsilParams = () =>
  nonEmpty(
    "/[city]/circle-rates/[tehsil]/",
    getCitiesWithRateList().flatMap((city) =>
      getTehsilsByCity(city)
        .filter((t) => getRowsByTehsil(city, t.id).length > 0)
        .map((t) => ({ city, tehsil: t.id })),
    ).concat(
      // SROs whose rate list has not arrived but whose khasra frontage list has: a village index.
      getFrontageCities().flatMap((city) => getFrontageOnlySros(city).map((tehsil) => ({ city, tehsil }))),
    ),
  );

/**
 * /[city]/circle-rates/[tehsil]/[village]/ — one per row of the published list. All of them
 * build; whether each is indexable is decided in lib/pages.ts, not here.
 */
export const rateVillageParams = () =>
  nonEmpty(
    "/[city]/circle-rates/[tehsil]/[village]/",
    getCitiesWithRateList().flatMap((city) =>
      getTehsilsByCity(city).flatMap((t) => getRowsByTehsil(city, t.id).map((r) => ({ city, tehsil: t.id, village: r.slug }))),
    ).concat(
      // Villages known only from a frontage list: same URL the rate row will take when it lands.
      getFrontageCities().flatMap((city) =>
        getFrontageOnlySros(city).flatMap((tehsil) => getFrontageVillages(city, tehsil).map((v) => ({ city, tehsil, village: v.slug }))),
      ),
    ),
  );

/** Only projects backed by a real notification; the rest keep their record but no page. */
export const projectParams = () => {
  const { buildable, skipped } = getBuildableProjects();
  logSkippedProjects(skipped);
  logBrokerPlaceholders(getBrokerRecord());
  logWithheldSchedules(getAllCircleRateSchedules());
  return nonEmpty(
    "/projects/[slug]/ (source guard)",
    buildable.map((p) => ({ slug: p.id })),
  );
};

export const guideParams = (locale: Locale) =>
  nonEmpty(
    `${localePath(locale, "/")}guides/[slug]/`,
    getGuides(locale).map((g) => ({ slug: g.frontmatter.slug })),
  );

export const toolParams = () =>
  nonEmpty(
    "/tools/[slug]/",
    TOOL_SLUGS.map((slug) => ({ slug })),
  );

export const updateParams = () =>
  nonEmpty(
    "/updates/[slug]/",
    getUpdates().map((u) => ({ slug: u.id })),
  );

/** Ids of localities that have a page in this locale. */
export const builtLocalityIds = (locale: Locale) => new Set(getBuildableLocalities(locale).buildable.map((l) => l.id));

export type Alternate = { href: string; missing: boolean };

/** Same path in the other tree. For pages that exist in both trees whenever they exist in one. */
export const sameAlternate = (locale: Locale, path: string): Alternate => ({
  href: localePath(otherLocale(locale), path),
  missing: false,
});

/** Locality pages can exist in one tree only (Hindi guard is stricter). Falls back to the other tree's city hub. */
export function localityAlternate(locale: Locale, cityId: string, localityId: string): Alternate {
  const other = otherLocale(locale);
  return builtLocalityIds(other).has(localityId)
    ? { href: localePath(other, `/${cityId}/${localityId}/`), missing: false }
    : { href: localePath(other, `/${cityId}/`), missing: true };
}

/** Guides pair by pairedSlug. Falls back to the other tree's first tagged city hub, or its home. */
export function guideAlternate(locale: Locale, pairedSlug: string | null, cityIds: string[]): Alternate {
  const other = otherLocale(locale);
  if (pairedSlug && getGuides(other).some((g) => g.frontmatter.slug === pairedSlug)) {
    return { href: localePath(other, `/guides/${pairedSlug}/`), missing: false };
  }
  return { href: localePath(other, cityIds[0] ? `/${cityIds[0]}/` : "/"), missing: true };
}

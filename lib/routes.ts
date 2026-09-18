/**
 * generateStaticParams sources and cross-tree links. Both route trees call these with their
 * own locale, so /app/(en) and /app/hi always build from the same rules.
 */
import { getBuildableLocalities, getCircleRateSchedules, getCities, getProjects, getUpdates } from "./data";
import { logSkippedLocalities } from "./guards";
import { getGuides } from "./guides";
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
  return nonEmpty(
    `${localePath(locale, "/")}[city]/[locality]/ (thin-page guard)`,
    buildable.map((l) => ({ city: l.cityId, locality: l.id })),
  );
}

export const circleRateParams = () =>
  nonEmpty(
    "/[city]/circle-rates/",
    [...new Set(getCircleRateSchedules().map((s) => s.cityId))].map((city) => ({ city })),
  );

export const projectParams = () =>
  nonEmpty(
    "/projects/[slug]/",
    getProjects().map((p) => ({ slug: p.id })),
  );

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

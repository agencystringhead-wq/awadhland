/**
 * Thin-page guard, docs/BUILD-SPEC.md Template 3 rules.
 *
 * Minimum field set for a locality page: name, city, lat/lng, circle rate, land use,
 * at least one narrative paragraph. Records missing any of these are excluded from
 * generateStaticParams and (from step 6) the sitemap. The skipped ids are logged at build.
 *
 * Hindi pages additionally need nameHi and at least one Hindi narrative paragraph,
 * because the Hindi template reads those fields and must not fall back to English copy.
 */
import type { Locale, Locality } from "./schemas";

export function missingMinimumFields(l: Locality, locale: Locale): string[] {
  const missing: string[] = [];
  if (!l.name) missing.push("name");
  if (!l.cityId) missing.push("cityId");
  if (l.lat === undefined || l.lng === undefined) missing.push("lat/lng");
  if (!l.circleRate) missing.push("circleRate");
  if (!l.landUse) missing.push("landUse");
  if (!l.narrative || l.narrative.drivers.length === 0) missing.push("narrative.drivers");
  if (locale === "hi") {
    if (!l.nameHi) missing.push("nameHi");
    if (!l.narrative?.driversHi || l.narrative.driversHi.length === 0) missing.push("narrative.driversHi");
  }
  return missing;
}

export function partitionLocalities(localities: Locality[], locale: Locale) {
  const buildable: Locality[] = [];
  const skipped: { id: string; missing: string[] }[] = [];
  for (const l of localities) {
    const missing = missingMinimumFields(l, locale);
    if (missing.length === 0) buildable.push(l);
    else skipped.push({ id: l.id, missing });
  }
  return { buildable, skipped };
}

export function logSkippedLocalities(locale: Locale, skipped: { id: string; missing: string[] }[]) {
  if (skipped.length === 0) {
    console.log(`[thin-page-guard] ${locale}: 0 localities skipped`);
    return;
  }
  console.warn(
    `[thin-page-guard] ${locale}: skipped ${skipped.length} localit${skipped.length === 1 ? "y" : "ies"}: ` +
      skipped.map((s) => `${s.id} (missing ${s.missing.join(", ")})`).join("; "),
  );
}

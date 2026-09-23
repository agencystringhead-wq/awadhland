/**
 * Thin-page guard, docs/BUILD-SPEC.md Template 3 rules.
 *
 * Minimum field set for a locality page: name, city, lat/lng, a circle rate, land use,
 * at least one narrative paragraph. Records missing any of these are excluded from
 * generateStaticParams and the sitemaps (lib/pages.ts). The skipped ids are logged at build.
 *
 * "A circle rate" means either the legacy `circleRate` object or at least one `rateRefs` entry
 * pointing into the published list. Requiring the old field alone would have dropped every
 * locality the Step 9 import moved onto rateRefs.
 *
 * Hindi pages additionally need nameHi and at least one Hindi narrative paragraph,
 * because the Hindi template reads those fields and must not fall back to English copy.
 */
import type { Locale, Locality, Project, TeamMember } from "./schemas";

export function missingMinimumFields(l: Locality, locale: Locale): string[] {
  const missing: string[] = [];
  if (!l.name) missing.push("name");
  if (!l.cityId) missing.push("cityId");
  if (l.lat === undefined || l.lng === undefined) missing.push("lat/lng");
  // A rate is either the legacy per-locality figure or a reference into the full published list
  // (Step 9 A4). Localities in cities whose list is not transcribed yet still use circleRate.
  if (!l.circleRate && !(l.rateRefs && l.rateRefs.length > 0)) missing.push("circleRate/rateRefs");
  // Land use and narrative must be real, not seeded. A page whose own copy says it is a
  // placeholder is exactly the thin page this guard exists to stop, and a land use no master plan
  // backs is not rendered anyway (hasSourcedLandUse), so counting it here would count nothing.
  if (!l.landUse) missing.push("landUse");
  else if (!hasSourcedLandUse(l)) missing.push("a sourced landUse");
  if (!l.narrative || l.narrative.drivers.length === 0) missing.push("narrative.drivers");
  else if (allPlaceholder(l.narrative.drivers)) missing.push("a real narrative.drivers");
  if (locale === "hi") {
    if (!l.nameHi) missing.push("nameHi");
    if (!l.narrative?.driversHi || l.narrative.driversHi.length === 0) missing.push("narrative.driversHi");
    else if (allPlaceholder(l.narrative.driversHi)) missing.push("a real narrative.driversHi");
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

/**
 * Source guard for government projects (CLAUDE.md: "Every data page renders a SourceStamp with
 * source and updatedAt. If a record lacks sources, it does not ship").
 *
 * A project page is the site making factual claims about public infrastructure — an agency, a
 * budget, a timeline — so it ships only when the record is actually backed by a notification.
 * Seed records carry a source labelled PLACEHOLDER and prose to match; they stay in
 * projects.json, keep their impacts and their id, and simply do not get a page until sourced.
 *
 * Unlike the locality guard this is not locale-dependent: a project without a source is
 * unpublishable in both trees.
 */
/**
 * Seed text the content pipeline marks as not yet real, in either language.
 *
 * The trailing guard is a lookahead rather than `\b`: JavaScript's word boundary is defined on
 * ASCII `\w`, so a `\b` after Devanagari never fires and the Hindi alternative would silently
 * never match.
 */
const PLACEHOLDER_TEXT = /^\s*(PLACEHOLDER|प्लेसहोल्डर)(?![\p{L}\p{N}])/u;

/** True when a record has no real copy yet: no paragraphs, or every one is placeholder text. */
const allPlaceholder = (paras: string[] | undefined) => !paras || paras.length === 0 || paras.every((t) => PLACEHOLDER_TEXT.test(t));

/**
 * Whether a locality's land use may be published.
 *
 * Land use comes from a master plan, not from us, so the claim ships only with the plan named
 * (CLAUDE.md: every data point carries a source, rendered on the page). Seed records guess a use
 * by price band and mark the source PLACEHOLDER; for those the key-facts row, the FAQ entry and
 * the meta-description clause are all omitted rather than published unsourced.
 *
 * The value stays on the record — it is a working guess, and the thin-page guard still counts it
 * — it is simply not shown until a plan backs it.
 */
export function hasSourcedLandUse(l: Pick<Locality, "landUse" | "landUseSource">): boolean {
  return Boolean(l.landUse && l.landUseSource && !PLACEHOLDER_TEXT.test(l.landUseSource));
}

export function missingProjectMinimumFields(p: Project): string[] {
  const missing: string[] = [];
  if (!p.sources.some((s) => !PLACEHOLDER_TEXT.test(s.label))) missing.push("a sourced notification");
  if (p.description.every((para) => PLACEHOLDER_TEXT.test(para))) missing.push("description");
  return missing;
}

export function partitionProjects(projects: Project[]) {
  const buildable: Project[] = [];
  const skipped: { id: string; missing: string[] }[] = [];
  for (const p of projects) {
    const missing = missingProjectMinimumFields(p);
    if (missing.length === 0) buildable.push(p);
    else skipped.push({ id: p.id, missing });
  }
  return { buildable, skipped };
}

export function logSkippedProjects(skipped: { id: string; missing: string[] }[]) {
  if (skipped.length === 0) {
    console.log("[source-guard] projects: 0 skipped");
    return;
  }
  console.warn(
    `[source-guard] projects: skipped ${skipped.length}: ` + skipped.map((s) => `${s.id} (missing ${s.missing.join(", ")})`).join("; "),
  );
}

/* ---------------------------------------------------------------- broker record */

/**
 * The broker record is seeded with TODO values, and unlike a missing rate or a thin narrative it
 * cannot simply be withheld: the name, phone and WhatsApp are the site's spine, read by 25 files.
 *
 * One part of it can and must be withheld, though. `reraNumber` is a regulatory credential and
 * lib/jsonld.ts publishes it as machine-readable structured data (propertyID "UP RERA"), while
 * `reraUrl` is emitted as a `sameAs` identity claim. A placeholder in either is a false claim about
 * a real regulator, not merely an unfinished page, so publishableBroker() nulls them. Both fields
 * are nullable in the schema and every component already guards on them, so the RERA disclosure,
 * the trust badge and the structured-data identifier all disappear on their own.
 *
 * The remaining TODOs stay visible. "TODO Broker Name" is obviously unfinished; a plausible-looking
 * registration number is the thing that misleads.
 */
const TODO_TEXT = /^\s*TODO/i;
/** A phone or wa.me number that is all zeros after the country code. */
const BLANK_NUMBER = /^\+?910{10}$/;
/** The UP RERA portal itself, rather than this broker's record on it. */
const RERA_PORTAL_ROOT = /^https?:\/\/(www\.)?up-rera\.in\/?$/i;

export function brokerPlaceholders(b: TeamMember): string[] {
  const missing: string[] = [];
  if (TODO_TEXT.test(b.name)) missing.push("name");
  if (TODO_TEXT.test(b.nameHi)) missing.push("nameHi");
  if (b.reraNumber && TODO_TEXT.test(b.reraNumber)) missing.push("reraNumber");
  if (b.reraUrl && RERA_PORTAL_ROOT.test(b.reraUrl)) missing.push("reraUrl (points at the portal, not the broker's record)");
  if (BLANK_NUMBER.test(b.phone)) missing.push("phone");
  if (BLANK_NUMBER.test(b.whatsapp)) missing.push("whatsapp");
  if (TODO_TEXT.test(b.bio)) missing.push("bio");
  if (TODO_TEXT.test(b.bioHi)) missing.push("bioHi");
  // The seeded id is "broker-todo", so the marker is a slug segment rather than a prefix.
  if (/(^|-)todo($|-)/i.test(b.id)) missing.push("id (a slug of the broker's name, once there is one)");
  return missing;
}

/** The record as it may be published: the RERA claims are dropped unless they are real. */
export function publishableBroker(b: TeamMember): TeamMember {
  const bad = new Set(brokerPlaceholders(b).map((f) => f.split(" ")[0]));
  if (!bad.has("reraNumber") && !bad.has("reraUrl")) return b;
  return {
    ...b,
    ...(bad.has("reraNumber") ? { reraNumber: null } : {}),
    ...(bad.has("reraUrl") ? { reraUrl: null } : {}),
  };
}

/** True only when a real registration number is on the record to back the claim. */
export const brokerIsRegistered = (b: Pick<TeamMember, "reraNumber">) => Boolean(b.reraNumber);

/**
 * Drop a "UP RERA registered" line from a trust strip when nothing backs it.
 *
 * Matched by content rather than position because the claim sits at index 0 in both languages
 * today and that is not a guarantee. The registration wording is the only RERA reference in these
 * strips, so the test is safe.
 */
export const withoutUnbackedReraClaim = (items: string[], registered: boolean) =>
  registered ? items : items.filter((s) => !/rera|रेरा/i.test(s));

export function logBrokerPlaceholders(b: TeamMember) {
  const missing = brokerPlaceholders(b);
  if (missing.length === 0) {
    console.log("[broker-guard] broker record is real");
    return;
  }
  console.warn(
    `[broker-guard] ${missing.length} placeholder field(s) in data/team.json: ${missing.join(", ")}. ` +
      "The UP RERA number and link are withheld from the page and the structured data until they are real.",
  );
}

/**
 * Cross-file checks that a per-file Zod schema cannot express: unique ids, foreign keys,
 * reserved slugs. Used by scripts/validate.ts and at import time by lib/data.ts, so both
 * `npm run validate` and a bare `next build` fail on broken references.
 */
import {
  RESERVED_CITY_IDS,
  RESERVED_LOCALITY_IDS,
  type CircleRateSchedule,
  type City,
  type Locality,
  type PriceObservation,
  type Project,
  type Reviews,
  type Scoring,
  type StampDutyRule,
  type TeamMember,
  type Update,
} from "./schemas";

export type Dataset = {
  cities: City[];
  localities: Locality[];
  projects: Project[];
  circleRates: CircleRateSchedule[];
  stampDutyRules: StampDutyRule[];
  updates: Update[];
  priceObservations: PriceObservation[];
  team: TeamMember[];
  scoring: Scoring;
  reviews: Reviews;
};

function duplicates(ids: string[]): string[] {
  const seen = new Set<string>();
  const dupes = new Set<string>();
  for (const id of ids) (seen.has(id) ? dupes : seen).add(id);
  return [...dupes];
}

export function checkIntegrity(d: Dataset): string[] {
  const errors: string[] = [];
  const err = (file: string, msg: string) => errors.push(`${file}: ${msg}`);

  const unique = (file: string, ids: string[]) => {
    for (const id of duplicates(ids)) err(file, `duplicate id "${id}"`);
  };
  unique(
    "cities.json",
    d.cities.map((c) => c.id),
  );
  unique(
    "localities.json",
    d.localities.map((l) => l.id),
  );
  unique(
    "projects.json",
    d.projects.map((p) => p.id),
  );
  unique(
    "circleRates.json",
    d.circleRates.map((s) => s.id),
  );
  unique(
    "stampDutyRules.json",
    d.stampDutyRules.map((r) => r.id),
  );
  unique(
    "updates.json",
    d.updates.map((u) => u.id),
  );
  unique(
    "priceObservations.json",
    d.priceObservations.map((o) => o.id),
  );
  unique(
    "team.json",
    d.team.map((t) => t.id),
  );

  const cityIds = new Set(d.cities.map((c) => c.id));
  const localityById = new Map(d.localities.map((l) => [l.id, l]));
  const projectIds = new Set(d.projects.map((p) => p.id));

  for (const c of d.cities) {
    if ((RESERVED_CITY_IDS as readonly string[]).includes(c.id)) err("cities.json", `city id "${c.id}" is a reserved URL segment`);
    for (const id of duplicates(c.anchors.map((a) => a.id))) err("cities.json", `${c.id}: duplicate anchor id "${id}"`);
  }

  for (const l of d.localities) {
    const at = `${l.id}`;
    if ((RESERVED_LOCALITY_IDS as readonly string[]).includes(l.id))
      err("localities.json", `locality id "${l.id}" is a reserved URL segment`);
    const city = d.cities.find((c) => c.id === l.cityId);
    if (!city) err("localities.json", `${at}: unknown cityId "${l.cityId}"`);
    if (l.parentLocalityId !== null) {
      const parent = localityById.get(l.parentLocalityId);
      if (!parent) err("localities.json", `${at}: unknown parentLocalityId "${l.parentLocalityId}"`);
      else if (parent.cityId !== l.cityId) err("localities.json", `${at}: parent "${parent.id}" is in a different city`);
      if (l.parentLocalityId === l.id) err("localities.json", `${at}: parentLocalityId points at itself`);
    }
    if (city && l.driveTimes) {
      const anchorIds = new Set(city.anchors.map((a) => a.id));
      for (const key of Object.keys(l.driveTimes)) {
        if (!anchorIds.has(key)) err("localities.json", `${at}: driveTimes key "${key}" is not an anchor of ${city.id}`);
      }
    }
  }

  for (const p of d.projects) {
    if (!cityIds.has(p.cityId)) err("projects.json", `${p.id}: unknown cityId "${p.cityId}"`);
    for (const id of p.affectedLocalityIds) {
      if (!localityById.has(id)) err("projects.json", `${p.id}: unknown affectedLocalityId "${id}"`);
    }
    for (const i of p.impacts) {
      if (!localityById.has(i.localityId)) err("projects.json", `${p.id}: impacts references unknown locality "${i.localityId}"`);
      if (!p.affectedLocalityIds.includes(i.localityId))
        err("projects.json", `${p.id}: impact locality "${i.localityId}" is not in affectedLocalityIds`);
    }
  }

  for (const s of d.circleRates) {
    if (!cityIds.has(s.cityId)) err("circleRates.json", `${s.id}: unknown cityId "${s.cityId}"`);
    for (const id of duplicates(s.rates.map((r) => r.localityId)))
      err("circleRates.json", `${s.id}: locality "${id}" appears twice in one schedule`);
    for (const r of s.rates) {
      const loc = localityById.get(r.localityId);
      if (!loc) err("circleRates.json", `${s.id}: unknown localityId "${r.localityId}"`);
      else if (loc.cityId !== s.cityId)
        err("circleRates.json", `${s.id}: locality "${r.localityId}" belongs to ${loc.cityId}, not ${s.cityId}`);
    }
  }
  const scheduleKeys = d.circleRates.map((s) => `${s.cityId}@${s.effectiveFrom}`);
  for (const key of duplicates(scheduleKeys)) err("circleRates.json", `two schedules for ${key}; a revision needs a new effectiveFrom`);

  const categories = d.stampDutyRules.map((r) => `${r.state}/${r.buyerCategory}@${r.effectiveFrom}`);
  for (const key of duplicates(categories)) err("stampDutyRules.json", `duplicate rule for ${key}`);

  for (const u of d.updates) {
    for (const id of u.cityIds) if (!cityIds.has(id)) err("updates.json", `${u.id}: unknown cityId "${id}"`);
    for (const id of u.localityIds) if (!localityById.has(id)) err("updates.json", `${u.id}: unknown localityId "${id}"`);
    for (const id of u.projectIds) if (!projectIds.has(id)) err("updates.json", `${u.id}: unknown projectId "${id}"`);
  }

  for (const o of d.priceObservations) {
    if (!localityById.has(o.localityId)) err("priceObservations.json", `${o.id}: unknown localityId "${o.localityId}"`);
  }

  return errors;
}

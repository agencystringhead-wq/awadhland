/**
 * The high-potential score (spec Template 2), derived rather than stored.
 *
 * The weights have always been in data/scoring.json. What was missing was the derivation: every
 * locality carried a hand-set `score` integer, `getScoring()` was never called, and the weights
 * were parsed and then ignored — so the ranking published on the homepage, the city cards and the
 * nav had nothing behind it. Two records said as much in their own todo ("score are illustrative").
 *
 * This computes the score from the record instead. Each signal returns a value in 0..1, or null
 * when the record has no input for it, and points are `weight × value`, so a signal the spec calls
 * negative contributes its full weight when the locality is clean and nothing when it is not.
 *
 * A locality missing ANY signal gets no score at all. That is deliberate and it is the whole point:
 * a number out of 100 assembled from 40 points of evidence is not a number out of 100, and this one
 * is shown to people deciding where to put money. Partial evidence produces no score, not a small
 * one. `scoreParts` exists so a methodology page can show the working once there is working to show.
 */
import { getCircleRateSchedules, getPublishedProjects, getPriceObservations, getScoring } from "./data";
import { hasSourcedLandUse } from "./guards";
import type { Locality } from "./schemas";

export type ScorePart = {
  key: string;
  label: string;
  labelHi: string;
  weight: number;
  /** 0..1, or null when the record has no input for this signal */
  value: number | null;
  /** weight × value, or null */
  points: number | null;
  /** why the signal could not be scored, for the build log and a future methodology page */
  missing?: string;
};

export type LocalityScore = { score: number; parts: ScorePart[] };

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

/**
 * Connectivity to anchors: the mean drive time to the city's anchors, in minutes.
 * 0 minutes scores 1 and 60 minutes or more scores 0 — the band the cities in this dataset fit in.
 */
function connectivity(l: Locality): number | null {
  const times = Object.values(l.driveTimes ?? {}).filter((n): n is number => typeof n === "number");
  if (times.length === 0) return null;
  const mean = times.reduce((a, b) => a + b, 0) / times.length;
  return clamp01(1 - mean / 60);
}

/**
 * Master-plan land use, scored only when a plan actually backs it (hasSourcedLandUse). An unsourced
 * guess is not evidence, and the site already refuses to render it.
 */
const LAND_USE_VALUE: Record<string, number> = {
  residential: 1,
  mixed: 0.9,
  commercial: 0.85,
  institutional: 0.6,
  industrial: 0.5,
  other: 0.4,
  agricultural: 0.25,
  "green-belt": 0,
};

function masterPlanLandUse(l: Locality): number | null {
  if (!hasSourcedLandUse(l)) return null;
  return LAND_USE_VALUE[l.landUse!] ?? null;
}

/** Annualised growth between the first and last of a dated series, or null when it cannot be read. */
function annualisedGrowth(points: { date: string; value: number }[]): number | null {
  if (points.length < 2) return null;
  const sorted = [...points].sort((a, b) => a.date.localeCompare(b.date));
  const first = sorted[0];
  const last = sorted.at(-1)!;
  // A window under a quarter is noise, not a trend.
  const days = (Date.parse(last.date) - Date.parse(first.date)) / 86_400_000;
  if (days < 90) return null;
  if (first.value <= 0) return null;
  return (last.value / first.value) ** (365 / days) - 1;
}

/**
 * Price momentum, from asking-price observations where they exist and otherwise from the official
 * circle-rate revision history.
 *
 * Asking prices come first because they are what a buyer actually faces. But they depend on
 * someone remembering to log a dated observation, whereas the site already transcribes every
 * schedule revision as part of its core job — so a locality whose city has two published schedules
 * has a real, sourced, dated series with nobody doing extra work. Circle rates are the
 * government's own revaluation and lag the market, which makes this the conservative of the two
 * readings; that is the right way round for a signal that pushes a locality up a ranking.
 *
 * Flat scores 0 and 25%/yr or more scores 1.
 */
function priceMomentum(l: Locality): number | null {
  const obs = getPriceObservations().filter((o) => o.localityId === l.id);
  // Mixed units would need a conversion; treat them as unreadable rather than guess.
  const units = new Set(obs.map((o) => o.unit));
  if (obs.length >= 2 && units.size === 1) {
    const growth = annualisedGrowth(obs.map((o) => ({ date: o.date, value: (o.low + o.high) / 2 })));
    if (growth !== null) return clamp01(growth / 0.25);
  }

  const schedule = getCircleRateSchedules()
    .filter((s) => s.cityId === l.cityId)
    .flatMap((s) => {
      const rate = s.rates.find((r) => r.localityId === l.id);
      return rate && rate.residential > 0 ? [{ date: s.effectiveFrom, value: rate.residential }] : [];
    });
  const growth = annualisedGrowth(schedule);
  return growth === null ? null : clamp01(growth / 0.25);
}

/**
 * Government project proximity: how many published projects name this locality as affected.
 * Only projects that pass the source guard count — an unsourced seed project is not a reason to
 * rate land higher. Three or more saturates the signal.
 */
function governmentProjectProximity(l: Locality): number | null {
  const projects = getPublishedProjects().filter((p) => p.cityId === l.cityId);
  if (projects.length === 0) return null; // nothing published for this city yet: unknowable, not zero
  const hits = projects.filter((p) => p.affectedLocalityIds.includes(l.id)).length;
  return clamp01(hits / 3);
}

/**
 * RERA coverage: how many UP RERA-registered projects sit in this locality.
 *
 * The spec names the signal and weights it at 10 but never says what it measures, so this is the
 * definition: formal development activity, counted as registrations. A locality where developers
 * register is one where building is happening under a regulator that publishes the project, the
 * promoter and the completion date — which is exactly the kind of place the score is meant to
 * favour, and exactly the paper trail a buyer can check.
 *
 * Counted from the UP RERA project search, which lists registrations by district and project
 * address, and dated because registrations accumulate. Nothing in this repo can derive it.
 *
 * Five or more saturates the signal. A rural locality with no formal projects counts 0 and scores
 * nothing here; that is the signal working rather than failing, and its 10 points are the smallest
 * of the six for that reason.
 */
function reraCoverage(l: Locality): number | null {
  if (!l.reraProjects) return null;
  return clamp01(l.reraProjects.count / 5);
}

/**
 * Litigation and dispute risk, the one signal the spec marks negative. `risks: []` means the
 * record has been checked and is clean, which scores its full weight; an absent `risks` means
 * nobody has looked, which is not the same thing and scores nothing.
 */
function litigationRisk(l: Locality): number | null {
  if (!l.risks) return null;
  return clamp01(1 - l.risks.length / 3);
}

const SIGNALS: Record<string, { value: (l: Locality) => number | null; missing: string }> = {
  connectivity: { value: connectivity, missing: "driveTimes" },
  masterPlanLandUse: { value: masterPlanLandUse, missing: "a sourced landUse" },
  priceMomentum: { value: priceMomentum, missing: "two dated price points 90+ days apart (observations, or two circle-rate schedules)" },
  governmentProjectProximity: { value: governmentProjectProximity, missing: "a published project in this city" },
  reraCoverage: { value: reraCoverage, missing: "reraProjects (count of UP RERA registrations, from the UP RERA project search)" },
  litigationRisk: { value: litigationRisk, missing: "risks" },
};

/** The signal breakdown, whether or not it adds up to a publishable score. */
export function scoreParts(l: Locality): ScorePart[] {
  return getScoring().signals.map((s) => {
    const signal = SIGNALS[s.key];
    const value = signal.value(l);
    return {
      key: s.key,
      label: s.label,
      labelHi: s.labelHi,
      weight: s.weight,
      value,
      points: value === null ? null : Math.round(s.weight * value * 10) / 10,
      ...(value === null ? { missing: signal.missing } : {}),
    };
  });
}

/** The score, or undefined when any signal has no input. See the note at the top of this file. */
export function getLocalityScore(l: Locality): LocalityScore | undefined {
  const parts = scoreParts(l);
  if (parts.some((p) => p.value === null)) return undefined;
  const score = Math.round(parts.reduce((sum, p) => sum + p.points!, 0));
  return { score: Math.min(getScoring().maxScore, score), parts };
}

/** Convenience for templates that only want the number. */
export const localityScore = (l: Locality): number | undefined => getLocalityScore(l)?.score;

/**
 * Order a city's localities for a "top areas" block.
 *
 * `ranked` is false when no locality in the list has a score, and the caller then shows a plain
 * list with no position numbers and no chips — a ranking nobody can compute is not a ranking. It
 * flips to true on its own for a city as soon as its records carry every signal.
 */
export function rankLocalities<T extends Locality>(localities: T[]): { ranked: boolean; list: { locality: T; score?: number }[] } {
  const scored = localities.map((locality) => ({ locality, score: localityScore(locality) }));
  const ranked = scored.some((x) => x.score !== undefined);
  if (!ranked) return { ranked: false, list: scored };
  return { ranked: true, list: [...scored].sort((a, b) => (b.score ?? -1) - (a.score ?? -1)) };
}

/** One line per signal that is blocking every locality, for the build log. */
export function logScoreCoverage(localities: Locality[]) {
  if (localities.length === 0) return;
  const blocking = new Map<string, number>();
  let scored = 0;
  for (const l of localities) {
    const parts = scoreParts(l);
    if (parts.every((p) => p.value !== null)) scored++;
    for (const p of parts) if (p.value === null) blocking.set(p.missing!, (blocking.get(p.missing!) ?? 0) + 1);
  }
  if (scored === localities.length) {
    console.log(`[score] ${scored}/${localities.length} localities scored`);
    return;
  }
  const worst = [...blocking].sort((a, b) => b[1] - a[1]);
  console.warn(
    `[score] ${scored}/${localities.length} localities scored; no score is shown for the rest. ` +
      `Missing: ${worst.map(([what, n]) => `${what} (${n})`).join(", ")}`,
  );
}

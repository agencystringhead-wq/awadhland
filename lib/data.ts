/**
 * Typed loaders for /data. Every file is parsed with its Zod schema when this module is
 * imported, and cross-file integrity is checked, so a bad record fails `next build` even
 * when the prebuild validate step is bypassed. All reads happen at build time; nothing here
 * runs in the browser.
 */
import { z } from "zod";
import citiesJson from "../data/cities.json";
import localitiesJson from "../data/localities.json";
import projectsJson from "../data/projects.json";
import circleRatesJson from "../data/circleRates.json";
import stampDutyRulesJson from "../data/stampDutyRules.json";
import updatesJson from "../data/updates.json";
import priceObservationsJson from "../data/priceObservations.json";
import teamJson from "../data/team.json";
import scoringJson from "../data/scoring.json";
import reviewsJson from "../data/reviews.json";
import standardPagesJson from "../data/standardPages.json";
import { dataFiles, type DataFileName, type Locale } from "./schemas";
import { checkIntegrity, type Dataset } from "./integrity";
import { partitionLocalities, partitionProjects } from "./guards";

function parse<F extends DataFileName>(file: F, raw: unknown): z.infer<(typeof dataFiles)[F]> {
  const result = dataFiles[file].safeParse(raw);
  if (!result.success) {
    throw new Error(`Invalid data in data/${file}:\n${z.prettifyError(result.error)}`);
  }
  return result.data as z.infer<(typeof dataFiles)[F]>;
}

const dataset: Dataset = {
  cities: parse("cities.json", citiesJson),
  localities: parse("localities.json", localitiesJson),
  projects: parse("projects.json", projectsJson),
  circleRates: parse("circleRates.json", circleRatesJson),
  stampDutyRules: parse("stampDutyRules.json", stampDutyRulesJson),
  updates: parse("updates.json", updatesJson),
  priceObservations: parse("priceObservations.json", priceObservationsJson),
  team: parse("team.json", teamJson),
  scoring: parse("scoring.json", scoringJson),
  reviews: parse("reviews.json", reviewsJson),
  standardPages: parse("standardPages.json", standardPagesJson),
};

const integrityErrors = checkIntegrity(dataset);
if (integrityErrors.length > 0) {
  throw new Error(`Data integrity check failed:\n- ${integrityErrors.join("\n- ")}`);
}

const byDateDesc = <T extends { date: string }>(a: T, b: T) => b.date.localeCompare(a.date);

/* cities */
export const getCities = () => dataset.cities;
export const getCity = (id: string) => dataset.cities.find((c) => c.id === id);

/* localities */
export const getLocalities = () => dataset.localities;
export const getLocalitiesByCity = (cityId: string) => dataset.localities.filter((l) => l.cityId === cityId);
export const getLocality = (cityId: string, id: string) => dataset.localities.find((l) => l.cityId === cityId && l.id === id);
/** Localities that pass the thin-page guard for this locale, plus the ids that were skipped. */
export const getBuildableLocalities = (locale: Locale) => partitionLocalities(dataset.localities, locale);

/** Aggregates for city cards and hub heroes, from the localities that pass the guard in this locale. */
export function getCityStats(cityId: string, locale: Locale) {
  const localities = partitionLocalities(getLocalitiesByCity(cityId), locale).buildable;
  const ranges = localities.flatMap((l) => (l.askingRange ? [l.askingRange] : []));
  return {
    localityCount: localities.length,
    projectCount: partitionProjects(dataset.projects).buildable.filter((p) => p.cityId === cityId).length,
    /** ₹ per sq ft across the city's localities, or null when no asking ranges are recorded */
    askingRange: ranges.length > 0 ? { low: Math.min(...ranges.map((r) => r.low)), high: Math.max(...ranges.map((r) => r.high)) } : null,
    /** The city's buildable localities. Ranking is the caller's job (lib/scoring.ts), because
     * a score exists only when every signal has an input. */
    topLocalities: localities,
  };
}

/* projects */
/** Every record, including the unsourced ones. Use getBuildableProjects for anything rendered. */
export const getProjects = () => dataset.projects;
export const getProject = (id: string) => dataset.projects.find((p) => p.id === id);
export const getProjectsByCity = (cityId: string) => dataset.projects.filter((p) => p.cityId === cityId);

/**
 * Projects that have a page: those backed by a real notification (lib/guards.ts). A project
 * without one keeps its record and its impacts but is not published, so counters, cards, nearby
 * lists and the sitemap all read from here rather than from getProjects.
 */
export const getBuildableProjects = () => partitionProjects(dataset.projects);
export const getPublishedProjects = () => partitionProjects(dataset.projects).buildable;
export const getPublishedProjectsByCity = (cityId: string) =>
  partitionProjects(dataset.projects).buildable.filter((p) => p.cityId === cityId);

/* circle rates */
export const getCircleRateSchedules = () => dataset.circleRates;
/** All schedules for a city, newest effectiveFrom first. The first entry is the current schedule. */
export const getCircleRateSchedulesByCity = (cityId: string) =>
  dataset.circleRates.filter((s) => s.cityId === cityId).sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom));
export const getCurrentCircleRateSchedule = (cityId: string) => getCircleRateSchedulesByCity(cityId)[0];

/* stamp duty */
export const getStampDutyRules = () => dataset.stampDutyRules;

/* updates */
/** Newest first. */
export const getUpdates = () => [...dataset.updates].sort(byDateDesc);
export const getUpdate = (id: string) => dataset.updates.find((u) => u.id === id);

/* price observations */
export const getPriceObservations = () => dataset.priceObservations;
export const getPriceObservationsByLocality = (localityId: string) =>
  dataset.priceObservations.filter((o) => o.localityId === localityId).sort((a, b) => a.date.localeCompare(b.date));

/**
 * Median of (low + high) / 2 across a city's localities per observation date, oldest first.
 * Feeds the hub price-trend chart; grows as observations are added.
 */
export function getCityPriceSeries(cityId: string): { date: string; median: number; count: number }[] {
  const localityIds = new Set(getLocalitiesByCity(cityId).map((l) => l.id));
  const byDate = new Map<string, number[]>();
  for (const o of dataset.priceObservations) {
    if (!localityIds.has(o.localityId)) continue;
    const mids = byDate.get(o.date) ?? [];
    mids.push((o.low + o.high) / 2);
    byDate.set(o.date, mids);
  }
  return [...byDate.entries()]
    .map(([date, mids]) => {
      const s = [...mids].sort((a, b) => a - b);
      const m = s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2;
      return { date, median: Math.round(m), count: s.length };
    })
    .sort((a, b) => a.date.localeCompare(b.date));
}

/* team */
export const getTeam = () => dataset.team;
export const getTeamMember = (id: string) => dataset.team.find((t) => t.id === id);
/** The broker shown in the header, trust blocks and author boxes: the first team.json record. */
export const getBroker = () => dataset.team[0];

/* scoring */
export const getScoring = () => dataset.scoring;

/* reviews */
export const getReviews = () => dataset.reviews;

/* standard pages */
export const getStandardPages = () => dataset.standardPages;
export const getStandardPage = (id: string) => dataset.standardPages.find((p) => p.id === id);

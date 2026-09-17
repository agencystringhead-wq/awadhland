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
import { dataFiles, type DataFileName, type Locale } from "./schemas";
import { checkIntegrity, type Dataset } from "./integrity";
import { partitionLocalities } from "./guards";

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
export const getLocality = (cityId: string, id: string) =>
  dataset.localities.find((l) => l.cityId === cityId && l.id === id);
/** Localities that pass the thin-page guard for this locale, plus the ids that were skipped. */
export const getBuildableLocalities = (locale: Locale) => partitionLocalities(dataset.localities, locale);

/* projects */
export const getProjects = () => dataset.projects;
export const getProject = (id: string) => dataset.projects.find((p) => p.id === id);
export const getProjectsByCity = (cityId: string) => dataset.projects.filter((p) => p.cityId === cityId);

/* circle rates */
export const getCircleRateSchedules = () => dataset.circleRates;
/** All schedules for a city, newest effectiveFrom first. The first entry is the current schedule. */
export const getCircleRateSchedulesByCity = (cityId: string) =>
  dataset.circleRates
    .filter((s) => s.cityId === cityId)
    .sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom));
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

/* team */
export const getTeam = () => dataset.team;
export const getTeamMember = (id: string) => dataset.team.find((t) => t.id === id);
/** The broker shown in the header, trust blocks and author boxes: the first team.json record. */
export const getBroker = () => dataset.team[0];

/* scoring */
export const getScoring = () => dataset.scoring;

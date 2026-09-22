/**
 * Loaders and lookups for the full published rate lists (Step 9, section A).
 *
 * data/rates/<city>-<effectiveFrom>.json holds one published schedule each: every village row and
 * every road-segment row exactly as printed. A revision is a new file, so the imports below are
 * the list of schedules the site knows about — add a line when a new list is transcribed.
 * Explicit imports rather than a directory scan because `output: 'export'` bundles these at build
 * and a variable require would not resolve.
 *
 * Units are never converted here. lib/units.ts does display conversion; storage stays as published.
 */
import { z } from "zod";
import ayodhya20250607 from "../data/rates/ayodhya-2025-06-07.json";
import indexableJson from "../data/rates/indexable.json";
import tehsilsJson from "../data/tehsils.json";
import unitsJson from "../data/units.json";
import valuationRulesJson from "../data/valuationRules.json";
import {
  indexableRatesFileSchema,
  rateScheduleSchema,
  tehsilsFileSchema,
  unitsFileSchema,
  valuationRulesFileSchema,
  type RateRow,
  type RateSchedule,
  type RoadSegmentRow,
  type Tehsil,
} from "./schemas";

function parse<T>(what: string, schema: z.ZodType<T>, raw: unknown): T {
  const result = schema.safeParse(raw);
  if (!result.success) throw new Error(`Invalid data in ${what}:\n${z.prettifyError(result.error)}`);
  return result.data;
}

/** Every published schedule the site knows about. Add a line per new transcribed list. */
const schedules: RateSchedule[] = [parse("data/rates/ayodhya-2025-06-07.json", rateScheduleSchema, ayodhya20250607)];

const tehsils = parse("data/tehsils.json", tehsilsFileSchema, tehsilsJson);
const units = parse("data/units.json", unitsFileSchema, unitsJson);
const valuationRules = parse("data/valuationRules.json", valuationRulesFileSchema, valuationRulesJson);
const indexable = parse("data/rates/indexable.json", indexableRatesFileSchema, indexableJson);

/* -------------------------------------------------------------------- schedules */

export const getRateSchedules = () => schedules;

/** Newest first; [0] is the schedule in force. */
export const getRateSchedulesByCity = (cityId: string) =>
  schedules.filter((s) => s.cityId === cityId).sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom));

export const getCurrentRateSchedule = (cityId: string): RateSchedule | undefined => getRateSchedulesByCity(cityId)[0];

/** Cities that have a full transcribed list, so the tehsil and village pages can build. */
export const getCitiesWithRateList = () => [...new Set(schedules.map((s) => s.cityId))];

/* ---------------------------------------------------------------------- tehsils */

export const getTehsils = () => tehsils;
export const getTehsilsByCity = (cityId: string) => tehsils.filter((t) => t.cityId === cityId);
export const getTehsil = (cityId: string, id: string): Tehsil | undefined =>
  tehsils.find((t) => t.cityId === cityId && t.id === id);

/* ------------------------------------------------------------------------- rows */

const rowIndex = new Map<string, { row: RateRow; cityId: string; schedule: RateSchedule }>();
for (const s of schedules) for (const row of s.rows) rowIndex.set(row.id, { row, cityId: s.cityId, schedule: s });

export const getRateRow = (id: string) => rowIndex.get(id)?.row;
export const getRateRowWithSchedule = (id: string) => rowIndex.get(id);

/** All rows of one tehsil in the city's current schedule, in printed serial order. */
export function getRowsByTehsil(cityId: string, tehsilId: string): RateRow[] {
  const s = getCurrentRateSchedule(cityId);
  if (!s) return [];
  return s.rows.filter((r) => r.sro === tehsilId).sort((a, b) => a.serial - b.serial);
}

export function getRoadSegmentsByTehsil(cityId: string, tehsilId: string): RoadSegmentRow[] {
  const s = getCurrentRateSchedule(cityId);
  if (!s) return [];
  return s.roadSegments.filter((r) => r.sro === tehsilId);
}

/** Road segments that run through one village row. */
export function getRoadSegmentsForRow(cityId: string, rateRowId: string): RoadSegmentRow[] {
  const s = getCurrentRateSchedule(cityId);
  if (!s) return [];
  return s.roadSegments.filter((r) => r.rateRowId === rateRowId);
}

/** Row by its slug within a tehsil — how the village page resolves its URL. */
export function getRowBySlug(cityId: string, tehsilId: string, slug: string): RateRow | undefined {
  return getRowsByTehsil(cityId, tehsilId).find((r) => r.slug === slug);
}

/* -------------------------------------------------------------------- summaries */

const median = (xs: number[]): number | null => {
  if (xs.length === 0) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2;
  return Math.round(m);
};

export type TehsilSummary = {
  tehsil: Tehsil;
  rowCount: number;
  segmentCount: number;
  /** ₹ per sq m, across the <9 m column, which is the base rate every row carries */
  minNonAgri: number | null;
  maxNonAgri: number | null;
  medianNonAgri: number | null;
  /** highest ₹ per sq m on any road segment in this tehsil */
  topSegmentRate: number | null;
};

export function getTehsilSummary(cityId: string, tehsilId: string): TehsilSummary | null {
  const tehsil = getTehsil(cityId, tehsilId);
  if (!tehsil) return null;
  const rows = getRowsByTehsil(cityId, tehsilId);
  const segments = getRoadSegmentsByTehsil(cityId, tehsilId);
  const base = rows.map((r) => r.nonAgri.lt9m);
  return {
    tehsil,
    rowCount: rows.length,
    segmentCount: segments.length,
    minNonAgri: base.length ? Math.min(...base) : null,
    maxNonAgri: base.length ? Math.max(...base) : null,
    medianNonAgri: median(base),
    topSegmentRate: segments.length ? Math.max(...segments.map((s) => s.nonAgri)) : null,
  };
}

export const getTehsilMedian = (cityId: string, tehsilId: string) => median(getRowsByTehsil(cityId, tehsilId).map((r) => r.nonAgri.lt9m));

/**
 * Nearest rows by rate similarity within the same tehsil (spec: "6 nearest villages in the same
 * tehsil by rate similarity"). Compared on the <9 m base rate, which every row has.
 */
export function getSimilarRows(cityId: string, row: RateRow, count = 6): RateRow[] {
  return getRowsByTehsil(cityId, row.sro)
    .filter((r) => r.id !== row.id)
    .map((r) => ({ r, d: Math.abs(r.nonAgri.lt9m - row.nonAgri.lt9m) }))
    .sort((a, b) => a.d - b.d || a.r.serial - b.r.serial)
    .slice(0, count)
    .map((x) => x.r);
}

/* ------------------------------------------------------------------- indexing */

const indexableIds = new Set(indexable.rateRowIds);

/**
 * A village page is indexable when a live locality points at its row, or when it has been opened
 * by hand in data/rates/indexable.json. Everything else builds but ships noindex and stays out of
 * the sitemaps (Step 9, section C3).
 */
export function isRowIndexable(rateRowId: string, referencedByLiveLocality: boolean): boolean {
  return referencedByLiveLocality || indexableIds.has(rateRowId);
}

export const getIndexableRowIds = () => indexableIds;

/* ---------------------------------------------------------------------- units */

export const getUnits = () => units;
export const getValuationRules = () => valuationRules;

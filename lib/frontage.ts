/**
 * Khasra road-frontage lists: which plots of a village sit on a highway, a district road, a link
 * road or next to the abadi. Loaded from data/frontage/, one file per city and valuation list.
 *
 * These are not rates. They exist on the site for the three Lucknow SROs whose मूल्यांकन सूची has
 * not arrived (Sadar-4, Bakshi Ka Talab, Malihabad), where they give each village a page and feed
 * the "check your plot" tool.
 *
 * Only the village file is imported here. The 58,000 khasra numbers live in a separate file that
 * scripts/build-frontage-chunks.ts splits into public/frontage/, one small JSON per village, so no
 * page or client bundle ever carries the whole list.
 */
import { z } from "zod";
import lucknow20250801 from "../data/frontage/lucknow-2025-08-01.json";
import { getRowsByTehsil, getTehsil } from "./rates";
import { frontageFileSchema, type FrontageCategory, type FrontageFile, type FrontageVillage } from "./schemas";

function parse<T>(what: string, schema: z.ZodType<T>, raw: unknown): T {
  const result = schema.safeParse(raw);
  if (!result.success) throw new Error(`Invalid data in ${what}:\n${z.prettifyError(result.error)}`);
  return result.data;
}

/** Every frontage list the site knows about. Add a line per new transcribed list. */
const files: FrontageFile[] = [parse("data/frontage/lucknow-2025-08-01.json", frontageFileSchema, lucknow20250801)];

export const getFrontageFiles = () => files;

/** Newest list for a city, or undefined where it has none. */
export const getFrontage = (cityId: string): FrontageFile | undefined =>
  files.filter((f) => f.cityId === cityId).sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom))[0];

/** Villages of one SRO, in printed serial order. */
export function getFrontageVillages(cityId: string, sro: string): FrontageVillage[] {
  return (getFrontage(cityId)?.villages ?? []).filter((v) => v.sro === sro).sort((a, b) => a.serial - b.serial);
}

export const getFrontageVillageBySlug = (cityId: string, sro: string, slug: string) =>
  getFrontageVillages(cityId, sro).find((v) => v.slug === slug);

/** SROs of a city that have a frontage list, in the order the file lists them. */
export const getFrontageSros = (cityId: string): string[] => getFrontage(cityId)?.sourceDocs.map((d) => d.sro) ?? [];

/** Cities with at least one frontage list. */
export const getFrontageCities = () => [...new Set(files.map((f) => f.cityId))];

/**
 * SROs that get their pages from the frontage list: registered in tehsils.json, still "pending",
 * and with no rows in the city's rate list. The moment an SRO's rates are transcribed it drops out
 * of here and its villages build from the rate list instead, at the same URLs.
 */
export function getFrontageOnlySros(cityId: string): string[] {
  return getFrontageSros(cityId).filter((sro) => {
    const t = getTehsil(cityId, sro);
    return t !== undefined && t.ratesStatus === "pending" && getRowsByTehsil(cityId, sro).length === 0;
  });
}

export const getFrontageSourceDoc = (cityId: string, sro: string) => getFrontage(cityId)?.sourceDocs.find((d) => d.sro === sro);

/** Where the per-village plot chunk is served. Mirrored by scripts/build-frontage-chunks.ts. */
export const frontageChunkPath = (cityId: string, sro: string, slug: string) => `/frontage/${cityId}/${sro}/${slug}.json`;

/** Shape of one chunk. Mirrored by scripts/build-frontage-chunks.ts; change both together. */
export type FrontageChunk = {
  /** village id */
  id: string;
  /** roads the `r` index points into, printed Hindi */
  roads: string[];
  /** k: khasra as printed, b: khasra_base, c: category, r: road index, u: uncertain note */
  plots: { k: string; b: string; c: FrontageCategory; r?: number; u?: string }[];
};

/* ---------------------------------------------------------------------- labels */

export const FRONTAGE_CATEGORIES: FrontageCategory[] = ["nh", "district", "link", "abadi"];

// Labels live in lib/frontage-copy.ts, which imports no data, so the client tool can use them.
export { frontageLabel, frontageShortLabel } from "./frontage-copy";

/* ----------------------------------------------------------------------- notes */

/**
 * English glosses for the list's printed remarks. The Hindi is always shown as printed; on the
 * English page each remark gets a plain-English line for every phrase recognised in it ("inside
 * nagar nigam limits and already urbanised" is two). A remark nothing here recognises is shown in
 * Hindi alone rather than guessed at.
 */
const GLOSSES: { test: RegExp; en: string }[] = [
  { test: /समस्त गाटो के आस-पास आबादी/, en: "Almost every plot in the village has abadi (settlement) around it." },
  { test: /पूर्ण आबादी विकसित/, en: "The whole village is built up (abadi)." },
  { test: /नगर पंचायत बी0के0टी0/, en: "The village now falls inside Nagar Panchayat Bakshi Ka Talab limits." },
  { test: /नगर निगम|नगर सीमा/, en: "The village now falls inside municipal (nagar nigam) limits." },
  { test: /शहरीकरण/, en: "The list records the village as already urbanised." },
  { test: /विकास प्राधिकरण|एल0डी0ए0/, en: "Land acquired by the Lucknow Development Authority (LDA)." },
  { test: /चकबन्दी नही/, en: "Land consolidation (chakbandi) has not been carried out in this village." },
  { test: /^चकबन्दी$/, en: "Marked only “chakbandi” (land consolidation); no khasra numbers are listed." },
  { test: /काकोरी का मजरा/, en: "A hamlet (majra) of Kakori village." },
  { test: /गैर आबाद/, en: "Marked “gair abad” (uninhabited)." },
];

export function glossNote(noteHi: string): string | null {
  const hits = GLOSSES.filter((g) => g.test.test(noteHi)).map((g) => g.en);
  return hits.length ? hits.join(" ") : null;
}

/**
 * True where the list's remark says almost every plot in the village has abadi around it. The
 * list then usually names no abadi plots one by one, so a plot missing from it proves nothing.
 */
export const isAllAbadi = (v: FrontageVillage) => v.notesHi.some((n) => /समस्त गाटो के आस-पास आबादी|पूर्ण आबादी विकसित/.test(n));

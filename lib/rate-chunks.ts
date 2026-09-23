/**
 * The compact row shape shared by the per-tehsil JSON chunks and the components that read them.
 *
 * Written by scripts/build-rate-chunks.ts, fetched by the tehsil table and the district search.
 * Keys are one character because 1,630 rows of readable key names would be most of the payload;
 * the mapping is documented here so nothing has to guess.
 *
 * Plain module, not a client one: the tehsil page converts its first 100 rows to this shape on
 * the server, and a "use client" file cannot export a function the server calls.
 */
import type { RateCategory, RateRow, RoadBand } from "./schemas";

export type ChunkRow = {
  /** RateRow id */
  i: string;
  /** slug, for the village page URL */
  s: string;
  /** nameEn */
  n: string;
  /** nameHi */
  h: string;
  /** wardHi */
  w: string | null;
  /** category, null where the list prints no category column */
  c: RateCategory | null;
  /** printed page */
  p: string;
  /**
   * non-agricultural ₹/sq m, one entry per band of the chunk's schedule, in its declared order.
   * Null where this row does not print that column. Three long for Ayodhya, four for Lucknow.
   */
  r: (number | null)[];
  /** commercial ₹/sq m: [shop, office, godown]; null where the row prints no commercial line */
  m: [number, number, number] | null;
  /** agricultural lakh ₹/hectare: [nh, state, link, chakmarg, abadi, general] */
  a: (number | null)[];
};

export type RateChunk = {
  cityId: string;
  tehsil: string;
  effectiveFrom: string;
  /**
   * The schedule's road bands, in the same order as every row's `r`. Carried in the chunk so a
   * table can label its own columns without knowing which city it is showing.
   */
  bands: RoadBand[];
  rows: ChunkRow[];
};

export const toChunkRow = (r: RateRow, bandKeys: string[]): ChunkRow => ({
  i: r.id,
  s: r.slug,
  n: r.nameEn,
  h: r.nameHi,
  w: r.wardHi,
  c: r.category,
  p: r.page,
  r: bandKeys.map((k) => r.nonAgri[k] ?? null),
  m: r.commercial ? [r.commercial.shop, r.commercial.office, r.commercial.godown] : null,
  a: [r.agriLakhPerHa.nh, r.agriLakhPerHa.state, r.agriLakhPerHa.link, r.agriLakhPerHa.chakmarg, r.agriLakhPerHa.abadi, r.agriLakhPerHa.general],
});

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
import type { RateCategory, RateRow } from "./schemas";

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
  /** category */
  c: RateCategory;
  /** printed page */
  p: string;
  /** non-agricultural ₹/sq m: [lt9m, 9–18 m, ≥18 m] */
  r: [number, number, number];
  /** commercial ₹/sq m: [shop, office, godown] */
  m: [number, number, number];
  /** agricultural lakh ₹/hectare: [nh, state, link, chakmarg, abadi, general] */
  a: (number | null)[];
};

export type RateChunk = {
  cityId: string;
  tehsil: string;
  effectiveFrom: string;
  rows: ChunkRow[];
};

export const toChunkRow = (r: RateRow): ChunkRow => ({
  i: r.id,
  s: r.slug,
  n: r.nameEn,
  h: r.nameHi,
  w: r.wardHi,
  c: r.category,
  p: r.page,
  r: [r.nonAgri.lt9m, r.nonAgri.m9to18, r.nonAgri.ge18m],
  m: [r.commercial.shop, r.commercial.office, r.commercial.godown],
  a: [r.agriLakhPerHa.nh, r.agriLakhPerHa.state, r.agriLakhPerHa.link, r.agriLakhPerHa.chakmarg, r.agriLakhPerHa.abadi, r.agriLakhPerHa.general],
});

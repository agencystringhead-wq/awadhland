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
import type { RateCategory, RateRow, RateSchedule, RoadBand } from "./schemas";

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
  /** printed page, null where the transcription carries none (Gorakhpur) */
  p: string | null;
  /**
   * non-agricultural ₹/sq m, one entry per band of the chunk's schedule, in its declared order.
   * Null where this row does not print that column. Three long for Ayodhya, four for Lucknow.
   */
  r: (number | null)[];
  /** commercial ₹/sq m, one entry per commercial column; null where the row prints no commercial line */
  m: (number | null)[] | null;
  /** agricultural lakh ₹/hectare, one entry per agricultural column */
  a: (number | null)[];
};

/** A labelled column of the commercial or agricultural view. */
export type TableColumn = { key: string; labelEn: string; labelHi: string };

/**
 * The columns a tehsil's table shows, per view.
 *
 * Land: the schedule's road bands, under this SRO's own labels. Commercial: the schedule's
 * commercial kinds. Agricultural: Ayodhya and Lucknow print one figure per frontage, six columns;
 * Gorakhpur prints a frontage × plot-size grid, which the table shows as its four frontages at the
 * largest-plot slab -- the one figure per frontage every priced row has. The full grid is on the
 * village page.
 */
export type TableColumns = { bands: RoadBand[]; commercial: TableColumn[]; agri: TableColumn[] };

const SIX_AGRI: TableColumn[] = [
  { key: "nh", labelEn: "National highway", labelHi: "राष्ट्रीय राजमार्ग" },
  { key: "state", labelEn: "State or district road", labelHi: "राज्य या जनपदीय मार्ग" },
  { key: "link", labelEn: "Link road", labelHi: "सम्पर्क मार्ग" },
  { key: "chakmarg", labelEn: "Chakmarg", labelHi: "चकमार्ग" },
  { key: "abadi", labelEn: "Adjoining abadi", labelHi: "आबादी से लगी" },
  { key: "general", labelEn: "General", labelHi: "सामान्य" },
];

const DEFAULT_COMMERCIAL: TableColumn[] = [
  { key: "shop", labelEn: "Shop", labelHi: "दुकान" },
  { key: "office", labelEn: "Office", labelHi: "कार्यालय" },
  { key: "godown", labelEn: "Godown", labelHi: "गोदाम" },
];

export function tableColumns(schedule: RateSchedule, sro: string): TableColumns {
  const doc = schedule.sourceDocs.find((d) => d.sro === sro);
  const gridRow = schedule.rows.find((r) => r.sro === sro && r.agriGrid);
  const top = gridRow?.agriGrid?.slabsHa[2];
  return {
    bands: doc?.roadBands ?? schedule.roadBands,
    commercial: schedule.commercialKinds ?? DEFAULT_COMMERCIAL,
    agri: top
      ? [
          { key: "nh", labelEn: `NH / state highway, over ${top.toFixed(3)} ha`, labelHi: `राजमार्ग, ${top.toFixed(3)} हे. से अधिक` },
          { key: "district", labelEn: `District road, over ${top.toFixed(3)} ha`, labelHi: `जनपदीय मार्ग, ${top.toFixed(3)} हे. से अधिक` },
          { key: "link", labelEn: `Link road, over ${top.toFixed(3)} ha`, labelHi: `सम्पर्क मार्ग, ${top.toFixed(3)} हे. से अधिक` },
          { key: "other", labelEn: `Elsewhere, over ${top.toFixed(3)} ha`, labelHi: `अन्यत्र, ${top.toFixed(3)} हे. से अधिक` },
        ]
      : SIX_AGRI,
  };
}

export type RateChunk = {
  cityId: string;
  tehsil: string;
  effectiveFrom: string;
  /**
   * The SRO's road bands, in the same order as every row's `r`. Carried in the chunk so a table
   * can label its own columns without knowing which city it is showing.
   */
  bands: RoadBand[];
  commercial: TableColumn[];
  agri: TableColumn[];
  rows: ChunkRow[];
};

export const toChunkRow = (r: RateRow, cols: TableColumns): ChunkRow => ({
  i: r.id,
  s: r.slug,
  n: r.nameEn,
  h: r.nameHi,
  w: r.wardHi,
  c: r.category,
  p: r.page,
  r: cols.bands.map((b) => r.nonAgri[b.key] ?? null),
  m: r.commercial ? cols.commercial.map((k) => r.commercial![k.key] ?? null) : null,
  a: r.agriGrid
    ? cols.agri.map((k) => r.agriGrid![k.key as "nh" | "district" | "link" | "other"]?.[3] ?? null)
    : cols.agri.map((k) => r.agriLakhPerHa[k.key as keyof RateRow["agriLakhPerHa"]] ?? null),
});

/**
 * npm run rates:import-gorakhpur
 *
 * Turns the hand-transcribed Gorakhpur मूल्यांकन दर-सूची (all 8 SROs) into
 * data/rates/gorakhpur-2016-08-03.json.
 *
 * Gorakhpur is its own script, as Lucknow is, because its list is shaped differently again:
 *
 * - Four road-width columns, but each SRO prints them under its own widths ("up to 2 m" in most,
 *   "up to 3 m" in Sadar-1 and -2, "no road" in Gola), so the schedule declares the keys once and
 *   each SRO's source doc carries its own labels. There is no column over 12 m; the 2025 rules
 *   value that as the 9–12 m rate +30% (data/valuationRulesByCity.json).
 * - Farmland is priced on a grid, four frontages by four plot sizes, with slab limits that differ
 *   by SRO. Kept in LAKH ₹ per hectare as printed, like Ayodhya and Lucknow.
 * - Commercial is a single-shop land rate plus carpet-area rates for other shops and offices, and
 *   no godown. Sadar-2's 2015 list prices commercial property by monthly rent instead.
 * - The village rows carry no printed page, so their source line names the SRO and date only.
 *
 * What it does not do is change a figure. A printed 0 or dash is stored as null ("not priced"),
 * and the transcriber's flags stay as internal notes. The one correction in the data, Sahjanwa's
 * 78 → 38, was made by the transcriber on the strength of an AIG Registration order printed at
 * the end of the same list, and is flagged on each row it touches.
 *
 * Two kinds of row are not imported one-to-one:
 * - A village printed with a different V-code or name in two tables comes out of the
 *   transcription as two partial rows. Where both halves agree on SRO, serial, V-code and name
 *   they are merged into one row (four villages; two Sahjanwa villages came out in three parts).
 * - A row with no figure at all is skipped (Sadar-2's two sub-rows of serial 260, whose name is
 *   cut off in the print). Both are logged.
 *
 * Re-running overwrites the output file. Nothing here runs at build time.
 */
import fs from "node:fs";
import path from "node:path";
import { romanise } from "../lib/devanagari";
import {
  rateScheduleSchema,
  type AgriGrid,
  type RateCategory,
  type RateRow,
  type RateSchedule,
  type RoadBand,
  type RoadSegmentRow,
} from "../lib/schemas";

const CITY = "gorakhpur";
const EFFECTIVE = "2016-08-03";
/**
 * The order that keeps the list in force, not the one that published it: the Collector's order
 * of 04-08-2020 extends the 03-08-2016 list "with all its provisions". The 2016 publishing order
 * has not been read off the scans.
 */
const ORDER_DATE = "2020-08-04";
const SRC = path.join("data", "sources", "circle-rates", "gorakhpur", "transcribed-2016-08-03");
const OUT = path.join("data", "rates", `${CITY}-${EFFECTIVE}.json`);
const TODAY = new Date().toISOString().slice(0, 10);

/** CSV SRO codes -> tehsils.json ids. */
const SRO_IDS: Record<string, string> = {
  sadar1: "sadar1",
  sadar2: "sadar2",
  gola: "gola",
  khajni: "khajni",
  basgaon: "bansgaon",
  sahjanwa: "sahjanwa",
  campier: "campierganj",
  chauri: "chaurichaura",
};

/* ---------------------------------------------------------------------- bands */

/** The four printed columns. Labels here are the city-level defaults; each SRO overrides them. */
const ROAD_BANDS: RoadBand[] = [
  { key: "basic", labelEn: "No road or narrow road", labelHi: "सड़क नहीं या संकरी सड़क", minM: null, maxM: 2, separateTable: true },
  { key: "first", labelEn: "Up to 5 m", labelHi: "5 मीटर तक", minM: 2, maxM: 5 },
  { key: "m5to9", labelEn: "5–9 m", labelHi: "5–9 मीटर", minM: 5, maxM: 9 },
  { key: "m9to12", labelEn: "9–12 m", labelHi: "9–12 मीटर", minM: 9, maxM: 12 },
];

/** basic_band as printed -> label and upper bound. */
const BASIC_BAND: Record<string, { en: string; hi: string; maxM: number }> = {
  "upto 2 m": { en: "Up to 2 m", hi: "2 मीटर तक", maxM: 2 },
  "upto 3 m": { en: "Up to 3 m", hi: "3 मीटर तक", maxM: 3 },
  "no road": { en: "No road", hi: "सड़क नहीं", maxM: 1 },
  "no road / elsewhere": { en: "No road / elsewhere", hi: "सड़क नहीं / अन्यत्र", maxM: 0.5 },
};

/** road_first_band_label as printed -> label and bounds. */
const FIRST_BAND: Record<string, { en: string; hi: string; minM: number | null }> = {
  "2-5 m": { en: "2–5 m", hi: "2–5 मीटर", minM: 2 },
  "3-5 m": { en: "3–5 m", hi: "3–5 मीटर", minM: 3 },
  "1-5 m": { en: "1–5 m", hi: "1–5 मीटर", minM: 1 },
  "upto 5 m": { en: "Up to 5 m", hi: "5 मीटर तक", minM: null },
};

const COMMERCIAL_KINDS = [
  { key: "shop", labelEn: "Single shop (land)", labelHi: "एकल दुकान (भूमि)" },
  { key: "shopMulti", labelEn: "Other shops (carpet)", labelHi: "अन्य दुकानें (कारपेट)" },
  { key: "office", labelEn: "Office (carpet)", labelHi: "कार्यालय (कारपेट)" },
];

const SRO_NAMES: Record<string, { en: string; hi: string }> = {
  sadar1: { en: "Sadar-1", hi: "सदर-1" },
  sadar2: { en: "Sadar-2", hi: "सदर-2" },
  gola: { en: "Gola", hi: "गोला" },
  khajni: { en: "Khajni", hi: "खजनी" },
  bansgaon: { en: "Bansgaon", hi: "बांसगांव" },
  sahjanwa: { en: "Sahjanwa", hi: "सहजनवा" },
  campierganj: { en: "Campierganj", hi: "कैम्पियरगंज" },
  chaurichaura: { en: "Chauri Chaura", hi: "चौरी चौरा" },
};

/* ---------------------------------------------------------------------- notes */

const NOTE_2016 = {
  en: "Gorakhpur has had no new rate list since 2016. These rates are from the 3 August 2016 list, kept in force by the Collector's order of 4 August 2020. Only the valuation rules were updated, in 2025.",
  hi: "गोरखपुर में 2016 के बाद कोई नई दर सूची नहीं आई। ये दरें 03-08-2016 की सूची की हैं, जिसे कलेक्टर के 04-08-2020 के आदेश ने लागू रखा है। 2025 में केवल मूल्यांकन के नियम बदले।",
};

/** Sadar-2 and Campierganj: IGRSUP serves the 2015 list, so the 2016 line would be wrong for them. */
const noteFor2015 = (sro: string) =>
  sro === "campierganj"
    ? {
        en: "IGRSUP serves the 1 August 2015 list for this sub-registrar office, and these rates are from it, with the commercial rates from the amendment effective 19 January 2016. The Collector's order of 4 August 2020 keeps the district's list in force; only the valuation rules were updated, in 2025. Confirm at the SRO office that no separate 2016 list applies.",
        hi: "इस उप निबंधक कार्यालय के लिए आईजीआरएसयूपी 01-08-2015 की सूची देता है, और ये दरें उसी से हैं; व्यावसायिक दरें 19-01-2016 से लागू संशोधन की हैं। कलेक्टर का 04-08-2020 का आदेश ज़िले की सूची लागू रखता है; 2025 में केवल मूल्यांकन के नियम बदले। एसआरओ कार्यालय से पुष्टि करें कि 2016 की अलग सूची लागू नहीं है।",
      }
    : {
        en: "IGRSUP serves the 1 August 2015 list for this sub-registrar office, and these rates are from it. The Collector's order of 4 August 2020 keeps the district's list in force; only the valuation rules were updated, in 2025. Confirm at the SRO office that no separate 2016 list applies.",
        hi: "इस उप निबंधक कार्यालय के लिए आईजीआरएसयूपी 01-08-2015 की सूची देता है, और ये दरें उसी से हैं। कलेक्टर का 04-08-2020 का आदेश ज़िले की सूची लागू रखता है; 2025 में केवल मूल्यांकन के नियम बदले। एसआरओ कार्यालय से पुष्टि करें कि 2016 की अलग सूची लागू नहीं है।",
      };

/* ------------------------------------------------------------------------- csv */

/** Minimal RFC-4180 reader: quoted fields, embedded commas, CRLF. Same as import-lucknow-rates.ts. */
function readCsv(file: string): Record<string, string>[] {
  const text = fs.readFileSync(file, "utf8").replace(/^﻿/, "").trim();
  const split = (line: string) => {
    const out: string[] = [];
    let cur = "";
    let quoted = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (quoted && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else quoted = !quoted;
      } else if (ch === "," && !quoted) {
        out.push(cur);
        cur = "";
      } else cur += ch;
    }
    out.push(cur);
    return out;
  };
  const lines = text.split(/\r?\n/);
  const head = split(lines[0]).map((h) => h.trim());
  return lines.slice(1).map((l) => {
    const cells = split(l);
    return Object.fromEntries(head.map((h, i) => [h, (cells[i] ?? "").trim()]));
  });
}

/** A printed figure, or null where the cell is blank or a printed 0 (not priced). */
function num(v: string, where: string): number | null {
  if (v === "" || v === "0") return null;
  const n = Number(v.replace(/,/g, ""));
  if (!Number.isFinite(n) || n < 0) throw new Error(`${where}: cannot read "${v}" as a number`);
  return n === 0 ? null : n;
}

function category(v: string, where: string): RateCategory | null {
  const map: Record<string, RateCategory> = {
    ग्रामीण: "rural",
    "ग्रामीण क्षेत्र": "rural",
    नगरीय: "urban",
    "नगरीय क्षेत्र": "urban",
    अर्द्धनगरीय: "semi-urban",
    अर्धनगरीय: "semi-urban",
    "अर्ध नगरीय": "semi-urban",
  };
  if (v === "") return null;
  // "श्रेणी अ" is printed once (Sadar-2 serial 123) and is not a category the list defines; left null.
  if (v === "श्रेणी अ") return null;
  const hit = map[v];
  if (!hit) throw new Error(`${where}: unknown category "${v}"`);
  return hit;
}

const isoFromDmy = (dmy: string) => dmy.split("-").reverse().join("-");

/* ------------------------------------------------------------------------ merge */

type Raw = Record<string, string>;

/**
 * Merge the halves of a village the transcription split across tables. Only rows that agree on
 * SRO, serial, V-code and name are merged; a field both halves print must print the same value,
 * or the import stops.
 */
function mergeExact(raw: Raw[]): { rows: Raw[]; merged: string[] } {
  const out: Raw[] = [];
  const byKey = new Map<string, Raw>();
  const merged: string[] = [];
  for (const r of raw) {
    if (!r.serial) {
      out.push(r);
      continue;
    }
    const key = [r.sro, r.serial, r.vcode, r.village_hi].join("|");
    const prev = byKey.get(key);
    if (!prev) {
      const copy = { ...r };
      byKey.set(key, copy);
      out.push(copy);
      continue;
    }
    for (const [k, v] of Object.entries(r)) {
      if (k === "flag") {
        prev.flag = [prev.flag, v].filter(Boolean).join(" | ");
        continue;
      }
      if (v === "") continue;
      if (prev[k] === "" || prev[k] === "0") prev[k] = v;
      else if (prev[k] !== v && !["category", "pargana_hi", "comm_source"].includes(k)) {
        throw new Error(`merge ${key}: "${k}" is "${prev[k]}" in one half and "${v}" in the other`);
      }
    }
    prev.flag = [prev.flag, "merged from two partial rows (split across tables in the transcription)"].filter(Boolean).join(" | ");
    merged.push(`${r.sro} ${r.serial} ${r.vcode} ${r.village_hi}`);
  }
  return { rows: out, merged };
}

/* ------------------------------------------------------------------------- rows */

const AGRI_COLS = ["nh", "dist", "link", "other"] as const;
const SLABS = ["a", "b", "c", "d"] as const;

function buildRows(): { rows: RateRow[]; merged: string[]; skipped: string[]; bandsBySro: Map<string, RoadBand[]>; datesBySro: Map<string, string> } {
  const { rows: raw, merged } = mergeExact(readCsv(path.join(SRC, "gorakhpur-all-rates.csv")));
  const rows: RateRow[] = [];
  const skipped: string[] = [];
  const seen = new Map<string, number>();
  const bandsBySro = new Map<string, RoadBand[]>();
  const datesBySro = new Map<string, string>();

  for (const r of raw) {
    const sro = SRO_IDS[r.sro];
    if (!sro) throw new Error(`unknown sro "${r.sro}" for ${r.village_hi}`);
    const where = `${sro}/${r.serial || "?"}/${r.village_hi}`;

    /* this SRO's band labels and date, which must not vary within it */
    const basic = BASIC_BAND[r.basic_band];
    const first = FIRST_BAND[r.road_first_band_label];
    if (!basic || !first) throw new Error(`${where}: unknown band label "${r.basic_band}" / "${r.road_first_band_label}"`);
    const bands: RoadBand[] = [
      { key: "basic", labelEn: basic.en, labelHi: basic.hi, minM: null, maxM: basic.maxM, separateTable: true },
      { key: "first", labelEn: first.en, labelHi: first.hi, minM: first.minM, maxM: 5 },
      ROAD_BANDS[2],
      ROAD_BANDS[3],
    ];
    const prevBands = bandsBySro.get(sro);
    if (prevBands && JSON.stringify(prevBands) !== JSON.stringify(bands)) throw new Error(`${where}: band labels differ within ${sro}`);
    bandsBySro.set(sro, bands);
    const date = isoFromDmy(r.list_effective_date.slice(0, 10));
    const prevDate = datesBySro.get(sro);
    if (prevDate && prevDate !== date) throw new Error(`${where}: effective date differs within ${sro}`);
    datesBySro.set(sro, date);

    const nonAgri: Record<string, number> = {};
    for (const [col, key] of [
      ["basic_rate", "basic"],
      ["road_first_band", "first"],
      ["road_5to9m", "m5to9"],
      ["road_9to12m", "m9to12"],
    ] as const) {
      const v = num(r[col], `${where} ${col}`);
      if (v !== null) nonAgri[key] = v;
    }

    const shop = num(r.shop_single_land, `${where} shop_single_land`);
    const shopMulti = num(r.shop_multi, `${where} shop_multi`);
    const office = num(r.office, `${where} office`);
    const rent = num(r.commercial_rent_per_sqm, `${where} commercial_rent_per_sqm`);

    const slabs = r.agri_slabs.replace(" ha", "").split("/").map(Number);
    if (slabs.length !== 3 || slabs.some((x) => !(x > 0))) throw new Error(`${where}: cannot read agri_slabs "${r.agri_slabs}"`);
    const grid = Object.fromEntries(
      AGRI_COLS.map((g) => [g === "dist" ? "district" : g, SLABS.map((s) => num(r[`${g}_${s}`], `${where} ${g}_${s}`))]),
    ) as Omit<AgriGrid, "slabsHa">;
    const anyAgri = Object.values(grid).some((xs) => xs.some((x) => x !== null));

    if (Object.keys(nonAgri).length === 0 && shop === null && rent === null && !anyAgri) {
      skipped.push(`${where}: no figure in any table${r.flag ? ` (${r.flag})` : ""}`);
      continue;
    }

    // Sadar-2's sub-rows print no serial of their own; they sit under serial 260.
    const serial = Number(r.serial || /sub-row of serial (\d+)/.exec(r.flag)?.[1]);
    if (!Number.isInteger(serial) || serial <= 0) throw new Error(`${where}: bad serial "${r.serial}"`);

    /*
     * 47 V-codes are printed for more than one row, so the id comes from the serial, with a
     * letter for a repeated serial. Prefixed with the city: Lucknow has a sadar1 and a sadar2 too,
     * and row ids share one index across cities.
     */
    const stem = `gkp-${sro}-s${serial}`;
    const n = (seen.get(stem) ?? 0) + 1;
    seen.set(stem, n);
    const id = n === 1 ? stem : `${stem}-${String.fromCharCode(96 + n)}`;

    const { nameEn, slug } = romanise(r.village_hi);
    rows.push({
      id,
      sro,
      page: null,
      serial,
      vcode: r.vcode || null,
      nameHi: r.village_hi,
      nameEn,
      slug,
      // The column is headed pargana; in the Sadar lists it is the mohalla-ward. The page labels
      // the field "ward or pargana", which fits both.
      wardHi: r.pargana_hi || null,
      category: category(r.category, where),
      nonAgri,
      commercial: shop !== null && shopMulti !== null && office !== null ? { shop, shopMulti, office } : null,
      covered: null,
      // Only `general` is set, from the grid's "elsewhere, largest plots" cell: the figure the
      // gorakhpur-importer.csv shape and the city summaries use. Everything else reads agriGrid.
      agriLakhPerHa: { nh: null, state: null, link: null, chakmarg: null, abadi: null, general: grid.other[3] },
      agriGrid: anyAgri ? { slabsHa: [slabs[0], slabs[1], slabs[2]], ...grid } : null,
      commercialRent: rent,
      commercialFrom: r.comm_source === "amend2016" ? "2016-01-19" : null,
      note: r.flag || null,
    });
  }

  /* Slug collisions within an SRO: every member takes its V-code or serial, as in Lucknow. */
  const bySlug = new Map<string, RateRow[]>();
  for (const r of rows) {
    const k = `${r.sro}/${r.slug}`;
    bySlug.set(k, [...(bySlug.get(k) ?? []), r]);
  }
  for (const group of bySlug.values()) {
    if (group.length < 2) continue;
    const vcodes = new Set(group.map((r) => r.vcode));
    // A V-code only tells the group apart when no two members share one.
    const byVcode = vcodes.size === group.length && !vcodes.has(null);
    for (const r of group) r.slug = `${r.slug}-${byVcode ? r.vcode : `s${r.serial}`}`;
  }
  // A suffixed slug can still land on another row's plain one; serials settle it.
  const taken = new Map<string, number>();
  for (const r of rows) taken.set(`${r.sro}/${r.slug}`, (taken.get(`${r.sro}/${r.slug}`) ?? 0) + 1);
  for (const r of rows) if ((taken.get(`${r.sro}/${r.slug}`) ?? 0) > 1) r.slug = `${r.slug}-${r.id.split("-").slice(-1)[0]}`;

  return { rows, merged, skipped, bandsBySro, datesBySro };
}

/* ---------------------------------------------------------------------- segments */

/**
 * प्रारूप-3 road stretches. One printed stretch lists every village it runs through, one CSV row
 * each. Matched to a rate row by V-code within the SRO, narrowed by name where the V-code is
 * printed for more than one village, then by name alone. What stays ambiguous or unmatched keeps
 * rateRowId null and still shows on the tehsil page.
 */
function buildSegments(rows: RateRow[]): { segments: RoadSegmentRow[]; unmatched: number; ambiguous: number } {
  const segments: RoadSegmentRow[] = [];
  let unmatched = 0;
  let ambiguous = 0;
  const seenId = new Map<string, number>();
  const clean = (s: string) => s.replace(/,\s*$/, "").trim();

  for (const s of readCsv(path.join(SRC, "gorakhpur-road-segments.csv"))) {
    const sro = SRO_IDS[s.sro];
    if (!sro) throw new Error(`unknown sro "${s.sro}" in road segments`);
    const where = `${sro} p${s.page} segment ${s.segment_no} ${s.village_hi}`;
    const mine = rows.filter((r) => r.sro === sro);
    const village = clean(s.village_hi);

    let candidates = s.vcode ? mine.filter((r) => r.vcode === s.vcode) : [];
    if (candidates.length > 1) {
      const named = candidates.filter((r) => r.nameHi === village);
      candidates = named.length > 0 ? named : candidates;
    }
    if (candidates.length === 0) candidates = mine.filter((r) => r.nameHi === village);
    let match: RateRow | null = null;
    if (candidates.length === 1) match = candidates[0];
    else if (candidates.length > 1) ambiguous++;
    else unmatched++;

    const nonAgri = num(s.land_rate, `${where} land_rate`);
    const shop = num(s.shop_single_land, `${where} shop_single_land`);
    const shopMulti = num(s.shop_multi, `${where} shop_multi`);
    const office = num(s.office, `${where} office`);
    const rent = /commercial_rent_pm_per_sqm=(\d+)|shop_rent_per_sqm=(\d+)/.exec(s.extra);
    const commercialRent = rent ? Number(rent[1] ?? rent[2]) : null;
    if (nonAgri === null && shop === null && commercialRent === null) throw new Error(`${where}: no rate at all`);

    const idStem = `gkp-${sro}-p${s.page}-s${s.segment_no}`;
    const seen = (seenId.get(idStem) ?? 0) + 1;
    seenId.set(idStem, seen);

    segments.push({
      id: seen === 1 ? idStem : `${idStem}-${seen}`,
      sro,
      page: s.page,
      segmentHi: s.segment_hi,
      segmentEn: romanise(s.segment_hi).nameEn,
      villageHi: village,
      rateRowId: match?.id ?? null,
      nonAgri,
      shop,
      office,
      godown: null,
      shopMulti,
      commercialRent,
      note: [s.extra || null, s.flag || null].filter(Boolean).join("; ") || null,
    });
  }
  return { segments, unmatched, ambiguous };
}

/* ------------------------------------------------------------------------- main */

function main() {
  const { rows, merged, skipped, bandsBySro, datesBySro } = buildRows();
  const { segments, unmatched, ambiguous } = buildSegments(rows);

  const sros = Object.values(SRO_IDS);
  const schedule: RateSchedule = {
    cityId: CITY,
    effectiveFrom: EFFECTIVE,
    orderDate: ORDER_DATE,
    sourceDocs: sros.map((sro) => {
      const effectiveFrom = datesBySro.get(sro)!;
      return {
        sro,
        pdfPath: `data/sources/circle-rates/${CITY}/${CITY}-${sro}-${effectiveFrom}.pdf`,
        archiveUrl: null,
        igrsupUrl: "https://igrsup.gov.in/",
        effectiveFrom,
        roadBands: bandsBySro.get(sro)!,
        ...(effectiveFrom === EFFECTIVE ? {} : { inForceNote: noteFor2015(sro) }),
      };
    }),
    roadBands: ROAD_BANDS,
    commercialKinds: COMMERCIAL_KINDS,
    inForceNote: NOTE_2016,
    rows,
    roadSegments: segments,
    sources: [
      {
        label: "IGRSUP मूल्यांकन दर-सूची, Gorakhpur district, effective 03-08-2016 (Sadar-2 and Campierganj: 01-08-2015), kept in force by the Collector's order of 04-08-2020",
        url: "https://igrsup.gov.in/",
        accessedAt: TODAY,
      },
    ],
    updatedAt: TODAY,
    todo: [
      "The village rows carry no printed page; add page numbers to the transcription so the source line can cite them.",
      "Sadar-2 and Campierganj: IGRSUP serves the 01-08-2015 list. Confirm at those two SRO offices that no separate 2016 list exists.",
      "orderDate is the 04-08-2020 order that keeps the list in force; the 2016 publishing order has not been read off the scans.",
      "sourceDocs[].pdfPath names the scans this was transcribed from; the files are gitignored and archiveUrl is null until R2 exists.",
      "Chauri Chaura serials 103–119: one page of the road-width table is missing from the PDF, so those villages carry the basic rate only.",
    ],
  };

  const parsed = rateScheduleSchema.safeParse(schedule);
  if (!parsed.success) {
    console.error(JSON.stringify(parsed.error.issues.slice(0, 20), null, 2));
    process.exit(1);
  }
  fs.writeFileSync(OUT, JSON.stringify(parsed.data, null, 2) + "\n");

  const per = sros.map((s) => `${SRO_NAMES[s].en} ${rows.filter((r) => r.sro === s).length}`).join(", ");
  console.log(`ok   rates:import-gorakhpur: ${rows.length} rows (${per}), ${segments.length} road segments -> ${OUT}`);
  console.log(`     segments: ${segments.length - unmatched - ambiguous} linked to a village, ${ambiguous} ambiguous, ${unmatched} unmatched`);
  console.log(`     merged ${merged.length} split village(s):\n       ${merged.join("\n       ")}`);
  console.log(`     skipped ${skipped.length} row(s) with no figure:\n       ${skipped.join("\n       ")}`);
  console.log(`     no land rate: ${rows.filter((r) => Object.keys(r.nonAgri).length === 0).length}; no agri grid: ${rows.filter((r) => !r.agriGrid).length}; flagged: ${rows.filter((r) => r.note).length}`);
}

main();

/**
 * npm run rates:import-lucknow
 *
 * Turns the hand-transcribed Lucknow मूल्यांकन सूची into data/rates/lucknow-2025-08-01.json.
 *
 * Lucknow is a separate script from import-rate-list.ts rather than a flag on it, because the two
 * lists are shaped differently enough that one parameterised reader would be harder to check than
 * two plain ones. Lucknow prints four road-width columns to Ayodhya's three, adds covered-area
 * construction rates, uses different agricultural frontage columns, and leaves the category column
 * off three of its seven SROs entirely.
 *
 * What it does not do is change any figure. Every value is stored in the unit the government
 * prints it in -- land and commercial in ₹ per sq m, agricultural in LAKH ₹ per hectare, the same
 * as Ayodhya -- and rows the transcriber flagged keep the printed figure with the flag as an
 * internal note. The README beside the CSVs lists the oddities that survive on purpose: an office
 * rate of 350000 that is probably 35000, a 9-12 m band cheaper than the <9 m one. They are
 * printed that way, so they ship that way.
 *
 * Re-running overwrites the output file. Nothing here runs at build time.
 */
import fs from "node:fs";
import path from "node:path";
import { romanise } from "../lib/devanagari";
import { rateScheduleSchema, type RateCategory, type RateRow, type RateSchedule, type RoadSegmentRow } from "../lib/schemas";

const CITY = "lucknow";
const EFFECTIVE = "2025-08-01";
const ORDER_DATE = "2025-07-31";
const SRC = path.join("data", "sources", "circle-rates", "lucknow", "transcribed-2025-08-01");
const OUT = path.join("data", "rates", `${CITY}-${EFFECTIVE}.json`);
const TODAY = new Date().toISOString().slice(0, 10);

/**
 * Lucknow's four printed road-width columns.
 *
 * Ayodhya's middle band spans 9-18 m; Lucknow splits it at 12. Nothing downstream assumes either
 * shape -- the keys live in the schedule and every reader goes through lib/rates.
 */
const ROAD_BANDS = [
  { key: "lt9m", labelEn: "Under 9 m", labelHi: "9 मीटर से कम", minM: null, maxM: 9 },
  { key: "m9to12", labelEn: "9–12 m", labelHi: "9–12 मीटर", minM: 9, maxM: 12 },
  { key: "m12to18", labelEn: "12–18 m", labelHi: "12–18 मीटर", minM: 12, maxM: 18 },
  { key: "ge18m", labelEn: "18 m and over", labelHi: "18 मीटर और अधिक", minM: 18, maxM: null },
];

/** CSV column -> band key, in printed order. */
const BAND_COLUMNS: [string, string][] = [
  ["nonagri_lt9m", "lt9m"],
  ["nonagri_9to12m", "m9to12"],
  ["nonagri_12to18m", "m12to18"],
  ["nonagri_ge18m", "ge18m"],
];

/** The seven SROs in the transcription, plus the three whose lists have not arrived. */
const SRO_NAMES: Record<string, { en: string; hi: string }> = {
  sadar1: { en: "Sadar-1", hi: "सदर-1" },
  sadar2: { en: "Sadar-2", hi: "सदर-2" },
  sadar3: { en: "Sadar-3", hi: "सदर-3" },
  sadar5: { en: "Sadar-5", hi: "सदर-5" },
  mohanlalganj: { en: "Mohanlalganj", hi: "मोहनलालगंज" },
  sarojininagar: { en: "Sarojini Nagar", hi: "सरोजनी नगर" },
  sarojininagar2: { en: "Sarojini Nagar-2", hi: "सरोजनी नगर-2" },
};

/* ------------------------------------------------------------------------- csv */

/** Minimal RFC-4180 reader: quoted fields, embedded commas, CRLF. */
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
  return lines.slice(1).map((l) => Object.fromEntries(head.map((h, i) => [h, (split(l)[i] ?? "").trim()])));
}

/** A printed figure, or null where the cell is blank. Never zero: blank means not priced. */
function num(v: string, where: string): number | null {
  if (v === "") return null;
  const n = Number(v.replace(/,/g, ""));
  if (!Number.isFinite(n) || n <= 0) throw new Error(`${where}: cannot read "${v}" as a positive number`);
  return n;
}

/** Categories as printed. Blank stays null: three SROs print no category column at all. */
function category(v: string, where: string): RateCategory | null {
  if (v === "") return null;
  const map: Record<string, RateCategory> = {
    "नगरीय क्षेत्र": "urban",
    नगरीय: "urban",
    "अर्द्धनगरीय": "semi-urban",
    "अर्धनगरीय": "semi-urban",
    "ग्रामीण": "rural",
  };
  const hit = map[v];
  if (!hit) throw new Error(`${where}: unknown category "${v}"`);
  return hit;
}

/**
 * pargana_hi holds either a ward ("ward 043 गणेशगंज") or a pargana ("101 मोहनलाल गंज").
 *
 * The distinction is real: a ward is a municipal subdivision and belongs in the ward column the
 * page already has, while a pargana is a revenue unit and is not a ward. Only the four Sadar SROs
 * print wards; the other three print parganas, so their rows carry no ward.
 */
function wardOrPargana(v: string): { wardHi: string | null; parganaHi: string | null } {
  if (v === "") return { wardHi: null, parganaHi: null };
  return /^ward\b/i.test(v) ? { wardHi: v.replace(/^ward\s*/i, "").trim(), parganaHi: null } : { wardHi: null, parganaHi: v };
}

/* ---------------------------------------------------------------------- rows */

function buildRows(): RateRow[] {
  const raw = readCsv(path.join(SRC, "lucknow-all-rates.csv"));
  const rows: RateRow[] = [];
  const seen = new Map<string, number>();

  for (const r of raw) {
    const sro = r.sro;
    if (!SRO_NAMES[sro]) throw new Error(`unknown sro "${sro}" for ${r.village_hi}`);
    const where = `${sro}/${r.village_hi}`;
    const serial = Number(r.serial);
    if (!Number.isInteger(serial) || serial <= 0) throw new Error(`${where}: bad serial "${r.serial}"`);

    /*
     * Sadar-2 prints five duplicate serials and one duplicate V-code, so its id has to come from
     * the V-code, and the V-code alone is not quite enough either: 1060 is printed twice, for
     * बाघामऊ and बाघामऊ (शालीमार वन वर्ल्ड). The second occurrence gets a -b suffix, matching how
     * the brief names it, so both keep a stable id and a distinct URL.
     */
    const vcode = r.vcode || null;
    const stem = `${sro}-${vcode ?? `s${serial}`}`;
    const n = (seen.get(stem) ?? 0) + 1;
    seen.set(stem, n);
    const id = n === 1 ? stem : `${stem}-${String.fromCharCode(96 + n)}`;

    const nonAgri: Record<string, number> = {};
    for (const [col, key] of BAND_COLUMNS) {
      const v = num(r[col], `${where} ${col}`);
      if (v !== null) nonAgri[key] = v;
    }
    if (Object.keys(nonAgri).length === 0) throw new Error(`${where}: no land rate in any band`);

    const shop = num(r.shop, `${where} shop`);
    const office = num(r.office, `${where} office`);
    const godown = num(r.godown, `${where} godown`);
    const coveredOrdinary = num(r.covered_ordinary, `${where} covered_ordinary`);
    const coveredPremium = num(r.covered_premium, `${where} covered_premium`);

    const { wardHi } = wardOrPargana(r.pargana_hi);
    const { nameEn, slug } = romanise(r.village_hi);

    rows.push({
      id,
      sro,
      // प्रारूप-2 is the page the name and the <9 m rate come from, so it is the one to cite.
      page: r.page_p2,
      serial,
      vcode,
      nameHi: r.village_hi,
      nameEn,
      slug,
      wardHi,
      category: category(r.category, where),
      nonAgri,
      // भरवारा prints land and covered rates but no commercial line.
      commercial: shop !== null && office !== null && godown !== null ? { shop, office, godown } : null,
      covered: coveredOrdinary !== null && coveredPremium !== null ? { ordinary: coveredOrdinary, premium: coveredPremium } : null,
      /*
       * Lucknow's agricultural columns are जनपदीय मार्ग / सम्पर्क मार्ग / आबादी से सटी / सामान्य.
       * They map onto the existing state/link/abadi/general fields. nh and chakmarg are not
       * printed in Lucknow at all, so they are null rather than zero.
       *
       * Kept in LAKH ₹ per hectare, as printed and as Ayodhya stores them. The brief asked for
       * ₹/ha; storing one unit here and another there would put two scales 100,000 apart in one
       * field, which is the kind of thing that ends up quoted at a buyer. Conversion happens at
       * render, in lib/units.
       */
      agriLakhPerHa: {
        nh: null,
        state: num(r.agri_state_district, `${where} agri_state_district`),
        link: num(r.agri_link, `${where} agri_link`),
        chakmarg: null,
        abadi: num(r.agri_abadi, `${where} agri_abadi`),
        general: num(r.agri_general, `${where} agri_general`),
      },
      note: r.flag || null,
    });
  }

  /*
   * Two rows in one SRO can carry the same name and so the same slug, which would put them on one
   * URL and lose one of them. Mostly the list simply prints a name twice -- गौतम बुद्व मार्ग is
   * three rows of Sadar-2, different V-codes, different wards, different rates -- and twice it is
   * two spellings that transliterate alike (तकिया गनेशगंज / तकिया गणेशगंज).
   *
   * Either way they are distinct priced rows and each needs its own page. They are told apart by
   * the discriminator the list itself uses, the V-code, or the serial where no V-code is printed.
   * Every member of a colliding group takes the suffix, including the first: leaving one bare
   * would hand it the plain URL for no reason except that it was read first.
   */
  const bySlug = new Map<string, RateRow[]>();
  for (const r of rows) {
    const k = `${r.sro}/${r.slug}`;
    if (!bySlug.has(k)) bySlug.set(k, []);
    bySlug.get(k)!.push(r);
  }
  for (const group of bySlug.values()) {
    if (group.length < 2) continue;
    for (const r of group) r.slug = `${r.slug}-${r.vcode ?? `s${r.serial}`}`;
  }
  return rows;
}

/* ------------------------------------------------------------------ segments */

/**
 * प्रारूप-3 road-segment rates, one file per SRO.
 *
 * A segment is matched to the village row it runs through by V-code where the file prints one and
 * by name otherwise. Three SROs print no V-code on their प्रारूप-3 at all, so those match by name
 * against that SRO's rows. A segment that matches nothing keeps rateRowId null and is reported --
 * it still renders on the tehsil page, it just does not link to a village.
 */
function buildSegments(rows: RateRow[]): { segments: RoadSegmentRow[]; unmatched: number } {
  const segments: RoadSegmentRow[] = [];
  let unmatched = 0;
  // A page can print the same segment number more than once, so page+number is not unique on its
  // own. Repeats take a letter, the same way a repeated V-code does on the rows.
  const seenId = new Map<string, number>();

  for (const sro of Object.keys(SRO_NAMES)) {
    const file = path.join(SRC, `lucknow-${sro}-p3.csv`);
    if (!fs.existsSync(file)) continue;
    const mine = rows.filter((r) => r.sro === sro);
    const byVcode = new Map(mine.filter((r) => r.vcode).map((r) => [r.vcode as string, r]));
    const byName = new Map(mine.map((r) => [r.nameHi, r]));

    for (const s of readCsv(file)) {
      const where = `${sro} p3 page ${s.page} segment ${s.segment_no}`;
      const nonAgri = num(s.nonagri, `${where} nonagri`);
      const shop = num(s.shop, `${where} shop`);
      const office = num(s.office, `${where} office`);
      const godown = num(s.godown, `${where} godown`);
      if (nonAgri === null || shop === null || office === null || godown === null) {
        throw new Error(`${where}: a segment row must price land, shop, office and godown`);
      }

      // V-codes in प्रारूप-3 are printed with leading zeros ("0127"); the rate rows are not.
      const vcode = s.vcode ? String(Number(s.vcode)) : null;
      const match = (vcode ? byVcode.get(vcode) : undefined) ?? byName.get(s.village_hi);
      if (!match) unmatched++;

      const idStem = `${sro}-p${s.page}-s${s.segment_no}`;
      const seen = (seenId.get(idStem) ?? 0) + 1;
      seenId.set(idStem, seen);

      segments.push({
        id: seen === 1 ? idStem : `${idStem}-${String.fromCharCode(96 + seen)}`,
        sro,
        page: s.page,
        segmentHi: s.segment_hi,
        segmentEn: romanise(s.segment_hi).nameEn,
        villageHi: s.village_hi,
        rateRowId: match?.id ?? null,
        nonAgri,
        shop,
        office,
        godown,
        // `extra` carries a figure printed beside the segment, e.g. agri_lakh_per_ha=N.
        note: [s.extra || null, s.flag || null].filter(Boolean).join("; ") || null,
      });
    }
  }
  return { segments, unmatched };
}

/* ---------------------------------------------------------------------- main */

function main() {
  const rows = buildRows();
  const { segments, unmatched } = buildSegments(rows);

  const sros = [...new Set(rows.map((r) => r.sro))].sort();
  const schedule: RateSchedule = {
    cityId: CITY,
    effectiveFrom: EFFECTIVE,
    orderDate: ORDER_DATE,
    sourceDocs: sros.map((sro) => ({
      sro,
      pdfPath: `data/sources/circle-rates/${CITY}/${CITY}-${sro}-${EFFECTIVE}.pdf`,
      archiveUrl: null,
      igrsupUrl: "https://igrsup.gov.in/",
      // All seven transcribed SROs share this date. Malihabad's list is 31-12-2025 and will carry
      // its own when it arrives, which is why the field exists per SRO rather than per city.
      effectiveFrom: EFFECTIVE,
      orderDate: ORDER_DATE,
    })),
    roadBands: ROAD_BANDS,
    rows,
    roadSegments: segments,
    sources: [
      {
        label: `IGRSUP मूल्यांकन सूची, Lucknow district, effective ${EFFECTIVE.split("-").reverse().join("-")}`,
        url: "https://igrsup.gov.in/",
        accessedAt: TODAY,
      },
    ],
    updatedAt: TODAY,
    todo: [
      "Sadar-4, Bakshi Ka Talab and Malihabad are not in this file. What was received for them is khasra lists, not the मूल्यांकन सूची; their rate lists need downloading from IGRSUP. Malihabad's is dated 31-12-2025.",
      "sourceDocs[].pdfPath names the scans this was transcribed from; the files are gitignored and archiveUrl is null until R2 exists.",
      "orderDate is the day before the effective date and has not been read off the Collector's order; confirm it against the published order.",
    ],
  };

  const parsed = rateScheduleSchema.safeParse(schedule);
  if (!parsed.success) {
    console.error(JSON.stringify(parsed.error.issues.slice(0, 20), null, 2));
    process.exit(1);
  }

  fs.writeFileSync(OUT, `${JSON.stringify(schedule, null, 2)}\n`);

  const pad = (v: string | number, n: number) => String(v).padEnd(n);
  console.log(`ok   wrote ${OUT}`);
  console.log(`\n${pad("SRO", 16)} ${pad("rows", 6)} ${pad("segments", 9)} category`);
  for (const sro of sros) {
    const mine = rows.filter((r) => r.sro === sro);
    const segs = segments.filter((s) => s.sro === sro).length;
    const cats = new Set(mine.map((r) => r.category));
    const catText = cats.has(null) && cats.size === 1 ? "not printed" : [...cats].filter(Boolean).join(", ");
    console.log(`${pad(SRO_NAMES[sro].en, 16)} ${pad(mine.length, 6)} ${pad(segs, 9)} ${catText}`);
  }
  console.log(`${pad("TOTAL", 16)} ${pad(rows.length, 6)} ${pad(segments.length, 9)}`);
  console.log(`\nrows with covered-area rates : ${rows.filter((r) => r.covered).length}`);
  console.log(`rows with any agricultural   : ${rows.filter((r) => r.agriLakhPerHa.general !== null).length}`);
  console.log(`rows with no commercial line : ${rows.filter((r) => !r.commercial).length}`);
  console.log(`rows short of four bands     : ${rows.filter((r) => Object.keys(r.nonAgri).length < 4).length}`);
  console.log(`transcriber flags carried    : ${rows.filter((r) => r.note).length}`);
  console.log(`segments not matched to a row: ${unmatched}`);
}

main();

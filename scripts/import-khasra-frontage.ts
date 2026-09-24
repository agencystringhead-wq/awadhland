/**
 * npm run frontage:import
 *
 * Turns the hand-transcribed Lucknow khasra road-frontage lists (Sadar-4, Bakshi Ka Talab,
 * Malihabad) into two files:
 *
 *   data/frontage/lucknow-2025-08-01.json        one record per village: counts, roads, notes
 *   data/frontage/lucknow-2025-08-01-plots.json  every khasra number, keyed by village id
 *
 * The split is deliberate. Pages import the village file; only scripts read the 58,000 plots, so
 * the plot list can never be bundled into a page or a client component by accident.
 * scripts/build-frontage-chunks.ts turns the plots into one small JSON per village for the
 * "check your plot" tool.
 *
 * Nothing is inferred. Counts are distinct plots per category (the printed counts are kept too), khasra numbers are as printed, and a
 * number the transcriber could not read or had to split keeps its flag. What the importer does
 * change is the notes column: the transcriber's prefixes ("cell text (no numbers): …") and page
 * continuations are stripped so the printed Hindi reads as printed.
 *
 * Re-running overwrites both files. Nothing here runs at build time.
 */
import fs from "node:fs";
import path from "node:path";
import { romanise } from "../lib/devanagari";
import {
  frontageFileSchema,
  frontagePlotsFileSchema,
  type FrontageCategory,
  type FrontageFile,
  type FrontagePlot,
  type FrontageVillage,
} from "../lib/schemas";

const CITY = "lucknow";
const EFFECTIVE = "2025-08-01";
const SRC = path.join("data", "sources", "khasra-frontage", "lucknow", "transcribed-2025-08-01");
const OUT_DIR = path.join("data", "frontage");
const OUT = path.join(OUT_DIR, `${CITY}-${EFFECTIVE}.json`);
const OUT_PLOTS = path.join(OUT_DIR, `${CITY}-${EFFECTIVE}-plots.json`);
const TODAY = new Date().toISOString().slice(0, 10);

/** The CSV's SRO codes -> tehsils.json ids. */
const SRO_IDS: Record<string, string> = { sadar4: "sadar4", bkt: "bakshikatalab", malihabad: "malihabad" };

/** From the README beside the CSVs. */
const SOURCE_DOCS: FrontageFile["sourceDocs"] = [
  { sro: "sadar4", pageCount: 45, igrsupUrl: "https://igrsup.gov.in/", archiveUrl: null, downloadDated: null },
  { sro: "bakshikatalab", pageCount: 104, igrsupUrl: "https://igrsup.gov.in/", archiveUrl: null, downloadDated: null },
  // The download is dated 31-12-2025, but the list's own note says it is part of the 01-08-2025 valuation list.
  { sro: "malihabad", pageCount: 70, igrsupUrl: "https://igrsup.gov.in/", archiveUrl: null, downloadDated: "2025-12-31" },
];

const CATEGORIES: FrontageCategory[] = ["nh", "district", "link", "abadi"];

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

const int = (v: string, where: string) => {
  const n = Number(v);
  if (!Number.isInteger(n) || n < 0) throw new Error(`${where}: cannot read "${v}" as a count`);
  return n;
};

/* ----------------------------------------------------------------------- notes */

/**
 * The notes column mixes the list's printed Hindi with the transcriber's English framing:
 * "cell text (no numbers): …", "(continues p36)", "text (cont.): …". Returns the printed Hindi
 * only, as whole sentences, with a sentence split across a page break joined back together.
 */
export function cleanNotes(raw: string): string[] {
  if (!raw) return [];
  const rawParts = raw.split(" | ");
  const clean = (p: string) => {
    let s = p;
    // Transcriber labels are Latin text up to a colon, sometimes two deep ("remark: abadi cell text: …").
    for (let i = 0; i < 3; i++) s = s.replace(/^[A-Za-z][A-Za-z0-9 ().,'/-]*:\s*/, "");
    // "cell reads '— …'" has no colon
    s = s.replace(/^cell reads\s*/i, "");
    // Latin parentheticals are the transcriber's, closed or not ("(continues p36)", "(cell reads chakbandi…").
    s = s.replace(/\([A-Za-z][^)]*\)?/g, "");
    s = s.replace(/\.\.\./g, "");
    s = s.replace(/^["'\s]+|["'\s]+$/g, "");
    s = s.replace(/^—\s*/, "");
    // The same phrase is printed "आस-पास", "आस- पास" and "आस–पास".
    s = s.replace(/आस\s*[-–]\s*पास/g, "आस-पास");
    return s.replace(/\s+/g, " ").trim();
  };
  /*
   * A part runs on into the next only where the transcriber says the text continued over a page
   * break. Otherwise each part stands alone: "— लखनऊ विकास प्राधिकरण में अधिग्रहित भूमि" is a
   * label with no full stop, not the start of the sentence after it.
   */
  const continues = (p: string) => /continues|continued/i.test(p);
  const truncated = (p: string) => /ends here|continues/i.test(p);
  const blocks: { text: string; truncated: boolean }[] = [];
  let carry: { text: string; truncated: boolean } | null = null;
  for (const p of rawParts) {
    const text = clean(p);
    if (carry) {
      carry.text = `${carry.text} ${text}`.trim();
      carry.truncated = truncated(p) && !/continued from/i.test(p);
    } else carry = { text, truncated: truncated(p) };
    if (!(continues(p) && !/continued from/i.test(p))) {
      blocks.push(carry);
      carry = null;
    }
  }
  if (carry) blocks.push(carry);

  const out: string[] = [];
  for (const b of blocks) {
    if (!b.text) continue;
    const endsWithStop = b.text.endsWith("।");
    const sentences = b.text.split("।").map((s) => s.trim()).filter(Boolean);
    sentences.forEach((s, i) => {
      const last = i === sentences.length - 1;
      // A sentence the scan cuts off keeps an ellipsis, so it is not read as complete.
      const text = last && !endsWithStop ? (b.truncated ? `${s} …` : s) : `${s}।`;
      if (!out.includes(text)) out.push(text);
    });
  }
  return out;
}

/* ------------------------------------------------------------------------ pages */

/** "12", "12–13", or "12, 14–15" from the space-separated page lists of a village's cells. */
function pageRange(pages: number[]): string | null {
  const ps = [...new Set(pages)].sort((a, b) => a - b);
  if (ps.length === 0) return null;
  const runs: [number, number][] = [];
  for (const p of ps) {
    const last = runs.at(-1);
    if (last && p === last[1] + 1) last[1] = p;
    else runs.push([p, p]);
  }
  return runs.map(([a, b]) => (a === b ? `${a}` : `${a}–${b}`)).join(", ");
}

/* ------------------------------------------------------------------------- main */

function main() {
  const villagesCsv = readCsv(path.join(SRC, "lucknow-khasra-villages.csv"));
  const cellsCsv = readCsv(path.join(SRC, "lucknow-khasra-cells.csv"));
  const lookupCsv = readCsv(path.join(SRC, "lucknow-khasra-lookup.csv"));

  const idOf = (sroCode: string, serial: string, where: string) => {
    const sro = SRO_IDS[sroCode];
    if (!sro) throw new Error(`${where}: unknown SRO code "${sroCode}"`);
    return { sro, id: `${sro}-f${int(serial, where)}` };
  };

  /* pages per village, from the cells file */
  const pagesById = new Map<string, number[]>();
  for (const [i, c] of cellsCsv.entries()) {
    const { id } = idOf(c.sro, c.serial, `cells row ${i + 2}`);
    const ps = c.pages.split(/\s+/).filter(Boolean).map((p) => int(p, `cells row ${i + 2} pages`));
    pagesById.set(id, [...(pagesById.get(id) ?? []), ...ps]);
  }

  /* villages */
  const villages: FrontageVillage[] = villagesCsv.map((r, i) => {
    const where = `villages row ${i + 2}`;
    const { sro, id } = idOf(r.sro, r.serial, where);
    if (r.effective_date !== "01-08-2025") throw new Error(`${where}: unexpected effective date ${r.effective_date}`);
    const { nameEn, slug } = romanise(r.village_hi);
    return {
      id,
      sro,
      serial: int(r.serial, where),
      nameHi: r.village_hi,
      nameEn,
      slug,
      // Filled from the plots below; the village file's own figures are kept as printedCounts.
      counts: { nh: 0, district: 0, link: 0, abadi: 0 },
      printedCounts: { nh: int(r.nh, where), district: int(r.district, where), link: int(r.link, where), abadi: int(r.abadi, where) },
      roadsHi: r.roads ? r.roads.split(" | ").map((s) => s.trim()).filter(Boolean) : [],
      notesHi: cleanNotes(r.notes),
      pages: pageRange(pagesById.get(id) ?? []),
    };
  });

  /*
   * Two villages in one SRO can romanise to one slug. Both get the printed serial appended, the
   * same rule the rate importer uses, so neither silently owns the plain slug.
   */
  const bySlug = new Map<string, FrontageVillage[]>();
  for (const v of villages) {
    const k = `${v.sro}/${v.slug}`;
    bySlug.set(k, [...(bySlug.get(k) ?? []), v]);
  }
  const collisions: string[] = [];
  for (const group of bySlug.values()) {
    if (group.length < 2) continue;
    for (const v of group) {
      collisions.push(`${v.id} ${v.nameHi} -> ${v.slug}-s${v.serial}`);
      v.slug = `${v.slug}-s${v.serial}`;
    }
  }

  /* plots */
  const byId = new Map(villages.map((v) => [v.id, v]));
  const plots: Record<string, FrontagePlot[]> = Object.fromEntries(villages.map((v) => [v.id, []]));
  const unmatchedRoads = new Set<string>();
  for (const [i, r] of lookupCsv.entries()) {
    const where = `lookup row ${i + 2}`;
    const { id } = idOf(r.sro, r.serial, where);
    const v = byId.get(id);
    if (!v) throw new Error(`${where}: no village ${id}`);
    if (v.nameHi !== r.village_hi) throw new Error(`${where}: village name "${r.village_hi}" does not match ${id} "${v.nameHi}"`);
    const cat = r.category as FrontageCategory;
    if (!CATEGORIES.includes(cat)) throw new Error(`${where}: unknown category "${r.category}"`);
    let road: number | null = null;
    if (r.road_hi) {
      road = v.roadsHi.indexOf(r.road_hi);
      if (road < 0) {
        // A road named on a plot but missing from the village's road list: add it rather than lose it.
        unmatchedRoads.add(`${id} ${r.road_hi}`);
        v.roadsHi.push(r.road_hi);
        road = v.roadsHi.length - 1;
      }
    }
    if (!/^\d+$/.test(r.khasra_base)) throw new Error(`${where}: khasra_base "${r.khasra_base}" is not digits`);
    plots[id].push([r.khasra, r.khasra_base, cat, road, r.uncertain || null]);
  }

  /*
   * What a page shows is plots, so each number counts once per category. The village file counts
   * printed entries, and the list repeats a number now and then ("115, … 115") -- 478 of its
   * category counts are higher than the distinct plots behind them. A fused number that the
   * transcriber split ("467466" -> 467, 466) counts as the one printed entry, not three.
   */
  for (const v of villages) {
    for (const cat of CATEGORIES) {
      v.counts[cat] = new Set(plots[v.id].filter((p) => p[2] === cat && !(p[4] ?? "").startsWith("split from")).map((p) => p[0])).size;
    }
  }
  const repeats = villages.reduce((n, v) => n + CATEGORIES.reduce((m, c) => m + v.printedCounts[c] - v.counts[c], 0), 0);

  const file: FrontageFile = {
    cityId: CITY,
    effectiveFrom: EFFECTIVE,
    sourceDocs: SOURCE_DOCS,
    villages,
    sources: [
      {
        label: "IGRSUP khasra road-frontage lists (सड़क / आबादी से लगे गाटे), Lucknow: Sadar-4, Bakshi Ka Talab, Malihabad; part of the valuation list effective 01-08-2025",
        url: "https://igrsup.gov.in/",
        accessedAt: TODAY,
      },
    ],
    updatedAt: TODAY,
    todo: [
      "Upload the three scanned lists to R2 and fill sourceDocs[].archiveUrl",
      "Replace these pages' 'rates awaited' state once the मूल्यांकन सूची for Sadar-4, Bakshi Ka Talab and Malihabad is transcribed",
    ],
  };

  const parsed = frontageFileSchema.parse(file);
  const parsedPlots = frontagePlotsFileSchema.parse(plots);

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(parsed, null, 2) + "\n");
  // One village per line: 58,000 tuples pretty-printed would be 300,000 lines of diff.
  const lines = Object.entries(parsedPlots).map(([id, ps]) => `  ${JSON.stringify(id)}: ${JSON.stringify(ps)}`);
  fs.writeFileSync(OUT_PLOTS, `{\n${lines.join(",\n")}\n}\n`);

  const perSro = (sro: string) => villages.filter((v) => v.sro === sro).length;
  const plotCount = Object.values(plots).reduce((n, ps) => n + ps.length, 0);
  console.log(`ok   frontage:import: ${villages.length} villages (${Object.keys(SRO_IDS).map((c) => `${SRO_IDS[c]} ${perSro(SRO_IDS[c])}`).join(", ")}), ${plotCount} khasra entries`);
  console.log(`     uncertain: ${Object.values(plots).flat().filter((p) => p[4]).length}; notes on ${villages.filter((v) => v.notesHi.length).length} villages; no cells for ${villages.filter((v) => !v.pages).length}`);
  if (collisions.length) console.log(`     slug collisions resolved:\n       ${collisions.join("\n       ")}`);
  if (unmatchedRoads.size) console.log(`     roads on plots but not in the village list:\n       ${[...unmatchedRoads].join("\n       ")}`);
  console.log(`     ${repeats} printed entries repeat a number already listed in the same category; pages count each plot once`);
}

main();

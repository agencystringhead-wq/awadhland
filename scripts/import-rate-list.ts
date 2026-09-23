/**
 * npm run rates:import-list -- --city ayodhya --effective 2025-06-07 --order-date 2025-06-06 \
 *   --dir data/sources/circle-rates/ayodhya/transcribed-2025-06-07 [--dry-run]
 *
 * Turns the hand-transcribed CSVs of a published IGRSUP मूल्यांकन सूची into
 * data/rates/<city>-<effectiveFrom>.json, and writes `rateRefs` onto the localities the list
 * covers (Step 9, section B).
 *
 * Every figure is stored in the unit the government prints it in — non-agricultural and
 * commercial in ₹ per sq m, agricultural in LAKH ₹ per hectare — and no value is converted,
 * rounded or recomputed on the way in. Rows the transcriber flagged keep the printed figure and
 * carry the flag as an internal `note`.
 *
 * A revision is a new file, never an overwrite, so the previous schedule stays readable.
 *
 * Nothing here runs at build time: the output JSON is committed and lib/rates.ts reads that.
 */
import fs from "node:fs";
import path from "node:path";
import { romanise, slugify, titleCase, transliterate } from "../lib/devanagari";
import type { RateCategory, RateRow, RateSchedule, RoadSegmentRow } from "../lib/schemas";

/* ----------------------------------------------------------------------- args */

type Args = { city: string; effective: string; orderDate: string; dir: string; dryRun: boolean };

function parseArgs(argv: string[]): Args {
  const get = (name: string) => {
    const i = argv.indexOf(`--${name}`);
    return i >= 0 ? argv[i + 1] : undefined;
  };
  const city = get("city");
  const effective = get("effective");
  const orderDate = get("order-date");
  const dir = get("dir");
  const missing = [
    ["--city", city],
    ["--effective", effective],
    ["--order-date", orderDate],
    ["--dir", dir],
  ].filter(([, v]) => !v);
  if (missing.length > 0) {
    console.error(
      `Missing ${missing.map(([n]) => n).join(", ")}.\n\n` +
        "Usage:\n  npm run rates:import-list -- --city ayodhya --effective 2025-06-07 \\\n" +
        "    --order-date 2025-06-06 --dir data/sources/circle-rates/ayodhya/transcribed-2025-06-07 [--dry-run]",
    );
    process.exit(1);
  }
  return { city: city!, effective: effective!, orderDate: orderDate!, dir: dir!, dryRun: argv.includes("--dry-run") };
}

/* ------------------------------------------------------------------------ csv */

/**
 * RFC 4180 reader. The transcribed files do use quoted fields with embedded commas
 * (road-segment descriptions especially), so splitting on "," silently corrupts rows.
 */
function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  const src = text.replace(/^﻿/, "").replace(/\r\n?/g, "\n");
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i++;
        } else quoted = false;
      } else field += ch;
      continue;
    }
    if (ch === '"') quoted = true;
    else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else field += ch;
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  const [head, ...body] = rows.filter((r) => r.some((c) => c.trim() !== ""));
  const keys = head.map((h) => h.trim());
  return body.map((r) => Object.fromEntries(keys.map((k, i) => [k, (r[i] ?? "").trim()])));
}

/** Empty cell → null. Printed figures are integers; stray thousands separators are tolerated. */
function num(cell: string): number | null {
  const s = cell.replace(/[,\s]/g, "");
  if (s === "" || s === "-" || s === "–") return null;
  const v = Number(s);
  if (!Number.isFinite(v) || v <= 0) return null;
  return v;
}

function required(cell: string, what: string): number {
  const v = num(cell);
  if (v === null) throw new Error(`expected a number for ${what}, got "${cell}"`);
  return v;
}

/* ----------------------------------------------------------------- categories */

/**
 * Categories as printed, collapsed to one value each. The list spells semi-urban two ways
 * (अर्द्धनगरीय / अर्धनगरीय) and developing two ways (ग्रामीण(वि0) in Bikapur, विकासशील in Rudauli).
 */
const CATEGORIES: Record<string, RateCategory> = {
  "नगरीय": "urban",
  "अर्द्धनगरीय": "semi-urban",
  "अर्धनगरीय": "semi-urban",
  "ग्रामीण": "rural",
  "ग्रामीण(वि0)": "developing",
  "ग्रामीण (वि0)": "developing",
  "विकासशील": "developing",
  "अधिसूचित": "notified",
  "नगरपंचायत": "nagar-panchayat",
  "नगर पंचायत": "nagar-panchayat",
};

function normaliseCategory(printed: string): RateCategory {
  const key = printed.replace(/\s+/g, " ").trim();
  const hit = CATEGORIES[key] ?? CATEGORIES[key.replace(/\s+/g, "")];
  if (!hit) throw new Error(`unknown category "${printed}" — add it to CATEGORIES in scripts/import-rate-list.ts`);
  return hit;
}

/* ---------------------------------------------------------------------- names */

type Override = { nameEn: string; slug?: string };
const overridesFile = JSON.parse(fs.readFileSync(path.join("scripts", "name-overrides.json"), "utf8")) as {
  overrides: Record<string, Override>;
};
const OVERRIDES = overridesFile.overrides;

/**
 * Hindi key for fuzzy matching: strips spaces, nuktas, the doubled-matra typo (ाा → ा),
 * bracketed qualifiers and zero-width joiners, so "कुम्हार टोला (सहादतगंज)" and "कुम्हार टोला"
 * compare equal.
 */
function normaliseHindi(s: string): string {
  return s
    .normalize("NFC")
    .replace(/[​-‍﻿]/g, "")
    .replace(/़/g, "")
    .replace(/ा{2,}/g, "ा")
    .replace(/[(（][^)）]*[)）]/g, "")
    .replace(/\s+/g, "")
    .trim();
}

/** Override first, then phonological transliteration. */
function nameFor(nameHi: string): { nameEn: string; slug: string } {
  const o = OVERRIDES[nameHi] ?? OVERRIDES[normaliseHindi(nameHi)];
  if (o) return { nameEn: o.nameEn, slug: o.slug ?? slugify(o.nameEn) };
  return romanise(nameHi);
}

/* --------------------------------------------------------------------- import */

type P4 = Record<string, string>;
type P3 = Record<string, string>;

type Collision = { sro: string; slug: string; names: string[]; resolvedTo: string[] };

function buildRows(byFile: { sro: string; rows: P4[] }[]): { rows: RateRow[]; collisions: Collision[] } {
  const rows: RateRow[] = [];

  for (const { sro, rows: raw } of byFile) {
    // First pass: derive the base slug for every row so collisions are known before ids are fixed.
    const derived = raw.map((r, i) => {
      const nameHi = r.village_hi;
      if (!nameHi) throw new Error(`${sro} row ${i + 2}: empty village_hi`);
      return { r, ...nameFor(nameHi) };
    });

    const bySlug = new Map<string, number[]>();
    derived.forEach((d, i) => bySlug.set(d.slug, [...(bySlug.get(d.slug) ?? []), i]));

    for (const [, idxs] of bySlug) {
      if (idxs.length < 2) continue;
      // Collision inside a tehsil: append the ward, else the V-code, else the serial (D1).
      for (const i of idxs) {
        const d = derived[i];
        const ward = d.r.ward_hi ? slugify(transliterate(d.r.ward_hi)) : "";
        const suffix = ward || d.r.vcode || `s${d.r.serial}`;
        d.slug = `${d.slug}-${slugify(String(suffix))}`;
      }
      // A ward suffix can still tie (same name, same ward): fall back to the V-code or serial.
      const seen = new Map<string, number>();
      for (const i of idxs) {
        const d = derived[i];
        const n = (seen.get(d.slug) ?? 0) + 1;
        seen.set(d.slug, n);
        if (n > 1) d.slug = `${d.slug}-${slugify(String(d.r.vcode || `s${d.r.serial}`))}`;
      }
    }

    for (const d of derived) {
      const r = d.r;
      const vcode = r.vcode || null;
      const serial = Number(r.serial);
      if (!Number.isInteger(serial) || serial <= 0) throw new Error(`${sro}: bad serial "${r.serial}" for ${r.village_hi}`);
      rows.push({
        id: `${sro}-${vcode ?? `s${serial}`}`,
        sro,
        page: r.page,
        serial,
        vcode,
        nameHi: r.village_hi,
        nameEn: d.nameEn,
        slug: d.slug,
        wardHi: r.ward_hi || null,
        category: normaliseCategory(r.category),
        nonAgri: {
          lt9m: required(r.nonagri_lt9m, `${sro}/${r.village_hi} nonagri_lt9m`),
          m9to18: required(r.nonagri_9to18m, `${sro}/${r.village_hi} nonagri_9to18m`),
          ge18m: required(r.nonagri_ge18m, `${sro}/${r.village_hi} nonagri_ge18m`),
        },
        commercial: {
          shop: required(r.shop, `${sro}/${r.village_hi} shop`),
          office: required(r.office, `${sro}/${r.village_hi} office`),
          godown: required(r.godown, `${sro}/${r.village_hi} godown`),
        },
        agriLakhPerHa: {
          nh: num(r.agri_nh),
          state: num(r.agri_state),
          link: num(r.agri_link),
          chakmarg: num(r.agri_chakmarg),
          abadi: num(r.agri_abadi),
          general: num(r.agri_general),
        },
        note: r.flag || null,
      });
    }
  }

  // Report collisions against the pre-suffix slug so the log names the real clash.
  const collisions: Collision[] = [];
  const grouped = new Map<string, RateRow[]>();
  for (const row of rows) {
    const base = nameFor(row.nameHi).slug;
    const k = `${row.sro}|${base}`;
    grouped.set(k, [...(grouped.get(k) ?? []), row]);
  }
  for (const [k, group] of grouped) {
    if (group.length < 2) continue;
    const [sro, slug] = k.split("|");
    collisions.push({ sro, slug, names: [...new Set(group.map((g) => g.nameHi))], resolvedTo: group.map((g) => g.slug) });
  }

  const ids = new Set<string>();
  for (const r of rows) {
    if (ids.has(r.id)) throw new Error(`duplicate rate row id "${r.id}" — V-code or serial is not unique within ${r.sro}`);
    ids.add(r.id);
  }
  return { rows, collisions };
}

function buildSegments(byFile: { sro: string; rows: P3[] }[], rateRows: RateRow[]): RoadSegmentRow[] {
  const out: RoadSegmentRow[] = [];
  const byVcode = new Map(rateRows.filter((r) => r.vcode).map((r) => [`${r.sro}|${r.vcode}`, r.id]));
  const byName = new Map<string, string>();
  for (const r of rateRows) {
    const k = `${r.sro}|${normaliseHindi(r.nameHi)}`;
    if (!byName.has(k)) byName.set(k, r.id); // first wins; ambiguity is reported by the dry run
  }

  const used = new Map<string, number>();
  for (const { sro, rows } of byFile) {
    rows.forEach((r, rowIndex) => {
      // Only Sadar, Bikapur and Milkipur number their segments, and Bikapur uses an en-dash
      // rather than a full stop. Sohawal and Rudauli print no number at all, so those ids fall
      // back to the row's position in the file, which is stable as long as the CSV is.
      const segNo = /^\s*(\d+)\s*[.–—-]/.exec(r.segment_hi)?.[1];
      const villageSlug = slugify(transliterate(r.village_hi)) || "row";
      let id = segNo ? `${sro}-seg${segNo}-${villageSlug}` : `${sro}-seg-r${rowIndex + 1}-${villageSlug}`;
      const n = (used.get(id) ?? 0) + 1;
      used.set(id, n);
      if (n > 1) id = `${id}-${n}`;

      const rateRowId =
        (r.vcode ? byVcode.get(`${sro}|${r.vcode}`) : undefined) ?? byName.get(`${sro}|${normaliseHindi(r.village_hi)}`) ?? null;

      out.push({
        id,
        sro,
        page: r.page,
        segmentHi: r.segment_hi,
        segmentEn: titleCase(transliterate(r.segment_hi.replace(/^\s*\d+\s*\.\s*/, ""))),
        villageHi: r.village_hi,
        rateRowId,
        nonAgri: required(r.nonagri, `${sro} segment ${id} nonagri`),
        shop: required(r.shop, `${sro} segment ${id} shop`),
        office: required(r.office, `${sro} segment ${id} office`),
        godown: required(r.godown, `${sro} segment ${id} godown`),
        note: r.flag || null,
      });
    });
  }
  return out;
}

/* ------------------------------------------------------------ locality matching */

type AliasEntry = { rateRowIds: string[]; roadSegmentIds: string[]; note?: string };
type Match = { localityId: string; via: "alias" | "exact" | "normalised"; rateRowIds: string[]; roadSegmentIds: string[] };

function matchLocalities(
  localities: { id: string; cityId: string; name: string; nameHi?: string }[],
  city: string,
  rows: RateRow[],
  aliases: Record<string, AliasEntry>,
): { matched: Match[]; unmatched: { id: string; name: string; nameHi?: string }[] } {
  const exact = new Map<string, RateRow[]>();
  const normalised = new Map<string, RateRow[]>();
  for (const r of rows) {
    exact.set(r.nameHi, [...(exact.get(r.nameHi) ?? []), r]);
    const k = normaliseHindi(r.nameHi);
    normalised.set(k, [...(normalised.get(k) ?? []), r]);
  }

  const matched: Match[] = [];
  const unmatched: { id: string; name: string; nameHi?: string }[] = [];

  for (const l of localities.filter((l) => l.cityId === city)) {
    const alias = aliases[l.id];
    if (alias && (alias.rateRowIds.length > 0 || alias.roadSegmentIds.length > 0)) {
      matched.push({ localityId: l.id, via: "alias", rateRowIds: alias.rateRowIds, roadSegmentIds: alias.roadSegmentIds });
      continue;
    }
    if (!l.nameHi) {
      unmatched.push({ id: l.id, name: l.name });
      continue;
    }
    const hitExact = exact.get(l.nameHi);
    if (hitExact) {
      matched.push({ localityId: l.id, via: "exact", rateRowIds: hitExact.map((r) => r.id), roadSegmentIds: [] });
      continue;
    }
    const hitNorm = normalised.get(normaliseHindi(l.nameHi));
    if (hitNorm) {
      matched.push({ localityId: l.id, via: "normalised", rateRowIds: hitNorm.map((r) => r.id), roadSegmentIds: [] });
      continue;
    }
    unmatched.push({ id: l.id, name: l.name, nameHi: l.nameHi });
  }
  return { matched, unmatched };
}

/* ----------------------------------------------------------------------- main */

function main() {
  const args = parseArgs(process.argv.slice(2));
  const dir = args.dir;
  if (!fs.existsSync(dir)) {
    console.error(`--dir not found: ${dir}`);
    process.exit(1);
  }

  const files = fs.readdirSync(dir);
  const p4Files = files.filter((f) => /-p4\.csv$/.test(f)).sort();
  const p3Files = files.filter((f) => /-p3\.csv$/.test(f)).sort();
  if (p4Files.length === 0) {
    console.error(`no *-p4.csv in ${dir}`);
    process.exit(1);
  }

  const read = (f: string) => parseCsv(fs.readFileSync(path.join(dir, f), "utf8"));
  const sroOf = (f: string) => f.replace(/^.*?-([a-z]+)-p[34]\.csv$/, "$1");

  const p4 = p4Files.map((f) => ({ sro: sroOf(f), rows: read(f) }));
  const p3 = p3Files.map((f) => ({ sro: sroOf(f), rows: read(f) }));

  const { rows, collisions } = buildRows(p4);
  const roadSegments = buildSegments(p3, rows);

  const localities = JSON.parse(fs.readFileSync(path.join("data", "localities.json"), "utf8")) as {
    id: string;
    cityId: string;
    name: string;
    nameHi?: string;
    rateRefs?: { rateRowId: string }[];
    roadSegmentRefs?: { id: string }[];
    circleRate?: unknown;
  }[];
  const aliasFile = JSON.parse(fs.readFileSync(path.join("scripts", "rate-aliases.json"), "utf8")) as { aliases: Record<string, AliasEntry> };
  const { matched, unmatched } = matchLocalities(localities, args.city, rows, aliasFile.aliases);

  const rowById = new Map(rows.map((r) => [r.id, r]));
  const segById = new Map(roadSegments.map((s) => [s.id, s]));
  const badRefs = matched.flatMap((m) => [
    ...m.rateRowIds.filter((id) => !rowById.has(id)).map((id) => `${m.localityId} → rate row ${id}`),
    ...m.roadSegmentIds.filter((id) => !segById.has(id)).map((id) => `${m.localityId} → road segment ${id}`),
  ]);

  /* ------------------------------------------------------------------ report */

  const pad = (s: string | number, n: number) => String(s).padEnd(n);
  console.log(`\nIGRSUP rate list · ${args.city} · effective ${args.effective} (order ${args.orderDate})`);
  console.log(`source: ${dir}\n`);

  console.log("rows per SRO");
  for (const { sro, rows: r } of p4) {
    const segs = roadSegments.filter((s) => s.sro === sro).length;
    console.log(`  ${pad(sro, 10)} ${pad(r.length, 6)} village rows   ${pad(segs, 5)} road-segment rows`);
  }
  console.log(`  ${pad("TOTAL", 10)} ${pad(rows.length, 6)} village rows   ${pad(roadSegments.length, 5)} road-segment rows`);

  const byCategory = new Map<string, number>();
  for (const r of rows) byCategory.set(r.category, (byCategory.get(r.category) ?? 0) + 1);
  console.log(`\ncategories: ${[...byCategory.entries()].sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(" · ")}`);

  console.log(`\nlocalities matched: ${matched.length}`);
  for (const m of matched) {
    const names = m.rateRowIds.map((id) => rowById.get(id)?.nameHi ?? id).join(", ");
    console.log(`  ${pad(m.localityId, 24)} ${pad(`(${m.via})`, 14)} ${m.rateRowIds.length} row(s)${names ? `: ${names}` : ""}`);
  }

  /**
   * Unmatched localities, each with the rows and segments whose names overlap. These are almost
   * never simple near-misses: the list prints देवकाली as three separate rows (छोटी देवकाली,
   * देवकाली अं.न.पा., देवकालीBNP), and which of them a locality page should cover is a local-knowledge
   * call, not something to guess. So the candidates are printed and the mapping stays manual.
   */
  const candidatesFor = (nameHi?: string) => {
    const needle = nameHi ? normaliseHindi(nameHi) : "";
    if (!needle) return { rows: [] as RateRow[], segs: [] as RoadSegmentRow[] };
    const overlap = (a: string) => a !== "" && (a.includes(needle) || needle.includes(a));
    // Devanagari spells the same place several ways (सिविल लाइंस vs सिविल लाइन्स, गोसाईगंज vs
    // गोशाईगंज), which no amount of character stripping reconciles. Comparing the romanised form
    // catches those, but only as a suggestion: the mapping itself stays manual.
    const needleSlug = slugify(transliterate(nameHi!));
    const slugNear = (s: string) => s !== "" && needleSlug !== "" && (s.startsWith(needleSlug) || needleSlug.startsWith(s));
    return {
      rows: rows.filter((r) => overlap(normaliseHindi(r.nameHi)) || slugNear(slugify(transliterate(r.nameHi)))),
      segs: roadSegments.filter(
        (s) => overlap(normaliseHindi(s.villageHi)) || normaliseHindi(s.segmentHi).includes(needle) || slugNear(slugify(transliterate(s.villageHi))),
      ),
    };
  };

  console.log(`\nlocalities unmatched: ${unmatched.length}`);
  for (const u of unmatched) {
    console.log(`  ${pad(u.id, 24)} ${u.nameHi ?? "(no nameHi)"}`);
    const note = aliasFile.aliases[u.id]?.note;
    if (note) console.log(`    note: ${note}`);
    const { rows: rowHits, segs: segHits } = candidatesFor(u.nameHi);
    for (const r of rowHits.slice(0, 6)) console.log(`      row  ${pad(r.id, 20)} ${r.nameHi}  (${r.sro} serial ${r.serial}, page ${r.page})`);
    for (const s of segHits.slice(0, 4)) console.log(`      seg  ${pad(s.id, 30)} ${s.segmentHi.slice(0, 58)}`);
    if (rowHits.length === 0 && segHits.length === 0) console.log("      (no name overlap in this list)");
  }
  if (unmatched.length > 0) console.log("\n  → fill these in scripts/rate-aliases.json, then re-run without --dry-run");

  const unmatchedSegs = roadSegments.filter((s) => s.rateRowId === null);
  console.log(`\nroad segments unmatched to a village row: ${unmatchedSegs.length} of ${roadSegments.length}`);
  const bySro = new Map<string, number>();
  for (const s of unmatchedSegs) bySro.set(s.sro, (bySro.get(s.sro) ?? 0) + 1);
  for (const [sro, n] of bySro) console.log(`  ${pad(sro, 10)} ${n}`);
  for (const s of unmatchedSegs.slice(0, 10)) console.log(`    ${pad(s.id, 34)} ${s.villageHi}`);
  if (unmatchedSegs.length > 10) console.log(`    … and ${unmatchedSegs.length - 10} more`);

  console.log(`\nname collisions within a tehsil: ${collisions.length}`);
  for (const c of collisions) console.log(`  ${pad(c.sro, 10)} ${pad(c.slug, 22)} ${c.names.join(" / ")} → ${c.resolvedTo.join(", ")}`);

  if (badRefs.length > 0) {
    console.log(`\nalias entries pointing at ids that do not exist: ${badRefs.length}`);
    for (const b of badRefs) console.log(`  ${b}`);
  }

  // Aliases that matched by name anyway, so the empty alias entry can be removed or confirmed.
  const namedMatches = matched.filter((m) => m.via !== "alias" && aliasFile.aliases[m.localityId]);
  if (namedMatches.length > 0) {
    console.log(`\naliases left empty that matched by name anyway: ${namedMatches.length}`);
    for (const m of namedMatches) {
      const { rows: rowHits } = candidatesFor(localities.find((l) => l.id === m.localityId)?.nameHi);
      console.log(`  ${pad(m.localityId, 24)} took ${m.rateRowIds.join(", ")} (${m.via}); ${rowHits.length} row(s) share the name`);
      if (rowHits.length > m.rateRowIds.length) {
        for (const r of rowHits.slice(0, 6)) console.log(`      row  ${pad(r.id, 20)} ${r.nameHi}  (${r.sro} serial ${r.serial}, page ${r.page})`);
      }
    }
  }

  /* ------------------------------------------------------------------- write */

  if (args.dryRun) {
    console.log("\n--dry-run: nothing written.\n");
    return;
  }
  if (badRefs.length > 0) {
    console.error("\nrefusing to write: rate-aliases.json points at ids that do not exist (listed above).\n");
    process.exit(1);
  }

  const today = new Date().toISOString().slice(0, 10);
  const sros = [...new Set(rows.map((r) => r.sro))].sort();
  const schedule: RateSchedule = {
    cityId: args.city,
    effectiveFrom: args.effective,
    orderDate: args.orderDate,
    sourceDocs: sros.map((sro) => ({
      sro,
      pdfPath: `data/sources/circle-rates/${args.city}/${args.city}-${sro}-${args.effective}.pdf`,
      archiveUrl: null,
      igrsupUrl: "https://igrsup.gov.in/",
    })),
    rows,
    roadSegments,
    sources: [
      {
        label: `IGRSUP मूल्यांकन सूची, ${titleCase(args.city)} district, effective ${args.effective} (Collector order ${args.orderDate})`,
        url: "https://igrsup.gov.in/",
        accessedAt: today,
      },
    ],
    updatedAt: today,
    todo: [
      "Upload the five scanned SRO PDFs to R2 and set archiveUrl on each sourceDoc (the files are gitignored; pdfPath is provenance only).",
      "Add per-SRO IGRSUP deep links once stable URLs are available; igrsupUrl is currently the site root for all five.",
    ],
  };

  const outDir = path.join("data", "rates");
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, `${args.city}-${args.effective}.json`);
  fs.writeFileSync(outFile, `${JSON.stringify(schedule, null, 2)}\n`);
  console.log(`\nwrote ${outFile} (${rows.length} rows, ${roadSegments.length} road segments)`);

  // rateRefs onto the localities this list covers. Localities in other cities are untouched.
  const byLocality = new Map(matched.map((m) => [m.localityId, m]));
  let updated = 0;
  let droppedLegacy = 0;
  for (const l of localities) {
    if (l.cityId !== args.city) continue;
    const m = byLocality.get(l.id);
    if (!m) continue;
    if (m.rateRowIds.length > 0) l.rateRefs = m.rateRowIds.map((rateRowId) => ({ rateRowId }));
    if (m.roadSegmentIds.length > 0) l.roadSegmentRefs = m.roadSegmentIds.map((id) => ({ id }));
    // Step 9 A4: the per-locality figure goes once the published rows are in. Leaving it would
    // keep a seed placeholder — with a date that never existed — feeding the meta description,
    // the OG image and the source stamp while the page body shows the real rows.
    //
    // Only when rows were actually written. A corridor matched to road segments alone has no
    // rateRefs to replace it, and dropping its circleRate would leave it with no rate at all —
    // which the thin-page guard reads as an incomplete record.
    if (m.rateRowIds.length > 0 && l.circleRate) {
      delete l.circleRate;
      droppedLegacy++;
    }
    updated++;
  }
  fs.writeFileSync(path.join("data", "localities.json"), `${JSON.stringify(localities, null, 2)}\n`);
  console.log(
    `wrote data/localities.json (rateRefs on ${updated} ${args.city} localities` +
      `${droppedLegacy > 0 ? `, legacy circleRate dropped from ${droppedLegacy}` : ""})\n`,
  );
}

main();

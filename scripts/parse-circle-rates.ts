/**
 * npm run rates:import -- --city ayodhya --effective 2026-08-01 --source https://igrsup.gov.in/... --csv path/to/ayodhya.csv [--archive https://r2/...pdf] [--dry-run] [--replace] [--allow-unmatched]
 *
 * Loads one circle-rate schedule from a CSV exported from the IGRSUP PDF (spec "Data model":
 * parsing scripts take a PDF-to-CSV export as input and emit JSON; nothing scrapes live sites).
 *
 * CSV columns (header row, any order, extra columns ignored):
 *   locality      name as printed in the schedule (Latin or Devanagari)
 *   tehsil
 *   residential   ₹ per sq m, as published
 *   commercial    ₹ per sq m, as published
 *   agricultural  ₹ per hectare, as published (never convert; if the PDF prints per sq m, fix the export)
 *   localityId    optional, wins over name matching
 *
 * Matching: localityId, then exact id, then normalised name against name / nameHi / the alias map
 * in scripts/circle-rate-aliases.json. Every row must match a locality of that city, and every
 * locality of the city should have a row; both lists are reported, and unmatched rows fail the
 * run unless --allow-unmatched.
 *
 * Writes: a new schedule `<city>-<effective>` into data/circleRates.json (older schedules are kept
 * for the revision history; --replace overwrites a schedule with the same id), and each matched
 * locality's circleRate, sources and updatedAt in data/localities.json. Status is not changed:
 * upgrading a draft to live is a deliberate edit after the narrative and drive times are in.
 */
import fs from "node:fs";
import path from "node:path";

type Row = { locality: string; tehsil: string; residential: number; commercial: number; agricultural: number; localityId?: string };
type Args = { city: string; effective: string; source: string; csv: string; archive?: string; dryRun: boolean; replace: boolean; allowUnmatched: boolean };

function args(): Args {
  const a = process.argv.slice(2);
  const get = (k: string) => {
    const i = a.indexOf(`--${k}`);
    return i >= 0 ? a[i + 1] : undefined;
  };
  const has = (k: string) => a.includes(`--${k}`);
  const city = get("city");
  const effective = get("effective");
  const source = get("source");
  const csv = get("csv");
  if (!city || !effective || !source || !csv) {
    console.error("usage: --city <id> --effective YYYY-MM-DD --source <https url> --csv <file> [--archive <url>] [--dry-run] [--replace] [--allow-unmatched]");
    process.exit(2);
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(effective)) fail(`--effective must be YYYY-MM-DD, got ${effective}`);
  if (!/^https:\/\//.test(source)) fail("--source must be an https URL (the schedule PDF)");
  return { city, effective, source, csv, archive: get("archive"), dryRun: has("dry-run"), replace: has("replace"), allowUnmatched: has("allow-unmatched") };
}

function fail(msg: string): never {
  console.error(`FAIL ${msg}`);
  process.exit(1);
}

/** Minimal CSV parser: quoted fields, doubled quotes, CRLF. */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) {
      if (ch === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') q = false;
      else cell += ch;
    } else if (ch === '"') q = true;
    else if (ch === ",") {
      row.push(cell);
      cell = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(cell);
      if (row.some((c) => c.trim() !== "")) rows.push(row);
      row = [];
      cell = "";
    } else cell += ch;
  }
  row.push(cell);
  if (row.some((c) => c.trim() !== "")) rows.push(row);
  return rows;
}

const num = (s: string) => Number(String(s).replace(/[₹,\s]/g, ""));

/** Lowercase, no punctuation, no diacritics, single spaces. Devanagari passes through unchanged. */
export const normalise = (s: string) =>
  s
    .normalize("NFKC")
    .toLowerCase()
    .replace(/\(.*?\)/g, " ")
    .replace(/[^\p{L}\p{M}\p{N}]+/gu, " ")
    .trim()
    .replace(/\s+/g, " ");

function readRows(file: string): Row[] {
  const rows = parseCsv(fs.readFileSync(file, "utf8"));
  if (rows.length < 2) fail("CSV has no data rows");
  const header = rows[0].map((h) => normalise(h).replace(/\s/g, ""));
  const col = (name: string) => header.indexOf(name);
  for (const required of ["locality", "residential", "commercial", "agricultural"]) if (col(required) < 0) fail(`CSV is missing the "${required}" column (have: ${header.join(", ")})`);
  const out: Row[] = [];
  rows.slice(1).forEach((r, i) => {
    const row: Row = {
      locality: (r[col("locality")] ?? "").trim(),
      tehsil: (r[col("tehsil")] ?? "").trim(),
      residential: num(r[col("residential")] ?? ""),
      commercial: num(r[col("commercial")] ?? ""),
      agricultural: num(r[col("agricultural")] ?? ""),
      localityId: col("localityid") >= 0 ? (r[col("localityid")] ?? "").trim() || undefined : undefined,
    };
    for (const k of ["residential", "commercial", "agricultural"] as const) {
      if (!Number.isFinite(row[k]) || row[k] <= 0) fail(`row ${i + 2} (${row.locality}): ${k} is not a positive number`);
    }
    if (!row.locality) fail(`row ${i + 2}: empty locality`);
    out.push(row);
  });
  return out;
}

type Loc = { id: string; cityId: string; name: string; nameHi?: string; tehsil?: string; circleRate?: unknown; sources: unknown[]; updatedAt: string; [k: string]: unknown };
type Schedule = { id: string; cityId: string; effectiveFrom: string; sourceUrl: string; archiveUrl: string | null; units: unknown; rates: unknown[]; sources: unknown[]; updatedAt: string; todo?: string[] };

function main() {
  const a = args();
  const root = process.cwd();
  const dataDir = path.join(root, "data");
  const localities = JSON.parse(fs.readFileSync(path.join(dataDir, "localities.json"), "utf8")) as Loc[];
  const schedules = JSON.parse(fs.readFileSync(path.join(dataDir, "circleRates.json"), "utf8")) as Schedule[];
  const aliasFile = path.join(root, "scripts", "circle-rate-aliases.json");
  const aliases = (fs.existsSync(aliasFile) ? JSON.parse(fs.readFileSync(aliasFile, "utf8")) : {}) as Record<string, Record<string, string>>;
  const cityAliases = Object.fromEntries(Object.entries(aliases[a.city] ?? {}).map(([k, v]) => [normalise(k), v]));
  const cityLocalities = localities.filter((l) => l.cityId === a.city);
  if (cityLocalities.length === 0) fail(`no localities for city "${a.city}" in data/localities.json`);

  const byId = new Map(cityLocalities.map((l) => [l.id, l]));
  const byName = new Map<string, Loc>();
  for (const l of cityLocalities) {
    byName.set(normalise(l.name), l);
    if (l.nameHi) byName.set(normalise(l.nameHi), l);
  }

  const rows = readRows(a.csv);
  const today = new Date().toISOString().slice(0, 10);
  const matched = new Map<string, Row>();
  const unmatched: Row[] = [];
  for (const r of rows) {
    const key = normalise(r.locality);
    const l = (r.localityId && byId.get(r.localityId)) || byId.get(key.replace(/\s/g, "-")) || byName.get(key) || (cityAliases[key] ? byId.get(cityAliases[key]) : undefined);
    if (!l) {
      unmatched.push(r);
      continue;
    }
    if (matched.has(l.id)) fail(`two CSV rows match locality "${l.id}" ("${matched.get(l.id)!.locality}" and "${r.locality}")`);
    matched.set(l.id, r);
  }
  const missing = cityLocalities.filter((l) => !matched.has(l.id));

  console.log(`rows ${rows.length}, matched ${matched.size}, unmatched ${unmatched.length}, localities without a row ${missing.length}`);
  for (const r of unmatched) console.log(`  unmatched: "${r.locality}" (${r.tehsil}) → add to scripts/circle-rate-aliases.json under "${a.city}" or set localityId`);
  for (const l of missing) console.log(`  no row:    ${l.id} (${l.name}${l.nameHi ? ` / ${l.nameHi}` : ""})`);
  if (unmatched.length > 0 && !a.allowUnmatched) fail("unmatched rows; fix aliases or pass --allow-unmatched to skip them");

  const id = `${a.city}-${a.effective}`;
  const existing = schedules.findIndex((s) => s.id === id);
  if (existing >= 0 && !a.replace) fail(`schedule ${id} already exists; pass --replace to overwrite it`);
  const source = { label: `IGRSUP circle rate schedule, ${cityLocalities[0].cityId}`, url: a.source, accessedAt: today };
  const schedule: Schedule = {
    id,
    cityId: a.city,
    effectiveFrom: a.effective,
    sourceUrl: a.source,
    archiveUrl: a.archive ?? null,
    units: { residential: "sqm", commercial: "sqm", agricultural: "hectare" },
    rates: [...matched.entries()].map(([localityId, r]) => ({
      localityId,
      tehsil: r.tehsil || byId.get(localityId)!.tehsil || "—",
      residential: r.residential,
      commercial: r.commercial,
      agricultural: r.agricultural,
      effectiveFrom: a.effective,
      sourceUrl: a.source,
    })),
    sources: [source],
    updatedAt: today,
    ...(a.archive ? {} : { todo: ["Upload the schedule PDF to R2 and set archiveUrl"] }),
  };

  for (const [localityId, r] of matched) {
    const l = byId.get(localityId)!;
    l.circleRate = { residential: r.residential, commercial: r.commercial, agricultural: r.agricultural, unit: "sqm|hectare", effectiveFrom: a.effective, sourceUrl: a.source };
    if (r.tehsil && !l.tehsil) l.tehsil = r.tehsil;
    const others = (l.sources as { label: string }[]).filter((s) => !/circle rate|IGRSUP portal \(placeholder/i.test(s.label));
    l.sources = [...others, source];
    l.updatedAt = today;
  }

  if (a.dryRun) {
    console.log(`dry run: would write schedule ${id} with ${schedule.rates.length} rows and update ${matched.size} localities`);
    return;
  }
  if (existing >= 0) schedules[existing] = schedule;
  else schedules.push(schedule);
  fs.writeFileSync(path.join(dataDir, "circleRates.json"), `${JSON.stringify(schedules, null, 2)}\n`);
  fs.writeFileSync(path.join(dataDir, "localities.json"), `${JSON.stringify(localities, null, 2)}\n`);
  console.log(`ok   wrote schedule ${id} (${schedule.rates.length} rows) and ${matched.size} locality circle rates. Run npm run validate.`);
}

main();

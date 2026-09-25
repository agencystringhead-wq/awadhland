/**
 * npm run rates:chunks
 *
 * Emits one compact JSON chunk per tehsil into public/rates/ (Step 9, detail D4).
 *
 * The tehsil page renders its own rows as static HTML — that is the SEO asset and the link graph
 * into the village pages, and it must work with JavaScript off. The chunks exist for the two jobs
 * static HTML cannot do: the district-wide search on /<city>/circle-rates/, which spans all 1,630
 * rows across five tehsils, and re-sorting a large table without re-reading the DOM.
 *
 * Field names are one or two characters because 1,630 rows of verbose keys is most of the payload.
 * The row shape and columns come from lib/rate-chunks.ts, shared with the tehsil page.
 *
 * Generated, gitignored, rebuilt on every prebuild.
 */
import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import { tableColumns, toChunkRow } from "../lib/rate-chunks";
import { rateScheduleSchema, type RateSchedule } from "../lib/schemas";

const ratesDir = path.join("data", "rates");
const outDir = path.join("public", "rates");

function readSchedules(): RateSchedule[] {
  if (!fs.existsSync(ratesDir)) return [];
  const out: RateSchedule[] = [];
  for (const f of fs.readdirSync(ratesDir).filter((f) => f.endsWith(".json") && f !== "indexable.json")) {
    const parsed = rateScheduleSchema.safeParse(JSON.parse(fs.readFileSync(path.join(ratesDir, f), "utf8")));
    if (!parsed.success) {
      console.error(`data/rates/${f}:\n${z.prettifyError(parsed.error)}`);
      process.exit(1);
    }
    out.push(parsed.data);
  }
  return out;
}

function main() {
  const schedules = readSchedules();
  if (schedules.length === 0) {
    console.log("ok   rates:chunks: no rate lists, nothing to build");
    return;
  }

  fs.mkdirSync(outDir, { recursive: true });
  const keep = new Set<string>();
  let totalRows = 0;
  let totalBytes = 0;

  // Newest schedule per city; older revisions stay readable in data/ but are not searched.
  const current = new Map<string, RateSchedule>();
  for (const s of schedules) {
    const prev = current.get(s.cityId);
    if (!prev || s.effectiveFrom > prev.effectiveFrom) current.set(s.cityId, s);
  }

  for (const [cityId, schedule] of current) {
    for (const sro of [...new Set(schedule.rows.map((r) => r.sro))].sort()) {
      // Same columns and row shape the tehsil page prerenders (lib/rate-chunks), so the first 100
      // rows and the rest can never disagree about what a column means.
      const cols = tableColumns(schedule, sro);
      const rows = schedule.rows
        .filter((r) => r.sro === sro)
        .sort((a, b) => a.serial - b.serial)
        .map((r) => toChunkRow(r, cols));

      const file = path.join(outDir, `${cityId}-${sro}.json`);
      const body = JSON.stringify({
        cityId,
        tehsil: sro,
        effectiveFrom: schedule.effectiveFrom,
        bands: cols.bands,
        commercial: cols.commercial,
        agri: cols.agri,
        rows,
      });
      fs.writeFileSync(file, body);
      keep.add(path.resolve(file));
      totalRows += rows.length;
      totalBytes += Buffer.byteLength(body);
    }
  }

  // Drop chunks from tehsils or cities that no longer exist, so the export carries no orphans.
  let removed = 0;
  for (const f of fs.readdirSync(outDir)) {
    const full = path.resolve(outDir, f);
    if (!keep.has(full)) {
      fs.unlinkSync(full);
      removed++;
    }
  }

  console.log(
    `ok   rates:chunks: ${keep.size} chunk(s), ${totalRows} rows, ${(totalBytes / 1024).toFixed(0)} KB total` +
      `${removed > 0 ? `, ${removed} stale removed` : ""}`,
  );
}

main();

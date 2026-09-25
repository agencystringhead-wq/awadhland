/**
 * npm run lookup:index
 *
 * Writes the circle rate lookup's data into public/lookup/:
 *
 *   index.json           every searchable place: id, both names, SRO, slug and normalised keys
 *   <city>-<sro>.json    one SRO's full records, fetched only when a result from it is picked
 *
 * The chunks are the rate lists' own RateRow and RoadSegmentRow records (minus the internal
 * transcriber note), not a second model. Rows come through lib/rates, so Ayodhya's corrected
 * slugs and names are the ones indexed and linked.
 *
 * Villages of the Lucknow SROs whose rate list has not arrived are indexed from their khasra
 * frontage list, so a search for them finds them and says the rates are awaited.
 *
 * Generated, gitignored, rebuilt on every prebuild. Fails if the gzipped index passes the budget.
 */
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { getCities, getLocalities } from "../lib/data";
import { getFrontage, getFrontageOnlySros, getFrontageVillages } from "../lib/frontage";
import { devKey, romanKey, type LookupChunk, type LookupEntryWire, type LookupIndexWire, type LookupSro } from "../lib/lookup";
import {
  getCommercialKinds,
  getCurrentRateSchedule,
  getInForceNote,
  getRoadBands,
  getRoadSegmentsByTehsil,
  getRowsByTehsil,
  getTehsilsByCity,
  rowEffectiveFrom,
} from "../lib/rates";

const OUT = path.join("public", "lookup");

/** A copy without one field: the transcriber's note and the printed counts never leave the build. */
function omit<T extends object, K extends keyof T>(o: T, key: K): Omit<T, K> {
  const copy = { ...o };
  delete copy[key];
  return copy;
}
/** The brief's budget for the whole index, gzipped. */
const BUDGET_GZ = 250 * 1024;

function main() {
  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });

  const cities = getCities().filter((c) => getCurrentRateSchedule(c.id) || getFrontage(c.id));
  const sros: LookupSro[] = [];
  const entries: LookupEntryWire[] = [];
  let chunkBytes = 0;
  let chunkCount = 0;

  // Other names a row goes by: every locality whose rateRefs point at it.
  const aliases = new Map<string, string[]>();
  for (const l of getLocalities()) {
    for (const r of l.rateRefs ?? []) {
      aliases.set(r.rateRowId, [...(aliases.get(r.rateRowId) ?? []), `${romanKey(l.name)}|${l.nameHi ? devKey(l.nameHi) : ""}`]);
    }
  }

  const write = (file: string, body: unknown) => {
    const s = JSON.stringify(body);
    fs.writeFileSync(path.join(OUT, file), s);
    return s.length;
  };

  cities.forEach((city, cityIdx) => {
    const schedule = getCurrentRateSchedule(city.id);
    const frontageSros = new Set(getFrontageOnlySros(city.id));

    for (const tehsil of getTehsilsByCity(city.id)) {
      /* SROs with a rate list */
      const rows = schedule ? getRowsByTehsil(city.id, tehsil.id) : [];
      if (schedule && rows.length > 0) {
        const sroIdx = sros.push({ city: cityIdx, id: tehsil.id, name: tehsil.name, nameHi: tehsil.nameHi, frontage: false }) - 1;
        // One SRO printing a name twice (Gorakhpur Sadar-1 has two रूस्तमपुर): tell them apart.
        const seenName = new Map<string, number>();
        for (const r of rows) seenName.set(r.nameHi, (seenName.get(r.nameHi) ?? 0) + 1);
        for (const r of rows) {
          const tellApart = (seenName.get(r.nameHi) ?? 0) > 1 ? (r.wardHi ?? `#${r.serial}`) : "";
          entries.push([r.id, r.nameHi, r.nameEn, sroIdx, r.slug, romanKey(r.nameEn), aliases.get(r.id) ?? [], tellApart]);
        }
        const doc = schedule.sourceDocs.find((d) => d.sro === tehsil.id);
        const chunk: LookupChunk = {
          kind: "rates",
          cityId: city.id,
          sro: tehsil.id,
          effectiveFrom: rowEffectiveFrom(schedule, tehsil.id),
          sourceUrl: doc?.archiveUrl ?? doc?.igrsupUrl ?? schedule.sources[0].url,
          bands: getRoadBands(city.id, tehsil.id),
          commercialKinds: getCommercialKinds(city.id),
          inForceNote: getInForceNote(city.id, tehsil.id),
          rows: rows.map((r) => omit(r, "note")),
          segments: getRoadSegmentsByTehsil(city.id, tehsil.id).map((g) => omit(g, "note")),
        };
        chunkBytes += write(`${city.id}-${tehsil.id}.json`, chunk);
        chunkCount++;
        continue;
      }

      /* SROs known only from a khasra frontage list */
      if (frontageSros.has(tehsil.id)) {
        const villages = getFrontageVillages(city.id, tehsil.id);
        const sroIdx = sros.push({ city: cityIdx, id: tehsil.id, name: tehsil.name, nameHi: tehsil.nameHi, frontage: true }) - 1;
        for (const v of villages) {
          entries.push([v.id, v.nameHi, v.nameEn, sroIdx, v.slug, romanKey(v.nameEn), [], ""]);
        }
        const chunk: LookupChunk = {
          kind: "frontage",
          cityId: city.id,
          sro: tehsil.id,
          effectiveFrom: getFrontage(city.id)!.effectiveFrom,
          villages: villages.map((v) => omit(v, "printedCounts")),
        };
        chunkBytes += write(`${city.id}-${tehsil.id}.json`, chunk);
        chunkCount++;
      }
    }
  });

  const index: LookupIndexWire = {
    generatedAt: new Date().toISOString().slice(0, 10),
    cities: cities.map((c) => ({ id: c.id, name: c.name, nameHi: c.nameHi })),
    sros,
    entries,
  };
  const body = JSON.stringify(index);
  fs.writeFileSync(path.join(OUT, "index.json"), body);
  const gz = zlib.gzipSync(body, { level: 9 }).length;

  const ids = new Set(entries.map((e) => e[0]));
  if (ids.size !== entries.length) {
    console.error(`FAIL lookup:index: ${entries.length - ids.size} duplicate ids in the index`);
    process.exit(1);
  }
  if (gz > BUDGET_GZ) {
    console.error(`FAIL lookup:index: index is ${(gz / 1024).toFixed(0)} KB gzipped, over the ${BUDGET_GZ / 1024} KB budget`);
    process.exit(1);
  }
  console.log(
    `ok   lookup:index: ${entries.length} places in ${sros.length} SROs across ${cities.length} cities; ` +
      `index ${(body.length / 1024).toFixed(0)} KB, ${(gz / 1024).toFixed(0)} KB gzipped; ${chunkCount} SRO chunks, ${(chunkBytes / 1024).toFixed(0)} KB`,
  );
}

main();

/**
 * npm run validate
 *
 * Runs every Zod schema in lib/schemas.ts against every file in /data, then cross-file integrity,
 * guide frontmatter, and the thin-page guard report. Reads files from disk (not via import) so
 * malformed JSON is reported per file instead of crashing. Exits 1 on any error.
 * Wired into "prebuild", so `npm run build` fails on bad data.
 */
import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import { dataFiles, type DataFileName } from "../lib/schemas";
import { checkIntegrity, type Dataset } from "../lib/integrity";
import { checkGuideReferences, readGuides } from "../lib/guide-files";
import { partitionLocalities } from "../lib/guards";

const root = process.cwd();
const dataDir = path.join(root, "data");
const errors: string[] = [];
const todos: string[] = [];
const parsed: Partial<Record<DataFileName, unknown>> = {};

/* 1. Every file in the registry exists, is JSON, and passes its schema. */
for (const file of Object.keys(dataFiles) as DataFileName[]) {
  const full = path.join(dataDir, file);
  if (!fs.existsSync(full)) {
    errors.push(`data/${file}: file is missing`);
    continue;
  }
  let raw: unknown;
  try {
    raw = JSON.parse(fs.readFileSync(full, "utf8"));
  } catch (e) {
    errors.push(`data/${file}: not valid JSON (${(e as Error).message})`);
    continue;
  }
  const result = dataFiles[file].safeParse(raw);
  if (!result.success) {
    errors.push(`data/${file}:\n${indent(z.prettifyError(result.error))}`);
    continue;
  }
  parsed[file] = result.data;
  const records = Array.isArray(result.data) ? result.data : [result.data];
  const count = records.length;
  for (const r of records as { id?: string; todo?: string[] }[]) {
    for (const t of r.todo ?? []) todos.push(`data/${file}${r.id ? ` [${r.id}]` : ""}: ${t}`);
  }
  console.log(`ok   data/${file} (${count} record${count === 1 ? "" : "s"})`);
}

/* 2. Any JSON file in /data without a schema is an error: unvalidated data must not ship. */
for (const file of fs.readdirSync(dataDir).filter((f) => f.endsWith(".json"))) {
  if (!(file in dataFiles)) errors.push(`data/${file}: no schema registered in lib/schemas.ts dataFiles`);
}

/* 3. Cross-file integrity, only when every file parsed. */
const allParsed = (Object.keys(dataFiles) as DataFileName[]).every((f) => parsed[f] !== undefined);
let dataset: Dataset | undefined;
if (allParsed) {
  dataset = {
    cities: parsed["cities.json"],
    localities: parsed["localities.json"],
    projects: parsed["projects.json"],
    circleRates: parsed["circleRates.json"],
    stampDutyRules: parsed["stampDutyRules.json"],
    updates: parsed["updates.json"],
    priceObservations: parsed["priceObservations.json"],
    team: parsed["team.json"],
    scoring: parsed["scoring.json"],
  } as Dataset;
  const integrity = checkIntegrity(dataset);
  errors.push(...integrity);
  if (integrity.length === 0) console.log("ok   cross-file integrity");
} else {
  console.log("skip cross-file integrity (fix schema errors first)");
}

/* 4. Guide frontmatter. */
const en = readGuides("en", root);
const hi = readGuides("hi", root);
errors.push(...en.errors, ...hi.errors);
if (dataset) {
  errors.push(
    ...checkGuideReferences(
      { en: en.guides, hi: hi.guides },
      { cityIds: new Set(dataset.cities.map((c) => c.id)), teamIds: new Set(dataset.team.map((t) => t.id)) },
    ),
  );
}
for (const g of [...en.guides, ...hi.guides]) {
  for (const t of g.frontmatter.todo ?? []) todos.push(`${g.file}: ${t}`);
}
console.log(`ok   guides: ${en.guides.length} en, ${hi.guides.length} hi parsed`);

/* 5. Thin-page guard report (informational: skipped localities are not errors). */
if (dataset) {
  for (const locale of ["en", "hi"] as const) {
    const { buildable, skipped } = partitionLocalities(dataset.localities, locale);
    const detail = skipped.map((s) => `${s.id} (missing ${s.missing.join(", ")})`).join("; ");
    console.log(`info thin-page guard ${locale}: ${buildable.length} buildable, ${skipped.length} skipped${detail ? `: ${detail}` : ""}`);
  }
}

if (todos.length > 0) {
  console.log(`\nwarn ${todos.length} open TODO${todos.length === 1 ? "" : "s"} on seed data:`);
  for (const t of todos) console.log(`  - ${t}`);
}

if (errors.length > 0) {
  console.error(`\nFAIL ${errors.length} validation error${errors.length === 1 ? "" : "s"}:`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log("\nPASS all data and guide frontmatter valid");

function indent(s: string) {
  return s
    .split("\n")
    .map((line) => `      ${line}`)
    .join("\n");
}

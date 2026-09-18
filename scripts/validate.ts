/**
 * npm run validate
 *
 * Runs every Zod schema in lib/schemas.ts against every file in /data, then cross-file integrity,
 * guide frontmatter and bodies (MDX compiles, components and ids resolve), and the thin-page guard
 * report. Reads files from disk (not via import) so malformed JSON is reported per file instead of
 * crashing. Exits 1 on any error. Wired into "prebuild", so `npm run build` fails on bad data.
 */
import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import { dataFiles, type DataFileName } from "../lib/schemas";
import { checkIntegrity, type Dataset } from "../lib/integrity";
import { checkGuideBodies, checkGuideReferences, dataPageLinks, readGuides, type GuideDataRefs } from "../lib/guide-files";
import { partitionLocalities } from "../lib/guards";

/** Spec "Internal linking": guides link to at least this many data pages via MDX components. */
const MIN_DATA_PAGE_LINKS = 3;

const root = process.cwd();
const dataDir = path.join(root, "data");
const errors: string[] = [];
const todos: string[] = [];
const warnings: string[] = [];
const parsed: Partial<Record<DataFileName, unknown>> = {};

async function main() {
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
      reviews: parsed["reviews.json"],
    } as Dataset;
    const integrity = checkIntegrity(dataset);
    errors.push(...integrity);
    if (integrity.length === 0) console.log("ok   cross-file integrity");
  } else {
    console.log("skip cross-file integrity (fix schema errors first)");
  }

  /* 4. Guides: frontmatter, references into /data, and MDX bodies. */
  const en = readGuides("en", root);
  const hi = readGuides("hi", root);
  const guides = [...en.guides, ...hi.guides];
  errors.push(...en.errors, ...hi.errors);
  if (dataset) {
    const refs: GuideDataRefs = {
      cityIds: new Set(dataset.cities.map((c) => c.id)),
      teamIds: new Set(dataset.team.map((t) => t.id)),
      localities: new Map(
        dataset.localities.map((l) => [
          l.id,
          { cityId: l.cityId, hasCircleRate: l.circleRate !== undefined, hasCoords: l.lat !== undefined && l.lng !== undefined },
        ]),
      ),
      anchorsByCity: new Map(dataset.cities.map((c) => [c.id, new Set(c.anchors.map((a) => a.id))])),
      projectIds: new Set(dataset.projects.map((p) => p.id)),
    };
    errors.push(...checkGuideReferences({ en: en.guides, hi: hi.guides }, refs));
  }
  errors.push(...(await checkGuideBodies(guides)));
  for (const g of guides) {
    for (const t of g.frontmatter.todo ?? []) todos.push(`${g.file}: ${t}`);
    const links = dataPageLinks(g.body);
    if (links < MIN_DATA_PAGE_LINKS) warnings.push(`${g.file}: links ${links} data page${links === 1 ? "" : "s"} via components, spec asks for ${MIN_DATA_PAGE_LINKS}`);
    const img = g.frontmatter.heroImage;
    if (!/^https?:\/\//.test(img) && !fs.existsSync(path.join(root, "public", img))) warnings.push(`${g.file}: heroImage ${img} not found under public/, image omitted`);
  }
  console.log(`ok   guides: ${en.guides.length} en, ${hi.guides.length} hi parsed and compiled`);

  /* 5. Thin-page guard report (informational: skipped localities are not errors). */
  if (dataset) {
    for (const locale of ["en", "hi"] as const) {
      const { buildable, skipped } = partitionLocalities(dataset.localities, locale);
      const detail = skipped.map((s) => `${s.id} (missing ${s.missing.join(", ")})`).join("; ");
      console.log(`info thin-page guard ${locale}: ${buildable.length} buildable, ${skipped.length} skipped${detail ? `: ${detail}` : ""}`);
    }
  }

  /* 6. Draft localities are noindex and absent from the sitemaps (Step 3 D2). */
  if (dataset && errors.length === 0) {
    const { getPages } = await import("../lib/pages");
    const { sitemapEn, sitemapHi } = await import("../lib/sitemaps");
    const drafts = dataset.localities.filter((l) => l.status === "draft");
    const live = dataset.localities.length - drafts.length;
    const maps = sitemapEn() + sitemapHi();
    for (const l of drafts) {
      const leaked = [`/${l.cityId}/${l.id}/</loc>`, `/hi/${l.cityId}/${l.id}/</loc>`].filter((u) => maps.includes(u));
      if (leaked.length > 0) errors.push(`sitemap: draft locality "${l.id}" is listed (${leaked.join(", ")})`);
      for (const locale of ["en", "hi"] as const) {
        const page = getPages(locale).find((p) => p.kind === "locality" && p.sitePath === `/${l.cityId}/${l.id}/`);
        if (page && !page.noindex) errors.push(`${locale} page for draft locality "${l.id}" is not noindex`);
      }
    }
    for (const c of dataset.cities) {
      const ls = dataset.localities.filter((l) => l.cityId === c.id);
      console.log(`info ${c.id}: ${ls.length} localities (${ls.filter((l) => l.status === "live").length} live, ${ls.filter((l) => l.status === "draft").length} draft), ${dataset.projects.filter((p) => p.cityId === c.id).length} projects`);
    }
    console.log(`ok   drafts: ${drafts.length} noindex and outside the sitemaps; ${live} live localities indexable`);
  }

  if (warnings.length > 0) {
    console.log(`\nwarn ${warnings.length} guide warning${warnings.length === 1 ? "" : "s"}:`);
    for (const w of warnings) console.log(`  - ${w}`);
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
  console.log("\nPASS all data and guide content valid");
}

function indent(s: string) {
  return s
    .split("\n")
    .map((line) => `      ${line}`)
    .join("\n");
}

main().catch((e) => {
  console.error(`\nFAIL validate crashed: ${(e as Error).stack ?? e}`);
  process.exit(1);
});

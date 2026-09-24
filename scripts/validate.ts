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
import { dataFiles, frontageFileSchema, frontagePlotsFileSchema, indexableRatesFileSchema, rateScheduleSchema, type DataFileName } from "../lib/schemas";
import { checkIntegrity, type Dataset } from "../lib/integrity";
import { checkGuideBodies, checkGuideReferences, dataPageLinks, readGuides } from "../lib/guide-files";
import { partitionLocalities, partitionProjects } from "../lib/guards";

/** Spec "Internal linking": guides link to at least this many data pages via MDX components. */
const MIN_DATA_PAGE_LINKS = 3;

const root = process.cwd();
const dataDir = path.join(root, "data");
const errors: string[] = [];
const todos: string[] = [];
const warnings: string[] = [];
/**
 * Typed per file, so the Dataset built below is checked rather than cast. It was cast before, and
 * the cast silently allowed two missing keys: standardPages, which nothing read, and villageNotes,
 * which crashed checkIntegrity the moment something did.
 */
type ParsedFiles = { [F in DataFileName]?: z.infer<(typeof dataFiles)[F]> };
const parsed: ParsedFiles = {};

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
    // One narrow cast at the write, because `file` is the whole union here. Reads stay typed,
    // which is the part that matters: the Dataset below is checked rather than cast.
    (parsed as Record<DataFileName, unknown>)[file] = result.data;
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
    // No cast: every key of Dataset has to be present and of the right type, so adding a data
    // file without adding it here is a compile error rather than a crash at run time.
    dataset = {
      cities: parsed["cities.json"]!,
      localities: parsed["localities.json"]!,
      projects: parsed["projects.json"]!,
      circleRates: parsed["circleRates.json"]!,
      stampDutyRules: parsed["stampDutyRules.json"]!,
      updates: parsed["updates.json"]!,
      priceObservations: parsed["priceObservations.json"]!,
      team: parsed["team.json"]!,
      scoring: parsed["scoring.json"]!,
      standardPages: parsed["standardPages.json"]!,
      villageNotes: parsed["villageNotes.json"]!,
      reviews: parsed["reviews.json"]!,
    };
    const integrity = checkIntegrity(dataset);
    errors.push(...integrity);
    if (integrity.length === 0) console.log("ok   cross-file integrity");
  } else {
    console.log("skip cross-file integrity (fix schema errors first)");
  }

  /* 3b. Full rate lists in data/rates/ (Step 9 A5). */
  const ratesDir = path.join(dataDir, "rates");
  if (fs.existsSync(ratesDir)) {
    const files = fs.readdirSync(ratesDir).filter((f) => f.endsWith(".json"));
    for (const f of files) {
      const at = `data/rates/${f}`;
      let raw: unknown;
      try {
        raw = JSON.parse(fs.readFileSync(path.join(ratesDir, f), "utf8"));
      } catch (e) {
        errors.push(`${at}: not valid JSON (${(e as Error).message})`);
        continue;
      }
      if (f === "indexable.json") {
        const r = indexableRatesFileSchema.safeParse(raw);
        if (!r.success) errors.push(`${at}:\n${indent(z.prettifyError(r.error))}`);
        else console.log(`ok   ${at} (${r.data.rateRowIds.length} row${r.data.rateRowIds.length === 1 ? "" : "s"} opened to indexing)`);
        continue;
      }
      const parsedSchedule = rateScheduleSchema.safeParse(raw);
      if (!parsedSchedule.success) {
        errors.push(`${at}:\n${indent(z.prettifyError(parsedSchedule.error))}`);
        continue;
      }
      const s = parsedSchedule.data;

      // Unique row and segment ids.
      const seenRow = new Set<string>();
      for (const r of s.rows) {
        if (seenRow.has(r.id)) errors.push(`${at}: duplicate rate row id "${r.id}"`);
        seenRow.add(r.id);
      }
      const seenSeg = new Set<string>();
      for (const r of s.roadSegments) {
        if (seenSeg.has(r.id)) errors.push(`${at}: duplicate road segment id "${r.id}"`);
        seenSeg.add(r.id);
      }

      // Unique slugs within a tehsil: two rows sharing one would collide as URLs.
      const bySroSlug = new Map<string, string[]>();
      for (const r of s.rows) {
        const k = `${r.sro}/${r.slug}`;
        bySroSlug.set(k, [...(bySroSlug.get(k) ?? []), r.id]);
      }
      for (const [k, ids] of bySroSlug) {
        if (ids.length > 1) errors.push(`${at}: slug "${k}" is used by ${ids.length} rows (${ids.join(", ")}) — they would share a URL`);
      }

      /*
       * Band keys are data now, so a row could name a column its schedule never declared and the
       * page would silently drop it. Nothing would look wrong -- a rate would just be missing.
       */
      const declared = new Set(s.roadBands.map((b) => b.key));
      for (const r of s.rows) {
        const stray = Object.keys(r.nonAgri).filter((k) => !declared.has(k));
        if (stray.length > 0) {
          errors.push(`${at}: ${r.id} (${r.nameHi}) has road band(s) ${stray.join(", ")} not declared in roadBands`);
        }
        if (Object.keys(r.nonAgri).length === 0) errors.push(`${at}: ${r.id} (${r.nameHi}) has no land rate at all`);
      }

      // Ordering sanity. A flagged row keeps the printed figure, so it warns rather than fails.
      let orderWarnings = 0;
      for (const r of s.rows) {
        // Across however many bands this city prints, each should cost at least the one before it.
        const printed = s.roadBands.map((b) => r.nonAgri[b.key]).filter((v): v is number => typeof v === "number");
        const landOut = printed.some((v, i) => i > 0 && v < printed[i - 1]);
        const commOut = r.commercial !== null && !(r.commercial.shop >= r.commercial.office && r.commercial.office >= r.commercial.godown);
        if (!landOut && !commOut) continue;
        const what = [landOut && "land rates do not rise with road width", commOut && "commercial is not shop ≥ office ≥ godown"]
          .filter(Boolean)
          .join("; ");
        const msg = `${at}: ${r.id} (${r.nameHi}, ${r.sro} serial ${r.serial}) ${what}`;
        if (r.note) {
          warnings.push(`${msg} — transcriber flagged: ${r.note}`);
          orderWarnings++;
        } else errors.push(`${msg} — no transcriber flag, so this is a transcription error, not a printed oddity`);
      }

      // Road segments: either resolve to a village row, or be listed as unmatched.
      const unmatchedSegs = s.roadSegments.filter((r) => r.rateRowId === null);
      const danglingSegs = s.roadSegments.filter((r) => r.rateRowId !== null && !seenRow.has(r.rateRowId));
      for (const r of danglingSegs) errors.push(`${at}: road segment "${r.id}" points at rate row "${r.rateRowId}", which does not exist`);

      console.log(
        `ok   ${at} (${s.rows.length} rows, ${s.roadSegments.length} road segments, effective ${s.effectiveFrom})`,
      );
      console.log(
        `info ${at}: ${unmatchedSegs.length} road segment${unmatchedSegs.length === 1 ? "" : "s"} unmatched to a village row` +
          `${orderWarnings > 0 ? `, ${orderWarnings} flagged row${orderWarnings === 1 ? "" : "s"} out of the usual order` : ""}`,
      );
      for (const t of s.todo ?? []) todos.push(`${at}: ${t}`);
    }
  }

  /* 3c. Khasra frontage lists in data/frontage/: villages, their plots, and the tehsils they hang off. */
  const frontageDir = path.join(dataDir, "frontage");
  if (fs.existsSync(frontageDir)) {
    const tehsils = parsed["tehsils.json"] ?? [];
    const readJson = (at: string, file: string): unknown => {
      try {
        return JSON.parse(fs.readFileSync(file, "utf8"));
      } catch (e) {
        errors.push(`${at}: not valid JSON (${(e as Error).message})`);
        return undefined;
      }
    };
    for (const f of fs.readdirSync(frontageDir).filter((f) => f.endsWith(".json") && !f.endsWith("-plots.json"))) {
      const at = `data/frontage/${f}`;
      const plotsAt = at.replace(/\.json$/, "-plots.json");
      const listRaw = readJson(at, path.join(frontageDir, f));
      const plotsRaw = readJson(plotsAt, path.join(root, plotsAt));
      if (listRaw === undefined || plotsRaw === undefined) continue;
      const list = frontageFileSchema.safeParse(listRaw);
      const plots = frontagePlotsFileSchema.safeParse(plotsRaw);
      if (!list.success) errors.push(`${at}:\n${indent(z.prettifyError(list.error))}`);
      if (!plots.success) errors.push(`${plotsAt}:\n${indent(z.prettifyError(plots.error))}`);
      if (!list.success || !plots.success) continue;
      const l = list.data;

      const docSros = new Set(l.sourceDocs.map((d) => d.sro));
      for (const sro of docSros) {
        const t = tehsils.find((x) => x.cityId === l.cityId && x.id === sro);
        if (!t) errors.push(`${at}: SRO "${sro}" is not in data/tehsils.json for ${l.cityId}`);
      }
      const ids = new Set<string>();
      const slugs = new Set<string>();
      for (const v of l.villages) {
        if (ids.has(v.id)) errors.push(`${at}: duplicate village id "${v.id}"`);
        ids.add(v.id);
        if (slugs.has(`${v.sro}/${v.slug}`)) errors.push(`${at}: slug "${v.sro}/${v.slug}" is used twice — they would share a URL`);
        slugs.add(`${v.sro}/${v.slug}`);
        if (!docSros.has(v.sro)) errors.push(`${at}: ${v.id} is under SRO "${v.sro}", which has no sourceDocs entry`);
        const ps = plots.data[v.id];
        if (!ps) {
          errors.push(`${plotsAt}: no plots entry for ${v.id} (${v.nameHi})`);
          continue;
        }
        // The counts a page shows must be the plots the tool will find.
        for (const cat of ["nh", "district", "link", "abadi"] as const) {
          const n = new Set(ps.filter((p) => p[2] === cat && !(p[4] ?? "").startsWith("split from")).map((p) => p[0])).size;
          if (n !== v.counts[cat]) errors.push(`${at}: ${v.id} ${cat} count ${v.counts[cat]} but ${plotsAt} lists ${n} distinct`);
        }
        for (const p of ps) {
          if (p[3] !== null && p[3] >= v.roadsHi.length) errors.push(`${plotsAt}: ${v.id} khasra ${p[0]} points at road ${p[3]}, which ${v.id} does not list`);
          // "04" is printed with its zero; its base is "4", so compare without leading zeros.
          if (!p[0].replace(/^0+(?=\d)/, "").startsWith(p[1])) errors.push(`${plotsAt}: ${v.id} khasra "${p[0]}" does not start with its base "${p[1]}"`);
        }
      }
      for (const id of Object.keys(plots.data)) if (!ids.has(id)) errors.push(`${plotsAt}: plots for "${id}", which is not a village in ${at}`);
      const plotCount = Object.values(plots.data).reduce((n, ps) => n + ps.length, 0);
      console.log(`ok   ${at} (${l.villages.length} villages across ${docSros.size} SROs, ${plotCount} khasra entries)`);
      for (const t of l.todo ?? []) todos.push(`${at}: ${t}`);
    }
  }

  /* 4. Guides: frontmatter, references into /data, and MDX bodies. */
  const en = readGuides("en", root);
  const hi = readGuides("hi", root);
  const guides = [...en.guides, ...hi.guides];
  errors.push(...en.errors, ...hi.errors);
  if (dataset) {
    // One source of truth with lib/guides.ts: a second copy of this map drifted once already and
    // let a guide reference survive validate but fail the build.
    const { guideDataRefs } = await import("../lib/guides");
    errors.push(...checkGuideReferences({ en: en.guides, hi: hi.guides }, guideDataRefs()));
  }
  errors.push(...(await checkGuideBodies(guides)));

  /*
   * Village page content (step 9b, point 6). Here rather than in lib/integrity.ts because that
   * module is reachable from a client component, and importing the 20 MB content there shipped
   * all of it to the browser. validate runs in prebuild, so these still fail the build.
   */
  {
    const { getAllVillageContent, villageContentIndexableIds, checkSegmentAgreement } = await import("../lib/village-content");
    const { getRateRow } = await import("../lib/rates");
    const CONTENT = "content/villages/…/ayodhya-villages-2025-06-07.json";
    const villages = getAllVillageContent();
    for (const village of villages) {
      if (!getRateRow(village.rateRowId)) errors.push(`${CONTENT}: unknown rateRowId "${village.rateRowId}"`);
    }
    for (const id of villageContentIndexableIds()) {
      if (!getRateRow(id)) errors.push(`content/villages/…/indexable.json: unknown rateRowId "${id}"`);
    }
    const seen = new Map<string, string>();
    for (const village of villages) {
      const key = `${village.sro}/${village.slug}`;
      const first = seen.get(key);
      if (first) errors.push(`${CONTENT}: slug "${village.slug}" is used twice in ${village.sro}: ${first} and ${village.rateRowId}`);
      else seen.set(key, village.rateRowId);
    }
    // The content's segment ids encode each village's nth stretch and its printed page, so they
    // are an independent check on the segment side of the transcription. A disagreement means one
    // of the two misread the source.
    for (const problem of checkSegmentAgreement()) errors.push(`${CONTENT}: ${problem}`);
    console.log(`ok   village content: ${villages.length} rows, ${villageContentIndexableIds().size} cleared for the sitemap`);
  }
  for (const g of guides) {
    for (const t of g.frontmatter.todo ?? []) todos.push(`${g.file}: ${t}`);
    const links = dataPageLinks(g.body);
    if (links < MIN_DATA_PAGE_LINKS) warnings.push(`${g.file}: links ${links} data page${links === 1 ? "" : "s"} via components, spec asks for ${MIN_DATA_PAGE_LINKS}`);
    const img = g.frontmatter.heroImage;
    if (!/^https?:\/\//.test(img) && !fs.existsSync(path.join(root, "public", img))) warnings.push(`${g.file}: heroImage ${img} not found under public/, image omitted`);
  }
  console.log(`ok   guides: ${en.guides.length} en, ${hi.guides.length} hi parsed and compiled`);

  /* 5. Guards (informational: skipped records are not errors). */
  if (dataset) {
    const { buildable: pubProjects, skipped: skippedProjects } = partitionProjects(dataset.projects);
    const detail = skippedProjects.map((s) => `${s.id} (missing ${s.missing.join(", ")})`).join("; ");
    console.log(
      `info source guard projects: ${pubProjects.length} published, ${skippedProjects.length} unsourced and not built${detail ? `: ${detail}` : ""}`,
    );
  }
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
      console.log(`info ${c.id}: ${ls.length} localities (${ls.filter((l) => l.status === "live").length} live, ${ls.filter((l) => l.status === "draft").length} draft), ${partitionProjects(dataset.projects).buildable.filter((p) => p.cityId === c.id).length} of ${dataset.projects.filter((p) => p.cityId === c.id).length} projects published`);
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

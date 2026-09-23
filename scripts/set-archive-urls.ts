/**
 * npm run rates:set-archive-urls -- --base https://media.awadhland.com [--city ayodhya] [--dry-run]
 *
 * Fills `sourceDocs[].archiveUrl` on the published rate schedules once the scanned PDFs are on R2.
 *
 * The scans are the provenance for every figure on the site, and IGRSUP reorganises: `igrsupUrl`
 * will rot, `archiveUrl` is the copy under our control. `pdfPath` stays as the repo-relative
 * reference to the local original, which is gitignored.
 *
 * The URL is derived from pdfPath's filename, so it matches whatever the upload put in the bucket:
 *
 *   <base>/<prefix>/<cityId>/<basename of pdfPath>
 *   https://media.awadhland.com/circle-rates/ayodhya/ayodhya-sadar-2025-06-07.pdf
 *
 * Before writing anything it HEADs every URL and compares the served content-length against the
 * local file, so a half-finished upload, a wrong prefix or a bucket that is not public fails here
 * rather than shipping an archiveUrl that 404s. There is deliberately no way to skip that check:
 * an archiveUrl is a public provenance link, and one written without ever being fetched is exactly
 * the broken link this script exists to prevent. If the upload is not finished, run it again later.
 */
import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import { rateScheduleSchema, type RateSchedule } from "../lib/schemas";

type Args = { base: string; prefix: string; city?: string; dryRun: boolean };

function parseArgs(argv: string[]): Args {
  const get = (name: string) => {
    const i = argv.indexOf(`--${name}`);
    return i >= 0 ? argv[i + 1] : undefined;
  };
  const base = get("base");
  if (!base) {
    console.error(
      "Missing --base.\n\n" +
        "Usage:\n  npm run rates:set-archive-urls -- --base https://media.awadhland.com \\\n" +
        "    [--prefix circle-rates] [--city ayodhya] [--dry-run]\n\n" +
        "--base is the bucket's public origin: its r2.dev address, or the custom domain bound to it.",
    );
    process.exit(1);
  }
  let url: URL;
  try {
    url = new URL(base);
  } catch {
    console.error(`--base is not a URL: ${base}`);
    process.exit(1);
  }
  if (url.protocol !== "https:") {
    console.error(`--base must be https, got ${url.protocol}//`);
    process.exit(1);
  }
  return {
    base: base.replace(/\/+$/, ""),
    prefix: (get("prefix") ?? "circle-rates").replace(/^\/+|\/+$/g, ""),
    city: get("city"),
    dryRun: argv.includes("--dry-run"),
  };
}

const ratesDir = path.join("data", "rates");

function readSchedules(city?: string): { file: string; schedule: RateSchedule }[] {
  if (!fs.existsSync(ratesDir)) return [];
  const out: { file: string; schedule: RateSchedule }[] = [];
  for (const f of fs.readdirSync(ratesDir).filter((f) => f.endsWith(".json") && f !== "indexable.json")) {
    const parsed = rateScheduleSchema.safeParse(JSON.parse(fs.readFileSync(path.join(ratesDir, f), "utf8")));
    if (!parsed.success) {
      console.error(`data/rates/${f}:\n${z.prettifyError(parsed.error)}`);
      process.exit(1);
    }
    if (city && parsed.data.cityId !== city) continue;
    out.push({ file: f, schedule: parsed.data });
  }
  return out;
}

type CheckResult = { ok: false; problem: string } | { ok: true; sizeCompared: boolean };

/** HEAD the object and compare what the bucket serves against the local original. */
async function check(url: string, pdfPath: string): Promise<CheckResult> {
  let res: Response;
  try {
    res = await fetch(url, { method: "HEAD", redirect: "follow" });
  } catch (e) {
    return { ok: false, problem: `unreachable (${(e as Error).message})` };
  }
  if (!res.ok) return { ok: false, problem: `HTTP ${res.status}` };

  const type = res.headers.get("content-type") ?? "";
  if (!/^application\/pdf\b/.test(type)) {
    return { ok: false, problem: `served as "${type || "no content-type"}", expected application/pdf` };
  }

  const served = Number(res.headers.get("content-length"));
  if (!Number.isFinite(served) || served <= 0) return { ok: false, problem: "no content-length to compare" };
  // The local original is gitignored, so on a fresh clone there is nothing to compare against. The
  // object still had to exist, be a PDF and have a body; the run reports it as unverified by size
  // rather than claiming a check it did not make.
  if (!fs.existsSync(pdfPath)) return { ok: true, sizeCompared: false };
  const local = fs.statSync(pdfPath).size;
  if (served !== local) return { ok: false, problem: `size mismatch: bucket ${served} bytes, local ${local}` };
  return { ok: true, sizeCompared: true };
}

/**
 * Record the verified URLs on a schedule's sourceDocs and retire the upload todo.
 *
 * Split out from main because it is the only part of this script that changes committed data,
 * while the check in front of it needs a bucket that does not exist yet — this way the write can
 * be exercised on its own.
 */
export function applyArchiveUrls(schedule: RateSchedule, urls: string[], today: string): void {
  if (urls.length !== schedule.sourceDocs.length) {
    throw new Error(`expected ${schedule.sourceDocs.length} urls for ${schedule.cityId}, got ${urls.length}`);
  }
  schedule.sourceDocs.forEach((doc, i) => {
    doc.archiveUrl = urls[i];
  });
  // The upload todo has been done; drop it rather than leave a stale instruction behind.
  schedule.todo = (schedule.todo ?? []).filter((t) => !/upload the .* pdfs to r2/i.test(t));
  if (schedule.todo.length === 0) delete schedule.todo;
  schedule.updatedAt = today;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const schedules = readSchedules(args.city);
  if (schedules.length === 0) {
    console.error(args.city ? `no schedule in data/rates/ for --city ${args.city}` : "no schedules in data/rates/");
    process.exit(1);
  }

  const problems: string[] = [];
  const planned = new Map<string, string[]>();
  let unsized = 0;

  for (const { file, schedule } of schedules) {
    console.log(`\n${file} · ${schedule.cityId} · effective ${schedule.effectiveFrom}`);
    const urls: string[] = [];
    for (const doc of schedule.sourceDocs) {
      const url = `${args.base}/${args.prefix}/${schedule.cityId}/${path.basename(doc.pdfPath)}`;
      const was = doc.archiveUrl;
      const result = await check(url, doc.pdfPath);
      if (!result.ok) problems.push(`${schedule.cityId}/${doc.sro}: ${result.problem}\n      ${url}`);
      else if (!result.sizeCompared) unsized++;
      urls.push(url);
      const mark = !result.ok ? "FAIL" : result.sizeCompared ? "ok  " : "ok* ";
      console.log(`  ${doc.sro.padEnd(10)} ${mark} ${url}${was && was !== url ? `\n             (was ${was})` : ""}`);
    }
    planned.set(file, urls);
  }

  const count = [...planned.values()].reduce((n, u) => n + u.length, 0);
  if (unsized > 0) {
    console.log(`\n  ok* = served as a PDF, but the local original is missing so its size was not compared (${unsized}).`);
  }

  if (problems.length > 0) {
    console.error(`\nrefusing to write: ${problems.length} object(s) did not check out.\n`);
    for (const p of problems) console.error(`  - ${p}`);
    console.error("\nFinish the upload, confirm the bucket is public, then run this again.\n");
    process.exit(1);
  }

  if (args.dryRun) {
    console.log(`\n--dry-run: ${count} archiveUrl would be set, nothing written.\n`);
    return;
  }

  const today = new Date().toISOString().slice(0, 10);
  for (const { file, schedule } of schedules) {
    applyArchiveUrls(schedule, planned.get(file)!, today);
    fs.writeFileSync(path.join(ratesDir, file), `${JSON.stringify(schedule, null, 2)}\n`);
  }

  console.log(`\nwrote ${schedules.length} schedule file(s), ${count} archiveUrl set.`);
  console.log("run `npm run rates:derive` so circleRates.json picks the archive link up.\n");
}

// Guarded so importing applyArchiveUrls from a test does not also run the CLI.
if (process.argv[1]?.includes("set-archive-urls")) main();

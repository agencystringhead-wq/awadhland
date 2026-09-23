/**
 * npm run rates:village-index
 *
 * Writes data/villageSlugs.json: the slug and English name for every rate row, and nothing else.
 *
 * lib/rates.ts needs those two fields so every URL, link and lookup uses the content's
 * hand-checked romanisation. It must not import the content file itself to get them. That file is
 * 20 MB, lib/rates is reachable from lib/data, and lib/data is reachable from a client component
 * through lib/tools — importing it there put the whole 20 MB into the browser bundle, taking it
 * from 2.0 MB to 20.4 MB. This map is about 150 KB and carries only what routing needs; the prose
 * stays in lib/village-content.ts, which only server components and the page registry import.
 */
import fs from "node:fs";
import path from "node:path";

const SRC = path.join("content", "villages", "village-content-ayodhya-2025-06-07", "ayodhya-villages-2025-06-07.json");
const OUT = path.join("data", "villageSlugs.json");

function main() {
  const content = JSON.parse(fs.readFileSync(SRC, "utf8")) as {
    villages: { rateRowId: string; slug: string; nameEn: string }[];
  };

  const map: Record<string, { slug: string; nameEn: string }> = {};
  for (const v of content.villages) map[v.rateRowId] = { slug: v.slug, nameEn: v.nameEn };

  fs.writeFileSync(OUT, `${JSON.stringify(map, null, 0)}\n`);
  const kb = Math.round(fs.statSync(OUT).size / 1024);
  console.log(`ok   village slug index: ${Object.keys(map).length} rows, ${kb} KB -> ${OUT}`);
}

main();

/**
 * npm run frontage:chunks
 *
 * Splits data/frontage/<city>-<date>-plots.json into one small JSON per village under
 * public/frontage/<city>/<sro>/<slug>.json, for the "check your plot" tool.
 *
 * The tool never loads the whole list: 58,000 khasra numbers is 1.8 MB, and a reader checking one
 * plot needs one village, typically 2–6 KB. The shape is mirrored by FrontageChunk in
 * lib/frontage.ts; change both together.
 *
 * Generated, gitignored, rebuilt on every prebuild.
 */
import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import { frontageFileSchema, frontagePlotsFileSchema } from "../lib/schemas";

const dataDir = path.join("data", "frontage");
const outDir = path.join("public", "frontage");

function read<T>(file: string, schema: z.ZodType<T>): T {
  const parsed = schema.safeParse(JSON.parse(fs.readFileSync(file, "utf8")));
  if (!parsed.success) {
    console.error(`${file}:\n${z.prettifyError(parsed.error)}`);
    process.exit(1);
  }
  return parsed.data;
}

function main() {
  const lists = fs.existsSync(dataDir) ? fs.readdirSync(dataDir).filter((f) => f.endsWith(".json") && !f.endsWith("-plots.json")) : [];
  if (lists.length === 0) {
    console.log("ok   frontage:chunks: no frontage lists, nothing to build");
    return;
  }
  fs.rmSync(outDir, { recursive: true, force: true });

  let files = 0;
  let bytes = 0;
  let largest = { id: "", bytes: 0 };
  for (const f of lists) {
    const list = read(path.join(dataDir, f), frontageFileSchema);
    const plotsFile = path.join(dataDir, f.replace(/\.json$/, "-plots.json"));
    if (!fs.existsSync(plotsFile)) {
      console.error(`FAIL frontage:chunks: ${plotsFile} is missing`);
      process.exit(1);
    }
    const plots = read(plotsFile, frontagePlotsFileSchema);
    for (const v of list.villages) {
      const ps = plots[v.id];
      if (!ps) {
        console.error(`FAIL frontage:chunks: no plots entry for ${v.id}`);
        process.exit(1);
      }
      const chunk = {
        id: v.id,
        roads: v.roadsHi,
        plots: ps.map(([k, b, c, r, u]) => ({ k, b, c, ...(r !== null ? { r } : {}), ...(u ? { u } : {}) })),
      };
      const dir = path.join(outDir, list.cityId, v.sro);
      fs.mkdirSync(dir, { recursive: true });
      const body = JSON.stringify(chunk);
      fs.writeFileSync(path.join(dir, `${v.slug}.json`), body);
      files++;
      bytes += body.length;
      if (body.length > largest.bytes) largest = { id: v.id, bytes: body.length };
    }
  }
  console.log(
    `ok   frontage:chunks: ${files} village chunks, ${(bytes / 1024).toFixed(0)} KB total, largest ${largest.id} ${(largest.bytes / 1024).toFixed(1)} KB`,
  );
}

main();

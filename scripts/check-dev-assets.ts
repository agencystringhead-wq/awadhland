/**
 * npm run build → postbuild
 *
 * Anything under /public/dev/ is a local placeholder (for now the reference portrait) and must
 * never reach production. This scans the static export for references to /dev/ and fails the
 * build on CI (Cloudflare Pages sets CF_PAGES=1 and CI=true). Locally it prints a warning so the
 * homepage can be worked on with the placeholder in place.
 */
import fs from "node:fs";
import path from "node:path";

const out = path.join(process.cwd(), "out");
const onCi = process.env.CF_PAGES === "1" || process.env.CI === "true" || process.env.CI === "1";
const pattern = /["'(=\s]\/dev\/[^"')\s\\]+/g;

function walk(dir: string, hits: Map<string, Set<string>>) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "dev" && dir === out) hits.set("out/dev/ (directory)", new Set(fs.readdirSync(full)));
      else walk(full, hits);
      continue;
    }
    if (!/\.(html|css|js|json|txt|xml)$/.test(entry.name)) continue;
    const text = fs.readFileSync(full, "utf8");
    const found = new Set<string>();
    for (const m of text.matchAll(pattern)) found.add(m[0].slice(1));
    if (found.size > 0) hits.set(path.relative(process.cwd(), full).split(path.sep).join("/"), found);
  }
}

if (!fs.existsSync(out)) {
  console.error("check-dev-assets: out/ not found; run after next build");
  process.exit(1);
}
const hits = new Map<string, Set<string>>();
walk(out, hits);

if (hits.size === 0) {
  console.log("ok   no /dev/ assets referenced in the export");
  process.exit(0);
}
const lines = [...hits.entries()].map(([file, refs]) => `  - ${file}: ${[...refs].join(", ")}`);
if (onCi) {
  console.error(`FAIL dev-only assets referenced in a CI build (${hits.size} file${hits.size === 1 ? "" : "s"}):\n${lines.join("\n")}`);
  console.error("Replace every /dev/ reference with real media on R2 before deploying.");
  process.exit(1);
}
console.log(`warn dev-only assets referenced (fine locally, fails on CI; ${hits.size} file${hits.size === 1 ? "" : "s"}):\n${lines.join("\n")}`);

/**
 * npm run build (postbuild)
 *
 * Removes the per-route `index.txt` files from the export.
 *
 * Next writes each page's React Server Component payload twice: inline in the HTML, and again as
 * a sibling `index.txt`. The `.txt` copy exists only so the client router can swap page content
 * on a `next/link` navigation without a full load. This site does not do that — every internal
 * link is a plain `<a href>`, in the header, the footer, the mega menu and all page templates —
 * so nothing ever fetched them. At 3,512 routes they were 455 MB of an export that Cloudflare
 * Pages has to receive on every deploy.
 *
 * If a `next/link` is ever introduced, its client-side navigation will 404 on the missing payload
 * and Next will fall back to a full page load, which is what a plain anchor does anyway. The
 * guard below fails the build in that case rather than letting it degrade silently.
 *
 * Only files named exactly `index.txt` are removed. `robots.txt` and `llms.txt` are real routes
 * and are left alone.
 */
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const outDir = path.join(root, "out");
const SOURCE_DIRS = ["app", "components", "lib"];

/** A next/link import anywhere means client-side navigation, which needs these files. */
function findNextLinkImports(): string[] {
  const hits: string[] = [];
  const walk = (dir: string) => {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.(tsx?|jsx?|mdx)$/.test(entry.name)) {
        if (/from\s+["']next\/link["']/.test(fs.readFileSync(full, "utf8"))) hits.push(path.relative(root, full));
      }
    }
  };
  for (const d of SOURCE_DIRS) walk(path.join(root, d));
  return hits;
}

function main() {
  const linkFiles = findNextLinkImports();
  if (linkFiles.length > 0) {
    console.error(
      `fail flight payloads: next/link is imported by ${linkFiles.length} file(s), which needs the index.txt payloads this step removes:\n` +
        linkFiles.map((f) => `       ${f}`).join("\n") +
        `\n\n       Either use a plain <a href> (the convention everywhere else on this site), or drop this\n` +
        `       postbuild step and accept the payloads back into the export.`,
    );
    process.exit(1);
  }

  if (!fs.existsSync(outDir)) {
    console.log("ok   flight payloads: no out/, nothing to drop");
    return;
  }

  let removed = 0;
  let bytes = 0;
  const walk = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name === "index.txt") {
        bytes += fs.statSync(full).size;
        fs.unlinkSync(full);
        removed++;
      }
    }
  };
  walk(outDir);

  console.log(`ok   flight payloads: dropped ${removed} index.txt (${(bytes / 1048576).toFixed(0)} MB); every internal link is a plain anchor`);
}

main();

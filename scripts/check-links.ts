/**
 * Fails the build if any exported page links to an internal path that was not exported.
 *
 * This exists because eighteen dead links sat in the footer and nav of all 3,318 pages for
 * several releases without anything noticing: they were links to standard pages the spec calls
 * for but that had not been built yet. A link that 404s on every page of the site is the kind of
 * defect that only a whole-export sweep catches, so the sweep runs on every build.
 *
 * Only same-origin paths are checked. External URLs, mailto:, tel:, and in-page anchors are the
 * page's own business; this is about the site disagreeing with itself.
 */
import fs from "node:fs";
import path from "node:path";

const OUT = "out";

/** Paths that are served by the host rather than emitted as files. */
const HOST_ROUTES = new Set<string>([]);

function walk(dir: string, onFile: (abs: string, rel: string) => void) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, e.name);
    if (e.isDirectory()) walk(abs, onFile);
    else onFile(abs, "/" + path.relative(OUT, abs).split(path.sep).join("/"));
  }
}

function main() {
  if (!fs.existsSync(OUT)) {
    console.error(`check-links: ${OUT}/ does not exist — run the build first.`);
    process.exit(1);
  }

  const emitted = new Set<string>();
  const pages: string[] = [];
  walk(OUT, (abs, rel) => {
    emitted.add(rel);
    if (abs.endsWith(".html")) pages.push(abs);
  });

  /** A link resolves if the export has that exact file, or the directory index, or a .html sibling. */
  const resolves = (href: string) => {
    const p = href.split("#")[0].split("?")[0];
    if (p === "") return true; // bare #anchor
    if (HOST_ROUTES.has(p)) return true;
    if (emitted.has(p)) return true;
    const bare = p.replace(/\/$/, "");
    return emitted.has(`${bare}/index.html`) || emitted.has(`${bare}.html`);
  };

  const dead = new Map<string, { count: number; first: string }>();
  let checked = 0;

  for (const file of pages) {
    const html = fs.readFileSync(file, "utf8");
    for (const m of html.matchAll(/href="(\/[^"]*)"/g)) {
      checked++;
      const href = m[1];
      if (resolves(href)) continue;
      const hit = dead.get(href);
      if (hit) hit.count++;
      else dead.set(href, { count: 1, first: path.relative(OUT, file).split(path.sep).join("/") });
    }
  }

  if (dead.size === 0) {
    console.log(`ok   check-links: ${checked} internal links across ${pages.length} pages, 0 dead`);
    return;
  }

  console.error(`\nFAIL check-links: ${dead.size} internal target(s) do not exist in ${OUT}/\n`);
  for (const [href, { count, first }] of [...dead].sort((a, b) => b[1].count - a[1].count)) {
    console.error(`  ${href}\n      ${count} link${count === 1 ? "" : "s"}, e.g. ${first}`);
  }
  console.error(
    "\nEither build the page, or stop linking it. The footer and nav filter themselves against\n" +
      "lib/pages.ts (builtSitePaths) and lib/tools.ts (TOOL_SLUGS) — adding the page to those is\n" +
      "usually all that is needed.\n",
  );
  process.exit(1);
}

main();

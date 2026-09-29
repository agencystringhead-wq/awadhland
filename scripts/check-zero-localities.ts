/**
 * npm run build → postbuild
 *
 * A city with no published locality pages must fall back to its sub-registrar data (lib/rates.ts)
 * rather than print "0 localities" or an empty list. This fails the build if any rendered page, or
 * any page's title, description or OG text, still says so. Numbers and labels sit in separate
 * elements (<dt>/<dd>), so the export is read as text with tags removed, in both orders.
 *
 * The patterns are built with String.raw so no backslash is lost between here and the RegExp; a
 * guard that silently matches nothing reads as passing. `--self-test` proves it still matches.
 */
import fs from "node:fs";
import path from "node:path";

const out = path.join(process.cwd(), "out");
// "0 localities", "localities 0", and the Hindi forms with or without the nukta; not "10" or "1,0".
const label = String.raw`(?:localit(?:y|ies)|इलाक़?े|इलाक़?ों)`;
const zero = String.raw`(?<![\d,.०-९])[0०](?![\d,.०-९])`;
const pattern = new RegExp(String.raw`${zero}\s*${label}|${label}\s*${zero}`, "iu");

const norm = (s: string) => s.normalize("NFD");
const text = (html: string) =>
  norm(
    html
      .replace(/<(script|style)[\s\S]*?<\/\1>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/\s+/g, " "),
  );

if (process.argv.includes("--self-test")) {
  const must = ["localities 0 See", "0 localities", "0 LOCALITIES", "इलाक़े 0", "0 इलाक़े", "इलाक़े 0"];
  const mustNot = ["12 localities", "localities 12", "10 localities", "1,0 localities", "localities 0.5"];
  const wrong = [...must.filter((s) => !pattern.test(norm(s))), ...mustNot.filter((s) => pattern.test(norm(s)))];
  if (wrong.length > 0) {
    console.error(`fail zero localities self-test: ${wrong.join(" | ")}`);
    process.exit(1);
  }
  console.log("ok   zero localities self-test");
  process.exit(0);
}

const bad: string[] = [];
const walk = (dir: string) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full);
    else if (e.name.endsWith(".html")) {
      const html = fs.readFileSync(full, "utf8");
      // Meta descriptions and OG tags live in attributes, which the tag-strip above discards.
      const metas = norm([...html.matchAll(/<meta[^>]+content="([^"]*)"/g)].map((m) => m[1]).join(" "));
      const hit = text(html).match(pattern) ?? metas.match(pattern);
      if (hit) bad.push(`${path.relative(out, full).split(path.sep).join("/")}: "${hit[0]}"`);
    }
  }
};

async function main() {
  if (fs.existsSync(out)) walk(out);
  // The OG images are drawn from these fields (scripts/generate-og.ts), so checking them covers the images.
  const { getAllPages } = await import("../lib/pages");
  for (const p of getAllPages()) {
    const hit = norm([p.title, p.description, p.og.title, p.og.subtitle, p.og.chip ?? ""].join(" | ")).match(pattern);
    if (hit) bad.push(`page entry ${p.locale} ${p.sitePath}: "${hit[0]}"`);
  }
  if (bad.length > 0) {
    console.error(`fail zero localities: ${bad.length} page(s) print a zero locality count. Fall back to the SRO data (getPublishedSros / getVillageCount in lib/rates.ts).`);
    for (const b of bad.slice(0, 20)) console.error(`       ${b}`);
    process.exit(1);
  }
  console.log("ok   zero localities: no page prints a zero locality count");
}
main();

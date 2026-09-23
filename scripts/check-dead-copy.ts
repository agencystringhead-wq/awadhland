/**
 * Reports copy that is written but never read.
 *
 * Two fields in lib/content.ts (heroTitle, heroPromise) were defined in both languages and
 * rendered nowhere — superseded by homeStory when the homepage copy was reshaped, and left behind.
 * The team.json `bio` had the same shape: written, translated, never displayed. Copy that no page
 * reads is worse than missing copy, because it reads as done.
 *
 * The test is deliberately crude: for each key declared inside a copy dictionary, look for `.key`
 * anywhere else in the app. That over-reports usage — a generic name like `title` matches
 * something somewhere — so it can miss dead copy, but anything it does report really is unread.
 * A false alarm is therefore near impossible, which is why this can be trusted at a glance.
 *
 * It fails the build. It warned while there was a backlog to clear; both dictionaries have been
 * at zero since the sixteen dead ui keys went, so a new one now means a key was added and the
 * page meant to read it never was. Catching that at the commit is the whole point — copy that no
 * page reads is worse than missing copy, because it reads as done.
 */
import fs from "node:fs";
import path from "node:path";

/** Copy dictionaries to scan, by file and by the exported binding that holds them. */
const TARGETS: { file: string; objects: string[] }[] = [
  { file: "lib/i18n.ts", objects: ["ui"] },
  { file: "lib/content.ts", objects: ["circleRatesCopy", "homeCopy", "toolCopy", "homeStory"] },
];

/** Source of the object literal assigned to `export const <name> = ... {`, brace-matched. */
function objectBody(src: string, name: string): string {
  const decl = new RegExp(`export const ${name}\\b`).exec(src);
  if (!decl) return "";
  const open = src.indexOf("{", decl.index);
  if (open === -1) return "";
  let depth = 0;
  for (let i = open; i < src.length; i++) {
    if (src[i] === "{") depth++;
    else if (src[i] === "}" && --depth === 0) return src.slice(open, i + 1);
  }
  return "";
}

function main() {
  const root = process.cwd();

  // Everything that could read the copy: the whole app minus the files that declare it.
  const declaring = new Set(TARGETS.map((t) => path.join(root, t.file)));
  const readers: string[] = [];
  (function walk(dir: string) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (["node_modules", ".next", "out", ".git"].includes(e.name)) continue;
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (/\.(ts|tsx)$/.test(e.name) && !declaring.has(p)) readers.push(p);
    }
  })(root);
  const haystack = readers.map((f) => fs.readFileSync(f, "utf8")).join("\n");

  /*
   * Names bound by destructuring, counted as reads alongside `.key` and `["key"]`.
   *
   * Nothing in the app reads copy that way today -- every component does `const t = ui[locale]`
   * and then `t.key` -- but this check now fails the build, and `const { ctaLabel } = t` is a
   * perfectly ordinary thing for someone to write. Without this it would stop a build over copy
   * that is being read. `{ a: b }` binds b but reads a, so the key before the colon is the one
   * that counts.
   */
  const destructured = new Set<string>();
  for (const m of haystack.matchAll(/(?:const|let|var)\s*\{([^{}]*)\}\s*=/g)) {
    for (const part of m[1].split(",")) {
      const key = part.split(":")[0].replace("...", "").split("=")[0].trim();
      if (/^[a-zA-Z][a-zA-Z0-9]*$/.test(key)) destructured.add(key);
    }
  }

  let total = 0;
  for (const { file, objects } of TARGETS) {
    const src = fs.readFileSync(path.join(root, file), "utf8");
    const keys = new Set<string>();
    for (const name of objects) {
      // Only keys inside the dictionary itself, so helper functions elsewhere in the file (an
      // Intl.DateTimeFormat options object, for instance) are not mistaken for copy.
      for (const m of objectBody(src, name).matchAll(/^\s+([a-zA-Z][a-zA-Z0-9]*)\??:\s*["'`[]/gm)) keys.add(m[1]);
    }
    const dead = [...keys]
      .filter((k) => !destructured.has(k) && !new RegExp(`[.\\[]"?${k}\\b`).test(haystack))
      .sort();
    total += dead.length;
    if (dead.length === 0) {
      console.log(`ok   ${file}: ${keys.size} copy key(s), all read`);
    } else {
      console.error(`FAIL ${file}: ${dead.length} of ${keys.size} copy key(s) are never read: ${dead.join(", ")}`);
    }
  }

  if (total > 0) {
    console.error(
      `\n${total} copy key(s) written and never rendered. Delete them, or wire up the page that was meant to read them.\n`,
    );
    process.exit(1);
  }
}

main();

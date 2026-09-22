/**
 * Guide file reading and frontmatter checks. No dependency on lib/data.ts, so
 * scripts/validate.ts can use it and still report every data error in one run.
 */
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { z } from "zod";
import { guideFrontmatterSchema, type GuideFrontmatter, type Locale } from "./schemas";

export type Guide = { frontmatter: GuideFrontmatter; body: string; file: string; readTimeMin: number };

/** Whole minutes at 200 words per minute, minimum 1. Counted on the raw MDX body. */
export function readTimeMin(body: string): number {
  const words = body.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

export const GUIDE_DIRS: Record<Locale, string> = {
  en: path.join("content", "guides"),
  hi: path.join("content", "hi", "guides"),
};

/** Parses every guide for a locale. Returns issues instead of throwing so callers can report all of them. */
export function readGuides(locale: Locale, root = process.cwd()): { guides: Guide[]; errors: string[] } {
  const dir = path.join(root, GUIDE_DIRS[locale]);
  const guides: Guide[] = [];
  const errors: string[] = [];
  if (!fs.existsSync(dir)) return { guides, errors };

  for (const name of fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".mdx"))
    .sort()) {
    const file = path.join(GUIDE_DIRS[locale], name).split(path.sep).join("/");
    let parsed: matter.GrayMatterFile<string>;
    try {
      parsed = matter(fs.readFileSync(path.join(dir, name), "utf8"));
    } catch (e) {
      errors.push(`${file}: frontmatter is not valid YAML (${(e as Error).message})`);
      continue;
    }
    // gray-matter turns unquoted YAML dates into Date objects; the schema expects YYYY-MM-DD strings.
    const data = Object.fromEntries(Object.entries(parsed.data).map(([k, v]) => [k, v instanceof Date ? v.toISOString().slice(0, 10) : v]));
    const result = guideFrontmatterSchema.safeParse(data);
    if (!result.success) {
      errors.push(`${file}:\n${z.prettifyError(result.error)}`);
      continue;
    }
    const fm = result.data;
    if (`${fm.slug}.mdx` !== name) errors.push(`${file}: slug "${fm.slug}" does not match file name`);
    if (fm.lang !== locale) errors.push(`${file}: lang "${fm.lang}" but file is in the ${locale} tree`);
    guides.push({ frontmatter: fm, body: parsed.content, file, readTimeMin: readTimeMin(parsed.content) });
  }
  return { guides, errors };
}

/* ------------------------------------------------------------------ body */

/**
 * Components a guide body may use (spec Template 6, section 3). The map in components/mdx
 * must cover exactly these names; validate.ts rejects any other capitalised tag.
 */
export const GUIDE_COMPONENT_NAMES = ["CircleRate", "Distance", "ProjectCard", "Callout", "Checklist"] as const;
export type GuideComponentName = (typeof GUIDE_COMPONENT_NAMES)[number];

/** Inserted by the renderer after the second H2 section (spec Template 6, section 4). Not for authors. */
export const MID_CTA_TAG = "MidArticleCta";

export type Heading = { id: string; text: string };

/** Lines of the body with fenced code blocks blanked, so headings and tags inside code are ignored. */
function proseLines(body: string): string[] {
  let inFence = false;
  return body.split("\n").map((line) => {
    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence;
      return "";
    }
    return inFence ? "" : line;
  });
}

/** Markdown inline syntax stripped for TOC labels and ids: **x**, *x*, `x`, [x](y). */
export function plainHeadingText(md: string): string {
  return md
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[*_`~]+/g, "")
    .trim();
}

/** Unicode-aware slug: keeps letters, marks (Devanagari matras) and digits; everything else becomes "-". */
export function slugifyHeading(text: string): string {
  return plainHeadingText(text)
    .normalize("NFC")
    .toLowerCase()
    .replace(/[^\p{L}\p{M}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
}

/** H2 headings in document order with unique ids. Same ids the renderer puts on the <h2> elements. */
export function guideHeadings(body: string): Heading[] {
  const seen = new Map<string, number>();
  const out: Heading[] = [];
  for (const line of proseLines(body)) {
    const m = /^##\s+(.+?)\s*#*\s*$/.exec(line);
    if (!m) continue;
    const text = plainHeadingText(m[1]);
    const base = slugifyHeading(text) || "section";
    const n = (seen.get(base) ?? 0) + 1;
    seen.set(base, n);
    out.push({ id: n === 1 ? base : `${base}-${n}`, text });
  }
  return out;
}

/** Body with the mid-article CTA tag placed before the third H2, or appended when there are fewer than three. */
export function withMidArticleCta(body: string): string {
  const lines = body.split("\n");
  const prose = proseLines(body);
  let h2 = 0;
  for (let i = 0; i < prose.length; i++) {
    if (!/^##\s+\S/.test(prose[i])) continue;
    h2++;
    if (h2 === 3) return [...lines.slice(0, i), "", `<${MID_CTA_TAG} />`, "", ...lines.slice(i)].join("\n");
  }
  return `${body.trimEnd()}\n\n<${MID_CTA_TAG} />\n`;
}

export type ComponentRef = { name: string; attrs: Record<string, string> };

/** Every capitalised JSX tag in the prose with its string attributes, e.g. <CircleRate locality="x" />. */
export function extractComponentRefs(body: string): ComponentRef[] {
  const refs: ComponentRef[] = [];
  const tag = /<([A-Z][A-Za-z0-9]*)\b([^>]*?)\/?>/g;
  const attr = /([A-Za-z][\w-]*)\s*=\s*"([^"]*)"/g;
  for (const m of proseLines(body).join("\n").matchAll(tag)) {
    const attrs: Record<string, string> = {};
    for (const a of m[2].matchAll(attr)) attrs[a[1]] = a[2];
    refs.push({ name: m[1], attrs });
  }
  return refs;
}

export type GuideDataRefs = {
  cityIds: Set<string>;
  teamIds: Set<string>;
  /** id → what the body components need from the record */
  localities: Map<string, { cityId: string; hasCircleRate: boolean; hasCoords: boolean }>;
  /** cityId → anchor ids usable in <Distance to="…" /> */
  anchorsByCity: Map<string, Set<string>>;
  projectIds: Set<string>;
};

/** Number of distinct data pages (localities, projects) a body links to through components. */
export function dataPageLinks(body: string): number {
  const pages = new Set<string>();
  for (const { name, attrs } of extractComponentRefs(body)) {
    if (name === "CircleRate" && attrs.locality) pages.add(`locality:${attrs.locality}`);
    if (name === "Distance" && attrs.from) pages.add(`locality:${attrs.from}`);
    if (name === "ProjectCard" && attrs.id) pages.add(`project:${attrs.id}`);
  }
  return pages.size;
}

/**
 * Frontmatter references: author must be a team id or "wwiser"; cityIds must exist; pairedSlug must
 * exist in the other tree. Body references: every capitalised tag is a known component and every
 * data id it names exists with the fields the component renders.
 */
export function checkGuideReferences(byLocale: Record<Locale, Guide[]>, refs: GuideDataRefs): string[] {
  const errors: string[] = [];
  const known = new Set<string>(GUIDE_COMPONENT_NAMES);
  for (const locale of ["en", "hi"] as const) {
    const other = locale === "en" ? "hi" : "en";
    const otherSlugs = new Set(byLocale[other].map((g) => g.frontmatter.slug));
    const seen = new Set<string>();
    for (const { frontmatter: fm, file, body } of byLocale[locale]) {
      if (seen.has(fm.slug)) errors.push(`${file}: duplicate slug "${fm.slug}" in the ${locale} tree`);
      seen.add(fm.slug);
      if (fm.author !== "wwiser" && !refs.teamIds.has(fm.author)) errors.push(`${file}: author "${fm.author}" is not in team.json`);
      for (const id of fm.cityIds) if (!refs.cityIds.has(id)) errors.push(`${file}: unknown cityId "${id}"`);
      if (fm.pairedSlug && !otherSlugs.has(fm.pairedSlug))
        errors.push(`${file}: pairedSlug "${fm.pairedSlug}" not found in the ${other} tree`);
      if (fm.updatedAt < fm.publishedAt) errors.push(`${file}: updatedAt is before publishedAt`);

      for (const { name, attrs } of extractComponentRefs(body)) {
        if (name === MID_CTA_TAG) {
          errors.push(`${file}: <${MID_CTA_TAG}> is placed by the template, remove it from the body`);
          continue;
        }
        if (!known.has(name)) {
          errors.push(`${file}: unknown component <${name}>; allowed: ${GUIDE_COMPONENT_NAMES.join(", ")}`);
          continue;
        }
        if (name === "CircleRate") {
          const l = attrs.locality ? refs.localities.get(attrs.locality) : undefined;
          if (!attrs.locality) errors.push(`${file}: <CircleRate> needs locality="<locality id>"`);
          else if (!l) errors.push(`${file}: <CircleRate locality="${attrs.locality}"> names an unknown locality`);
          else if (!l.hasCircleRate) errors.push(`${file}: <CircleRate locality="${attrs.locality}">: that locality has neither a circleRate nor rateRefs yet`);
        }
        if (name === "Distance") {
          const l = attrs.from ? refs.localities.get(attrs.from) : undefined;
          if (!attrs.from || !attrs.to) errors.push(`${file}: <Distance> needs from="<locality id>" to="<anchor id>"`);
          else if (!l) errors.push(`${file}: <Distance from="${attrs.from}"> names an unknown locality`);
          else if (!l.hasCoords) errors.push(`${file}: <Distance from="${attrs.from}">: that locality has no lat/lng`);
          else if (!refs.anchorsByCity.get(l.cityId)?.has(attrs.to))
            errors.push(
              `${file}: <Distance to="${attrs.to}">: not an anchor of ${l.cityId} (${[...(refs.anchorsByCity.get(l.cityId) ?? [])].join(", ")})`,
            );
        }
        if (name === "ProjectCard") {
          if (!attrs.id) errors.push(`${file}: <ProjectCard> needs id="<project id>"`);
          else if (!refs.projectIds.has(attrs.id)) errors.push(`${file}: <ProjectCard id="${attrs.id}"> names an unknown project`);
        }
      }
    }
  }
  return errors;
}

/** Compiles each body with the same MDX options the renderer uses, so a syntax error fails validate, not the page. */
export async function checkGuideBodies(guides: Guide[]): Promise<string[]> {
  const [{ compile }, { default: remarkGfm }] = await Promise.all([import("@mdx-js/mdx"), import("remark-gfm")]);
  const errors: string[] = [];
  for (const g of guides) {
    try {
      await compile(withMidArticleCta(g.body), { remarkPlugins: [remarkGfm], outputFormat: "function-body" });
    } catch (e) {
      errors.push(`${g.file}: MDX does not compile (${(e as Error).message})`);
    }
  }
  return errors;
}

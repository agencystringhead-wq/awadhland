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

  for (const name of fs.readdirSync(dir).filter((f) => f.endsWith(".mdx")).sort()) {
    const file = path.join(GUIDE_DIRS[locale], name).split(path.sep).join("/");
    let parsed: matter.GrayMatterFile<string>;
    try {
      parsed = matter(fs.readFileSync(path.join(dir, name), "utf8"));
    } catch (e) {
      errors.push(`${file}: frontmatter is not valid YAML (${(e as Error).message})`);
      continue;
    }
    // gray-matter turns unquoted YAML dates into Date objects; the schema expects YYYY-MM-DD strings.
    const data = Object.fromEntries(
      Object.entries(parsed.data).map(([k, v]) => [k, v instanceof Date ? v.toISOString().slice(0, 10) : v]),
    );
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

/** author must be a team id or "wwiser"; cityIds must exist; pairedSlug must exist in the other tree. */
export function checkGuideReferences(
  byLocale: Record<Locale, Guide[]>,
  refs: { cityIds: Set<string>; teamIds: Set<string> },
): string[] {
  const errors: string[] = [];
  for (const locale of ["en", "hi"] as const) {
    const other = locale === "en" ? "hi" : "en";
    const otherSlugs = new Set(byLocale[other].map((g) => g.frontmatter.slug));
    const seen = new Set<string>();
    for (const { frontmatter: fm, file } of byLocale[locale]) {
      if (seen.has(fm.slug)) errors.push(`${file}: duplicate slug "${fm.slug}" in the ${locale} tree`);
      seen.add(fm.slug);
      if (fm.author !== "wwiser" && !refs.teamIds.has(fm.author)) errors.push(`${file}: author "${fm.author}" is not in team.json`);
      for (const id of fm.cityIds) if (!refs.cityIds.has(id)) errors.push(`${file}: unknown cityId "${id}"`);
      if (fm.pairedSlug && !otherSlugs.has(fm.pairedSlug)) errors.push(`${file}: pairedSlug "${fm.pairedSlug}" not found in the ${other} tree`);
      if (fm.updatedAt < fm.publishedAt) errors.push(`${file}: updatedAt is before publishedAt`);
    }
  }
  return errors;
}

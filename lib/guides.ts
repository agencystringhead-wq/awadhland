/**
 * Guide loader. Reads MDX frontmatter and body from /content/guides (en) and /content/hi/guides (hi)
 * at build time and validates both against /data. Rendering lives in lib/mdx.tsx.
 */
import fs from "node:fs";
import path from "node:path";
import type { Locale } from "./schemas";
import { getCities, getLocalities, getProjects, getTeam } from "./data";
import { checkGuideReferences, readGuides, type Guide, type GuideDataRefs } from "./guide-files";

export type { Guide };

const cache = new Map<Locale, Guide[]>();

/** What the body components may reference, computed once from /data. */
export function guideDataRefs(): GuideDataRefs {
  return {
    cityIds: new Set(getCities().map((c) => c.id)),
    teamIds: new Set(getTeam().map((t) => t.id)),
    localities: new Map(
      getLocalities().map((l) => [
        l.id,
        { cityId: l.cityId, hasCircleRate: l.circleRate !== undefined, hasCoords: l.lat !== undefined && l.lng !== undefined },
      ]),
    ),
    anchorsByCity: new Map(getCities().map((c) => [c.id, new Set(c.anchors.map((a) => a.id))])),
    projectIds: new Set(getProjects().map((p) => p.id)),
  };
}

/** Newest publishedAt first. Throws if any guide in either tree is invalid. */
export function getGuides(locale: Locale): Guide[] {
  const hit = cache.get(locale);
  if (hit) return hit;
  const en = readGuides("en");
  const hi = readGuides("hi");
  const errors = [...en.errors, ...hi.errors, ...checkGuideReferences({ en: en.guides, hi: hi.guides }, guideDataRefs())];
  if (errors.length > 0) throw new Error(`Invalid guide content:\n- ${errors.join("\n- ")}`);
  const guides = (locale === "en" ? en.guides : hi.guides).sort((a, b) =>
    b.frontmatter.publishedAt.localeCompare(a.frontmatter.publishedAt),
  );
  cache.set(locale, guides);
  return guides;
}

export const getGuide = (locale: Locale, slug: string) => getGuides(locale).find((g) => g.frontmatter.slug === slug);

/**
 * heroImage as rendered: an R2 URL as-is, a /public path only when the file exists. A missing local
 * file omits the image rather than shipping a broken one; validate.ts warns about it.
 */
export function heroImageSrc(heroImage: string, root = process.cwd()): string | undefined {
  if (/^https?:\/\//.test(heroImage)) return heroImage;
  return fs.existsSync(path.join(root, "public", heroImage)) ? heroImage : undefined;
}

/**
 * Three related guides by shared tags (spec Template 6, section 7): most shared tags first, then a
 * shared city, then newest. Fills from the rest of the tree when fewer than three share anything.
 */
export function getRelatedGuides(locale: Locale, guide: Guide, count = 3): Guide[] {
  const tags = new Set(guide.frontmatter.tags);
  const cities = new Set(guide.frontmatter.cityIds);
  return getGuides(locale)
    .filter((g) => g.frontmatter.slug !== guide.frontmatter.slug)
    .map((g) => ({
      g,
      tagScore: g.frontmatter.tags.filter((t) => tags.has(t)).length,
      cityScore: g.frontmatter.cityIds.some((c) => cities.has(c)) ? 1 : 0,
    }))
    .sort(
      (a, b) =>
        b.tagScore - a.tagScore || b.cityScore - a.cityScore || b.g.frontmatter.publishedAt.localeCompare(a.g.frontmatter.publishedAt),
    )
    .slice(0, count)
    .map((x) => x.g);
}

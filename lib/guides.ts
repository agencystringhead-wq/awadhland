/**
 * Guide loader. Reads MDX frontmatter from /content/guides (en) and /content/hi/guides (hi)
 * at build time and validates it. MDX body compilation arrives in build step 4.
 */
import type { Locale } from "./schemas";
import { getCities, getTeam } from "./data";
import { checkGuideReferences, readGuides, type Guide } from "./guide-files";

export type { Guide };

const cache = new Map<Locale, Guide[]>();

/** Newest publishedAt first. Throws if any guide in either tree is invalid. */
export function getGuides(locale: Locale): Guide[] {
  const hit = cache.get(locale);
  if (hit) return hit;
  const en = readGuides("en");
  const hi = readGuides("hi");
  const errors = [
    ...en.errors,
    ...hi.errors,
    ...checkGuideReferences(
      { en: en.guides, hi: hi.guides },
      { cityIds: new Set(getCities().map((c) => c.id)), teamIds: new Set(getTeam().map((t) => t.id)) },
    ),
  ];
  if (errors.length > 0) throw new Error(`Invalid guide frontmatter:\n- ${errors.join("\n- ")}`);
  const guides = (locale === "en" ? en.guides : hi.guides).sort((a, b) =>
    b.frontmatter.publishedAt.localeCompare(a.frontmatter.publishedAt),
  );
  cache.set(locale, guides);
  return guides;
}

export const getGuide = (locale: Locale, slug: string) => getGuides(locale).find((g) => g.frontmatter.slug === slug);

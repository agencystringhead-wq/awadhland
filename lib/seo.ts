/**
 * Next Metadata for a page (spec "SEO and schema"): per-language title and description from
 * lib/pages.ts, self-referencing absolute canonical, hreflang en-IN / hi-IN / x-default (→ English)
 * only for pairs that exist, and the build-time OG image.
 */
import type { Metadata } from "next";
import { otherLocale, SITE_URL, type Locale } from "./i18n";
import { getPage } from "./pages";

const OG = { width: 1200, height: 630 } as const;

export function metadataFor(locale: Locale, sitePath: string): Metadata {
  const page = getPage(locale, sitePath);
  if (!page) return {};
  const other = otherLocale(locale);
  const languages: Record<string, string> = { [locale === "en" ? "en-IN" : "hi-IN"]: page.url };
  if (!page.alternate.missing) languages[other === "en" ? "en-IN" : "hi-IN"] = `${SITE_URL}${page.alternate.href}`;
  languages["x-default"] = languages["en-IN"] ?? page.url;
  const article = page.kind === "guide" || page.kind === "update";
  return {
    title: page.title,
    description: page.description,
    alternates: { canonical: page.url, languages },
    openGraph: {
      title: page.title,
      description: page.description,
      url: page.url,
      siteName: locale === "hi" ? "अवधलैंड" : "Awadhland",
      locale: locale === "hi" ? "hi_IN" : "en_IN",
      type: article ? "article" : "website",
      images: [{ url: page.ogPath, width: OG.width, height: OG.height, alt: page.og.title }],
    },
    twitter: { card: "summary_large_image", title: page.title, description: page.description, images: [page.ogPath] },
  };
}

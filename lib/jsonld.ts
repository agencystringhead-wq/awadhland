/**
 * JSON-LD builders (spec "SEO and schema"): Organization + RealEstateAgent site-wide,
 * BreadcrumbList on every page, FAQPage where an FAQ renders, Article on guides and updates,
 * Place with geo on localities, Person for the broker. Output is plain objects; components/JsonLd
 * serialises them.
 */
import { SITE_URL, type Locale } from "./i18n";
import type { City, Locality, Reviews, TeamMember } from "./schemas";

export type JsonLdObject = Record<string, unknown>;

const ctx = (o: JsonLdObject): JsonLdObject => ({ "@context": "https://schema.org", ...o });

export const organization = (): JsonLdObject =>
  ctx({
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name: "Awadhland",
    url: `${SITE_URL}/`,
    logo: `${SITE_URL}/icon.svg`,
  });

export function realEstateAgent(broker: TeamMember, cities: Pick<City, "name" | "district" | "state">[], reviews?: Reviews): JsonLdObject {
  const sameAs = [broker.reraUrl, reviews?.profileUrl].filter((x): x is string => Boolean(x));
  return ctx({
    "@type": "RealEstateAgent",
    "@id": `${SITE_URL}/#agent`,
    name: "Awadhland",
    url: `${SITE_URL}/`,
    telephone: broker.phone,
    employee: { "@id": `${SITE_URL}/about/#broker` },
    areaServed: cities.map((c) => ({ "@type": "City", name: c.name, containedInPlace: { "@type": "State", name: "Uttar Pradesh" } })),
    parentOrganization: { "@id": `${SITE_URL}/#organization` },
    ...(sameAs.length ? { sameAs } : {}),
    // AggregateRating only once data/reviews.json holds real, synced values (spec Template 9 rules).
  });
}

export function person(broker: TeamMember, locale: Locale, reviews?: Reviews): JsonLdObject {
  const sameAs = [broker.reraUrl, reviews?.profileUrl].filter((x): x is string => Boolean(x));
  return ctx({
    "@type": "Person",
    "@id": `${SITE_URL}/about/#broker`,
    name: locale === "hi" ? broker.nameHi : broker.name,
    alternateName: locale === "hi" ? broker.name : broker.nameHi,
    jobTitle: broker.role,
    telephone: broker.phone,
    // About-page portrait first when there is one, then the card photo.
    image: [broker.portrait?.src, broker.photo]
      .filter((x): x is string => Boolean(x))
      .map((src) => (src.startsWith("http") ? src : `${SITE_URL}${src}`)),
    worksFor: { "@id": `${SITE_URL}/#agent` },
    ...(broker.reraNumber ? { identifier: { "@type": "PropertyValue", propertyID: "UP RERA", value: broker.reraNumber } } : {}),
    ...(sameAs.length ? { sameAs } : {}),
  });
}

/** Items in order; the last item may omit `url` (the current page). */
export const breadcrumbList = (items: { name: string; url?: string }[]): JsonLdObject =>
  ctx({
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      ...(it.url ? { item: it.url } : {}),
    })),
  });

export const faqPage = (items: { q: string; a: string }[]): JsonLdObject =>
  ctx({
    "@type": "FAQPage",
    mainEntity: items.map((it) => ({ "@type": "Question", name: it.q, acceptedAnswer: { "@type": "Answer", text: it.a } })),
  });

export type ArticleInput = {
  headline: string;
  description: string;
  url: string;
  datePublished: string;
  dateModified: string;
  locale: Locale;
  author: { name: string; url?: string };
  image?: string;
  /** NewsArticle for update entries (a dated notice); Article otherwise */
  type?: "Article" | "NewsArticle";
};

export const article = (a: ArticleInput): JsonLdObject =>
  ctx({
    "@type": a.type ?? "Article",
    headline: a.headline,
    description: a.description,
    url: a.url,
    mainEntityOfPage: a.url,
    datePublished: a.datePublished,
    dateModified: a.dateModified,
    inLanguage: a.locale === "hi" ? "hi-IN" : "en-IN",
    author: { "@type": "Person", name: a.author.name, ...(a.author.url ? { url: a.author.url } : {}) },
    publisher: { "@id": `${SITE_URL}/#organization` },
    ...(a.image ? { image: a.image.startsWith("http") ? a.image : `${SITE_URL}${a.image}` } : {}),
  });

export function place(locality: Locality, city: City, locale: Locale, url: string): JsonLdObject {
  return ctx({
    "@type": "Place",
    name: locale === "hi" ? locality.nameHi : locality.name,
    alternateName: locale === "hi" ? locality.name : locality.nameHi,
    url,
    ...(locality.lat !== undefined && locality.lng !== undefined
      ? { geo: { "@type": "GeoCoordinates", latitude: locality.lat, longitude: locality.lng } }
      : {}),
    address: {
      "@type": "PostalAddress",
      addressLocality: city.name,
      addressRegion: "Uttar Pradesh",
      addressCountry: "IN",
      ...(locality.pincode ? { postalCode: locality.pincode } : {}),
    },
    containedInPlace: { "@type": "City", name: city.name },
  });
}

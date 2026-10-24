import { getListings } from "./data";
import { formatNumber, type Locale } from "./i18n";
import type { Listing } from "./schemas";

/** A listing not re-confirmed within this many days is hidden at the next build. */
export const LISTING_MAX_AGE_DAYS = 30;
/** The homepage shows one row of cards. */
export const FEATURED_COUNT = 4;

const DAY = 86_400_000;

/** Featured listings confirmed within LISTING_MAX_AGE_DAYS of the build, in file order. Stale ids are logged. */
export function getFeaturedListings(now: Date = new Date()): Listing[] {
  const fresh: Listing[] = [];
  const stale: string[] = [];
  for (const l of getListings()) {
    if (!l.featured) continue;
    const age = (now.getTime() - Date.parse(`${l.confirmedAt}T00:00:00+05:30`)) / DAY;
    if (age > LISTING_MAX_AGE_DAYS) stale.push(l.id);
    else fresh.push(l);
  }
  if (stale.length > 0) console.warn(`[listings] hidden, not confirmed in ${LISTING_MAX_AGE_DAYS} days: ${stale.join(", ")}`);
  return fresh.slice(0, FEATURED_COUNT);
}

/** ₹24 Cr, ₹17.6 Cr, ₹60 L. One decimal at most, trailing .0 dropped. */
function crore(n: number): string {
  return `${Math.round((n / (n >= 10_000_000 ? 10_000_000 : 100_000)) * 10) / 10}`;
}

function unit(n: number, locale: Locale): string {
  if (n >= 10_000_000) return locale === "hi" ? "करोड़" : "Cr";
  return locale === "hi" ? "लाख" : "L";
}

/** "₹24–30 Cr" or "₹13 Cr". Both ends share the larger unit's label when they match. */
export function formatPriceRange(min: number, max: number | null, locale: Locale): string {
  if (max === null || max === min) return `₹${crore(min)} ${unit(min, locale)}`;
  if (unit(min, locale) === unit(max, locale)) return `₹${crore(min)}–${crore(max)} ${unit(max, locale)}`;
  return `₹${crore(min)} ${unit(min, locale)}–₹${crore(max)} ${unit(max, locale)}`;
}

/** "₹20,000–25,000/sq ft", "~₹1,470/sq ft", with "built-up" when the rate is on built area. */
export function formatRate(l: Listing, locale: Locale): string {
  const per = locale === "hi" ? (l.rateBasis === "built-up" ? "/वर्ग फ़ुट बिल्ट-अप" : "/वर्ग फ़ुट") : l.rateBasis === "built-up" ? "/sq ft built-up" : "/sq ft";
  if (l.ratePerSqFtMax === null) return `~₹${formatNumber(l.ratePerSqFtMin)}${per}`;
  return `₹${formatNumber(l.ratePerSqFtMin)}–${formatNumber(l.ratePerSqFtMax)}${per}`;
}

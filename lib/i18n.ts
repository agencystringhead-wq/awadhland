/**
 * Locale helpers. The locale always comes from the route tree a page lives in
 * (app/(en) or app/hi), passed down as a prop. Never from cookies, headers or the browser.
 */
import type { Locale } from "./schemas";

export type { Locale };

export const LOCALES = ["en", "hi"] as const satisfies readonly Locale[];

export const SITE_URL = "https://awadhland.com";

export const otherLocale = (locale: Locale): Locale => (locale === "en" ? "hi" : "en");

/** path is a site path with leading and trailing slash, e.g. "/ayodhya/". */
export function localePath(locale: Locale, path: string): string {
  if (!path.startsWith("/") || !path.endsWith("/")) {
    throw new Error(`localePath expects a path with leading and trailing slash, got "${path}"`);
  }
  return locale === "en" ? path : `/hi${path}`;
}

export const htmlLang: Record<Locale, string> = { en: "en-IN", hi: "hi-IN" };

export function formatDate(isoDate: string, locale: Locale): string {
  return new Intl.DateTimeFormat(htmlLang[locale], {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${isoDate}T00:00:00Z`));
}

/** Pick the Hindi field when on the Hindi tree and it exists. */
export function pick<T>(locale: Locale, en: T, hi: T | undefined | null): T {
  return locale === "hi" && hi !== undefined && hi !== null ? hi : en;
}

/** Interface labels only. Page titles and meta descriptions are written per language in step 6, not here. */
export const ui = {
  en: {
    home: "Home",
    languageToggle: "हिंदी",
    alternateMissing: "This page is not available in Hindi yet.",
    whatsapp: "WhatsApp",
    call: "Call",
    source: "Source",
    effective: "effective",
    pageUpdated: "Page updated",
    circleRates: "Circle rates",
    guides: "Guides",
    tools: "Tools",
    updates: "Updates",
    about: "About",
    projects: "Projects",
    disclaimer: "Disclaimer",
    reraDisclosure: "RERA disclosure",
  },
  hi: {
    home: "होम",
    languageToggle: "English",
    alternateMissing: "यह पेज अभी अंग्रेज़ी में उपलब्ध नहीं है।",
    whatsapp: "व्हाट्सऐप",
    call: "कॉल करें",
    source: "स्रोत",
    effective: "लागू",
    pageUpdated: "पेज अपडेट",
    circleRates: "सर्किल रेट",
    guides: "गाइड",
    tools: "टूल्स",
    updates: "अपडेट",
    about: "हमारे बारे में",
    projects: "प्रोजेक्ट",
    disclaimer: "अस्वीकरण",
    reraDisclosure: "रेरा जानकारी",
  },
} as const satisfies Record<Locale, Record<string, string>>;

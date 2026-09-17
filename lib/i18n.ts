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

/** Indian grouping (12,34,567). Digits stay Latin in both trees. */
export function formatNumber(n: number): string {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(n);
}

/** ₹ with Indian grouping. */
export const formatInr = (n: number) => `₹${formatNumber(n)}`;

/** Pick the Hindi field when on the Hindi tree and it exists. */
export function pick<T>(locale: Locale, en: T, hi: T | undefined | null): T {
  return locale === "hi" && hi !== undefined && hi !== null ? hi : en;
}

/**
 * Prefilled WhatsApp message naming the page the user came from (spec Template 1 behaviour).
 * pageLabel is the human name of the page, e.g. "Faizabad Road, Ayodhya".
 */
export function whatsappText(locale: Locale, pageLabel: string): string {
  return locale === "hi"
    ? `नमस्ते, मैं awadhland.com पर "${pageLabel}" देख रहा/रही हूँ और ज़मीन के बारे में बात करना चाहता/चाहती हूँ।`
    : `Hi, I am looking at "${pageLabel}" on awadhland.com and would like to talk about land there.`;
}

/**
 * Interface labels only. Page titles and meta descriptions are written per language in step 6.
 * Hindi labels here are interface strings, not broker-voice copy.
 */
export const ui = {
  en: {
    siteName: "Awadhland",
    home: "Home",
    menu: "Menu",
    languageToggle: "हिंदी",
    alternateMissing: "This page is not available in Hindi yet. This link goes to the Hindi city page.",
    whatsapp: "WhatsApp",
    talkOnWhatsapp: "Talk to us on WhatsApp",
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
    privacy: "Privacy",
    terms: "Terms",
    contact: "Contact",
    methodology: "How we score localities",
    reraDisclosure: "RERA disclosure",
    localities: "localities",
    projectsTracked: "projects tracked",
    circleRateEntries: "circle-rate entries",
    cities: "cities",
    citiesTitle: "Cities",
    lastUpdated: "last updated",
    whatChanged: "What changed",
    allUpdates: "All updates",
    viewCity: "See the city page",
    viewLocality: "Locality page",
    topAreas: "High-potential areas",
    score: "Score",
    priceBand: "Price band",
    perSqFt: "per sq ft",
    perSqM: "per sq m",
    perHectare: "per hectare",
    unitSqM: "sq m",
    unitHectare: "hectare",
    residential: "Residential",
    commercial: "Commercial",
    agricultural: "Agricultural",
    investment: "Investment",
    locality: "Locality",
    tehsil: "Tehsil",
    fullCircleRateTable: "Full circle-rate table",
    priceTrend: "Price trend",
    medianAsking: "Median asking rate",
    observations: "observations",
    brokerNote: "From the broker",
    guidesForCity: "Guides for this city",
    recentUpdates: "Recent updates",
    allLocalities: "All localities",
    governmentProjects: "Government projects",
    latestGuides: "Latest guides",
    readTime: "min read",
    yourSituation: "Your situation",
    freeTools: "Free tools",
    beforeYouPay: "Before you pay a rupee",
    fullChecklist: "Read the full checklist",
    leadForm: "Tell us what you are looking for",
    leadFormNote: "The form is being connected. Until then, WhatsApp or call and a real person replies.",
    yourBroker: "Your broker",
    reraRegistered: "UP RERA registered agent",
    yearsInAyodhya: "years in Ayodhya",
    areasCovered: "Areas covered",
    reviewsOnGoogle: "Reviews are collected on Google and shown as written.",
    seeGoogleProfile: "See all reviews on Google",
    fees: "Fees",
    partOf: "Part of",
    footerTagline: "Land in Awadh, with the paperwork checked first.",
    builtBy: "Site by Stringhead Technologies, Pune.",
    minutes: "min",
    km: "km",
  },
  hi: {
    siteName: "अवधलैंड",
    home: "होम",
    menu: "मेन्यू",
    languageToggle: "English",
    alternateMissing: "यह पेज अभी अंग्रेज़ी में उपलब्ध नहीं है। यह लिंक अंग्रेज़ी शहर पेज पर जाता है।",
    whatsapp: "व्हाट्सऐप",
    talkOnWhatsapp: "व्हाट्सऐप पर बात करें",
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
    privacy: "प्राइवेसी",
    terms: "नियम",
    contact: "संपर्क",
    methodology: "हम इलाक़ों को स्कोर कैसे देते हैं",
    reraDisclosure: "रेरा जानकारी",
    localities: "इलाक़े",
    projectsTracked: "प्रोजेक्ट ट्रैक",
    circleRateEntries: "सर्किल रेट एंट्री",
    cities: "शहर",
    citiesTitle: "शहर",
    lastUpdated: "आख़िरी अपडेट",
    whatChanged: "क्या बदला",
    allUpdates: "सभी अपडेट",
    viewCity: "शहर का पेज देखें",
    viewLocality: "इलाक़े का पेज",
    topAreas: "ऊँची संभावना वाले इलाक़े",
    score: "स्कोर",
    priceBand: "दाम की श्रेणी",
    perSqFt: "प्रति वर्ग फ़ुट",
    perSqM: "प्रति वर्ग मीटर",
    perHectare: "प्रति हेक्टेयर",
    unitSqM: "वर्ग मीटर",
    unitHectare: "हेक्टेयर",
    residential: "रिहायशी",
    commercial: "व्यावसायिक",
    agricultural: "कृषि",
    investment: "निवेश",
    locality: "इलाक़ा",
    tehsil: "तहसील",
    fullCircleRateTable: "पूरी सर्किल रेट सूची",
    priceTrend: "दाम का रुझान",
    medianAsking: "माँगे जा रहे दाम का मध्यमान",
    observations: "अवलोकन",
    brokerNote: "ब्रोकर की बात",
    guidesForCity: "इस शहर की गाइड",
    recentUpdates: "हाल के अपडेट",
    allLocalities: "सभी इलाक़े",
    governmentProjects: "सरकारी प्रोजेक्ट",
    latestGuides: "नई गाइड",
    readTime: "मिनट",
    yourSituation: "आपकी स्थिति",
    freeTools: "मुफ़्त टूल्स",
    beforeYouPay: "एक रुपया देने से पहले",
    fullChecklist: "पूरी चेकलिस्ट पढ़ें",
    leadForm: "बताइए आप क्या ढूँढ रहे हैं",
    leadFormNote: "फ़ॉर्म जोड़ा जा रहा है। तब तक व्हाट्सऐप या कॉल करें, जवाब एक असली व्यक्ति देगा।",
    yourBroker: "आपका ब्रोकर",
    reraRegistered: "यूपी रेरा पंजीकृत एजेंट",
    yearsInAyodhya: "वर्ष अयोध्या में",
    areasCovered: "कवर किए गए इलाक़े",
    reviewsOnGoogle: "समीक्षाएँ गूगल पर ली गई हैं और जैसी लिखी गईं वैसी ही दिखाई गई हैं।",
    seeGoogleProfile: "गूगल पर सभी समीक्षाएँ देखें",
    fees: "फ़ीस",
    partOf: "हिस्सा",
    footerTagline: "अवध में ज़मीन, काग़ज़ पहले जाँचे हुए।",
    builtBy: "साइट: स्ट्रिंगहेड टेक्नोलॉजीज़, पुणे।",
    minutes: "मिनट",
    km: "किमी",
  },
} as const satisfies Record<Locale, Record<string, string>>;

export type UiKey = keyof (typeof ui)["en"];

/**
 * Copy for the circle rate lookup. Written per language, not translated, like lib/rate-copy.ts.
 *
 * Imports no data, and nothing that does: the lookup is a client component, and lib/valuation and
 * lib/units reach lib/rates, which would put every rate list into the tool page's bundle. The few
 * labels the result card shares with the rate pages are restated here for that reason.
 */
import type { Locale } from "./i18n";
import type { RateCategory } from "./schemas";

const copy = {
  en: {
    searchLabel: "Type your village, mohalla or colony",
    searchPlaceholder: "e.g. Chinhat, रिकाबगंज, Rustampur",
    searchHint: "Hindi or English. Two letters is enough to start.",
    city: "City",
    sro: "Sub-registrar office",
    all: "All",
    loading: "Loading the list…",
    loadFailed: "The list could not be loaded. Check your connection and try again.",
    noMatchTitle: "Can't find your village?",
    noMatchBody: "WhatsApp us the name and khasra number and we will look it up in the list for you.",
    noMatchCta: "WhatsApp us the name",
    sroSuggestion: "all villages in this SRO",
    suggestionsLabel: "Suggestions",
    resultLoading: "Loading the rates…",

    effective: "effective",
    land: "Non-agricultural land",
    perSqM: "per sq m",
    perSqFt: "per sq ft",
    commercial: "Commercial",
    commercialRent: "Commercial rent, per sq m per month",
    commercialAmended: "Commercial rates from the amendment effective {date}.",
    agri: "Agricultural land",
    lakhPerHa: "₹ lakh per hectare",
    perBigha: "per bigha",
    agriGridNote: "By frontage and plot size; the whole plot takes the rate of the size band its area falls in.",
    frontage: "Frontage",
    mainRoads: "Rates on main roads",
    mainRoadsLede: "A plot on one of these named stretches is valued at the stretch's rate, not the village's. Land rates only apply to non-agricultural land.",
    roadLand: "Land",
    roadShop: "Shop",
    noLand: "The list prints no land rate for this place; it appears only in its commercial or agricultural table.",

    calculate: "Calculate stamp duty for this plot",
    yieldLink: "What could this plot earn?",
    openPage: "Open full page",
    share: "Share",
    copied: "Link copied",
    whatsapp: "Ask us about this place",

    awaitedTitle: "Circle rates awaited",
    awaitedBody:
      "The valuation list for this sub-registrar office has not been published on this site yet. What is here is its khasra frontage list: check whether your plot is on a highway, district road, link road or next to the abadi.",
    awaitedCta: "Check your plot",

    finePrint: "Source: IGRSUP valuation list, {sro}, effective {date}. Final value is set by the Sub-Registrar.",
    finePrintFrontage: "Source: IGRSUP khasra frontage list, {sro}, part of the valuation list effective {date}. The Tehsildar's decision is final.",
    gorakhpurFinePrint: "2016 list, kept in force by the Collector's order of 04-08-2020.",
    fallback: "The lookup needs JavaScript. Every village's rates are on its city's circle-rate page:",
  },
  hi: {
    searchLabel: "अपना गाँव, मोहल्ला या कॉलोनी लिखें",
    searchPlaceholder: "जैसे चिनहट, Rikabganj, रूस्तमपुर",
    searchHint: "हिंदी या अंग्रेज़ी में। दो अक्षर काफ़ी हैं।",
    city: "शहर",
    sro: "उप निबंधक कार्यालय",
    all: "सभी",
    loading: "सूची खुल रही है…",
    loadFailed: "सूची नहीं खुल पाई। कनेक्शन देखें और फिर कोशिश करें।",
    noMatchTitle: "आपका गाँव नहीं मिला?",
    noMatchBody: "गाँव का नाम और खसरा नंबर व्हाट्सऐप करें, हम सूची में देखकर बताएँगे।",
    noMatchCta: "नाम व्हाट्सऐप करें",
    sroSuggestion: "इस एसआरओ के सभी गाँव",
    suggestionsLabel: "सुझाव",
    resultLoading: "दरें खुल रही हैं…",

    effective: "लागू",
    land: "अकृषिक भूमि",
    perSqM: "प्रति वर्ग मीटर",
    perSqFt: "प्रति वर्ग फ़ुट",
    commercial: "व्यावसायिक",
    commercialRent: "व्यावसायिक किराया, प्रति वर्ग मीटर प्रति माह",
    commercialAmended: "व्यावसायिक दरें {date} से लागू संशोधन की हैं।",
    agri: "कृषि भूमि",
    lakhPerHa: "₹ लाख प्रति हेक्टेयर",
    perBigha: "प्रति बीघा",
    agriGridNote: "फ्रंटेज और प्लॉट के आकार के हिसाब से; पूरे प्लॉट पर उसी आकार-श्रेणी की दर लगती है जिसमें उसका क्षेत्रफल आता है।",
    frontage: "फ्रंटेज",
    mainRoads: "मुख्य सड़कों पर दरें",
    mainRoadsLede: "इन नामित सड़कों पर पड़ने वाले प्लॉट पर गाँव की नहीं, सड़क खंड की दर लगती है। भूमि दर सिर्फ़ अकृषिक भूमि पर लागू है।",
    roadLand: "भूमि",
    roadShop: "दुकान",
    noLand: "सूची इस जगह की भूमि दर नहीं छापती; यह केवल व्यावसायिक या कृषि तालिका में है।",

    calculate: "इस प्लॉट की स्टाम्प ड्यूटी निकालें",
    yieldLink: "यह प्लॉट कितना कमा सकता है?",
    openPage: "पूरा पेज खोलें",
    share: "शेयर करें",
    copied: "लिंक कॉपी हो गया",
    whatsapp: "इस जगह के बारे में पूछें",

    awaitedTitle: "सर्किल रेट सूची की प्रतीक्षा है",
    awaitedBody:
      "इस उप निबंधक कार्यालय की मूल्यांकन सूची अभी इस साइट पर नहीं आई है। यहाँ उसकी खसरा सूची है: देखें कि आपका गाटा राजमार्ग, जनपदीय मार्ग, सम्पर्क मार्ग पर या आबादी से लगा है या नहीं।",
    awaitedCta: "अपना गाटा जाँचें",

    finePrint: "स्रोत: आईजीआरएसयूपी मूल्यांकन सूची, {sro}, {date} से लागू। अंतिम मूल्य उप निबंधक तय करते हैं।",
    finePrintFrontage: "स्रोत: आईजीआरएसयूपी खसरा सूची, {sro}, {date} से लागू मूल्यांकन सूची का भाग। तहसीलदार का निर्णय अंतिम है।",
    gorakhpurFinePrint: "2016 की सूची, कलेक्टर के 04-08-2020 के आदेश से लागू।",
    fallback: "खोज के लिए जावास्क्रिप्ट चाहिए। हर गाँव की दरें उसके शहर के सर्किल रेट पेज पर हैं:",
  },
} satisfies Record<Locale, Record<string, string>>;

export type LookupCopy = (typeof copy)["en"];
export const lc = (locale: Locale): LookupCopy => copy[locale];

export const lookupCategoryLabel: Record<RateCategory, Record<Locale, string>> = {
  urban: { en: "Urban", hi: "नगरीय" },
  "semi-urban": { en: "Semi-urban", hi: "अर्द्धनगरीय" },
  rural: { en: "Rural", hi: "ग्रामीण" },
  developing: { en: "Developing", hi: "विकासशील" },
  notified: { en: "Notified", hi: "अधिसूचित" },
  "nagar-panchayat": { en: "Nagar panchayat", hi: "नगर पंचायत" },
};

/** The six single-figure frontage columns (Ayodhya, Lucknow). */
export const sixFrontageLabel: Record<"nh" | "state" | "link" | "chakmarg" | "abadi" | "general", Record<Locale, string>> = {
  nh: { en: "National highway", hi: "राष्ट्रीय राजमार्ग" },
  state: { en: "State or district road", hi: "राज्य या जनपदीय मार्ग" },
  link: { en: "Link road", hi: "सम्पर्क मार्ग" },
  chakmarg: { en: "Chakmarg", hi: "चकमार्ग" },
  abadi: { en: "Adjoining abadi", hi: "आबादी से लगी" },
  general: { en: "General", hi: "सामान्य" },
};

/** Gorakhpur's grid rows. */
export const gridFrontageLabel: Record<"nh" | "district" | "link" | "other", Record<Locale, string>> = {
  nh: { en: "NH or state highway", hi: "राष्ट्रीय / राज्य राजमार्ग" },
  district: { en: "District road", hi: "जनपदीय मार्ग" },
  link: { en: "Link road", hi: "सम्पर्क मार्ग" },
  other: { en: "Elsewhere", hi: "अन्यत्र" },
};

export function slabLabels(slabsHa: readonly [number, number, number], locale: Locale): string[] {
  const f = (n: number) => n.toFixed(3);
  return locale === "hi"
    ? [`${f(slabsHa[0])} हे. तक`, `${f(slabsHa[0])}–${f(slabsHa[1])} हे.`, `${f(slabsHa[1])}–${f(slabsHa[2])} हे.`, `${f(slabsHa[2])} हे. से अधिक`]
    : [`Up to ${f(slabsHa[0])} ha`, `${f(slabsHa[0])}–${f(slabsHa[1])} ha`, `${f(slabsHa[1])}–${f(slabsHa[2])} ha`, `Over ${f(slabsHa[2])} ha`];
}

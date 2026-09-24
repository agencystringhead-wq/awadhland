/**
 * Copy for the khasra frontage pages and the "check your plot" tool. Written per language, not
 * translated, like lib/rate-copy.ts.
 *
 * Two lines are fixed by the brief and must appear wherever a result is shown: the "rates
 * awaited" line on every page built from a frontage list, and the Tehsil verification line next
 * to every lookup result.
 */
import type { Locale } from "./i18n";
import type { FrontageCategory } from "./schemas";

export const frontageLabel: Record<FrontageCategory, Record<Locale, string>> = {
  nh: { en: "On a national or state highway / expressway", hi: "राष्ट्रीय / राज्य राजमार्ग या एक्सप्रेसवे पर" },
  district: { en: "On a district road (जनपदीय मार्ग)", hi: "जनपदीय मार्ग पर" },
  link: { en: "On a link road or other road", hi: "सम्पर्क मार्ग या अन्य सड़क पर" },
  abadi: { en: "Next to the abadi", hi: "आबादी से लगा हुआ" },
};

/** Short form for tables and counters. */
export const frontageShortLabel: Record<FrontageCategory, Record<Locale, string>> = {
  nh: { en: "Highway", hi: "राजमार्ग" },
  district: { en: "District road", hi: "जनपदीय मार्ग" },
  link: { en: "Link road", hi: "सम्पर्क मार्ग" },
  abadi: { en: "Next to abadi", hi: "आबादी से लगा" },
};

const copy = {
  en: {
    ratesAwaited: "Circle rates for this SRO are awaited.",
    ratesAwaitedLede:
      "The district's valuation list for this sub-registrar office has not been published on this site yet. What is here is the khasra frontage list printed as part of it: which plots sit on a highway, a district road, a link road or next to the abadi. It carries no ₹ figures.",
    otherSros: "Circle rates for the other SROs",
    verify: "Verify with the Tehsil / Sub-Registrar office. The Tehsildar's decision is final.",
    verifyShort: "verify at the Tehsil",

    /* SRO page */
    sroH1: "villages and their khasra frontage list",
    villagesInSro: "villages",
    frontageTable: "Every village, with its frontage counts",
    frontageTableLede:
      "How many khasra plots the list places on each kind of road, or next to the abadi, in printed serial order. A plot can appear under more than one heading. Open a village for its roads and the list's remarks, or check a single khasra number.",
    serial: "Serial",
    village: "Village",
    remarks: "Remarks",
    hasRemark: "yes",
    sourceLine: "IGRSUP khasra frontage list",
    partOfList: "part of the valuation list effective",
    pdfPage: "PDF page",
    pdfPages: "PDF pages",
    downloadDated: "download dated",

    /* village page */
    frontageTitle: "Plots on a road or next to the abadi",
    frontageLede:
      "Under the valuation list's rules an agricultural plot that fronts a road or adjoins the abadi is valued above a general one. These are the khasra numbers the list names in this village. Repeats are counted once.",
    plots: "khasra plots",
    roadsTitle: "Roads the list names",
    roadsLede: "The link-road plots in this village are listed road by road, under these names as printed.",
    remarksTitle: "What the list says about this village",
    checkTitle: "Check your khasra number",
    checkLede: "The SRO and village are already filled in. Type the khasra (gata) number from your khatauni to see which list it is on.",
    checkCta: "Check a khasra number in",
    moreVillages: "Other villages under",
    allVillages: "All villages under",

    /* tool */
    toolSro: "Sub-registrar office",
    toolVillage: "Village",
    toolKhasra: "Khasra (gata) number",
    toolKhasraHint: "As on the khatauni, e.g. 123, 123क or 123/2",
    toolCheck: "Check",
    toolLoading: "Loading this village's list…",
    toolLoadFailed: "The list for this village could not be loaded. Try again, or open the village page.",
    toolPrompt: "Pick an SRO and a village, then type a khasra number.",
    toolNoDigits: "A khasra number starts with digits. Type it as it is on the khatauni.",
    toolFound: "is on the list",
    toolFoundLede: "Every entry in this village's list that shares the number",
    toolExact: "exact match",
    toolSameBase: "same base number",
    toolRange: "inside a printed range",
    toolNotFound: "is not on this village's frontage list",
    toolNotFoundLede:
      "The list, as transcribed, does not place this number on a highway, district road or link road, or next to the abadi. That usually means the plot is valued at the general agricultural rate, but a number can be missed or misread in a scanned list.",
    toolAllAbadi:
      "The list notes that almost every plot in this village has abadi around it, and so names few or no abadi plots one by one. Your plot may still count as next to the abadi.",
    toolRoad: "Road",
    toolVillagePage: "Village page",
    toolSendWhatsapp: "Send this to us on WhatsApp",
    cardFrontage: "khasra frontage list",
    hubToolLede:
      "For {sros} the district's khasra list is in: type a khasra number and see whether the plot is on a highway, a district road, a link road or next to the abadi.",
    hubToolCta: "Check your plot",
    toolFallback: "The check needs JavaScript. Every village and its frontage counts are on its SRO's page:",
  },
  hi: {
    ratesAwaited: "इस एसआरओ की सर्किल रेट सूची की प्रतीक्षा है।",
    ratesAwaitedLede:
      "इस उप निबंधक कार्यालय की मूल्यांकन सूची अभी इस साइट पर नहीं आई है। यहाँ उसी सूची का हिस्सा, खसरा सूची है: कौन से गाटे राजमार्ग, जनपदीय मार्ग, सम्पर्क मार्ग पर या आबादी से लगे हैं। इसमें कोई दर नहीं है।",
    otherSros: "बाक़ी एसआरओ की सर्किल रेट",
    verify: "तहसील / उप निबंधक कार्यालय से पुष्टि करें। तहसीलदार का निर्णय अंतिम है।",
    verifyShort: "तहसील से पुष्टि करें",

    sroH1: "के गाँव और सड़क से लगे खसरा",
    villagesInSro: "गाँव",
    frontageTable: "हर गाँव, सड़क और आबादी से लगे खसरों की गिनती के साथ",
    frontageTableLede:
      "सूची हर गाँव के कितने खसरे किस सड़क पर या आबादी से लगे बताती है, मुद्रित क्रम में। एक गाटा एक से ज़्यादा खाने में हो सकता है। सड़कों के नाम और सूची की टिप्पणी के लिए गाँव खोलें, या एक खसरा नंबर जाँचें।",
    serial: "क्रम",
    village: "गाँव",
    remarks: "टिप्पणी",
    hasRemark: "है",
    sourceLine: "आईजीआरएसयूपी खसरा सूची (सड़क / आबादी से लगे गाटे)",
    partOfList: "मूल्यांकन सूची का भाग, लागू",
    pdfPage: "पीडीएफ़ पृष्ठ",
    pdfPages: "पीडीएफ़ पृष्ठ",
    downloadDated: "डाउनलोड की तारीख़",

    frontageTitle: "सड़क या आबादी से लगे गाटे",
    frontageLede:
      "मूल्यांकन सूची के नियमों में सड़क से लगा या आबादी से सटा कृषि गाटा सामान्य गाटे से ऊँचा आँका जाता है। इस गाँव में सूची ये खसरा नंबर बताती है। दोहराया गया नंबर एक बार गिना गया है।",
    plots: "खसरे",
    roadsTitle: "सूची में दर्ज सड़कें",
    roadsLede: "इस गाँव के सम्पर्क मार्ग वाले गाटे सड़क-वार दर्ज हैं, इन्हीं नामों से।",
    remarksTitle: "सूची में इस गाँव के बारे में टिप्पणी",
    checkTitle: "अपना खसरा नंबर जाँचें",
    checkLede: "एसआरओ और गाँव पहले से भरे हैं। खतौनी से खसरा (गाटा) नंबर लिखें और देखें कि वह किस सूची में है।",
    checkCta: "खसरा नंबर जाँचें:",
    moreVillages: "के और गाँव",
    allVillages: "के सभी गाँव",

    toolSro: "उप निबंधक कार्यालय (एसआरओ)",
    toolVillage: "गाँव",
    toolKhasra: "खसरा (गाटा) नंबर",
    toolKhasraHint: "जैसा खतौनी में है, जैसे 123, 123क या 123/2",
    toolCheck: "जाँचें",
    toolLoading: "इस गाँव की सूची खुल रही है…",
    toolLoadFailed: "इस गाँव की सूची नहीं खुल पाई। फिर कोशिश करें, या गाँव का पेज खोलें।",
    toolPrompt: "एसआरओ और गाँव चुनें, फिर खसरा नंबर लिखें।",
    toolNoDigits: "खसरा नंबर अंकों से शुरू होता है। जैसा खतौनी में है वैसा लिखें।",
    toolFound: "सूची में है",
    toolFoundLede: "इस गाँव की सूची की हर प्रविष्टि जिसका मूल नंबर यही है",
    toolExact: "हूबहू मेल",
    toolSameBase: "वही मूल नंबर",
    toolRange: "मुद्रित श्रेणी के भीतर",
    toolNotFound: "इस गाँव की सूची में नहीं है",
    toolNotFoundLede:
      "जैसी सूची पढ़ी गई है, उसमें यह नंबर राजमार्ग, जनपदीय मार्ग, सम्पर्क मार्ग पर या आबादी से लगा नहीं है। आम तौर पर इसका मतलब सामान्य कृषि दर होता है, पर स्कैन की गई सूची में कोई नंबर छूट या ग़लत पढ़ा जा सकता है।",
    toolAllAbadi:
      "सूची में लिखा है कि इस गाँव के लगभग सभी गाटों के आस-पास आबादी है, इसलिए आबादी वाले गाटे अलग से कम या बिल्कुल नहीं गिनाए गए। आपका गाटा फिर भी आबादी से लगा माना जा सकता है।",
    toolRoad: "सड़क",
    toolVillagePage: "गाँव का पेज",
    toolSendWhatsapp: "यह हमें व्हाट्सऐप पर भेजें",
    cardFrontage: "सड़क से लगे खसरों की सूची",
    hubToolLede:
      "{sros} की खसरा सूची आ गई है: खसरा नंबर लिखें और देखें कि गाटा राजमार्ग, जनपदीय मार्ग, सम्पर्क मार्ग पर या आबादी से लगा है या नहीं।",
    hubToolCta: "अपना गाटा जाँचें",
    toolFallback: "जाँच के लिए जावास्क्रिप्ट चाहिए। हर गाँव और उसकी गिनती उसके एसआरओ के पेज पर है:",
  },
} satisfies Record<Locale, Record<string, string>>;

export type FrontageCopy = (typeof copy)["en"];
export const fc = (locale: Locale): FrontageCopy => copy[locale];

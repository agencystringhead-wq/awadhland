/**
 * Copy for the circle-rate pages (Step 9, section C). Written per language, not translated:
 * the Hindi is what a Hindi-reading buyer in Awadh would actually say, which is why it is shorter
 * and blunter than the English in several places rather than a matching sentence.
 *
 * Kept out of lib/i18n.ts because these strings are specific to three templates and that file is
 * already the shared UI vocabulary for the whole site.
 */
import type { Locale } from "./i18n";

export const rateCopy = {
  en: {
    /* shared */
    village: "Village or mohalla",
    ward: "Ward or pargana",
    category: "Category",
    printedPage: "printed page",
    serial: "Serial",
    vcode: "V-code",
    tehsil: "Tehsil",
    perSqM: "per sq m",
    allTehsils: "All tehsils",
    allCategories: "All categories",
    allWards: "All wards",

    /* views */
    viewLabel: "Columns",
    viewLand: "Land",
    viewCommercial: "Commercial",
    viewAgricultural: "Agricultural",
    landColumns: "Non-agricultural land, ₹ per sq m, by the width of the road the plot fronts",
    commercialColumns: "Commercial, ₹ per sq m of carpet area",
    agriColumns: "Agricultural land, by frontage",

    /* city page */
    tehsilSelectorTitle: "Five tehsils, five lists",
    tehsilSelectorLede:
      "The district publishes one list per sub-registrar office. Pick a tehsil for its full table, or search every village below.",
    rowsInTehsil: "villages",
    segmentsInTehsil: "road segments",
    landRange: "Land rate range",
    topSegment: "Highest road-segment rate",
    searchTitle: "Find a village",
    searchLede: "Type a village or mohalla name in either script. Searches all rows in the district.",
    searchPlaceholder: "e.g. Rikabganj, सहादतगंज, Bhadarsa",
    searchLoading: "Loading the district list…",
    searchNoResults: "No village matches that. Try fewer letters, or the other script.",
    searchResultCount: "matches",
    searchHint: "Start typing to search the district.",

    /* tehsil page */
    fullTable: "Every village in this tehsil",
    roadSegments: "Road segments",
    roadSegmentsLede:
      "Plots fronting these named stretches take the segment rate instead of the village rate. It applies to non-agricultural land only.",
    segment: "Road stretch",
    segmentLand: "Land",
    valuationRulesTitle: "How the list says to value a plot",
    filterCategory: "Category",
    filterWard: "Ward",
    showing: "Showing",
    of: "of",
    rows: "rows",
    clearFilters: "Clear filters",
    showAll: "Show all",

    /* village page */
    landRates: "Land",
    commercialRates: "Commercial",
    agriRates: "Agricultural",
    segmentsHere: "Road stretches through this village",
    workedExample: "What this means for a plot",
    workedExampleLede: "A 1,000 sq ft plot fronting a road under 9 m, at this village's rate.",
    circleValue: "Circle value",
    stampDutyMale: "Stamp duty, male buyer",
    stampDutyFemale: "Stamp duty, female buyer",
    comparedToTehsil: "Compared with the tehsil",
    aboveMedian: "above the tehsil median",
    belowMedian: "below the tehsil median",
    atMedian: "the same as the tehsil median",
    tehsilMedian: "Tehsil median",
    similarVillages: "Villages at a similar rate",
    partOfLocality: "Covered by our locality page",
    noAgriHere: "This row is urban and the list prints no agricultural rates for it.",

    /* locality block */
    circleRatesHere: "Circle rates here",
    circleRatesHereLede: "Rows of the published list that cover this locality.",
    seeVillageRow: "Full row",

    /* calculator */
    calculatorTitle: "Stamp duty estimate",
    landKind: "What you are buying",
    kindNonAgri: "Non-agricultural plot",
    kindCommercial: "Commercial",
    kindAgri: "Agricultural land",
    roadWidth: "Road width at the plot",
    onSegment: "The plot fronts a listed road stretch",
    nearCommercial: "Within 50 m of commercial activity",
    nearActivity: "Within 200 m of residential or commercial activity",
    adjoiningRoads: "Roads the plot adjoins",
    adjoiningAbadi: "Adjoins abadi",
    frontage: "Frontage",
    area: "Area",
    buyer: "Buyer",
    rulesApplied: "Rules applied",
    noRulesApplied: "No percentage adjustment applied.",
    largePlotNote: "Plot over 1,000 sq m: the part above that is valued at 75%.",
    segmentNotForAgri: "Road-segment rates do not apply to agricultural land (instruction 24), so the village rate was used.",
    estimateOnly: "Estimate only. The sub-registrar's valuation is final.",
    baseValue: "Base value",
    adjustments: "Adjustments",
    registrationFee: "Registration fee",
    total: "Total payable at registry",
  },
  hi: {
    /* shared */
    village: "गाँव या मोहल्ला",
    ward: "वार्ड या परगना",
    category: "श्रेणी",
    printedPage: "मुद्रित पृष्ठ",
    serial: "क्रम",
    vcode: "वी-कोड",
    tehsil: "तहसील",
    perSqM: "प्रति वर्ग मीटर",
    allTehsils: "सभी तहसीलें",
    allCategories: "सभी श्रेणियाँ",
    allWards: "सभी वार्ड",

    /* views */
    viewLabel: "कॉलम",
    viewLand: "ज़मीन",
    viewCommercial: "व्यावसायिक",
    viewAgricultural: "कृषि",
    landColumns: "अकृषिक भूमि, ₹ प्रति वर्ग मीटर, प्लॉट के सामने की सड़क की चौड़ाई के हिसाब से",
    commercialColumns: "व्यावसायिक, ₹ प्रति वर्ग मीटर कारपेट एरिया",
    agriColumns: "कृषि भूमि, फ्रंटेज के हिसाब से",

    /* city page */
    tehsilSelectorTitle: "पाँच तहसीलें, पाँच सूचियाँ",
    tehsilSelectorLede: "ज़िला हर उप निबंधक कार्यालय की अलग सूची छापता है। तहसील चुनिए, या नीचे पूरे ज़िले में गाँव खोजिए।",
    rowsInTehsil: "गाँव",
    segmentsInTehsil: "सड़क खंड",
    landRange: "ज़मीन की दर",
    topSegment: "सबसे ऊँची सड़क खंड दर",
    searchTitle: "गाँव खोजिए",
    searchLede: "गाँव या मोहल्ले का नाम हिंदी या अंग्रेज़ी में लिखिए। पूरे ज़िले की सूची में खोजा जाएगा।",
    searchPlaceholder: "जैसे रिकाबगंज, सहादतगंज, भदरसा",
    searchLoading: "ज़िले की सूची आ रही है…",
    searchNoResults: "इस नाम का कोई गाँव नहीं मिला। कम अक्षर लिखकर देखिए, या दूसरी लिपि में।",
    searchResultCount: "नतीजे",
    searchHint: "खोजने के लिए लिखना शुरू कीजिए।",

    /* tehsil page */
    fullTable: "इस तहसील के सारे गाँव",
    roadSegments: "सड़क खंड",
    roadSegmentsLede: "इन नामित सड़कों पर पड़ने वाले प्लॉट पर गाँव की दर नहीं, सड़क खंड की दर लगती है। यह सिर्फ़ अकृषिक भूमि पर लागू है।",
    segment: "सड़क का हिस्सा",
    segmentLand: "ज़मीन",
    valuationRulesTitle: "सूची के अनुसार प्लॉट का मूल्यांकन कैसे होता है",
    filterCategory: "श्रेणी",
    filterWard: "वार्ड",
    showing: "दिखा रहे हैं",
    of: "में से",
    rows: "पंक्तियाँ",
    clearFilters: "फ़िल्टर हटाइए",
    showAll: "सभी दिखाइए",

    /* village page */
    landRates: "ज़मीन",
    commercialRates: "व्यावसायिक",
    agriRates: "कृषि",
    segmentsHere: "इस गाँव से गुज़रने वाली सड़कें",
    workedExample: "एक प्लॉट पर इसका मतलब",
    workedExampleLede: "9 मीटर से कम चौड़ी सड़क पर 1,000 वर्ग फ़ुट का प्लॉट, इसी गाँव की दर पर।",
    circleValue: "सर्किल मूल्य",
    stampDutyMale: "स्टाम्प ड्यूटी, पुरुष ख़रीदार",
    stampDutyFemale: "स्टाम्प ड्यूटी, महिला ख़रीदार",
    comparedToTehsil: "तहसील से तुलना",
    aboveMedian: "तहसील के मध्यक से ऊपर",
    belowMedian: "तहसील के मध्यक से नीचे",
    atMedian: "तहसील के मध्यक के बराबर",
    tehsilMedian: "तहसील का मध्यक",
    similarVillages: "मिलती-जुलती दर वाले गाँव",
    partOfLocality: "हमारे इलाक़ा पेज में शामिल",
    noAgriHere: "यह नगरीय पंक्ति है, सूची इसके लिए कृषि दरें नहीं छापती।",

    /* locality block */
    circleRatesHere: "यहाँ के सर्किल रेट",
    circleRatesHereLede: "प्रकाशित सूची की वे पंक्तियाँ जो इस इलाक़े को कवर करती हैं।",
    seeVillageRow: "पूरी पंक्ति",

    /* calculator */
    calculatorTitle: "स्टाम्प ड्यूटी का अनुमान",
    landKind: "आप क्या ख़रीद रहे हैं",
    kindNonAgri: "अकृषिक प्लॉट",
    kindCommercial: "व्यावसायिक",
    kindAgri: "कृषि भूमि",
    roadWidth: "प्लॉट के सामने सड़क की चौड़ाई",
    onSegment: "प्लॉट किसी नामित सड़क खंड पर है",
    nearCommercial: "व्यावसायिक गतिविधि से 50 मीटर के भीतर",
    nearActivity: "रिहायशी या व्यावसायिक गतिविधि से 200 मीटर के भीतर",
    adjoiningRoads: "प्लॉट कितनी सड़कों से लगा है",
    adjoiningAbadi: "आबादी से लगा है",
    frontage: "फ्रंटेज",
    area: "क्षेत्रफल",
    buyer: "ख़रीदार",
    rulesApplied: "लगाए गए नियम",
    noRulesApplied: "कोई प्रतिशत समायोजन नहीं लगा।",
    largePlotNote: "1,000 वर्ग मीटर से बड़ा प्लॉट: उससे ऊपर का हिस्सा 75% पर आँका जाता है।",
    segmentNotForAgri: "कृषि भूमि पर सड़क खंड की दर नहीं लगती (निर्देश 24), इसलिए गाँव की दर ली गई।",
    estimateOnly: "यह सिर्फ़ अनुमान है। उप निबंधक का मूल्यांकन ही अंतिम है।",
    baseValue: "आधार मूल्य",
    adjustments: "समायोजन",
    registrationFee: "पंजीकरण शुल्क",
    total: "रजिस्ट्री पर कुल देय",
  },
} as const;

export const rc = (locale: Locale) => rateCopy[locale];

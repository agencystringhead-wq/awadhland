/**
 * Hand-authored homepage blocks (spec Template 1, sections 2, 5, 6, 7). Written per language,
 * not translated. Guide and tool slugs come from the spec's launch lists; the pages exist from
 * build steps 4 and 5.
 */
import type { Locale } from "./schemas";

/**
 * Circle-rate page explainer (spec Template 5, section 4). The spec wants this as MDX; it moves to
 * content/ once the explainer needs data components. Written per language.
 */
export const circleRatesCopy: Record<Locale, { paragraphs: string[] }> = {
  en: {
    paragraphs: [
      "A circle rate is the minimum value per unit of land that the Uttar Pradesh government assigns to each locality for stamp duty. Registrars use it as the floor: the duty on a sale is charged on the higher of the circle value and the price in the agreement.",
      "The market rate is what buyers actually pay. On busy roads it can be several times the circle rate; in interior villages it can sit close to it. The gap between the two tells you how much of a plot's price is location premium and how much is the government's own valuation.",
      "Rates are published in the unit the government uses: rupees per square metre for residential and commercial land, rupees per hectare for agricultural land. This page keeps those units and never stores converted values, so the numbers can be checked against the source document line by line.",
      "The state revises the schedule roughly once a year per district. Each revision is a new schedule here, not an edit of the old one, so past values stay available for comparison.",
    ],
  },
  hi: {
    paragraphs: [
      "सर्किल रेट वह न्यूनतम मूल्य है जो उत्तर प्रदेश सरकार हर इलाक़े की ज़मीन के लिए स्टाम्प ड्यूटी के वास्ते तय करती है। रजिस्ट्रार इसे न्यूनतम आधार मानता है: सौदे पर ड्यूटी सर्किल मूल्य और अनुबंध की क़ीमत में जो ज़्यादा हो, उस पर लगती है।",
      "बाज़ार भाव वह है जो ख़रीदार असल में देता है। व्यस्त सड़कों पर यह सर्किल रेट से कई गुना हो सकता है; अंदर के गाँवों में इसके आसपास। दोनों का फ़र्क़ बताता है कि प्लॉट की क़ीमत में कितना हिस्सा जगह का प्रीमियम है और कितना सरकार का अपना मूल्यांकन।",
      "रेट उसी इकाई में प्रकाशित होते हैं जो सरकार इस्तेमाल करती है: रिहायशी और व्यावसायिक ज़मीन के लिए रुपये प्रति वर्ग मीटर, कृषि भूमि के लिए रुपये प्रति हेक्टेयर। यह पेज वही इकाइयाँ रखता है और बदले हुए मान कभी नहीं रखता, ताकि हर आँकड़ा मूल दस्तावेज़ से पंक्ति दर पंक्ति मिलाया जा सके।",
      "राज्य हर ज़िले में लगभग साल में एक बार सूची संशोधित करता है। हर संशोधन यहाँ नई सूची के रूप में जुड़ता है, पुरानी में बदलाव नहीं होता, इसलिए पिछले मान तुलना के लिए बने रहते हैं।",
    ],
  },
};

export type Situation = { title: string; body: string; guideSlug: string };
export type Tool = { slug: string; title: string; body: string };
export type ChecklistItem = { title: string; body: string };

export const homeCopy: Record<
  Locale,
  {
    situations: Situation[];
    tools: Tool[];
    checklist: ChecklistItem[];
    checklistGuideSlug: string;
  }
> = {
  en: {
    situations: [
      {
        title: "Buying from abroad (NRI)",
        body: "What you can legally buy, how to pay, and how to finish the registry without flying in for every step.",
        guideSlug: "buy-land-in-ayodhya-as-nri",
      },
      {
        title: "First plot in Ayodhya",
        body: "Where a first plot makes sense at each budget, and what to check before the token amount.",
        guideSlug: "buy-a-plot-in-ayodhya-step-by-step",
      },
      {
        title: "Commercial land near the airport",
        body: "What is actually available on the approach roads, what land use allows, and what is already acquired.",
        guideSlug: "land-near-ayodhya-airport",
      },
      {
        title: "Investment under 25 lakh",
        body: "Localities where that budget buys a plot close to circle rate rather than a hoarding price.",
        guideSlug: "ayodhya-vs-lucknow-vs-gorakhpur-land-investment",
      },
      {
        title: "Agricultural to residential",
        body: "Section 80 conversion in UP: who can apply, what it costs, and how long it takes.",
        guideSlug: "agricultural-to-residential-conversion-up",
      },
      {
        title: "Not sure yet",
        body: "Start with the safety checklist and a 15-minute call. No pressure, no listings pushed at you.",
        guideSlug: "how-to-check-if-land-in-up-is-safe-to-buy",
      },
    ],
    tools: [
      {
        slug: "stamp-duty-calculator",
        title: "Stamp duty calculator",
        body: "Circle value, stamp duty, registration fee and total for a UP land purchase.",
      },
      { slug: "circle-rate-lookup", title: "Circle rate lookup", body: "Type a locality, get its current rates and the effective date." },
      {
        slug: "land-safety-checklist",
        title: "Land safety checklist",
        body: "Every check with an explanation. Print it or save it as a PDF.",
      },
      {
        slug: "plot-yield-calculator",
        title: "Plot yield calculator",
        body: "Compare a plot against FD returns over 5 or 10 years with your own growth assumption.",
      },
    ],
    checklist: [
      { title: "Khatauni", body: "The seller's name must be on the current khatauni, not a relative's or a company's." },
      { title: "Encumbrance", body: "No loan, lien or pending case against the plot in the sub-registrar's records." },
      { title: "Mutation", body: "The last sale must already be mutated in the revenue record, or you inherit the gap." },
      { title: "Master-plan land use", body: "A plot sold as residential can still be agricultural or green belt in the master plan." },
      {
        title: "Gram Sabha or ceiling land",
        body: "Some land cannot be sold at all. Check the category in the khatauni before anything else.",
      },
      {
        title: "RERA for plotted projects",
        body: "A plotted development above the size threshold needs UP RERA registration. Ask for the number.",
      },
    ],
    checklistGuideSlug: "how-to-check-if-land-in-up-is-safe-to-buy",
  },
  hi: {
    situations: [
      {
        title: "विदेश से ख़रीदना (एनआरआई)",
        body: "क़ानूनन आप क्या ख़रीद सकते हैं, भुगतान कैसे करें, और हर क़दम पर भारत आए बिना रजिस्ट्री कैसे पूरी करें।",
        guideSlug: "buy-land-in-ayodhya-as-nri",
      },
      {
        title: "अयोध्या में पहला प्लॉट",
        body: "हर बजट में पहला प्लॉट कहाँ समझदारी है, और टोकन देने से पहले क्या जाँचें।",
        guideSlug: "buy-a-plot-in-ayodhya-step-by-step",
      },
      {
        title: "एयरपोर्ट के पास व्यावसायिक ज़मीन",
        body: "पहुँच सड़कों पर असल में क्या उपलब्ध है, भू-उपयोग क्या इजाज़त देता है, और क्या पहले ही अधिग्रहित है।",
        guideSlug: "land-near-ayodhya-airport",
      },
      {
        title: "25 लाख से कम में निवेश",
        body: "वे इलाक़े जहाँ इस बजट में होर्डिंग वाले दाम नहीं, सर्किल रेट के पास प्लॉट मिलता है।",
        guideSlug: "ayodhya-vs-lucknow-vs-gorakhpur-land-investment",
      },
      {
        title: "कृषि से रिहायशी",
        body: "यूपी में धारा 80 के तहत भू-उपयोग बदलना: कौन आवेदन कर सकता है, ख़र्च कितना, समय कितना।",
        guideSlug: "agricultural-to-residential-conversion-up",
      },
      {
        title: "अभी तय नहीं",
        body: "सुरक्षा चेकलिस्ट और 15 मिनट की बात से शुरू करें। कोई दबाव नहीं, कोई लिस्टिंग थोपी नहीं जाती।",
        guideSlug: "how-to-check-if-land-in-up-is-safe-to-buy",
      },
    ],
    tools: [
      {
        slug: "stamp-duty-calculator",
        title: "स्टाम्प ड्यूटी कैलकुलेटर",
        body: "यूपी में ज़मीन ख़रीद पर सर्किल मूल्य, स्टाम्प ड्यूटी, रजिस्ट्री शुल्क और कुल रक़म।",
      },
      { slug: "circle-rate-lookup", title: "सर्किल रेट खोज", body: "इलाक़े का नाम लिखें, मौजूदा रेट और लागू तारीख़ पाएँ।" },
      { slug: "land-safety-checklist", title: "ज़मीन सुरक्षा चेकलिस्ट", body: "हर जाँच समझाई हुई। प्रिंट करें या पीडीएफ़ में रखें।" },
      {
        slug: "plot-yield-calculator",
        title: "प्लॉट रिटर्न कैलकुलेटर",
        body: "अपनी बढ़त की धारणा से 5 या 10 साल में प्लॉट की तुलना एफ़डी से करें।",
      },
    ],
    checklist: [
      { title: "खतौनी", body: "मौजूदा खतौनी में बेचने वाले का ही नाम हो, किसी रिश्तेदार या कंपनी का नहीं।" },
      { title: "भार-मुक्त", body: "सब-रजिस्ट्रार के रिकॉर्ड में प्लॉट पर कोई क़र्ज़, बंधक या मुक़दमा न हो।" },
      { title: "दाख़िल-ख़ारिज", body: "पिछली बिक्री राजस्व रिकॉर्ड में दर्ज हो चुकी हो, वरना वह कमी आपके हिस्से आएगी।" },
      { title: "मास्टर प्लान में भू-उपयोग", body: "रिहायशी बताकर बेचा गया प्लॉट मास्टर प्लान में अब भी कृषि या ग्रीन बेल्ट हो सकता है।" },
      { title: "ग्राम सभा या सीलिंग की ज़मीन", body: "कुछ ज़मीन बेची ही नहीं जा सकती। सबसे पहले खतौनी में श्रेणी देखें।" },
      { title: "प्लॉटेड प्रोजेक्ट के लिए रेरा", body: "तय आकार से बड़े प्लॉटेड प्रोजेक्ट को यूपी रेरा पंजीकरण चाहिए। नंबर माँगें।" },
    ],
    checklistGuideSlug: "how-to-check-if-land-in-up-is-safe-to-buy",
  },
};

/* ------------------------------------------------------------------- tools */

export type ToolCopy = {
  title: string;
  /** one line under the h1 */
  intro: string;
  /** 400–800 word explainer under the tool (spec Template 7) */
  explainer: string[];
  faq: { q: string; a: string }[];
};

/**
 * Tool page copy (spec Template 7), written per language. Keyed by tool slug; the slug list
 * that actually builds lives in lib/tools.ts.
 */
export const toolCopy: Record<Locale, Record<"stamp-duty-calculator" | "khasra-frontage-check", ToolCopy>> = {
  en: {
    "stamp-duty-calculator": {
      title: "Stamp duty calculator for land in UP",
      intro: "Circle value, stamp duty, registration fee and the total payable at the registry for a plot in Ayodhya, Lucknow or Gorakhpur.",
      explainer: [
        "Stamp duty in Uttar Pradesh is charged on the value of the land, and the state sets a floor for that value: the circle rate. Every locality has one, published by the district's stamp and registration office (IGRSUP) and revised roughly once a year. The registrar takes the higher of the circle value and the price written in the sale deed, then applies the stamp duty percentage for the buyer's category and the registration fee on top.",
        "This calculator does the first half of that sum. Pick the city and the locality, choose the land type, enter the area, and it multiplies the area by the published circle rate to give the circle value. Residential and commercial rates are published per square metre; agricultural rates per hectare. The calculator converts your area into the published unit and never the other way round, so the number it shows can be checked line by line against the schedule on the circle-rate page.",
        "The buyer category matters. UP charges a lower rate to women buyers, with a cap on the property value the rebate applies to, and treats joint purchases separately. The rules the calculator applies are shown in the table on each circle-rate page with their effective date and source, and they are stored in the site's data with the same dates, so a change in the notification is a data change here, not a code change.",
        "Two things the calculator cannot know. First, the price you actually agree. If it is above the circle value, duty is charged on your price, not on the circle value; add the difference yourself or send us the number. Second, exemptions and special cases: transfers within a family, land bought under a government scheme, and plots in a registered township can carry different rates or concessions. Those need the notification, not a calculator.",
        "Registration fee is a separate charge from stamp duty. It is a percentage of the same value, sometimes with a cap, and it is paid at the sub-registrar's office along with the duty before the deed is signed. The total shown here is stamp duty plus registration fee: the amount that goes to the government at registry. Brokerage, lawyer's fees and mutation charges come on top and are agreed separately, in writing, before any site visit.",
        "Use the result as a budget line, not a quote. Circle rates change on revision, and the schedule on this site is dated so you can see whether it is current. If a seller's price is far below the circle rate, the duty will still be charged on the circle value, and the gap itself is worth asking about.",
      ],
      faq: [
        {
          q: "Is stamp duty charged on the circle value or on the price I pay?",
          a: "On whichever is higher. The calculator uses the circle value because that is the floor; if your agreed price is above it, the duty is charged on your price.",
        },
        {
          q: "Why does the buyer category change the amount?",
          a: "UP charges a lower stamp duty rate to women buyers, up to a cap on the property value, and applies its own rate to joint purchases. The rates and their effective dates are shown on each circle-rate page.",
        },
        {
          q: "Which unit should I enter the area in?",
          a: "Any of square feet, square metres, square yards, acres or hectares. The calculator converts to the unit the circle rate is published in: square metres for residential and commercial land, hectares for agricultural land.",
        },
        {
          q: "Does the total include brokerage or lawyer's fees?",
          a: "No. The total is stamp duty plus registration fee, the government charges at registry. Brokerage, legal fees and mutation charges are separate and should be agreed in writing beforehand.",
        },
      ],
    },
    "khasra-frontage-check": {
      title: "Check your plot: is your khasra on a road or next to the abadi?",
      intro: "Pick the sub-registrar office and the village, type the khasra number, and see whether the district's list puts that plot on a highway, a district road, a link road or next to the abadi.",
      explainer: [
        "An agricultural plot in Uttar Pradesh is not valued at one flat rate for its village. The district's valuation list carries a general agricultural rate and higher rates for plots that front a national or state highway, a district road (जनपदीय मार्ग) or a link road, and for plots next to the abadi, the village's settled area. Which of those applies to a plot decides its circle value, and the circle value is the floor stamp duty is charged on.",
        "To make that decidable plot by plot, the district prints a khasra list alongside the valuation list: for each revenue village, the khasra (gata) numbers that sit on each kind of road and next to the abadi. The signed notes on the Lucknow lists say they are part of the valuation list effective 1 August 2025, and that in any dispute the Tehsildar's decision is final. This tool searches that list. It covers the three Lucknow sub-registrar offices whose lists we hold: Sadar-4, Bakshi Ka Talab and Malihabad, about 58,000 khasra numbers across 465 villages.",
        "How to use it. Take the khasra number from the khatauni or the seller's papers, pick the SRO and the village, and type the number as printed. The tool matches on the number's leading digits, so 123 also finds 123क and 123/2, and every entry sharing those digits is shown with the heading it sits under. If the list names the plot under more than one heading, for example on a link road and next to the abadi, you see both.",
        "Where the result says to verify at the Tehsil, the transcriber could not be sure of that entry: a digit was unreadable in the scan, or two numbers were printed with no comma between them and had to be split. Treat those as leads, not answers.",
        "A number that is not found is not proof that the plot is general agricultural land. The lists were transcribed by hand from scanned pages, and a scan can hide a digit. Some villages are also described rather than listed: in parts of Bakshi Ka Talab the list notes that almost every plot has abadi around it and that the village now falls inside municipal limits, and names few or no abadi plots one by one. The tool tells you when the village you picked is one of these.",
        "What the tool does not do is give you a rate. The valuation list for these three SROs, the one with the ₹ figures, has not been published on this site yet, so the village pages say so plainly. When it lands, each village page will carry its rates alongside this list, at the same address.",
        "Use the result the way you would use a note from someone who has read the list for you: to know what to ask, and what the valuation at registry is likely to assume. Then confirm it where it counts. The Tehsil or the sub-registrar's office holds the signed list, and the Tehsildar's decision is final.",
      ],
      faq: [
        {
          q: "Why does it matter whether my plot is on a road?",
          a: "Because the valuation list rates a road-front or abadi-adjacent agricultural plot above a general one, the circle value, and so the stamp duty floor, is higher for it.",
        },
        {
          q: "I typed 123 and got 123/1 and 123क as well. Which is mine?",
          a: "The one written on your khatauni. The tool shows every entry that shares the leading digits so that a sub-division is not missed; the exact match, if there is one, is marked.",
        },
        {
          q: "My khasra is not on the list. Is it general land then?",
          a: "Usually, but not certainly. A number can be missed in a scanned list, and some villages are described as abadi throughout rather than listed. Ask at the Tehsil before relying on it.",
        },
        {
          q: "Which villages does it cover?",
          a: "All 465 villages of the Sadar-4, Bakshi Ka Talab and Malihabad sub-registrar offices in Lucknow district, from the lists printed as part of the valuation list effective 1 August 2025.",
        },
      ],
    },
  },
  hi: {
    "stamp-duty-calculator": {
      title: "यूपी में ज़मीन के लिए स्टाम्प ड्यूटी कैलकुलेटर",
      intro: "अयोध्या, लखनऊ या गोरखपुर में प्लॉट के लिए सर्किल मूल्य, स्टाम्प ड्यूटी, रजिस्ट्री शुल्क और रजिस्ट्री पर देय कुल रक़म।",
      explainer: [
        "उत्तर प्रदेश में स्टाम्प ड्यूटी ज़मीन के मूल्य पर लगती है, और राज्य उस मूल्य की एक न्यूनतम सीमा तय करता है: सर्किल रेट। हर इलाक़े का अपना सर्किल रेट होता है, जिसे ज़िले का स्टाम्प एवं रजिस्ट्रेशन कार्यालय (आईजीआरएसयूपी) प्रकाशित करता है और लगभग साल में एक बार संशोधित करता है। रजिस्ट्रार सर्किल मूल्य और बैनामे में लिखे दाम में जो ज़्यादा हो उसे लेता है, फिर ख़रीदार की श्रेणी के हिसाब से स्टाम्प ड्यूटी का प्रतिशत लगाता है और ऊपर से रजिस्ट्री शुल्क।",
        "यह कैलकुलेटर उस हिसाब का पहला आधा हिस्सा करता है। शहर और इलाक़ा चुनें, ज़मीन का प्रकार चुनें, क्षेत्रफल लिखें, और यह क्षेत्रफल को प्रकाशित सर्किल रेट से गुणा करके सर्किल मूल्य देता है। रिहायशी और व्यावसायिक रेट प्रति वर्ग मीटर प्रकाशित होते हैं; कृषि रेट प्रति हेक्टेयर। कैलकुलेटर आपके क्षेत्रफल को प्रकाशित इकाई में बदलता है, उल्टा कभी नहीं, इसलिए जो संख्या दिखती है उसे सर्किल रेट पेज की सूची से पंक्ति दर पंक्ति मिलाया जा सकता है।",
        "ख़रीदार की श्रेणी मायने रखती है। यूपी महिला ख़रीदारों से कम दर लेता है, जिस पर संपत्ति मूल्य की एक सीमा लागू है, और संयुक्त ख़रीद को अलग तरह से देखता है। कैलकुलेटर जो नियम लगाता है वे हर सर्किल रेट पेज की तालिका में लागू तारीख़ और स्रोत के साथ दिखते हैं, और साइट के डेटा में उन्हीं तारीख़ों के साथ रखे हैं, इसलिए अधिसूचना में बदलाव यहाँ डेटा का बदलाव है, कोड का नहीं।",
        "दो बातें कैलकुलेटर नहीं जान सकता। पहली, आप असल में कौन सा दाम तय करते हैं। अगर वह सर्किल मूल्य से ऊपर है, तो ड्यूटी आपके दाम पर लगेगी, सर्किल मूल्य पर नहीं; फ़र्क़ ख़ुद जोड़ लें या हमें संख्या भेजें। दूसरी, छूट और विशेष मामले: परिवार के भीतर हस्तांतरण, सरकारी योजना में ली गई ज़मीन, और पंजीकृत टाउनशिप के प्लॉट पर अलग दरें या रियायतें हो सकती हैं। उनके लिए अधिसूचना चाहिए, कैलकुलेटर नहीं।",
        "रजिस्ट्री शुल्क स्टाम्प ड्यूटी से अलग है। यह उसी मूल्य का एक प्रतिशत है, कभी-कभी एक ऊपरी सीमा के साथ, और बैनामे पर दस्तख़त से पहले सब-रजिस्ट्रार दफ़्तर में ड्यूटी के साथ जमा होता है। यहाँ दिखाया गया कुल स्टाम्प ड्यूटी और रजिस्ट्री शुल्क का जोड़ है: वह रक़म जो रजिस्ट्री पर सरकार को जाती है। ब्रोकरेज, वकील की फ़ीस और दाख़िल-ख़ारिज का ख़र्च इसके ऊपर है और किसी भी साइट विज़िट से पहले लिखित में अलग से तय होता है।",
        "नतीजे को बजट की एक पंक्ति मानें, कोटेशन नहीं। सर्किल रेट संशोधन पर बदलते हैं, और इस साइट की सूची तारीख़ के साथ है ताकि आप देख सकें कि वह मौजूदा है या नहीं। अगर बेचने वाले का दाम सर्किल रेट से बहुत नीचे है, तो ड्यूटी फिर भी सर्किल मूल्य पर लगेगी, और वह फ़र्क़ ख़ुद पूछने लायक़ है।",
      ],
      faq: [
        {
          q: "स्टाम्प ड्यूटी सर्किल मूल्य पर लगती है या मेरे दिए दाम पर?",
          a: "जो ज़्यादा हो उस पर। कैलकुलेटर सर्किल मूल्य लेता है क्योंकि वही न्यूनतम है; आपका तय दाम उससे ऊपर है तो ड्यूटी आपके दाम पर लगेगी।",
        },
        {
          q: "ख़रीदार की श्रेणी से रक़म क्यों बदलती है?",
          a: "यूपी महिला ख़रीदारों से कम स्टाम्प ड्यूटी लेता है, संपत्ति मूल्य की एक सीमा तक, और संयुक्त ख़रीद पर अपनी दर लगाता है। दरें और उनकी लागू तारीख़ हर सर्किल रेट पेज पर दिखती हैं।",
        },
        {
          q: "क्षेत्रफल किस इकाई में लिखूँ?",
          a: "वर्ग फ़ुट, वर्ग मीटर, वर्ग गज, एकड़ या हेक्टेयर, कोई भी। कैलकुलेटर उसे उस इकाई में बदलता है जिसमें सर्किल रेट प्रकाशित है: रिहायशी और व्यावसायिक के लिए वर्ग मीटर, कृषि के लिए हेक्टेयर।",
        },
        {
          q: "क्या कुल में ब्रोकरेज या वकील की फ़ीस शामिल है?",
          a: "नहीं। कुल स्टाम्प ड्यूटी और रजिस्ट्री शुल्क का जोड़ है, यानी रजिस्ट्री पर सरकारी शुल्क। ब्रोकरेज, क़ानूनी फ़ीस और दाख़िल-ख़ारिज का ख़र्च अलग है और पहले लिखित में तय होना चाहिए।",
        },
      ],
    },
    "khasra-frontage-check": {
      title: "अपना गाटा जाँचें: खसरा सड़क पर है या आबादी से लगा?",
      intro: "उप निबंधक कार्यालय और गाँव चुनें, खसरा नंबर लिखें, और देखें कि ज़िले की सूची उस गाटे को राजमार्ग, जनपदीय मार्ग, सम्पर्क मार्ग पर या आबादी से लगा बताती है या नहीं।",
      explainer: [
        "उत्तर प्रदेश में कृषि गाटे का मूल्य पूरे गाँव के लिए एक दर से नहीं आँका जाता। ज़िले की मूल्यांकन सूची में एक सामान्य कृषि दर होती है, और उससे ऊँची दरें उन गाटों के लिए जो राष्ट्रीय या राज्य राजमार्ग, जनपदीय मार्ग या सम्पर्क मार्ग पर हैं, और जो आबादी से लगे हैं। किसी गाटे पर इनमें से कौन सी दर लगेगी, उसी से उसका सर्किल मूल्य तय होता है, और स्टाम्प ड्यूटी उसी न्यूनतम मूल्य पर लगती है।",
        "यह गाटा-दर-गाटा तय हो सके, इसके लिए ज़िला मूल्यांकन सूची के साथ एक खसरा सूची छापता है: हर राजस्व गाँव के वे खसरा (गाटा) नंबर जो हर तरह की सड़क पर या आबादी से लगे हैं। लखनऊ की सूचियों पर हस्ताक्षरित टिप्पणी कहती है कि यह 01.08.2025 की मूल्यांकन सूची का भाग है, और किसी विवाद में तहसीलदार का निर्णय अंतिम होगा। यह टूल उसी सूची में खोजता है। इसमें लखनऊ के तीन उप निबंधक कार्यालय हैं जिनकी सूची हमारे पास है: सदर-4, बख्शी का तालाब और मलिहाबाद, 465 गाँवों के लगभग 58,000 खसरा नंबर।",
        "कैसे इस्तेमाल करें। खतौनी या बेचने वाले के काग़ज़ से खसरा नंबर लें, एसआरओ और गाँव चुनें, और नंबर वैसा ही लिखें जैसा छपा है। टूल नंबर के शुरू के अंकों से मिलान करता है, इसलिए 123 लिखने पर 123क और 123/2 भी मिलेंगे, और उन अंकों वाली हर प्रविष्टि अपने खाने के साथ दिखेगी। अगर सूची गाटे को एक से ज़्यादा खाने में रखती है, जैसे सम्पर्क मार्ग पर भी और आबादी से लगा भी, तो दोनों दिखेंगे।",
        "जहाँ नतीजा कहे कि तहसील से पुष्टि करें, वहाँ पढ़ने वाले को उस प्रविष्टि पर पक्का भरोसा नहीं था: स्कैन में कोई अंक पढ़ा नहीं गया, या दो नंबर बिना कॉमा के छपे थे और उन्हें अलग करना पड़ा। उन्हें इशारा मानें, जवाब नहीं।",
        "नंबर न मिलना इस बात का सबूत नहीं कि गाटा सामान्य कृषि भूमि है। सूचियाँ स्कैन किए पन्नों से हाथ से उतारी गई हैं, और स्कैन में कोई अंक छिप सकता है। कुछ गाँवों की सूची नंबरों की जगह टिप्पणी देती है: बख्शी का तालाब के कई गाँवों में लिखा है कि लगभग सभी गाटों के आस-पास आबादी है और गाँव अब नगर निगम सीमा में है, और आबादी वाले गाटे अलग से कम या बिल्कुल नहीं गिनाए गए। आपका चुना गाँव ऐसा है तो टूल बता देगा।",
        "यह टूल दर नहीं बताता। इन तीन एसआरओ की मूल्यांकन सूची, जिसमें रुपये के आँकड़े हैं, अभी इस साइट पर नहीं आई, और गाँव के पेज यह साफ़ लिखते हैं। जब वह आएगी, हर गाँव के पेज पर इसी सूची के साथ उसकी दरें भी होंगी, इसी पते पर।",
        "नतीजे को ऐसे बरतें जैसे किसी ने आपके लिए सूची पढ़कर नोट दिया हो: क्या पूछना है और रजिस्ट्री पर मूल्यांकन क्या मानकर चलेगा, यह जानने के लिए। फिर जहाँ मायने रखता है वहाँ पुष्टि करें। हस्ताक्षरित सूची तहसील या उप निबंधक कार्यालय में है, और तहसीलदार का निर्णय अंतिम है।",
      ],
      faq: [
        {
          q: "गाटा सड़क पर है या नहीं, इससे क्या फ़र्क़ पड़ता है?",
          a: "मूल्यांकन सूची सड़क से लगे या आबादी से सटे कृषि गाटे की दर सामान्य गाटे से ऊँची रखती है, इसलिए उसका सर्किल मूल्य, और स्टाम्प ड्यूटी की न्यूनतम सीमा, ज़्यादा होती है।",
        },
        {
          q: "मैंने 123 लिखा और 123/1 और 123क भी आए। मेरा कौन सा है?",
          a: "जो आपकी खतौनी में लिखा है। टूल एक जैसे शुरुआती अंकों वाली हर प्रविष्टि दिखाता है ताकि कोई बँटवारा छूटे नहीं; हूबहू मेल हो तो उस पर निशान लगा होता है।",
        },
        {
          q: "मेरा खसरा सूची में नहीं है। तो क्या यह सामान्य ज़मीन है?",
          a: "आम तौर पर हाँ, पर पक्का नहीं। स्कैन की गई सूची में नंबर छूट सकता है, और कुछ गाँव पूरे आबादी वाले बताए गए हैं, गिनाए नहीं गए। भरोसा करने से पहले तहसील में पूछें।",
        },
        {
          q: "इसमें कौन से गाँव हैं?",
          a: "लखनऊ ज़िले के सदर-4, बख्शी का तालाब और मलिहाबाद उप निबंधक कार्यालयों के सभी 465 गाँव, 01.08.2025 से लागू मूल्यांकन सूची के भाग के रूप में छपी सूचियों से।",
        },
      ],
    },
  },
};

/* ---------------------------------------------------------- homepage story */

export type Option = { value: string; label: string };
export type Framing = { eyebrow: string; heading: string; accent: string; lede?: string };

export type FormCopy = {
  eyebrow: string;
  intro: string;
  name: string;
  phone: string;
  email: string;
  city: string;
  cityOptions: Option[];
  lookingFor: string;
  pickClosest: string;
  purposes: Option[];
  submit: string;
  orWhatsapp: string;
  trust: string[];
  /** Band-only fields */
  budget: string;
  budgetOptions: Option[];
  location: string;
  locationOptions: Option[];
  message: string;
  bandSubmit: string;
  /** Prefix of the WhatsApp message built from the fields until JotForm is wired */
  waPrefix: string;
};

/**
 * Homepage as a story (Step 2 Phase C). Every line written per language, not translated.
 * `{years}` and `{phone}` are filled from team.json at render; nothing here holds a number.
 */
export type HomeStory = {
  hero: { status: string; title: string; accent: string; lede: string; ledeAccent: string; ctaPrimary: string; call: string; note: string };
  form: FormCopy;
  broker: { eyebrow: string; native: string; line: string; rated: string };
  stats: {
    circleRateEntries: string;
    localities: string;
    projects: string;
    years: string;
    rera: string;
    reraValue: string;
    cities: string;
    languages: string;
    languagesValue: string;
    lastUpdated: string;
  };
  changed: Framing & { all: string };
  cities: Framing & { seeCity: string; topAreas: string; priceBand: string };
  why: Framing & { pillars: { title: string; body: string }[] };
  situations: Framing & { open: string };
  how: Framing & { steps: { title: string; body: string }[]; feeNote: string };
  tools: Framing & { tryIt: string };
  checklist: Framing & { fullGuide: string };
  guides: Framing & { all: string };
  reviews: Framing & { verified: string; seeProfile: string; disclaimer: string };
  band: Framing & { trust: string[] };
};

export const homeStory: Record<Locale, HomeStory> = {
  en: {
    hero: {
      status: "Taking enquiries · replies within the hour on WhatsApp",
      title: "Land in Awadh,",
      accent: "checked before you pay.",
      lede: "You don't need a broker tonight. You need the real circle rate, a plot that's actually clean, and someone who replies on WhatsApp when you have a question.",
      ledeAccent: "That's what we do.",
      ctaPrimary: "Start here — the six checks",
      call: "Call",
      note: "Enquiries answered Mon–Sat 9a–7p IST. WhatsApp works from any country.",
    },
    form: {
      eyebrow: "Enquiry · replies within the hour",
      intro: "Leave your details. A real person replies on WhatsApp.",
      name: "Your name",
      phone: "Phone",
      email: "Email",
      city: "City",
      cityOptions: [
        { value: "ayodhya", label: "Ayodhya" },
        { value: "lucknow", label: "Lucknow" },
        { value: "gorakhpur", label: "Gorakhpur" },
        { value: "not-sure", label: "Not sure" },
      ],
      lookingFor: "What are you looking for?",
      pickClosest: "— pick the closest",
      purposes: [
        { value: "residential", label: "Residential plot" },
        { value: "commercial", label: "Commercial land" },
        { value: "investment", label: "Investment" },
        { value: "agricultural", label: "Agricultural" },
        { value: "not-sure", label: "Not sure yet" },
      ],
      submit: "Send my enquiry",
      orWhatsapp: "or WhatsApp",
      trust: ["UP RERA registered", "{years} years", "Real human", "Encrypted", "No data sold"],
      budget: "Budget",
      budgetOptions: [
        { value: "under-25", label: "Under ₹25 lakh" },
        { value: "25-50", label: "₹25–50 lakh" },
        { value: "50-100", label: "₹50 lakh – 1 crore" },
        { value: "over-100", label: "Over ₹1 crore" },
        { value: "not-sure", label: "Not sure yet" },
      ],
      location: "Where are you?",
      locationOptions: [
        { value: "india", label: "In India" },
        { value: "abroad", label: "Outside India" },
      ],
      message: "Anything else? A khasra number, a locality, a question.",
      bandSubmit: "Send my enquiry",
      waPrefix: "Enquiry from awadhland.com",
    },
    broker: {
      eyebrow: "Your broker",
      native: "Ayodhya native",
      line: "{years} years in Awadh land · all three cities · fees in writing",
      rated: "Rated on Google →",
    },
    stats: {
      circleRateEntries: "Circle-rate entries",
      localities: "Localities covered",
      projects: "Projects tracked",
      years: "Years active",
      rera: "RERA registered",
      reraValue: "Yes",
      cities: "Cities",
      languages: "Languages",
      languagesValue: "2",
      lastUpdated: "Last updated",
    },
    changed: { eyebrow: "What changed", heading: "Every notice that", accent: "moves land.", all: "All updates →" },
    cities: {
      eyebrow: "Three cities",
      heading: "Ayodhya first.",
      accent: "Lucknow and Gorakhpur alongside.",
      lede: "One page per locality, the same fields everywhere: circle rate, asking range, land use, distances, projects.",
      seeCity: "See the city page →",
      topAreas: "High-potential areas",
      priceBand: "Asking range",
    },
    why: {
      eyebrow: "Why we exist",
      heading: "Too many buyers get bad information",
      accent: "or bad land.",
      lede: "Especially buyers from outside UP. The rate quoted is a hoarding price, the plot is still agricultural in the khatauni, and nobody says so until the token is paid. This site exists so the numbers come first.",
      pillars: [
        { title: "Verified", body: "Every rate, distance and project on the site has a source and a date. If we cannot source it, it does not go up." },
        { title: "Plain", body: "Hindi and English, written separately. No jargon, no pressure, no listing pushed at you." },
        { title: "Local", body: "Native to the region and on the ground every week. We walk the plot with you, or on video if you are abroad." },
      ],
    },
    situations: {
      eyebrow: "Start with your situation",
      heading: "Six ways people",
      accent: "arrive here.",
      lede: "Pick the closest. Each one opens the guide written for it.",
      open: "Open the guide →",
    },
    how: {
      eyebrow: "How we work",
      heading: "Four steps.",
      accent: "That's the whole thing.",
      lede: "No listings pushed at you, no site visit before the papers are checked.",
      steps: [
        { title: "A 15-minute call", body: "WhatsApp or phone. You say what you want and your budget; we say what is realistic." },
        { title: "A written shortlist", body: "Rates, distances and what to check for each plot, in writing, before you spend a rupee." },
        { title: "Site visit, checks done first", body: "In person, or on video for NRIs. Khatauni and land-use checks are done before you travel." },
        { title: "Registry and mutation", body: "Paperwork through the sub-registrar and the revenue record, with the fee agreed in writing up front." },
      ],
      feeNote: "Brokerage is disclosed in writing before any visit.",
    },
    tools: {
      eyebrow: "Free tools",
      heading: "Do the sums",
      accent: "before the call.",
      lede: "No signup. Everything runs in your browser from the same data as the pages.",
      tryIt: "Try it →",
    },
    checklist: {
      eyebrow: "Before you pay a rupee",
      heading: "Six checks.",
      accent: "In this order.",
      lede: "A seller who objects to any of these is telling you something.",
      fullGuide: "Read the full checklist →",
    },
    guides: { eyebrow: "Recently published", heading: "Guides written", accent: "for one situation each.", all: "All guides →" },
    reviews: {
      eyebrow: "Reviews",
      heading: "What buyers say",
      accent: "after the registry.",
      lede: "Collected on Google and shown as written. We do not edit them.",
      verified: "verified reviews",
      seeProfile: "See the profile →",
      disclaimer: "Reviews are collected on Google and shown as written, with the buyer's name and month. We never edit or select them.",
    },
    band: {
      eyebrow: "Enquiry",
      heading: "Tell us what",
      accent: "you are looking for.",
      lede: "A real person replies on WhatsApp within the hour, Mon–Sat 9a–7p IST. From India or abroad.",
      trust: ["UP RERA registered", "{years} years", "Real human", "Encrypted", "No data sold"],
    },
  },
  hi: {
    hero: {
      status: "पूछताछ जारी · व्हाट्सऐप पर एक घंटे में जवाब",
      title: "अवध में ज़मीन,",
      accent: "पैसे देने से पहले जाँची हुई।",
      lede: "आज रात आपको ब्रोकर नहीं चाहिए। आपको असली सर्किल रेट चाहिए, ऐसा प्लॉट जो सचमुच साफ़ हो, और कोई जो सवाल पूछने पर व्हाट्सऐप पर जवाब दे।",
      ledeAccent: "यही हम करते हैं।",
      ctaPrimary: "यहाँ से शुरू करें — छह जाँचें",
      call: "कॉल",
      note: "पूछताछ का जवाब सोम–शनि सुबह 9 से शाम 7 (भारतीय समय)। व्हाट्सऐप किसी भी देश से चलता है।",
    },
    form: {
      eyebrow: "पूछताछ · एक घंटे में जवाब",
      intro: "अपनी जानकारी छोड़ें। व्हाट्सऐप पर एक असली व्यक्ति जवाब देगा।",
      name: "आपका नाम",
      phone: "फ़ोन",
      email: "ईमेल",
      city: "शहर",
      cityOptions: [
        { value: "ayodhya", label: "अयोध्या" },
        { value: "lucknow", label: "लखनऊ" },
        { value: "gorakhpur", label: "गोरखपुर" },
        { value: "not-sure", label: "तय नहीं" },
      ],
      lookingFor: "आप क्या ढूँढ रहे हैं?",
      pickClosest: "— जो सबसे क़रीब हो",
      purposes: [
        { value: "residential", label: "रिहायशी प्लॉट" },
        { value: "commercial", label: "व्यावसायिक ज़मीन" },
        { value: "investment", label: "निवेश" },
        { value: "agricultural", label: "कृषि भूमि" },
        { value: "not-sure", label: "अभी तय नहीं" },
      ],
      submit: "मेरी पूछताछ भेजें",
      orWhatsapp: "या व्हाट्सऐप",
      trust: ["यूपी रेरा पंजीकृत", "{years} वर्ष", "असली व्यक्ति", "एन्क्रिप्टेड", "डेटा बेचा नहीं जाता"],
      budget: "बजट",
      budgetOptions: [
        { value: "under-25", label: "₹25 लाख से कम" },
        { value: "25-50", label: "₹25–50 लाख" },
        { value: "50-100", label: "₹50 लाख – 1 करोड़" },
        { value: "over-100", label: "₹1 करोड़ से ऊपर" },
        { value: "not-sure", label: "अभी तय नहीं" },
      ],
      location: "आप कहाँ हैं?",
      locationOptions: [
        { value: "india", label: "भारत में" },
        { value: "abroad", label: "भारत से बाहर" },
      ],
      message: "और कुछ? खसरा नंबर, इलाक़ा, कोई सवाल।",
      bandSubmit: "मेरी पूछताछ भेजें",
      waPrefix: "awadhland.com से पूछताछ",
    },
    broker: {
      eyebrow: "आपका ब्रोकर",
      native: "अयोध्या के निवासी",
      line: "अवध की ज़मीन में {years} वर्ष · तीनों शहर · फ़ीस लिखित में",
      rated: "गूगल पर रेटिंग →",
    },
    stats: {
      circleRateEntries: "सर्किल रेट एंट्री",
      localities: "इलाक़े कवर",
      projects: "प्रोजेक्ट ट्रैक",
      years: "वर्ष सक्रिय",
      rera: "रेरा पंजीकृत",
      reraValue: "हाँ",
      cities: "शहर",
      languages: "भाषाएँ",
      languagesValue: "2",
      lastUpdated: "आख़िरी अपडेट",
    },
    changed: { eyebrow: "क्या बदला", heading: "हर वह सूचना जो", accent: "ज़मीन को हिलाती है।", all: "सभी अपडेट →" },
    cities: {
      eyebrow: "तीन शहर",
      heading: "पहले अयोध्या।",
      accent: "साथ में लखनऊ और गोरखपुर।",
      lede: "हर इलाक़े का एक पेज, हर जगह वही खाने: सर्किल रेट, माँगा जा रहा दाम, भू-उपयोग, दूरियाँ, प्रोजेक्ट।",
      seeCity: "शहर का पेज देखें →",
      topAreas: "ऊँची संभावना वाले इलाक़े",
      priceBand: "माँगा जा रहा दाम",
    },
    why: {
      eyebrow: "हम क्यों हैं",
      heading: "बहुत से ख़रीदारों को ग़लत जानकारी मिलती है",
      accent: "या ग़लत ज़मीन।",
      lede: "ख़ासकर यूपी के बाहर के ख़रीदारों को। बताया गया रेट होर्डिंग का दाम होता है, प्लॉट खतौनी में अब भी कृषि भूमि होता है, और टोकन देने तक कोई नहीं बताता। यह साइट इसलिए है कि आँकड़े पहले आएँ।",
      pillars: [
        { title: "जाँचा हुआ", body: "साइट पर हर रेट, दूरी और प्रोजेक्ट का स्रोत और तारीख़ है। जिसका स्रोत नहीं, वह यहाँ नहीं।" },
        { title: "सीधी बात", body: "हिंदी और अंग्रेज़ी, अलग-अलग लिखी हुई। न शब्दजाल, न दबाव, न कोई लिस्टिंग थोपी हुई।" },
        { title: "यहीं के", body: "इसी इलाक़े के, हर हफ़्ते ज़मीन पर। प्लॉट पर आपके साथ चलेंगे, विदेश में हैं तो वीडियो पर।" },
      ],
    },
    situations: {
      eyebrow: "अपनी स्थिति से शुरू करें",
      heading: "छह रास्ते जिनसे लोग",
      accent: "यहाँ पहुँचते हैं।",
      lede: "जो सबसे क़रीब हो चुनें। हर एक उसी के लिए लिखी गाइड खोलता है।",
      open: "गाइड खोलें →",
    },
    how: {
      eyebrow: "हम कैसे काम करते हैं",
      heading: "चार क़दम।",
      accent: "बस इतना ही।",
      lede: "न लिस्टिंग थोपी जाती है, न काग़ज़ जाँचे बिना साइट विज़िट।",
      steps: [
        { title: "15 मिनट की बात", body: "व्हाट्सऐप या फ़ोन। आप बताते हैं क्या चाहिए और बजट कितना; हम बताते हैं क्या मुमकिन है।" },
        { title: "लिखित शॉर्टलिस्ट", body: "हर प्लॉट के रेट, दूरियाँ और क्या जाँचना है, लिखित में, एक रुपया ख़र्च करने से पहले।" },
        { title: "साइट विज़िट, जाँच पहले", body: "ख़ुद जाकर, या एनआरआई के लिए वीडियो पर। खतौनी और भू-उपयोग की जाँच आपके सफ़र से पहले हो जाती है।" },
        { title: "रजिस्ट्री और दाख़िल-ख़ारिज", body: "सब-रजिस्ट्रार और राजस्व रिकॉर्ड तक का काग़ज़ी काम, फ़ीस पहले से लिखित में तय।" },
      ],
      feeNote: "किसी भी विज़िट से पहले ब्रोकरेज लिखित में बताई जाती है।",
    },
    tools: {
      eyebrow: "मुफ़्त टूल्स",
      heading: "हिसाब पहले,",
      accent: "बात बाद में।",
      lede: "कोई साइनअप नहीं। सब कुछ आपके ब्राउज़र में, पेजों वाले ही डेटा से।",
      tryIt: "आज़माएँ →",
    },
    checklist: {
      eyebrow: "एक रुपया देने से पहले",
      heading: "छह जाँचें।",
      accent: "इसी क्रम में।",
      lede: "जो बेचने वाला इनमें से किसी पर एतराज़ करे, वह आपको कुछ बता रहा है।",
      fullGuide: "पूरी चेकलिस्ट पढ़ें →",
    },
    guides: { eyebrow: "हाल में प्रकाशित", heading: "गाइड, हर एक", accent: "एक स्थिति के लिए।", all: "सभी गाइड →" },
    reviews: {
      eyebrow: "समीक्षाएँ",
      heading: "रजिस्ट्री के बाद",
      accent: "ख़रीदार क्या कहते हैं।",
      lede: "गूगल पर ली गईं और जैसी लिखी गईं वैसी दिखाई गईं। हम उन्हें बदलते नहीं।",
      verified: "सत्यापित समीक्षाएँ",
      seeProfile: "प्रोफ़ाइल देखें →",
      disclaimer: "समीक्षाएँ गूगल पर ली जाती हैं और ख़रीदार के नाम और महीने के साथ जैसी लिखी गईं वैसी दिखाई जाती हैं। हम न उन्हें बदलते हैं, न चुनते हैं।",
    },
    band: {
      eyebrow: "पूछताछ",
      heading: "बताइए आप",
      accent: "क्या ढूँढ रहे हैं।",
      lede: "एक असली व्यक्ति व्हाट्सऐप पर एक घंटे में जवाब देता है, सोम–शनि सुबह 9 से शाम 7 (भारतीय समय)। भारत से या विदेश से।",
      trust: ["यूपी रेरा पंजीकृत", "{years} वर्ष", "असली व्यक्ति", "एन्क्रिप्टेड", "डेटा बेचा नहीं जाता"],
    },
  },
};

/** Fills {years} and {phone} placeholders in story copy. */
export const fill = (s: string, vars: Record<string, string | number>) => s.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`));

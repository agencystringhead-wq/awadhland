/**
 * Hand-authored homepage blocks (spec Template 1, sections 2, 5, 6, 7). Written per language,
 * not translated. Guide and tool slugs come from the spec's launch lists; the pages exist from
 * build steps 4 and 5.
 */
import type { Locale } from "./schemas";

/**
 * Circle-rate page explainer (spec Template 5, section 4). The spec wants this as MDX; it moves to
 * content/ when the MDX pipeline lands in step 4. Written per language.
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
    heroTitle: string;
    heroPromise: string;
    situations: Situation[];
    tools: Tool[];
    checklist: ChecklistItem[];
    checklistGuideSlug: string;
  }
> = {
  en: {
    heroTitle: "Land in Ayodhya, Lucknow and Gorakhpur, with the numbers checked first.",
    heroPromise:
      "Circle rates, asking prices, distances and government projects for every locality, each with a source and a date. Then a UP RERA-registered broker on WhatsApp.",
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
    heroTitle: "अयोध्या, लखनऊ और गोरखपुर में ज़मीन, आँकड़े पहले जाँचे हुए।",
    heroPromise:
      "हर इलाक़े का सर्किल रेट, माँगा जा रहा दाम, दूरी और सरकारी प्रोजेक्ट, हर एक स्रोत और तारीख़ के साथ। फिर व्हाट्सऐप पर यूपी रेरा पंजीकृत ब्रोकर।",
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
export const toolCopy: Record<Locale, Record<"stamp-duty-calculator", ToolCopy>> = {
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
  },
};

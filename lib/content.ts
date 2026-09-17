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

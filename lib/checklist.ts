/**
 * The land safety checklist: 30 checks in 5 stages, the red flags and the documents to collect.
 *
 * One source for the HTML on /guides/land-safety-checklist/ (both trees) and its ItemList JSON-LD.
 * The English is the text of public/downloads/AwadhLand-Land-Safety-Checklist-UP.pdf (version
 * September 2026), so the page and the printable copy say the same thing; change both together.
 * The Hindi is written for Hindi readers from the same checks, not a machine translation.
 *
 * Imports no data, so a client component may read it.
 */
import type { Locale } from "./i18n";

type T = Record<Locale, string>;

export type ChecklistItem = {
  n: number;
  /** the bold lead-in */
  lead: T;
  /** the rest of the sentence */
  text: T;
  /** the smaller line under it */
  note?: T;
  links?: { label: string; href: string }[];
};

export type ChecklistStage = { n: number; title: T; hint: T; items: ChecklistItem[] };

const upbhulekh = { label: "upbhulekh.gov.in", href: "https://upbhulekh.gov.in/" };
const upbhunaksha = { label: "upbhunaksha.gov.in", href: "https://upbhunaksha.gov.in/" };
const igrsup = { label: "igrsup.gov.in", href: "https://igrsup.gov.in/" };
const vaad = { label: "vaad.up.nic.in", href: "https://vaad.up.nic.in/" };
const ecourts = { label: "ecourts.gov.in", href: "https://ecourts.gov.in/" };
const rera = { label: "up-rera.in", href: "https://www.up-rera.in/" };

export const CHECKLIST_STAGES: ChecklistStage[] = [
  {
    n: 1,
    title: { en: "Identify the land exactly", hi: "ज़मीन की पक्की पहचान" },
    hint: { en: "before anything else", hi: "सबसे पहले" },
    items: [
      {
        n: 1,
        lead: { en: "Get the khasra / gata number, village, tehsil and district in writing", hi: "खसरा / गाटा नंबर, गाँव, तहसील और ज़िला लिखित में लें" },
        text: { en: "from the seller.", hi: "बेचने वाले से।" },
        note: { en: "Every later check depends on the right number. \"Near the highway\" is not an address.", hi: "आगे की हर जाँच सही नंबर पर टिकी है। \"हाईवे के पास\" कोई पता नहीं है।" },
      },
      {
        n: 2,
        lead: { en: "Download the latest Khatauni (खतौनी)", hi: "नई खतौनी डाउनलोड करें" },
        text: { en: "and confirm the seller's name, father's name and share.", hi: "और बेचने वाले का नाम, पिता का नाम और हिस्सा मिलाएँ।" },
        note: {
          en: "If there are several co-owners, every one of them must sign the sale deed, or you only buy their share.",
          hi: "अगर कई सह-खातेदार हैं तो सबको बैनामे पर दस्तख़त करने होंगे, वरना आप सिर्फ़ उनका हिस्सा ख़रीदते हैं।",
        },
        links: [upbhulekh],
      },
      {
        n: 3,
        lead: { en: "Check the Khatauni class:", hi: "खतौनी की श्रेणी देखें:" },
        text: { en: "the seller should be a transferable bhumidhar (संक्रमणीय भूमिधर).", hi: "बेचने वाला संक्रमणीय भूमिधर होना चाहिए।" },
        note: {
          en: "Non-transferable bhumidhar (असंक्रमणीय), asami or government-patta land can't be sold freely. Ask a lawyer before going further.",
          hi: "असंक्रमणीय भूमिधर, आसामी या सरकारी पट्टे की ज़मीन खुलकर नहीं बिक सकती। आगे बढ़ने से पहले वकील से पूछें।",
        },
      },
      {
        n: 4,
        lead: { en: "Make sure it isn't public land:", hi: "पक्का करें कि यह सार्वजनिक ज़मीन नहीं है:" },
        text: {
          en: "Gram Sabha land such as बंजर, नवीन परती, तालाब, चारागाह, खलिहान, रास्ता, नाली, कब्रिस्तान can't be bought, whatever the seller says.",
          hi: "बंजर, नवीन परती, तालाब, चारागाह, खलिहान, रास्ता, नाली, कब्रिस्तान जैसी ग्राम सभा की ज़मीन ख़रीदी नहीं जा सकती, बेचने वाला कुछ भी कहे।",
        },
        note: { en: "These entries show in the Khasra / Khatauni. Buying it means losing the land and the money.", hi: "ये प्रविष्टियाँ खसरा / खतौनी में दिखती हैं। ऐसी ज़मीन ख़रीदने का मतलब ज़मीन और पैसा दोनों गँवाना है।" },
      },
      {
        n: 5,
        lead: { en: "Rule out Nazul land (नजूल)", hi: "नजूल ज़मीन तो नहीं," },
        text: { en: "in city areas.", hi: "शहरी इलाक़ों में यह जाँचें।" },
        note: {
          en: "Nazul is government-owned leasehold land, common in old parts of Lucknow, Ayodhya and Gorakhpur. It needs a freehold or permission from the authority before a clean sale.",
          hi: "नजूल सरकार की पट्टे वाली ज़मीन है, लखनऊ, अयोध्या और गोरखपुर के पुराने हिस्सों में आम। साफ़ बिक्री से पहले फ़्रीहोल्ड या प्राधिकरण की अनुमति चाहिए।",
        },
      },
      {
        n: 6,
        lead: { en: "Match the plot on the village map", hi: "गाँव के नक्शे पर प्लॉट मिलाएँ" },
        text: { en: "(shape, neighbours, road).", hi: "(आकार, पड़ोसी, रास्ता)।" },
        note: {
          en: "Check there is a recorded path or road (चक रोड / रास्ता) to the plot, not just a field boundary people walk on.",
          hi: "देखें कि प्लॉट तक दर्ज रास्ता या चक रोड है, सिर्फ़ खेत की मेड़ नहीं जिस पर लोग चलते हैं।",
        },
        links: [upbhunaksha],
      },
    ],
  },
  {
    n: 2,
    title: { en: "Legal checks", hi: "क़ानूनी जाँच" },
    hint: { en: "ideally done by your own advocate", hi: "बेहतर हो आपका अपना वकील करे" },
    items: [
      {
        n: 7,
        lead: { en: "Title chain for at least 12 years, better 30:", hi: "कम से कम 12 साल, बेहतर 30 साल की स्वामित्व-श्रृंखला:" },
        text: {
          en: "see every earlier sale deed, gift deed or inheritance entry that brought the land to the seller.",
          hi: "हर पिछला बैनामा, दानपत्र या विरासत की प्रविष्टि देखें जिससे ज़मीन बेचने वाले तक पहुँची।",
        },
        note: { en: "Gaps in the chain are where most frauds hide.", hi: "ज़्यादातर धोखाधड़ी श्रृंखला की ख़ाली जगहों में छिपी होती है।" },
      },
      {
        n: 8,
        lead: { en: "Inherited land? Check the varasat (वरासत) entry", hi: "विरासत की ज़मीन? वरासत की प्रविष्टि देखें:" },
        text: { en: "is done and every legal heir is recorded and signs.", hi: "दर्ज हो चुकी हो और हर क़ानूनी वारिस दर्ज हो और दस्तख़त करे।" },
        note: { en: "A sister or brother left out can challenge the sale years later.", hi: "छूटा हुआ भाई या बहन सालों बाद बिक्री को चुनौती दे सकता है।" },
      },
      {
        n: 9,
        lead: { en: "Encumbrance search (भार मुक्त प्रमाण पत्र / 12 साला)", hi: "भार मुक्त प्रमाण पत्र / 12 साला खोज" },
        text: {
          en: "from the Sub-Registrar to see any earlier sale, mortgage or loan registered on the land.",
          hi: "उप निबंधक कार्यालय से, ताकि ज़मीन पर दर्ज पिछली बिक्री, गिरवी या क़र्ज़ दिख जाए।",
        },
        links: [igrsup],
      },
      {
        n: 10,
        lead: { en: "Court cases:", hi: "अदालती मुक़दमे:" },
        text: { en: "search revenue courts and civil courts by village, khasra and the seller's name.", hi: "गाँव, खसरा और बेचने वाले के नाम से राजस्व और दीवानी अदालतों में खोजें।" },
        note: { en: "Partition, boundary and inheritance cases are common in UP villages.", hi: "यूपी के गाँवों में बँटवारे, मेड़ और विरासत के मुक़दमे आम हैं।" },
        links: [vaad, ecourts],
      },
      {
        n: 11,
        lead: { en: "Seller from a Scheduled Caste?", hi: "बेचने वाला अनुसूचित जाति से है?" },
        text: {
          en: "Sale to a non-SC buyer needs the Collector's permission under Section 98 of the UP Revenue Code, 2006.",
          hi: "ग़ैर-अनुसूचित जाति के ख़रीदार को बिक्री के लिए उत्तर प्रदेश राजस्व संहिता, 2006 की धारा 98 में कलेक्टर की अनुमति चाहिए।",
        },
        note: { en: "Without it the sale can be declared void.", hi: "इसके बिना बिक्री शून्य घोषित हो सकती है।" },
      },
      {
        n: 12,
        lead: { en: "Land use and master plan:", hi: "भू-उपयोग और मास्टर प्लान:" },
        text: { en: "check the zone in the development authority's master plan (Ayodhya DA, LDA, GDA).", hi: "विकास प्राधिकरण (अयोध्या, एलडीए, जीडीए) के मास्टर प्लान में ज़ोन देखें।" },
        note: {
          en: "Agricultural or green-belt zones won't get a residential building map. Also ask if the land is under any acquisition notice for a highway, ring road or airport.",
          hi: "कृषि या ग्रीन-बेल्ट ज़ोन में रिहायशी नक्शा पास नहीं होता। यह भी पूछें कि ज़मीन हाईवे, रिंग रोड या एयरपोर्ट के अधिग्रहण नोटिस में तो नहीं।",
        },
      },
      {
        n: 13,
        lead: { en: "Buying farmland to build on?", hi: "बनाने के लिए खेती की ज़मीन ले रहे हैं?" },
        text: {
          en: "Ask whether the Section 80 declaration (non-agricultural use) has been done by the SDM, or budget time and cost to get it.",
          hi: "पूछें कि एसडीएम से धारा 80 की घोषणा (अकृषिक उपयोग) हो चुकी है या नहीं, वरना उसका समय और ख़र्च जोड़ें।",
        },
      },
      {
        n: 14,
        lead: { en: "Plot in a colony or layout?", hi: "कॉलोनी या लेआउट में प्लॉट?" },
        text: {
          en: "Check it is registered with UP RERA (where required) and the layout is approved by the development authority.",
          hi: "देखें कि यह यूपी रेरा में पंजीकृत हो (जहाँ ज़रूरी है) और लेआउट विकास प्राधिकरण से स्वीकृत हो।",
        },
        note: {
          en: "Unapproved colonies often can't get a building map, water or electricity connections on normal terms.",
          hi: "अस्वीकृत कॉलोनियों में अक्सर नक्शा, पानी या बिजली का कनेक्शन सामान्य शर्तों पर नहीं मिलता।",
        },
        links: [rera],
      },
      {
        n: 15,
        lead: { en: "NRI or OCI buyer?", hi: "एनआरआई या ओसीआई ख़रीदार?" },
        text: {
          en: "Under FEMA you can't buy agricultural land, a plantation or a farmhouse. Residential and commercial plots are allowed.",
          hi: "फ़ेमा के तहत आप कृषि भूमि, बागान या फ़ार्महाउस नहीं ख़रीद सकते। रिहायशी और व्यावसायिक प्लॉट की अनुमति है।",
        },
        note: { en: "Inheritance is a separate case. Take advice before paying.", hi: "विरासत अलग मामला है। भुगतान से पहले सलाह लें।" },
      },
    ],
  },
  {
    n: 3,
    title: { en: "Site visit", hi: "मौक़े पर जाँच" },
    hint: { en: "go yourself, or send someone you trust", hi: "ख़ुद जाएँ, या किसी भरोसेमंद को भेजें" },
    items: [
      {
        n: 16,
        lead: { en: "Stand on the plot and check the boundaries", hi: "प्लॉट पर खड़े होकर सीमाएँ जाँचें" },
        text: { en: "against the map and the deed: length, width, neighbours on each side.", hi: "नक्शे और बैनामे से मिलाकर: लंबाई, चौड़ाई, हर तरफ़ के पड़ोसी।" },
      },
      {
        n: 17,
        lead: { en: "Talk to two or three neighbours:", hi: "दो-तीन पड़ोसियों से बात करें:" },
        text: { en: "who owns it, who farms it, any dispute?", hi: "मालिक कौन है, खेती कौन करता है, कोई विवाद?" },
        note: { en: "They know things no record shows.", hi: "वे वह जानते हैं जो किसी रिकॉर्ड में नहीं दिखता।" },
      },
      {
        n: 18,
        lead: { en: "Check who is in possession.", hi: "देखें क़ब्ज़ा किसका है।" },
        text: { en: "Crops, a hut or a tenant on the land means someone else claims a right to it.", hi: "ज़मीन पर फ़सल, झोपड़ी या किरायेदार का मतलब है कि कोई और उस पर हक़ जताता है।" },
      },
      {
        n: 19,
        lead: { en: "Get a measurement (पैमाइश) by the Lekhpal", hi: "लेखपाल से पैमाइश कराएँ" },
        text: { en: "before the registry, especially for part of a larger khasra.", hi: "रजिस्ट्री से पहले, ख़ासकर जब बड़े खसरे का एक हिस्सा ले रहे हों।" },
      },
      {
        n: 20,
        lead: { en: "Look at the ground itself:", hi: "ज़मीन को ख़ुद देखें:" },
        text: {
          en: "low-lying or flood-prone near a river (Saryu, Gomti, Rapti, Rohin), high-tension lines overhead, drains, waterlogging in monsoon.",
          hi: "नदी (सरयू, गोमती, राप्ती, रोहिन) के पास नीची या बाढ़ वाली, ऊपर हाई-टेंशन लाइन, नाला, बरसात में जलभराव।",
        },
      },
    ],
  },
  {
    n: 4,
    title: { en: "Money and registry", hi: "पैसा और रजिस्ट्री" },
    hint: { en: "where most people lose money", hi: "जहाँ ज़्यादातर लोग पैसा गँवाते हैं" },
    items: [
      {
        n: 21,
        lead: { en: "Sign an agreement to sell before the token", hi: "टोकन से पहले इक़रारनामा करें" },
        text: { en: "with price, area, khasra, timeline and a full refund clause if the title fails.", hi: "दाम, रक़बा, खसरा, समय-सीमा और स्वामित्व में खोट निकलने पर पूरी वापसी की शर्त के साथ।" },
        note: { en: "A registered agreement is stronger.", hi: "पंजीकृत इक़रारनामा ज़्यादा मज़बूत है।" },
      },
      {
        n: 22,
        lead: { en: "Pay only by bank transfer, cheque or DD.", hi: "भुगतान सिर्फ़ बैंक ट्रांसफ़र, चेक या डीडी से।" },
        text: {
          en: "Cash advances of ₹20,000 or more for land, or taking ₹2 lakh or more in cash, are not allowed under the Income Tax Act.",
          hi: "आयकर अधिनियम के तहत ज़मीन के लिए ₹20,000 या ज़्यादा का नक़द अग्रिम, या ₹2 लाख या ज़्यादा नक़द लेना मना है।",
        },
        note: { en: "Bank records are also your proof of payment.", hi: "बैंक का रिकॉर्ड आपके भुगतान का सबूत भी है।" },
      },
      {
        n: 23,
        lead: { en: "Check the circle rate.", hi: "सर्किल रेट देखें।" },
        text: {
          en: "Stamp duty is charged on the circle-rate value or the deal price, whichever is higher.",
          hi: "स्टाम्प ड्यूटी सर्किल रेट के मूल्य या सौदे के दाम, जो ज़्यादा हो, उस पर लगती है।",
        },
        note: { en: "A price far below the circle rate is a warning sign, not a bargain.", hi: "सर्किल रेट से बहुत कम दाम चेतावनी है, सस्ता सौदा नहीं।" },
        links: [{ label: "circle-rate-lookup", href: "/tools/circle-rate-lookup/" }],
      },
      {
        n: 24,
        lead: { en: "TDS:", hi: "टीडीएस:" },
        text: {
          en: "if the price is ₹50 lakh or more (and it isn't rural farmland), deduct 1% TDS and deposit it. Different rules apply if the seller is an NRI.",
          hi: "दाम ₹50 लाख या ज़्यादा हो (और ग्रामीण खेती की ज़मीन न हो) तो 1% टीडीएस काटकर जमा करें। बेचने वाला एनआरआई हो तो नियम अलग हैं।",
        },
        note: { en: "Ask your CA.", hi: "अपने सीए से पूछें।" },
      },
      {
        n: 25,
        lead: { en: "See the originals", hi: "मूल दस्तावेज़ देखें" },
        text: { en: "of all earlier deeds, and match the seller's Aadhaar and PAN with the Khatauni name.", hi: "सारे पिछले बैनामों के, और बेचने वाले का आधार और पैन खतौनी के नाम से मिलाएँ।" },
      },
      {
        n: 26,
        lead: { en: "Avoid power-of-attorney \"sales\".", hi: "मुख़्तारनामे वाली \"बिक्री\" से बचें।" },
        text: {
          en: "The Supreme Court has held that a sale through GPA, agreement or will doesn't transfer ownership.",
          hi: "सुप्रीम कोर्ट कह चुका है कि जीपीए, इक़रारनामे या वसीयत से हुई बिक्री से मालिकाना हक़ नहीं बदलता।",
        },
        note: { en: "Buy only through a registered sale deed (बैनामा) signed by the recorded owner.", hi: "सिर्फ़ दर्ज मालिक के दस्तख़त वाले पंजीकृत बैनामे से ख़रीदें।" },
      },
      {
        n: 27,
        lead: { en: "Registry at the Sub-Registrar office", hi: "उप निबंधक कार्यालय में रजिस्ट्री" },
        text: {
          en: "with the seller in person, two witnesses, and the deed matching the khasra, area and boundaries you checked.",
          hi: "बेचने वाले की मौजूदगी, दो गवाहों और ऐसे बैनामे के साथ जो आपके जाँचे खसरे, रक़बे और सीमाओं से मेल खाए।",
        },
      },
    ],
  },
  {
    n: 5,
    title: { en: "After the registry", hi: "रजिस्ट्री के बाद" },
    hint: { en: "don't stop here", hi: "यहीं मत रुकिए" },
    items: [
      {
        n: 28,
        lead: { en: "Mutation (दाखिल-खारिज) at the tehsil:", hi: "तहसील में दाखिल-ख़ारिज:" },
        text: { en: "follow up until the Khatauni shows your name.", hi: "तब तक पीछे लगे रहें जब तक खतौनी में आपका नाम न आ जाए।" },
        note: { en: "Until then, records still show the seller as owner.", hi: "तब तक रिकॉर्ड में बेचने वाला ही मालिक दिखता है।" },
      },
      {
        n: 29,
        lead: { en: "Keep a file:", hi: "एक फ़ाइल रखें:" },
        text: { en: "certified copy of the sale deed, new Khatauni, map, payment proofs, receipts for stamp duty.", hi: "बैनामे की प्रमाणित प्रति, नई खतौनी, नक्शा, भुगतान के सबूत, स्टाम्प ड्यूटी की रसीदें।" },
      },
      {
        n: 30,
        lead: { en: "Protect the plot:", hi: "प्लॉट की हिफ़ाज़त करें:" },
        text: {
          en: "put up a boundary or at least pillars and a board with your name, and visit it regularly.",
          hi: "बाउंड्री या कम से कम पिलर और अपने नाम का बोर्ड लगाएँ, और नियमित जाते रहें।",
        },
      },
    ],
  },
];

export const CHECKLIST_RED_FLAGS: T[] = [
  { en: "The seller is in a hurry, or the price is well below nearby deals and the circle rate.", hi: "बेचने वाला जल्दी में है, या दाम आसपास के सौदों और सर्किल रेट से काफ़ी नीचे है।" },
  { en: "Only photocopies, no originals. \"The registry will happen later.\"", hi: "सिर्फ़ फ़ोटोकॉपी, मूल नहीं। \"रजिस्ट्री बाद में हो जाएगी।\"" },
  { en: "A power-of-attorney holder is selling instead of the owner.", hi: "मालिक की जगह मुख़्तारनामा रखने वाला बेच रहा है।" },
  { en: "The name in the Khatauni doesn't match the seller's ID, or some co-owners are \"not available\".", hi: "खतौनी का नाम बेचने वाले की आईडी से नहीं मिलता, या कुछ सह-खातेदार \"उपलब्ध नहीं\" हैं।" },
  { en: "The plot is \"right next to\" a big government project, but no one can show the master-plan zone.", hi: "प्लॉट किसी बड़े सरकारी प्रोजेक्ट के \"बिल्कुल पास\" है, पर मास्टर प्लान का ज़ोन कोई नहीं दिखा पाता।" },
  { en: "You're asked to pay cash, or into someone else's account.", hi: "आपसे नक़द, या किसी और के खाते में भुगतान करने को कहा जाता है।" },
];

export const CHECKLIST_DOCUMENTS: T[] = [
  { en: "Latest Khatauni (खतौनी)", hi: "नई खतौनी" },
  { en: "Khasra / village map extract (भू-नक्शा)", hi: "खसरा / गाँव के नक्शे का अंश (भू-नक्शा)" },
  { en: "Earlier sale / gift deeds (12–30 years)", hi: "पिछले बैनामे / दानपत्र (12–30 साल)" },
  { en: "Varasat entry, if inherited", hi: "विरासत हो तो वरासत की प्रविष्टि" },
  { en: "Encumbrance search (भार मुक्त प्रमाण पत्र)", hi: "भार मुक्त प्रमाण पत्र" },
  { en: "Court case search results", hi: "मुक़दमों की खोज के नतीजे" },
  { en: "Master-plan zone / layout approval", hi: "मास्टर प्लान ज़ोन / लेआउट की स्वीकृति" },
  { en: "RERA registration (colony plots)", hi: "रेरा पंजीकरण (कॉलोनी के प्लॉट)" },
  { en: "Section 80 order (if farmland for building)", hi: "धारा 80 का आदेश (खेती की ज़मीन पर निर्माण हो तो)" },
  { en: "Seller ID: Aadhaar + PAN", hi: "बेचने वाले की आईडी: आधार + पैन" },
  { en: "Agreement to sell + payment proofs", hi: "इक़रारनामा + भुगतान के सबूत" },
  { en: "Registered sale deed + mutation order", hi: "पंजीकृत बैनामा + दाखिल-ख़ारिज का आदेश" },
];

export const CHECKLIST_COUNT = CHECKLIST_STAGES.reduce((n, s) => n + s.items.length, 0);

/**
 * The printable copies, one per language, generated from the lists above by
 * scripts/build-checklist-pdf.ts (npm run checklist:pdf) and committed. Generated rather than
 * designed by hand so the PDF and the page cannot say different things, and so neither carries a
 * claim the site withholds: the hand-designed PDF named a UP RERA registration that is not yet on
 * record. scripts/validate.ts fails the build when the lists change and the PDFs were not rebuilt.
 */
export const CHECKLIST_PDFS: Record<Locale, { href: string; file: string; preview: { src: string; width: number; height: number } }> = {
  en: {
    href: "/downloads/awadhland-land-safety-checklist-en.pdf",
    file: "public/downloads/awadhland-land-safety-checklist-en.pdf",
    preview: { src: "/images/guides/land-safety-checklist-page1-en.webp", width: 720, height: 1018 },
  },
  hi: {
    href: "/downloads/awadhland-land-safety-checklist-hi.pdf",
    file: "public/downloads/awadhland-land-safety-checklist-hi.pdf",
    preview: { src: "/images/guides/land-safety-checklist-page1-hi.webp", width: 720, height: 1018 },
  },
};

/** Where the lock file records what the committed PDFs were generated from. */
export const CHECKLIST_PDF_LOCK = "scripts/checklist-pdf.lock.json";

/**
 * A short hash of everything the PDFs print: the stages, the red flags and the documents. Written
 * into the lock file by the generator and compared by validate, so an edit here without a rebuild
 * fails the build instead of shipping a PDF that disagrees with the page.
 */
export function checklistContentHash(extra = ""): string {
  const text = JSON.stringify([CHECKLIST_STAGES, CHECKLIST_RED_FLAGS, CHECKLIST_DOCUMENTS]) + extra;
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
}

export const CHECKLIST_GUIDE_SLUG = "land-safety-checklist";

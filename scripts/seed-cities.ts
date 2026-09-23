/**
 * npm run seed:cities
 *
 * Seeds Lucknow and Gorakhpur (cities, localities, projects, circle-rate schedules) and the rest of
 * Ayodhya's localities as DRAFT records with clearly marked placeholders, so every nav item and
 * city page is real on the preview build. Idempotent: records whose id already exists are left
 * untouched, so upgrading a draft to live data in the JSON is never overwritten by a re-run.
 *
 * Every generated value except name, nameHi, tehsil and approximate coordinates is a placeholder
 * and says so in `todo`. Drafts are noindex and absent from the sitemaps until status is "live".
 */
import fs from "node:fs";
import path from "node:path";

type Band = "low" | "mid" | "high" | "premium";
type Use = "residential" | "commercial" | "mixed" | "agricultural" | "industrial" | "institutional";
type Seed = { id?: string; name: string; nameHi: string; tehsil: string; lat: number; lng: number; band: Band; use: Use };

const TODAY = "2026-09-18";
const EFFECTIVE = "2026-08-01";
const SRC = "https://igrsup.gov.in/";
const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/\(.*?\)/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/* ------------------------------------------------------------------ seeds */

const AYODHYA: Seed[] = [
  { name: "Faizabad Road", nameHi: "फैजाबाद रोड", tehsil: "Sadar", lat: 26.78, lng: 82.15, band: "mid", use: "residential" },
  { name: "Civil Lines", nameHi: "सिविल लाइंस", tehsil: "Sadar", lat: 26.773, lng: 82.14, band: "high", use: "mixed" },
  { name: "Naya Ghat", nameHi: "नया घाट", tehsil: "Sadar", lat: 26.805, lng: 82.205, band: "premium", use: "mixed" },
  { name: "Ram Path", nameHi: "राम पथ", tehsil: "Sadar", lat: 26.797, lng: 82.196, band: "premium", use: "commercial" },
  { name: "Dharma Path", nameHi: "धर्म पथ", tehsil: "Sadar", lat: 26.79, lng: 82.19, band: "premium", use: "commercial" },
  { name: "Bhakti Path", nameHi: "भक्ति पथ", tehsil: "Sadar", lat: 26.796, lng: 82.2, band: "premium", use: "commercial" },
  { name: "Sahadatganj", nameHi: "सहादतगंज", tehsil: "Sadar", lat: 26.78, lng: 82.135, band: "high", use: "mixed" },
  { name: "Rikabganj", nameHi: "रिकाबगंज", tehsil: "Sadar", lat: 26.772, lng: 82.145, band: "high", use: "mixed" },
  { name: "Devkali", nameHi: "देवकाली", tehsil: "Sadar", lat: 26.768, lng: 82.16, band: "mid", use: "residential" },
  { name: "Ranopali", nameHi: "रानोपाली", tehsil: "Sadar", lat: 26.788, lng: 82.18, band: "mid", use: "residential" },
  { id: "ayodhya-bypass-nh-27", name: "Ayodhya Bypass (NH-27)", nameHi: "अयोध्या बाईपास (एनएच-27)", tehsil: "Sadar", lat: 26.76, lng: 82.15, band: "mid", use: "commercial" },
  { name: "Airport Road", nameHi: "एयरपोर्ट रोड", tehsil: "Sadar", lat: 26.755, lng: 82.16, band: "high", use: "mixed" },
  { name: "Lucknow Road", nameHi: "लखनऊ रोड", tehsil: "Sadar", lat: 26.77, lng: 82.11, band: "mid", use: "residential" },
  { name: "Gosaiganj", nameHi: "गोसाईगंज", tehsil: "Bikapur", lat: 26.7, lng: 82.06, band: "low", use: "agricultural" },
  { name: "Bikapur Road", nameHi: "बीकापुर रोड", tehsil: "Bikapur", lat: 26.7, lng: 82.12, band: "low", use: "agricultural" },
  { name: "Sohawal", nameHi: "सोहावल", tehsil: "Sohawal", lat: 26.76, lng: 82.06, band: "low", use: "agricultural" },
  { name: "Masodha", nameHi: "मसौधा", tehsil: "Sadar", lat: 26.74, lng: 82.15, band: "low", use: "agricultural" },
  { name: "Barun Bypass", nameHi: "बरुण बाईपास", tehsil: "Sadar", lat: 26.745, lng: 82.135, band: "mid", use: "mixed" },
  { name: "Deokali", nameHi: "देवकाली (देओकाली)", tehsil: "Sadar", lat: 26.766, lng: 82.165, band: "mid", use: "residential" },
  { name: "Mahobra", nameHi: "महोबरा", tehsil: "Sadar", lat: 26.785, lng: 82.23, band: "low", use: "agricultural" },
  { name: "Darshan Nagar", nameHi: "दर्शन नगर", tehsil: "Sadar", lat: 26.74, lng: 82.24, band: "low", use: "residential" },
  { name: "Bhadarsa Road", nameHi: "भदरसा रोड", tehsil: "Sadar", lat: 26.72, lng: 82.25, band: "low", use: "agricultural" },
  { name: "Rudauli Road", nameHi: "रुदौली रोड", tehsil: "Sohawal", lat: 26.775, lng: 82.09, band: "low", use: "agricultural" },
  { name: "Kumarganj Road", nameHi: "कुमारगंज रोड", tehsil: "Bikapur", lat: 26.7, lng: 82.18, band: "low", use: "agricultural" },
];

const LUCKNOW: Seed[] = [
  { name: "Gomti Nagar", nameHi: "गोमती नगर", tehsil: "Sadar", lat: 26.85, lng: 81.0, band: "premium", use: "residential" },
  { name: "Gomti Nagar Extension", nameHi: "गोमती नगर एक्सटेंशन", tehsil: "Sadar", lat: 26.85, lng: 81.04, band: "high", use: "residential" },
  { name: "Sultanpur Road", nameHi: "सुल्तानपुर रोड", tehsil: "Mohanlalganj", lat: 26.79, lng: 81.01, band: "high", use: "residential" },
  { name: "Shaheed Path", nameHi: "शहीद पथ", tehsil: "Sadar", lat: 26.815, lng: 81.0, band: "premium", use: "mixed" },
  { name: "Raebareli Road", nameHi: "रायबरेली रोड", tehsil: "Mohanlalganj", lat: 26.78, lng: 80.95, band: "mid", use: "residential" },
  { name: "Kanpur Road", nameHi: "कानपुर रोड", tehsil: "Sarojini Nagar", lat: 26.8, lng: 80.89, band: "mid", use: "mixed" },
  { name: "Mohan Road", nameHi: "मोहान रोड", tehsil: "Sadar", lat: 26.84, lng: 80.85, band: "low", use: "residential" },
  { name: "Deva Road", nameHi: "देवा रोड", tehsil: "Sadar", lat: 26.88, lng: 81.05, band: "mid", use: "residential" },
  { id: "faizabad-road-chinhat", name: "Faizabad Road (Chinhat)", nameHi: "फैजाबाद रोड (चिनहट)", tehsil: "Sadar", lat: 26.88, lng: 81.02, band: "high", use: "mixed" },
  { name: "Sitapur Road", nameHi: "सीतापुर रोड", tehsil: "Sadar", lat: 26.92, lng: 80.94, band: "mid", use: "residential" },
  { name: "Hardoi Road", nameHi: "हरदोई रोड", tehsil: "Sadar", lat: 26.89, lng: 80.88, band: "low", use: "residential" },
  { name: "Kursi Road", nameHi: "कुर्सी रोड", tehsil: "Bakshi Ka Talab", lat: 26.93, lng: 80.98, band: "mid", use: "residential" },
  { name: "IIM Road", nameHi: "आईआईएम रोड", tehsil: "Sadar", lat: 26.93, lng: 80.91, band: "mid", use: "residential" },
  { id: "amausi-airport", name: "Amausi / Airport", nameHi: "अमौसी / एयरपोर्ट", tehsil: "Sarojini Nagar", lat: 26.77, lng: 80.89, band: "high", use: "commercial" },
  { name: "Sushant Golf City", nameHi: "सुशांत गोल्फ़ सिटी", tehsil: "Mohanlalganj", lat: 26.78, lng: 81.02, band: "premium", use: "residential" },
  { name: "Vrindavan Yojana", nameHi: "वृंदावन योजना", tehsil: "Mohanlalganj", lat: 26.77, lng: 80.96, band: "high", use: "residential" },
  { name: "Jankipuram", nameHi: "जानकीपुरम", tehsil: "Sadar", lat: 26.91, lng: 80.95, band: "high", use: "residential" },
  { name: "Aliganj", nameHi: "अलीगंज", tehsil: "Sadar", lat: 26.89, lng: 80.94, band: "premium", use: "residential" },
  { name: "Indira Nagar", nameHi: "इंदिरा नगर", tehsil: "Sadar", lat: 26.88, lng: 80.99, band: "premium", use: "residential" },
  { name: "Chinhat", nameHi: "चिनहट", tehsil: "Sadar", lat: 26.885, lng: 81.04, band: "mid", use: "mixed" },
  { name: "Malihabad Road", nameHi: "मलिहाबाद रोड", tehsil: "Malihabad", lat: 26.9, lng: 80.82, band: "low", use: "agricultural" },
  { name: "Dubagga", nameHi: "दुबग्गा", tehsil: "Sadar", lat: 26.87, lng: 80.86, band: "low", use: "mixed" },
  { name: "Bijnor Road", nameHi: "बिजनौर रोड", tehsil: "Sarojini Nagar", lat: 26.8, lng: 80.9, band: "mid", use: "residential" },
  { name: "Ashiyana", nameHi: "आशियाना", tehsil: "Sadar", lat: 26.8, lng: 80.93, band: "high", use: "residential" },
  { name: "Alambagh", nameHi: "आलमबाग", tehsil: "Sadar", lat: 26.82, lng: 80.91, band: "high", use: "commercial" },
  { name: "Mahanagar", nameHi: "महानगर", tehsil: "Sadar", lat: 26.87, lng: 80.96, band: "premium", use: "residential" },
  { name: "Hazratganj", nameHi: "हज़रतगंज", tehsil: "Sadar", lat: 26.85, lng: 80.945, band: "premium", use: "commercial" },
  { name: "Gomti Nagar Vibhuti Khand", nameHi: "गोमती नगर विभूति खंड", tehsil: "Sadar", lat: 26.86, lng: 81.01, band: "premium", use: "commercial" },
  { name: "Gomti Nagar Vipul Khand", nameHi: "गोमती नगर विपुल खंड", tehsil: "Sadar", lat: 26.845, lng: 81.01, band: "premium", use: "residential" },
  { name: "Vikas Nagar", nameHi: "विकास नगर", tehsil: "Sadar", lat: 26.9, lng: 80.96, band: "high", use: "residential" },
  { name: "Telibagh", nameHi: "तेलीबाग", tehsil: "Mohanlalganj", lat: 26.79, lng: 80.96, band: "mid", use: "residential" },
  { name: "Bangla Bazar", nameHi: "बंगला बाज़ार", tehsil: "Sadar", lat: 26.8, lng: 80.945, band: "mid", use: "mixed" },
  { name: "Sarojini Nagar", nameHi: "सरोजिनी नगर", tehsil: "Sarojini Nagar", lat: 26.78, lng: 80.88, band: "mid", use: "mixed" },
  { name: "Bakshi Ka Talab", nameHi: "बख़्शी का तालाब", tehsil: "Bakshi Ka Talab", lat: 26.99, lng: 80.92, band: "low", use: "agricultural" },
  { name: "Itaunja", nameHi: "इटौंजा", tehsil: "Bakshi Ka Talab", lat: 27.04, lng: 80.9, band: "low", use: "agricultural" },
  { name: "Kakori", nameHi: "काकोरी", tehsil: "Malihabad", lat: 26.87, lng: 80.78, band: "low", use: "agricultural" },
];

const GORAKHPUR: Seed[] = [
  { name: "Medical College Road", nameHi: "मेडिकल कॉलेज रोड", tehsil: "Sadar", lat: 26.77, lng: 83.4, band: "high", use: "mixed" },
  { id: "kunraghat-aiims", name: "Kunraghat / AIIMS", nameHi: "कुनराघाट / एम्स", tehsil: "Sadar", lat: 26.73, lng: 83.43, band: "high", use: "residential" },
  { name: "Taramandal", nameHi: "तारामंडल", tehsil: "Sadar", lat: 26.74, lng: 83.39, band: "premium", use: "residential" },
  { id: "gida", name: "GIDA", nameHi: "गीडा", tehsil: "Sahjanwa", lat: 26.74, lng: 83.25, band: "mid", use: "industrial" },
  { name: "Deoria Road", nameHi: "देवरिया रोड", tehsil: "Sadar", lat: 26.72, lng: 83.42, band: "mid", use: "residential" },
  { name: "Kushinagar Road", nameHi: "कुशीनगर रोड", tehsil: "Sadar", lat: 26.77, lng: 83.45, band: "mid", use: "mixed" },
  { name: "Nausadh", nameHi: "नौसढ़", tehsil: "Sadar", lat: 26.72, lng: 83.36, band: "mid", use: "commercial" },
  { name: "Rustampur", nameHi: "रुस्तमपुर", tehsil: "Sadar", lat: 26.735, lng: 83.375, band: "high", use: "residential" },
  { name: "Mohaddipur", nameHi: "मोहद्दीपुर", tehsil: "Sadar", lat: 26.755, lng: 83.4, band: "high", use: "mixed" },
  { name: "Gorakhnath", nameHi: "गोरखनाथ", tehsil: "Sadar", lat: 26.79, lng: 83.36, band: "high", use: "mixed" },
  { name: "Padri Bazar", nameHi: "पादरी बाज़ार", tehsil: "Sadar", lat: 26.8, lng: 83.38, band: "mid", use: "residential" },
  { name: "Shahpur", nameHi: "शाहपुर", tehsil: "Sadar", lat: 26.77, lng: 83.37, band: "high", use: "residential" },
  { name: "Basharatpur", nameHi: "बशारतपुर", tehsil: "Sadar", lat: 26.78, lng: 83.385, band: "mid", use: "residential" },
  { name: "Gulariha", nameHi: "गुलरिहा", tehsil: "Sadar", lat: 26.8, lng: 83.4, band: "mid", use: "residential" },
  { name: "Rapti Nagar", nameHi: "राप्ती नगर", tehsil: "Sadar", lat: 26.79, lng: 83.41, band: "mid", use: "residential" },
  { name: "Jhungia", nameHi: "झुंगिया", tehsil: "Sadar", lat: 26.81, lng: 83.34, band: "low", use: "residential" },
  { id: "hurl-fertilizer-belt", name: "HURL Fertilizer belt", nameHi: "एचयूआरएल खाद कारखाना क्षेत्र", tehsil: "Sadar", lat: 26.82, lng: 83.36, band: "mid", use: "industrial" },
  { name: "Maharajganj Road", nameHi: "महराजगंज रोड", tehsil: "Sadar", lat: 26.83, lng: 83.38, band: "low", use: "residential" },
  { name: "Sahjanwa", nameHi: "सहजनवा", tehsil: "Sahjanwa", lat: 26.75, lng: 83.19, band: "low", use: "agricultural" },
  { name: "Ramgarh Tal", nameHi: "रामगढ़ ताल", tehsil: "Sadar", lat: 26.745, lng: 83.4, band: "premium", use: "commercial" },
  { id: "jungle-kaudia-airport", name: "Jungle Kaudia / Airport", nameHi: "जंगल कौड़िया / एयरपोर्ट", tehsil: "Sadar", lat: 26.74, lng: 83.44, band: "mid", use: "mixed" },
  { name: "Khorabar", nameHi: "खोराबार", tehsil: "Sadar", lat: 26.72, lng: 83.45, band: "mid", use: "residential" },
  { name: "Bargadwa", nameHi: "बरगदवा", tehsil: "Sadar", lat: 26.79, lng: 83.32, band: "low", use: "industrial" },
  { name: "Sonbarsa", nameHi: "सोनबरसा", tehsil: "Sadar", lat: 26.7, lng: 83.33, band: "low", use: "agricultural" },
  { name: "Chargawan", nameHi: "चरगावाँ", tehsil: "Sadar", lat: 26.78, lng: 83.3, band: "low", use: "agricultural" },
];

const BAND = {
  low: { res: 6000, com: 12000, agri: 2500000, ask: [1500, 3500] },
  mid: { res: 12000, com: 24000, agri: 4500000, ask: [4500, 9000] },
  high: { res: 18000, com: 36000, agri: 6000000, ask: [7000, 13000] },
  premium: { res: 30000, com: 60000, agri: 9000000, ask: [12000, 25000] },
} as const;

const USE_HI: Record<Use, string> = {
  residential: "रिहायशी",
  commercial: "व्यावसायिक",
  mixed: "मिश्रित",
  agricultural: "कृषि",
  industrial: "औद्योगिक",
  institutional: "संस्थागत",
};

const cities = [
  {
    id: "lucknow",
    name: "Lucknow",
    nameHi: "लखनऊ",
    district: "Lucknow",
    state: "UP",
    lat: 26.8467,
    lng: 80.9462,
    intro:
      "Lucknow's land market runs on three corridors: Sultanpur Road and Shaheed Path to the south-east where the townships and the outer ring road are, Kanpur Road towards the airport, and Sitapur and Kursi Road to the north. Prices inside the ring road are set by LDA and Awas Vikas schemes; outside it, by how close a plot sits to an expressway junction.",
    introHi:
      "लखनऊ का ज़मीन बाज़ार तीन गलियारों पर चलता है: दक्षिण-पूर्व में सुल्तानपुर रोड और शहीद पथ जहाँ टाउनशिप और आउटर रिंग रोड हैं, एयरपोर्ट की ओर कानपुर रोड, और उत्तर में सीतापुर और कुर्सी रोड। रिंग रोड के अंदर दाम एलडीए और आवास विकास की योजनाएँ तय करती हैं; बाहर, एक्सप्रेसवे के जंक्शन से दूरी।",
    anchors: [
      { id: "shaheed-path", name: "Shaheed Path", nameHi: "शहीद पथ", lat: 26.815, lng: 81.005 },
      { id: "airport", name: "Chaudhary Charan Singh International Airport", nameHi: "चौधरी चरण सिंह अंतरराष्ट्रीय हवाई अड्डा", lat: 26.7606, lng: 80.8893 },
      { id: "charbagh", name: "Charbagh Railway Station", nameHi: "चारबाग़ रेलवे स्टेशन", lat: 26.832, lng: 80.9216 },
      { id: "gomti-nagar", name: "Gomti Nagar", nameHi: "गोमती नगर", lat: 26.85, lng: 81.0 },
      { id: "outer-ring-road", name: "Outer Ring Road", nameHi: "आउटर रिंग रोड", lat: 26.95, lng: 81.05 },
    ],
  },
  {
    id: "gorakhpur",
    name: "Gorakhpur",
    nameHi: "गोरखपुर",
    district: "Gorakhpur",
    state: "UP",
    lat: 26.7606,
    lng: 83.3732,
    intro:
      "Gorakhpur's demand is anchored by three institutions: AIIMS on the Kunraghat side, the HURL fertilizer plant to the north and GIDA's industrial estate towards Sahjanwa. The Gorakhpur Link Expressway and the airport have pulled buyers to the east and south-east; the old city and Medical College Road hold the commercial premium.",
    introHi:
      "गोरखपुर की माँग तीन संस्थानों से जुड़ी है: कुनराघाट की ओर एम्स, उत्तर में एचयूआरएल खाद कारखाना और सहजनवा की ओर गीडा का औद्योगिक क्षेत्र। गोरखपुर लिंक एक्सप्रेसवे और एयरपोर्ट ने ख़रीदारों को पूर्व और दक्षिण-पूर्व खींचा है; पुराना शहर और मेडिकल कॉलेज रोड व्यावसायिक प्रीमियम रखते हैं।",
    anchors: [
      { id: "aiims", name: "AIIMS Gorakhpur", nameHi: "एम्स गोरखपुर", lat: 26.7305, lng: 83.43 },
      { id: "airport", name: "Gorakhpur Airport", nameHi: "गोरखपुर हवाई अड्डा", lat: 26.7397, lng: 83.4497 },
      { id: "railway-station", name: "Gorakhpur Junction", nameHi: "गोरखपुर जंक्शन", lat: 26.7588, lng: 83.381 },
      { id: "fertilizer-belt", name: "HURL Fertilizer belt", nameHi: "एचयूआरएल खाद कारखाना क्षेत्र", lat: 26.82, lng: 83.36 },
      { id: "nh-28", name: "NH-28 (Lucknow–Gorakhpur)", nameHi: "एनएच-28 (लखनऊ–गोरखपुर)", lat: 26.745, lng: 83.3 },
    ],
  },
];

type Project = {
  id: string;
  cityId: string;
  name: string;
  nameHi: string;
  agency: string;
  agencyName?: string;
  affected: string[];
};

const projects: Project[] = [
  { id: "ayodhya-master-plan-2031", cityId: "ayodhya", name: "Ayodhya Master Plan 2031", nameHi: "अयोध्या मास्टर प्लान 2031", agency: "ADA", affected: ["faizabad-road", "ram-path", "airport-road"] },
  { id: "ayodhya-greenfield-township", cityId: "ayodhya", name: "Ayodhya Greenfield Township", nameHi: "अयोध्या ग्रीनफ़ील्ड टाउनशिप", agency: "ADA", affected: ["airport-road", "masodha", "barun-bypass"] },
  { id: "84-kosi-parikrama-marg", cityId: "ayodhya", name: "84 Kosi Parikrama Marg", nameHi: "84 कोसी परिक्रमा मार्ग", agency: "NHAI", affected: ["gosaiganj", "rudauli-road", "kumarganj-road"] },
  { id: "14-kosi-parikrama-marg", cityId: "ayodhya", name: "14 Kosi Parikrama Marg", nameHi: "14 कोसी परिक्रमा मार्ग", agency: "other", agencyName: "UP PWD", affected: ["naya-ghat", "mahobra", "darshan-nagar"] },
  { id: "ayodhya-ring-road", cityId: "ayodhya", name: "Ayodhya Ring Road", nameHi: "अयोध्या रिंग रोड", agency: "NHAI", affected: ["sohawal", "masodha", "bhadarsa-road"] },
  { id: "awas-vikas-ayodhya-scheme", cityId: "ayodhya", name: "Awas Vikas Ayodhya Scheme", nameHi: "आवास विकास अयोध्या योजना", agency: "other", agencyName: "UP Awas Evam Vikas Parishad", affected: ["lucknow-road", "sohawal"] },
  { id: "lda-plot-schemes", cityId: "lucknow", name: "LDA Plot Schemes", nameHi: "एलडीए प्लॉट योजनाएँ", agency: "LDA", affected: ["sultanpur-road", "mohan-road", "kanpur-road"] },
  { id: "awas-vikas-lucknow-schemes", cityId: "lucknow", name: "Awas Vikas Lucknow Schemes", nameHi: "आवास विकास लखनऊ योजनाएँ", agency: "other", agencyName: "UP Awas Evam Vikas Parishad", affected: ["vrindavan-yojana", "raebareli-road"] },
  { id: "lucknow-outer-ring-road", cityId: "lucknow", name: "Lucknow Outer Ring Road", nameHi: "लखनऊ आउटर रिंग रोड", agency: "NHAI", affected: ["kursi-road", "sitapur-road", "sultanpur-road"] },
  { id: "shaheed-path-extension", cityId: "lucknow", name: "Shaheed Path Extension", nameHi: "शहीद पथ विस्तार", agency: "other", agencyName: "UP PWD", affected: ["shaheed-path", "sushant-golf-city"] },
  { id: "lucknow-kanpur-expressway", cityId: "lucknow", name: "Lucknow–Kanpur Expressway", nameHi: "लखनऊ–कानपुर एक्सप्रेसवे", agency: "NHAI", affected: ["kanpur-road", "amausi-airport", "sarojini-nagar"] },
  { id: "gda-plot-schemes", cityId: "gorakhpur", name: "GDA Plot Schemes", nameHi: "जीडीए प्लॉट योजनाएँ", agency: "GDA", affected: ["taramandal", "rapti-nagar", "khorabar"] },
  { id: "gida-expansion", cityId: "gorakhpur", name: "GIDA Expansion", nameHi: "गीडा विस्तार", agency: "other", agencyName: "Gorakhpur Industrial Development Authority", affected: ["gida", "sahjanwa"] },
  { id: "gorakhpur-link-expressway", cityId: "gorakhpur", name: "Gorakhpur Link Expressway", nameHi: "गोरखपुर लिंक एक्सप्रेसवे", agency: "UPEIDA", affected: ["jungle-kaudia-airport", "khorabar", "sahjanwa"] },
  { id: "aiims-corridor", cityId: "gorakhpur", name: "AIIMS Corridor", nameHi: "एम्स कॉरिडोर", agency: "GDA", affected: ["kunraghat-aiims", "deoria-road"] },
  { id: "hurl-fertilizer-plant", cityId: "gorakhpur", name: "HURL Fertilizer Plant", nameHi: "एचयूआरएल खाद कारखाना", agency: "other", agencyName: "Hindustan Urvarak & Rasayan Ltd", affected: ["hurl-fertilizer-belt", "jhungia", "maharajganj-road"] },
];

/* --------------------------------------------------------------- builders */

const placeholderSource = [{ label: "IGRSUP portal (placeholder source, replace with the schedule PDF)", url: SRC, accessedAt: TODAY }];

function locality(seed: Seed, cityId: string, cityName: string, cityNameHi: string) {
  const id = seed.id ?? slugify(seed.name);
  const b = BAND[seed.band];
  return {
    id,
    cityId,
    parentLocalityId: null,
    status: "draft",
    name: seed.name,
    nameHi: seed.nameHi,
    tehsil: seed.tehsil,
    lat: seed.lat,
    lng: seed.lng,
    priceBand: seed.band,
    askingRange: { low: b.ask[0], high: b.ask[1], unit: "sqft", asOf: "2026-09-01" },
    circleRate: { residential: b.res, commercial: b.com, agricultural: b.agri, unit: "sqm|hectare", effectiveFrom: EFFECTIVE, sourceUrl: SRC },
    landUse: seed.use,
    landUseSource: "PLACEHOLDER: master plan reference to be confirmed",
    narrative: {
      drivers: [
        `PLACEHOLDER (draft): ${seed.name} is a ${seed.use} locality in ${seed.tehsil} tehsil, ${cityName}. The circle rate, asking range and land use shown here are seed values by price band, not sourced figures. This page is not indexed until the record is upgraded to live with the IGRSUP schedule and the broker's observations.`,
      ],
      driversHi: [
        `प्लेसहोल्डर (ड्राफ़्ट): ${seed.nameHi}, ${cityNameHi} की ${seed.tehsil} तहसील का ${USE_HI[seed.use]} इलाक़ा है। यहाँ दिखाए गए सर्किल रेट, माँगा जा रहा दाम और भू-उपयोग दाम श्रेणी के अनुसार नमूना मान हैं, स्रोत से लिए आँकड़े नहीं। आईजीआरएसयूपी सूची और ब्रोकर के अवलोकन के साथ रिकॉर्ड लाइव होने तक यह पेज इंडेक्स नहीं होता।`,
      ],
    },
    fit: {
      residential: { rating: "mixed", reason: "PLACEHOLDER: fit to be assessed by the broker", reasonHi: "प्लेसहोल्डर: ब्रोकर द्वारा आकलन बाक़ी" },
      commercial: { rating: "mixed", reason: "PLACEHOLDER: fit to be assessed by the broker", reasonHi: "प्लेसहोल्डर: ब्रोकर द्वारा आकलन बाक़ी" },
      investment: { rating: "mixed", reason: "PLACEHOLDER: fit to be assessed by the broker", reasonHi: "प्लेसहोल्डर: ब्रोकर द्वारा आकलन बाक़ी" },
    },
    sources: placeholderSource,
    updatedAt: TODAY,
    todo: [
      "Draft seed record: name, tehsil and approximate coordinates only; circle rate, asking range, land use, narrative and fit are placeholders by price band",
      "Upgrade status to live only with the parsed IGRSUP row, ADA/LDA/GDA land use, drive times and the broker's own narrative in both languages",
    ],
  };
}

function project(p: Project) {
  return {
    id: p.id,
    cityId: p.cityId,
    name: p.name,
    nameHi: p.nameHi,
    agency: p.agency,
    ...(p.agencyName ? { agencyName: p.agencyName } : {}),
    status: "announced",
    budgetCr: null,
    announcedOn: null,
    expectedCompletion: null,
    extent: null,
    description: [
      `PLACEHOLDER (TODO): ${p.name} is tracked here for its effect on land in the listed localities. Status, budget, dates, extent and the plain-language description are to be filled from the agency's notification before this record is treated as sourced.`,
    ],
    descriptionHi: [`प्लेसहोल्डर (TODO): ${p.nameHi} को सूचीबद्ध इलाक़ों की ज़मीन पर असर के लिए यहाँ ट्रैक किया जा रहा है। स्थिति, बजट, तारीख़ें, विस्तार और सरल भाषा में विवरण एजेंसी की अधिसूचना से भरे जाने हैं।`],
    geometry: null,
    affectedLocalityIds: p.affected,
    impacts: p.affected.map((localityId) => ({ localityId, level: "moderate", reason: "PLACEHOLDER: effect to be assessed", reasonHi: "प्लेसहोल्डर: असर का आकलन बाक़ी" })),
    milestones: [],
    sources: [{ label: "PLACEHOLDER: agency notification to be linked", url: "https://up.gov.in/", accessedAt: TODAY }],
    updatedAt: TODAY,
    todo: ["Seed record: status, budget, announced date, expected completion, extent, geometry, milestones and description are placeholders marked TODO; confirm from the agency's notification"],
  };
}

function schedule(cityId: string, cityName: string, rows: { localityId: string; tehsil: string; band: Band }[]) {
  return {
    id: `${cityId}-${EFFECTIVE}`,
    cityId,
    effectiveFrom: EFFECTIVE,
    sourceUrl: SRC,
    archiveUrl: null,
    units: { residential: "sqm", commercial: "sqm", agricultural: "hectare" },
    rates: rows.map((r) => ({
      localityId: r.localityId,
      tehsil: r.tehsil,
      residential: BAND[r.band].res,
      commercial: BAND[r.band].com,
      agricultural: BAND[r.band].agri,
      effectiveFrom: EFFECTIVE,
      sourceUrl: SRC,
    })),
    sources: [{ label: `IGRSUP circle rate schedule, ${cityName} (TODO: link the PDF)`, url: SRC, accessedAt: TODAY }],
    updatedAt: TODAY,
    todo: [`Seed schedule: every row is a placeholder by price band; replace with output of scripts/parse-circle-rates.ts on the real ${cityName} PDF (sourceUrl is TODO)`, "Upload the schedule PDF to R2 and set archiveUrl"],
  };
}

/* ------------------------------------------------------------------ main */

type AnyRecord = { id: string; [k: string]: unknown };
const dataDir = path.join(process.cwd(), "data");
const read = <T,>(f: string): T => JSON.parse(fs.readFileSync(path.join(dataDir, f), "utf8")) as T;
const write = (f: string, v: unknown) => fs.writeFileSync(path.join(dataDir, f), `${JSON.stringify(v, null, 2)}\n`);

const citiesJson = read<AnyRecord[]>("cities.json");
const localitiesJson = read<AnyRecord[]>("localities.json");
const projectsJson = read<AnyRecord[]>("projects.json");
type RateRow = { localityId: string; [k: string]: unknown };
const schedulesJson = read<(AnyRecord & { cityId: string; effectiveFrom: string; rates: RateRow[] })[]>("circleRates.json");

const added = { cities: 0, localities: 0, projects: 0, schedules: 0, rows: 0 };

for (const c of cities) {
  if (citiesJson.some((x) => x.id === c.id)) continue;
  citiesJson.push({
    ...c,
    brokerNote: "TODO: broker note in the broker's own words",
    brokerNoteHi: "TODO: ब्रोकर की बात, हिंदी किसी व्यक्ति द्वारा",
    brokerNoteDate: TODAY,
    sources: [{ label: `District ${c.name}, Government of Uttar Pradesh`, url: `https://${c.id}.nic.in/`, accessedAt: TODAY }],
    updatedAt: TODAY,
    todo: ["Seed record: verify anchor coordinates; intro is editorial draft, brokerNote is a TODO placeholder"],
  });
  added.cities++;
}

const cityNames: Record<string, { name: string; nameHi: string }> = { ayodhya: { name: "Ayodhya", nameHi: "अयोध्या" } };
for (const c of cities) cityNames[c.id] = { name: c.name, nameHi: c.nameHi };

// Existing records without a status are the hand-written live ones.
for (const l of localitiesJson) if (!("status" in l)) l.status = "live";

const seedsByCity: Record<string, Seed[]> = { ayodhya: AYODHYA, lucknow: LUCKNOW, gorakhpur: GORAKHPUR };
for (const [cityId, seeds] of Object.entries(seedsByCity)) {
  for (const s of seeds) {
    const id = s.id ?? slugify(s.name);
    if (localitiesJson.some((x) => x.id === id)) continue;
    localitiesJson.push(locality(s, cityId, cityNames[cityId].name, cityNames[cityId].nameHi));
    added.localities++;
  }
}

for (const p of projects) {
  if (projectsJson.some((x) => x.id === p.id)) continue;
  projectsJson.push(project(p));
  added.projects++;
}

for (const [cityId, seeds] of Object.entries(seedsByCity)) {
  const rows = seeds.map((s) => ({ localityId: s.id ?? slugify(s.name), tehsil: s.tehsil, band: s.band }));
  const existing = schedulesJson.find((x) => x.cityId === cityId);
  if (existing) {
    const have = new Set(existing.rates.map((r) => r.localityId));
    for (const r of rows) {
      if (have.has(r.localityId)) continue;
      existing.rates.push({ localityId: r.localityId, tehsil: r.tehsil, residential: BAND[r.band].res, commercial: BAND[r.band].com, agricultural: BAND[r.band].agri, effectiveFrom: existing.effectiveFrom, sourceUrl: SRC });
      added.rows++;
    }
  } else {
    schedulesJson.push(schedule(cityId, cityNames[cityId].name, rows));
    added.schedules++;
    added.rows += rows.length;
  }
}

write("cities.json", citiesJson);
write("localities.json", localitiesJson);
write("projects.json", projectsJson);
write("circleRates.json", schedulesJson);
console.log(`ok   seeded: +${added.cities} cities, +${added.localities} localities, +${added.projects} projects, +${added.schedules} schedules, +${added.rows} rate rows`);
for (const cityId of Object.keys(seedsByCity)) {
  const ls = localitiesJson.filter((l) => l.cityId === cityId);
  console.log(`     ${cityId}: ${ls.length} localities (${ls.filter((l) => l.status === "live").length} live, ${ls.filter((l) => l.status === "draft").length} draft), ${projectsJson.filter((p) => p.cityId === cityId).length} projects`);
}

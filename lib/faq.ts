/**
 * Q&As generated from records at build (spec Template 3 section 11, Template 5 section 6).
 * The FAQ component renders these and emits FAQPage JSON-LD from the same array. Questions are written per
 * language, not translated, and only asked when the record has the answer.
 */
import type { FAQItem } from "@/components/FAQ";
import { formatDate, formatNumber, pick, type Locale } from "./i18n";
import { hasSourcedLandUse } from "./guards";
import { fitRatingLabels, landUseLabels } from "./labels";
import type { Anchor, City, CircleRateSchedule, Locality } from "./schemas";

export function localityFaq(
  l: Locality,
  city: City,
  locale: Locale,
  distances: { anchor: Anchor; km: number; driveMin?: number }[],
): FAQItem[] {
  const name = pick(locale, l.name, l.nameHi);
  const cityName = pick(locale, city.name, city.nameHi);
  const items: FAQItem[] = [];

  if (l.circleRate) {
    const r = l.circleRate;
    items.push(
      locale === "hi"
        ? {
            q: `${name} में सर्किल रेट क्या है?`,
            a: `${formatDate(r.effectiveFrom, "hi")} से लागू सूची के अनुसार ${name} में रिहायशी ज़मीन का सर्किल रेट ₹${formatNumber(r.residential)} प्रति वर्ग मीटर, व्यावसायिक ₹${formatNumber(r.commercial)} प्रति वर्ग मीटर और कृषि ₹${formatNumber(r.agricultural)} प्रति हेक्टेयर है।`,
          }
        : {
            q: `What is the circle rate in ${name}?`,
            a: `Under the schedule effective ${formatDate(r.effectiveFrom, "en")}, the circle rate in ${name} is ₹${formatNumber(r.residential)} per sq m for residential land, ₹${formatNumber(r.commercial)} per sq m commercial and ₹${formatNumber(r.agricultural)} per hectare agricultural.`,
          },
    );
  }

  if (l.askingRange) {
    const a = l.askingRange;
    items.push(
      locale === "hi"
        ? {
            q: `${name} में प्लॉट का बाज़ार भाव क्या चल रहा है?`,
            a: `${formatDate(a.asOf, "hi")} तक ${name} में माँगा जा रहा दाम ₹${formatNumber(a.low)} से ₹${formatNumber(a.high)} प्रति वर्ग फ़ुट के बीच है। सड़क से लगे प्लॉट ऊपरी छोर पर होते हैं।`,
          }
        : {
            q: `What do plots in ${name} sell for?`,
            a: `As of ${formatDate(a.asOf, "en")}, asking prices in ${name} run from ₹${formatNumber(a.low)} to ₹${formatNumber(a.high)} per sq ft. Road-facing plots sit at the top of that range.`,
          },
    );
  }

  const first = distances[0];
  if (first) {
    const anchor = pick(locale, first.anchor.name, first.anchor.nameHi);
    const drive =
      first.driveMin !== undefined
        ? locale === "hi"
          ? `, गाड़ी से लगभग ${first.driveMin} मिनट`
          : `, about ${first.driveMin} minutes by road`
        : "";
    items.push(
      locale === "hi"
        ? { q: `${name} से ${anchor} कितनी दूर है?`, a: `${name} से ${anchor} सीधी दूरी लगभग ${first.km} किमी है${drive}।` }
        : { q: `How far is ${name} from ${anchor}?`, a: `${anchor} is about ${first.km} km from ${name} in a straight line${drive}.` },
    );
  }

  // Only when a master plan backs it; an unsourced use is neither asked nor answered.
  if (hasSourcedLandUse(l)) {
    const use = landUseLabels[l.landUse!][locale];
    const src = l.landUseSource ? (locale === "hi" ? ` (${l.landUseSource} के अनुसार)` : ` (per ${l.landUseSource})`) : "";
    items.push(
      locale === "hi"
        ? {
            q: `${name} में मास्टर प्लान के अनुसार भू-उपयोग क्या है?`,
            a: `${name} का भू-उपयोग ${use} दर्ज है${src}। ख़रीदने से पहले अपने प्लॉट के खसरा नंबर पर इसे ज़रूर मिलाएँ।`,
          }
        : {
            q: `What is the master-plan land use in ${name}?`,
            a: `${name} is recorded as ${use.toLowerCase()}${src}. Check it against your plot's khasra number before paying anything.`,
          },
    );
  }

  // This entry answers for investment and for living in, so it needs both. A commercial-only fit
  // block has no question to ask here and the FAQ simply omits it (BUILD-SPEC: an empty field
  // means an omitted section, never a "not available" row).
  if (l.fit?.investment && l.fit?.residential) {
    const inv = l.fit.investment;
    const res = l.fit.residential;
    items.push(
      locale === "hi"
        ? {
            q: `क्या ${name} निवेश के लिए ठीक है?`,
            a: `निवेश के लिए ${fitRatingLabels[inv.rating].hi}: ${pick("hi", inv.reason, inv.reasonHi)} घर बनाने के लिए ${fitRatingLabels[res.rating].hi}: ${pick("hi", res.reason, res.reasonHi)}`,
          }
        : {
            q: `Is ${name} a good place to invest in land?`,
            a: `For investment: ${fitRatingLabels[inv.rating].en.toLowerCase()}. ${inv.reason}. For a house to live in: ${fitRatingLabels[res.rating].en.toLowerCase()}. ${res.reason}.`,
          },
    );
  }

  if (l.parentLocalityId === null && items.length < 6) {
    items.push(
      locale === "hi"
        ? {
            q: `${name}, ${cityName} में ज़मीन देखने के लिए किससे बात करें?`,
            a: `इस पेज के नीचे व्हाट्सऐप या कॉल बटन से यूपी रेरा पंजीकृत ब्रोकर से सीधे बात करें। पहले 15 मिनट की बातचीत, फिर लिखित शॉर्टलिस्ट।`,
          }
        : {
            q: `Who do I talk to about land in ${name}, ${cityName}?`,
            a: `Use the WhatsApp or call button at the end of this page to reach the UP RERA-registered broker directly. A 15-minute call first, then a written shortlist.`,
          },
    );
  }

  return items.slice(0, 6);
}

export function circleRateFaq(city: City, schedule: CircleRateSchedule, revisionCount: number, locale: Locale): FAQItem[] {
  const cityName = pick(locale, city.name, city.nameHi);
  const date = formatDate(schedule.effectiveFrom, locale);
  return locale === "hi"
    ? [
        {
          q: `${cityName} में सर्किल रेट कब से लागू है?`,
          a: `मौजूदा सूची ${date} से लागू है। इस पेज पर ${revisionCount} सूची दर्ज ${revisionCount === 1 ? "है" : "हैं"}; पुरानी सूचियाँ संशोधन इतिहास में हैं।`,
        },
        {
          q: "सर्किल रेट और बाज़ार भाव में क्या फ़र्क़ है?",
          a: "सर्किल रेट सरकार की तय न्यूनतम क़ीमत है जिस पर स्टाम्प ड्यूटी लगती है। बाज़ार भाव वह है जो ख़रीदार असल में देता है, और यह ऊपर या नीचे दोनों हो सकता है।",
        },
        {
          q: "स्टाम्प ड्यूटी किस रक़म पर लगती है?",
          a: "सर्किल मूल्य और सौदे की क़ीमत में जो ज़्यादा हो, उस पर। सौदा सर्किल रेट से कम दिखाने से ड्यूटी कम नहीं होती।",
        },
        {
          q: "उत्तर प्रदेश में सर्किल रेट कितनी बार बदलता है?",
          a: "आम तौर पर हर ज़िले में साल में एक बार, ज़िला कलेक्टर की अधिसूचना से। हर संशोधन यहाँ नई सूची के रूप में जुड़ता है।",
        },
      ]
    : [
        {
          q: `When did the current circle rates in ${cityName} take effect?`,
          a: `The current schedule is effective from ${date}. This page holds ${revisionCount} schedule${revisionCount === 1 ? "" : "s"}; earlier ones are in the revision history.`,
        },
        {
          q: "What is the difference between circle rate and market rate?",
          a: "The circle rate is the government's minimum value for stamp duty. The market rate is what buyers actually pay, which can sit above or below it.",
        },
        {
          q: "Which value is stamp duty charged on?",
          a: "The higher of the circle value and the agreed price. Under-declaring the sale price below the circle rate does not reduce the duty.",
        },
        {
          q: "How often does Uttar Pradesh revise circle rates?",
          a: "Usually once a year per district, by notification of the District Collector. Each revision is added here as a new schedule.",
        },
      ];
}

/**
 * City hub Q&As (FAQPage on every city page). Only questions the record can answer are asked: the
 * circle-rate and coverage answers depend on what is published for that city, so a city with no
 * rate page never claims one. The checks and contact answers are the same for every city.
 */
export function cityFaq(
  city: City,
  locale: Locale,
  data: { localityNames: string[]; villageCount: number; sroCount: number; effectiveFrom?: string; hasRatesPage: boolean; phone: string; email: string },
): FAQItem[] {
  const name = pick(locale, city.name, city.nameHi);
  const hi = locale === "hi";
  const items: FAQItem[] = [];

  if (data.hasRatesPage) {
    items.push(
      hi
        ? {
            q: `${name} में सर्किल रेट कहाँ देखें?`,
            a: `AwadhLand के ${name} सर्किल रेट पेज पर ज़िले के प्रकाशित रेट हर एक के स्रोत और तारीख़ के साथ मिलते हैं${data.effectiveFrom ? ` (लागू: ${formatDate(data.effectiveFrom, "hi")})` : ""}। किसी गाँव या इलाक़े का रेट सीधे खोजने के लिए सर्किल रेट लुकअप भी है।`,
          }
        : {
            q: `Where can I check circle rates in ${name}?`,
            a: `AwadhLand's ${name} circle rate page lists the rates published for the district, each with its source and date${data.effectiveFrom ? `, effective ${formatDate(data.effectiveFrom, "en")}` : ""}. You can also search a village or locality directly in the circle rate lookup.`,
          },
    );
  }

  if (data.localityNames.length > 0) {
    const sample = data.localityNames.slice(0, 3).join(", ");
    items.push(
      hi
        ? { q: `AwadhLand ${name} के किन इलाक़ों को कवर करता है?`, a: `${name} के ${formatNumber(data.localityNames.length)} इलाक़ों के पेज हैं, जैसे ${sample}। हर इलाक़े के पेज पर सर्किल रेट, दूरी और आसपास के सरकारी प्रोजेक्ट स्रोत और तारीख़ के साथ दिए हैं।` }
        : { q: `Which areas of ${name} does AwadhLand cover?`, a: `AwadhLand has pages for ${formatNumber(data.localityNames.length)} localities in ${name}, including ${sample}. Each locality page gives the circle rate, distances and nearby government projects, with sources and dates.` },
    );
  } else if (data.villageCount > 0) {
    items.push(
      hi
        ? { q: `AwadhLand ${name} में कितने गाँवों के सर्किल रेट देता है?`, a: `${name} के ${formatNumber(data.sroCount)} उप निबंधक कार्यालयों की सूचियों से ${formatNumber(data.villageCount)} गाँवों के सर्किल रेट, हर एक के स्रोत और तारीख़ के साथ।` }
        : { q: `How many villages in ${name} does AwadhLand list circle rates for?`, a: `${formatNumber(data.villageCount)} villages across ${formatNumber(data.sroCount)} sub-registrar offices in ${name}, each rate with its source and date.` },
    );
  }

  items.push(
    hi
      ? {
          q: `${name} में ज़मीन ख़रीदने से पहले क्या जाँचना चाहिए?`,
          a: `टाइटल किसके नाम है, मास्टर प्लान में भू-उपयोग क्या है, सर्किल रेट और उसके हिसाब से स्टाम्प ड्यूटी, और रास्ता क़ानूनी है या नहीं। AwadhLand ये जाँचें आपके पैसा देने से पहले आपके साथ करता है।`,
        }
      : {
          q: `What should I check before buying land in ${name}?`,
          a: `Who holds the title, what the land use is on the master plan, the circle rate and the stamp duty that follows, and whether the road access is legal. AwadhLand runs these checks with you before you pay.`,
        },
    hi
      ? {
          q: `क्या NRI ${name} में AwadhLand की मदद से ज़मीन ख़रीद सकते हैं?`,
          a: `जी हाँ, NRI उन ख़रीदारों में हैं जिनकी हम मदद करते हैं। NRI कौन-सी ज़मीन ख़रीद सकता है, यह ज़मीन की श्रेणी और लागू नियमों पर निर्भर करता है, इसलिए हर प्लॉट के लिए हम यह पहले पक्का करते हैं।`,
        }
      : {
          q: `Can NRIs buy land in ${name} with AwadhLand's help?`,
          a: `Yes, NRIs are among the buyers we help. What an NRI may buy depends on the category of the land and the rules in force, so we confirm that for each plot first.`,
        },
    hi
      ? { q: `${name} की ज़मीन के बारे में AwadhLand से संपर्क कैसे करें?`, a: `${data.phone} पर कॉल या व्हाट्सऐप करें, या ${data.email} पर लिखें। हम व्हाट्सऐप पर एक घंटे के भीतर जवाब देते हैं।` }
      : { q: `How do I contact AwadhLand about land in ${name}?`, a: `Call or WhatsApp ${data.phone}, or write to ${data.email}. We reply on WhatsApp within the hour.` },
  );
  return items;
}

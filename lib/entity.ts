/**
 * What AwadhLand is, said once. The About page opens with this sentence, the Organization JSON-LD
 * carries it as `description`, and llms.txt quotes it, so a person, a search engine and an AI
 * assistant all read the same definition. The Hindi text is written for Hindi readers, not machine
 * translated; it should be read by the broker before it is treated as final.
 */
import type { Locale } from "./i18n";

export const BRAND_NAME = "AwadhLand";
export const BRAND_NAME_HI = "अवधलैंड";

export const entityDescription: Record<Locale, string> = {
  en: "AwadhLand is a land-buying advisory for Ayodhya, Lucknow and Gorakhpur in Uttar Pradesh, helping buyers from across India and NRIs find residential plots, commercial land, agricultural land and investment land, and check title, land use and circle rates before buying.",
  hi: "AwadhLand उत्तर प्रदेश के अयोध्या, लखनऊ और गोरखपुर के लिए एक ज़मीन-ख़रीद सलाहकार है, जो पूरे भारत के ख़रीदारों और NRI को रिहायशी प्लॉट, कमर्शियल ज़मीन, खेती की ज़मीन और निवेश की ज़मीन खोजने में मदद करता है, और ख़रीदने से पहले टाइटल, भू-उपयोग और सर्किल रेट की जाँच कराता है।",
};

/** Schema.org knowsAbout, per language. */
export const knowsAbout: Record<Locale, string[]> = {
  en: ["Land purchase in Uttar Pradesh", "Circle rates", "Ayodhya Master Plan 2031", "LDA schemes", "Stamp duty and registration in Uttar Pradesh"],
  hi: ["उत्तर प्रदेश में ज़मीन की ख़रीद", "सर्किल रेट", "अयोध्या मास्टर प्लान 2031", "LDA योजनाएँ", "उत्तर प्रदेश में स्टाम्प ड्यूटी और रजिस्ट्री"],
};

/** Body of the About page's opening block, after the one-sentence definition. `{phone}`, `{email}` and `{hours}` are filled from the broker record. */
export type AboutEntityCopy = {
  whatWeDoTitle: string;
  whatWeDo: string;
  citiesTitle: string;
  citiesNote: string;
  whoTitle: string;
  who: string;
  contactTitle: string;
  contact: string;
  hours: string;
  faqTitle: string;
  faq: { q: string; a: string }[];
};

export const aboutEntityCopy: Record<Locale, AboutEntityCopy> = {
  en: {
    whatWeDoTitle: "What we do",
    whatWeDo:
      "We help you shortlist land, then check the paperwork before you pay: who holds the title, what the land use is on the master plan, what the circle rate is and the stamp duty that follows, and whether the road access is real. The circle rates, asking prices and government projects we work from are published on this site, each with its source and the date it was last updated.",
    citiesTitle: "Cities we cover",
    citiesNote: "in Uttar Pradesh",
    whoTitle: "Who we help",
    who: "Buyers from across India and NRIs buying from abroad: families looking for a residential plot, businesses looking for commercial land, and investors looking for agricultural or investment land.",
    contactTitle: "How to contact us",
    contact: "Call or WhatsApp {phone}, or write to {email}.",
    hours: "{hours}. We reply on WhatsApp within the hour.",
    faqTitle: "About AwadhLand: common questions",
    faq: [
      { q: "What is AwadhLand?", a: "{definition}" },
      { q: "Which cities does AwadhLand cover?", a: "Ayodhya, Lucknow and Gorakhpur in Uttar Pradesh, in English and Hindi." },
      {
        q: "Can NRIs use AwadhLand to buy land in Uttar Pradesh?",
        a: "Yes. NRIs are among the buyers we help. We find land that suits the brief and check title, land use and circle rates before you commit. What an NRI may buy depends on the category of the land and the rules in force, so we confirm that with you for each plot.",
      },
      {
        q: "What does AwadhLand check before a purchase?",
        a: "Who holds the title, what the land use is on the master plan, the circle rate and the stamp duty that follows, and whether the road access is legal. These are the same checks as in our land safety checklist.",
      },
      { q: "How do I contact AwadhLand?", a: "Call or WhatsApp {phone}, or write to {email}. {hours}." },
    ],
  },
  hi: {
    whatWeDoTitle: "हम क्या करते हैं",
    whatWeDo:
      "हम आपको ज़मीन छाँटने में मदद करते हैं, और पैसा देने से पहले काग़ज़ जाँचते हैं: टाइटल किसके नाम है, मास्टर प्लान में भू-उपयोग क्या है, सर्किल रेट क्या है और उसके हिसाब से स्टाम्प ड्यूटी कितनी बनेगी, और रास्ता सच में मिलता है या नहीं। जिन सर्किल रेट, माँगे जा रहे दामों और सरकारी प्रोजेक्ट के आधार पर हम काम करते हैं, वे इसी साइट पर हर एक के स्रोत और आख़िरी अपडेट की तारीख़ के साथ छपे हैं।",
    citiesTitle: "हम किन शहरों में काम करते हैं",
    citiesNote: "उत्तर प्रदेश में",
    whoTitle: "हम किनकी मदद करते हैं",
    who: "पूरे भारत के ख़रीदार और विदेश से ख़रीद रहे NRI: रिहायशी प्लॉट खोजते परिवार, कमर्शियल ज़मीन खोजते कारोबारी, और खेती या निवेश की ज़मीन खोजते निवेशक।",
    contactTitle: "हमसे संपर्क कैसे करें",
    contact: "{phone} पर कॉल या व्हाट्सऐप करें, या {email} पर लिखें।",
    hours: "{hours}। हम व्हाट्सऐप पर एक घंटे के भीतर जवाब देते हैं।",
    faqTitle: "AwadhLand के बारे में आम सवाल",
    faq: [
      { q: "AwadhLand क्या है?", a: "{definition}" },
      { q: "AwadhLand किन शहरों में काम करता है?", a: "उत्तर प्रदेश के अयोध्या, लखनऊ और गोरखपुर में, हिंदी और अंग्रेज़ी दोनों में।" },
      {
        q: "क्या NRI उत्तर प्रदेश में ज़मीन ख़रीदने के लिए AwadhLand की मदद ले सकते हैं?",
        a: "जी हाँ। NRI उन ख़रीदारों में हैं जिनकी हम मदद करते हैं। हम आपकी ज़रूरत के हिसाब से ज़मीन खोजते हैं और आपके फ़ैसला करने से पहले टाइटल, भू-उपयोग और सर्किल रेट जाँचते हैं। NRI कौन-सी ज़मीन ख़रीद सकता है, यह ज़मीन की श्रेणी और लागू नियमों पर निर्भर करता है, इसलिए हर प्लॉट के लिए हम यह आपके साथ पक्का करते हैं।",
      },
      {
        q: "ख़रीद से पहले AwadhLand क्या जाँचता है?",
        a: "टाइटल किसके नाम है, मास्टर प्लान में भू-उपयोग क्या है, सर्किल रेट और उसके हिसाब से स्टाम्प ड्यूटी, और रास्ता क़ानूनी है या नहीं। ये वही जाँचें हैं जो हमारी ज़मीन सुरक्षा चेकलिस्ट में हैं।",
      },
      { q: "AwadhLand से संपर्क कैसे करें?", a: "{phone} पर कॉल या व्हाट्सऐप करें, या {email} पर लिखें। {hours}।" },
    ],
  },
};

/** Fills {name} placeholders; unknown names are left as written so a typo shows up on the page. */
export const fillCopy = (text: string, vars: Record<string, string>) => text.replace(/\{(\w+)\}/g, (m, k: string) => vars[k] ?? m);

/** Display labels for enum values, both languages. Colour maps stay in the chip components. */
import type { Locale } from "./i18n";
import type { FitRating, Locality, Project } from "./schemas";

export const fitRatingLabels: Record<FitRating, Record<Locale, string>> = {
  good: { en: "Good", hi: "अच्छा" },
  mixed: { en: "Mixed", hi: "मिला-जुला" },
  poor: { en: "Poor", hi: "कमज़ोर" },
};

export const landUseLabels: Record<NonNullable<Locality["landUse"]>, Record<Locale, string>> = {
  residential: { en: "Residential", hi: "रिहायशी" },
  commercial: { en: "Commercial", hi: "व्यावसायिक" },
  mixed: { en: "Mixed use", hi: "मिश्रित" },
  agricultural: { en: "Agricultural", hi: "कृषि" },
  industrial: { en: "Industrial", hi: "औद्योगिक" },
  institutional: { en: "Institutional", hi: "संस्थागत" },
  "green-belt": { en: "Green belt", hi: "ग्रीन बेल्ट" },
  other: { en: "Other", hi: "अन्य" },
};

export const impactLevelLabels: Record<Project["impacts"][number]["level"], Record<Locale, string>> = {
  strong: { en: "Strong", hi: "ज़्यादा" },
  moderate: { en: "Moderate", hi: "मध्यम" },
  mild: { en: "Mild", hi: "हल्का" },
};

export const impactLevelClass: Record<Project["impacts"][number]["level"], string> = {
  strong: "bg-band-high",
  moderate: "bg-band-mid",
  mild: "bg-band-low",
};

export const buyerCategoryLabels: Record<"male" | "female" | "joint", Record<Locale, string>> = {
  male: { en: "Male", hi: "पुरुष" },
  female: { en: "Female", hi: "महिला" },
  joint: { en: "Joint", hi: "संयुक्त" },
};

export const agencyLabel = (agency: Project["agency"], agencyName?: string) => (agency === "other" ? (agencyName ?? "") : agency);

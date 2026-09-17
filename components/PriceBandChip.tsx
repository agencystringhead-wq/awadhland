import type { Locale } from "@/lib/i18n";
import type { PriceBand } from "@/lib/schemas";

export const priceBandLabels: Record<PriceBand, Record<Locale, string>> = {
  low: { en: "Low", hi: "कम" },
  mid: { en: "Mid", hi: "मध्यम" },
  high: { en: "High", hi: "ऊँचा" },
  premium: { en: "Premium", hi: "प्रीमियम" },
};

/** Colour map defined once; also read by LocalityMap for marker colours. */
export const priceBandClass: Record<PriceBand, string> = {
  low: "bg-band-low",
  mid: "bg-band-mid",
  high: "bg-band-high",
  premium: "bg-band-premium",
};

export const priceBandHex: Record<PriceBand, string> = {
  low: "#5f8f6b",
  mid: "#c9a53a",
  high: "#d0763c",
  premium: "#9c3a3a",
};

export type PriceBandChipProps = {
  locale: Locale;
  band: PriceBand;
};

export function PriceBandChip({ locale, band }: PriceBandChipProps) {
  return (
    <span data-component="PriceBandChip" data-band={band} className={`chip ${priceBandClass[band]}`}>
      {priceBandLabels[band][locale]}
    </span>
  );
}

import type { Locale } from "@/lib/i18n";
import type { PriceBand } from "@/lib/schemas";

export const priceBandLabels: Record<PriceBand, Record<Locale, string>> = {
  low: { en: "Low", hi: "कम" },
  mid: { en: "Mid", hi: "मध्यम" },
  high: { en: "High", hi: "ऊँचा" },
  premium: { en: "Premium", hi: "प्रीमियम" },
};

export type PriceBandChipProps = {
  locale: Locale;
  band: PriceBand;
};

/** Stub. */
export function PriceBandChip({ locale, band }: PriceBandChipProps) {
  return (
    <span data-component="PriceBandChip" data-band={band}>
      {priceBandLabels[band][locale]}
    </span>
  );
}

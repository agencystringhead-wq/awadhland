/**
 * Display conversions for published rates (Step 9, detail D2).
 *
 * Agricultural rates are published in LAKH ₹ per hectare and are stored that way. Nothing here
 * writes back into the data: every function takes the published figure and returns a number for
 * rendering only, so a page can offer ₹/bigha or ₹/sq m without the stored value ever changing.
 *
 * The bigha is deliberately awkward. UP has no single bigha, and the factor in data/units.json is
 * the Awadh pakka bigha pending the broker's confirmation, which is why `bighaLabel` exists and
 * why every bigha figure must be rendered with it.
 */
import { getUnits } from "./rates";

export const LAKH = 100_000;
export const SQM_PER_HECTARE = 10_000;

/** LAKH ₹/hectare → ₹/hectare. */
export const lakhPerHaToRupeesPerHa = (lakhPerHa: number) => lakhPerHa * LAKH;

/** LAKH ₹/hectare → ₹ per square metre. */
export const lakhPerHaToRupeesPerSqm = (lakhPerHa: number) => (lakhPerHa * LAKH) / SQM_PER_HECTARE;

/** LAKH ₹/hectare → ₹ per local bigha, using the factor in data/units.json. */
export function lakhPerHaToRupeesPerBigha(lakhPerHa: number): number {
  const { bigha } = getUnits();
  return (lakhPerHa * LAKH * bigha.sqm) / SQM_PER_HECTARE;
}

/** The label that must accompany any bigha figure, because the local bigha is not yet confirmed. */
export const bighaLabel = (locale: "en" | "hi") => (locale === "hi" ? getUnits().bigha.labelHi : getUnits().bigha.label);

export type AgriUnit = "lakh-per-hectare" | "rupees-per-sqm" | "rupees-per-bigha";

export const AGRI_UNITS: AgriUnit[] = ["lakh-per-hectare", "rupees-per-sqm", "rupees-per-bigha"];

/** Converts a published agricultural figure into the unit the reader picked. */
export function convertAgri(lakhPerHa: number, to: AgriUnit): number {
  switch (to) {
    case "lakh-per-hectare":
      return lakhPerHa;
    case "rupees-per-sqm":
      return lakhPerHaToRupeesPerSqm(lakhPerHa);
    case "rupees-per-bigha":
      return lakhPerHaToRupeesPerBigha(lakhPerHa);
  }
}

export const agriUnitLabel: Record<AgriUnit, { en: string; hi: string }> = {
  "lakh-per-hectare": { en: "₹ lakh / hectare", hi: "₹ लाख / हेक्टेयर" },
  "rupees-per-sqm": { en: "₹ / sq m", hi: "₹ / वर्ग मीटर" },
  "rupees-per-bigha": { en: "₹ / bigha", hi: "₹ / बीघा" },
};

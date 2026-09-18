/**
 * Stamp duty and registration estimate for a UP land purchase (spec Template 7, stamp duty
 * calculator; Template 5, section 2). Pure functions with no data access, so the client
 * calculator and the circle-rate page share one computation and it can be checked in isolation.
 *
 * Circle rates are stored in the published unit: ₹ per sq m for residential and commercial land,
 * ₹ per hectare for agricultural land. The user's area is converted to that unit here; stored
 * rates are never converted.
 */
import type { StampDutyRule } from "./schemas";

export type LandType = "residential" | "commercial" | "agricultural";
export type AreaUnit = "sqft" | "sqm" | "sqyd" | "acre" | "hectare";
export type BuyerCategory = StampDutyRule["buyerCategory"];

export const LAND_TYPES: LandType[] = ["residential", "commercial", "agricultural"];
export const AREA_UNITS: AreaUnit[] = ["sqft", "sqm", "sqyd", "acre", "hectare"];
export const BUYER_CATEGORIES: BuyerCategory[] = ["male", "female", "joint"];

/** Square metres per unit. */
const SQM_PER: Record<AreaUnit, number> = {
  sqft: 0.09290304,
  sqm: 1,
  sqyd: 0.83612736,
  acre: 4046.8564224,
  hectare: 10000,
};

export const SQM_PER_HECTARE = 10000;

export type RateRow = { residential: number; commercial: number; agricultural: number };

export type StampDutyInput = {
  rate: RateRow;
  landType: LandType;
  area: number;
  unit: AreaUnit;
  buyer: BuyerCategory;
  rules: StampDutyRule[];
};

export type StampDutyResult = {
  /** area converted to the unit the rate is published in */
  areaInRateUnit: number;
  rateUnit: "sqm" | "hectare";
  ratePerUnit: number;
  circleValue: number;
  stampDutyPct: number;
  stampDuty: number;
  registrationFeePct: number;
  registrationFee: number;
  /** stamp duty plus registration fee: what is paid to the government at registry */
  total: number;
  /** the rule whose percentages were applied */
  rule: StampDutyRule;
  /** true when a rebate cap was exceeded and the base (male) rate applied instead */
  rebateCapExceeded: boolean;
};

export const toSqM = (area: number, unit: AreaUnit) => area * SQM_PER[unit];

/**
 * Picks the rule for the buyer category. When that rule carries a rebate with a property-value
 * cap and the circle value is above it, the rebate does not apply and the base "male" rule is used.
 */
export function applicableRule(rules: StampDutyRule[], buyer: BuyerCategory, circleValue: number): { rule: StampDutyRule; capExceeded: boolean } {
  const own = rules.find((r) => r.buyerCategory === buyer);
  const base = rules.find((r) => r.buyerCategory === "male");
  if (!own) throw new Error(`stampDutyRules.json has no rule for buyer category "${buyer}"`);
  const cap = own.rebate?.maxPropertyValue ?? null;
  if (cap !== null && circleValue > cap && base) return { rule: base, capExceeded: true };
  return { rule: own, capExceeded: false };
}

export function computeStampDuty(input: StampDutyInput): StampDutyResult {
  const { rate, landType, area, unit, buyer, rules } = input;
  const rateUnit = landType === "agricultural" ? "hectare" : "sqm";
  const sqm = toSqM(area, unit);
  const areaInRateUnit = rateUnit === "hectare" ? sqm / SQM_PER_HECTARE : sqm;
  const ratePerUnit = rate[landType];
  const circleValue = Math.round(areaInRateUnit * ratePerUnit);
  const { rule, capExceeded } = applicableRule(rules, buyer, circleValue);
  const stampDuty = Math.round((circleValue * rule.stampDutyPct) / 100);
  const uncappedFee = Math.round((circleValue * rule.registrationFeePct) / 100);
  const registrationFee = rule.registrationFeeCap !== null ? Math.min(uncappedFee, rule.registrationFeeCap) : uncappedFee;
  return {
    areaInRateUnit,
    rateUnit,
    ratePerUnit,
    circleValue,
    stampDutyPct: rule.stampDutyPct,
    stampDuty,
    registrationFeePct: rule.registrationFeePct,
    registrationFee,
    total: stampDuty + registrationFee,
    rule,
    rebateCapExceeded: capExceeded,
  };
}

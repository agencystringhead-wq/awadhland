/**
 * Plot yield: what a land purchase costs to get into, what it might return, and how that compares
 * with a fixed deposit, on the reader's own assumptions.
 *
 * Pure: no data access, no dates, no randomness. The duty percentages come in as the existing
 * stamp duty rules (data/stampDutyRules.json through lib/stamp-duty), and the circle value comes in
 * already computed (lib/valuation on the picked row), so nothing here restates a rate. Everything
 * is before tax. Unit-tested in lib/yield.test.ts.
 */
import { applicableRule, type BuyerCategory } from "./stamp-duty";
import type { StampDutyRule } from "./schemas";

/* ------------------------------------------------------------------ config */

/**
 * Defaults, all editable in the calculator. The fixed deposit rate is the comparison line; it is a
 * round figure for a multi-year bank FD, not a quote, and lives here so it is changed in one place.
 */
export const YIELD_DEFAULTS = {
  fdRatePct: 7,
  brokerLegalPct: 2,
  sellingCostPct: 2,
  years: 5,
  appreciationPct: 8,
  incomeGrowthPct: 0,
  holdingCostPerYear: 0,
} as const;

/** The three appreciation buttons. Assumptions the reader chooses, not a forecast. */
export const APPRECIATION_PRESETS = [
  { key: "cautious", pct: 5 },
  { key: "moderate", pct: 8 },
  { key: "strong", pct: 12 },
] as const;

export const MIN_YEARS = 1;
export const MAX_YEARS = 20;

/* ------------------------------------------------------------------- area */

export type YieldAreaUnit = "sqft" | "sqm" | "sqyd" | "bigha" | "acre" | "hectare";
export const YIELD_AREA_UNITS: YieldAreaUnit[] = ["sqft", "sqm", "sqyd", "bigha", "acre", "hectare"];

const SQM_PER: Record<Exclude<YieldAreaUnit, "bigha">, number> = {
  sqft: 0.09290304,
  sqm: 1,
  sqyd: 0.83612736,
  acre: 4046.8564224,
  hectare: 10000,
};

/** Area in square metres. The bigha factor is passed in from data/units.json, never assumed here. */
export function areaToSqm(area: number, unit: YieldAreaUnit, bighaSqm: number): number {
  return area * (unit === "bigha" ? bighaSqm : SQM_PER[unit]);
}

export const SQFT_PER_SQM = 1 / SQM_PER.sqft;

/* ----------------------------------------------------------------- inputs */

export type YieldInput = {
  /** agreed purchase price, ₹ */
  price: number;
  /** area × circle rate for the chosen road band, ₹; null when no locality was picked */
  circleValue: number | null;
  buyer: BuyerCategory;
  dutyRules: StampDutyRule[];
  /** broker, lawyer and other costs at purchase, % of price */
  brokerLegalPct: number;
  years: number;
  /** yearly appreciation of the plot's market value, % (the reader's assumption) */
  appreciationPct: number;
  /** income in year 1 (farming lease, rent), ₹ */
  incomePerYear: number;
  /** yearly growth of that income, % */
  incomeGrowthPct: number;
  /** upkeep, guard, property tax, ₹ per year */
  holdingCostPerYear: number;
  /** selling costs at exit, % of the sale value */
  sellingCostPct: number;
  /** fixed deposit rate for the comparison line, % a year */
  fdRatePct: number;
};

export type YieldYear = {
  year: number;
  /** market value of the plot at the end of the year */
  value: number;
  income: number;
  holdingCost: number;
  /** the year's net cash flow, including the net exit value in the final year */
  cashFlow: number;
  /** running total of cash flows from year 0 */
  cumulative: number;
  /** the same total cost in a fixed deposit, compounded yearly */
  fdValue: number;
};

export type YieldResult = {
  /** what stamp duty and registration were charged on: the higher of price and circle value */
  dutyBase: number;
  /** true when the circle value is above the price, so duty is on the circle value */
  dutyOnCircleValue: boolean;
  dutyRule: StampDutyRule;
  rebateCapExceeded: boolean;
  stampDuty: number;
  registrationFee: number;
  brokerLegal: number;
  /** price + stamp duty + registration + broker/legal */
  totalCost: number;
  /** price grown at the appreciation rate for the holding period */
  exitValueGross: number;
  sellingCost: number;
  exitValueNet: number;
  totalIncome: number;
  totalHoldingCost: number;
  /** everything received minus everything paid */
  netProfit: number;
  /** total received ÷ total cost */
  multiple: number;
  /** compound yearly growth of the total cost into the total received; null when nothing comes back */
  cagr: number | null;
  /** internal rate of return on the yearly cash flows; null when there is no rate that zeroes them */
  irr: number | null;
  /** year-1 income ÷ total cost */
  grossYield: number;
  /** the total cost in a fixed deposit for the same years */
  fdValue: number;
  fdProfit: number;
  years: YieldYear[];
  cashFlows: number[];
};

/* ------------------------------------------------------------------ maths */

const round = (n: number) => Math.round(n);

/** Net present value of yearly cash flows at `rate`, flows[0] at year 0. */
export function npv(rate: number, flows: number[]): number {
  let v = 0;
  for (let t = 0; t < flows.length; t++) v += flows[t] / Math.pow(1 + rate, t);
  return v;
}

/**
 * IRR by bisection. Robust where Newton's method is not: flows with no income in between (all the
 * return in the last year) and flows that lose money both have one root and a monotonic NPV, which
 * bisection finds every time. Returns null when the flows never change sign, or when the NPV has
 * the same sign at both ends of the bracket, rather than a number that means nothing.
 */
export function irr(flows: number[], lo = -0.9999, hi = 10, tol = 1e-9): number | null {
  if (!flows.some((f) => f < 0) || !flows.some((f) => f > 0)) return null;
  let fLo = npv(lo, flows);
  const fHi = npv(hi, flows);
  if (Number.isNaN(fLo) || Number.isNaN(fHi) || fLo * fHi > 0) return null;
  for (let i = 0; i < 300; i++) {
    const mid = (lo + hi) / 2;
    const fMid = npv(mid, flows);
    if (Math.abs(fMid) < tol || (hi - lo) / 2 < tol) return mid;
    if (fLo * fMid < 0) hi = mid;
    else {
      lo = mid;
      fLo = fMid;
    }
  }
  return (lo + hi) / 2;
}

export function computeYield(input: YieldInput): YieldResult {
  const years = Math.max(MIN_YEARS, Math.min(MAX_YEARS, Math.round(input.years)));
  const price = Math.max(0, input.price);
  const circle = input.circleValue ?? 0;

  /* purchase: duty on the higher of the price and the circle value */
  const dutyBase = Math.max(price, circle);
  const { rule, capExceeded } = applicableRule(input.dutyRules, input.buyer, dutyBase);
  const stampDuty = round((dutyBase * rule.stampDutyPct) / 100);
  const regUncapped = round((dutyBase * rule.registrationFeePct) / 100);
  const registrationFee = rule.registrationFeeCap !== null ? Math.min(regUncapped, rule.registrationFeeCap) : regUncapped;
  const brokerLegal = round((price * input.brokerLegalPct) / 100);
  const totalCost = price + stampDuty + registrationFee + brokerLegal;

  /* exit */
  const g = input.appreciationPct / 100;
  const exitValueGross = round(price * Math.pow(1 + g, years));
  const sellingCost = round((exitValueGross * input.sellingCostPct) / 100);
  const exitValueNet = exitValueGross - sellingCost;

  /* year by year */
  const fd = input.fdRatePct / 100;
  const cashFlows = [-totalCost];
  const rows: YieldYear[] = [];
  let cumulative = -totalCost;
  let totalIncome = 0;
  let totalHoldingCost = 0;
  for (let t = 1; t <= years; t++) {
    const income = round(input.incomePerYear * Math.pow(1 + input.incomeGrowthPct / 100, t - 1));
    const holdingCost = round(input.holdingCostPerYear);
    const cashFlow = income - holdingCost + (t === years ? exitValueNet : 0);
    cumulative += cashFlow;
    totalIncome += income;
    totalHoldingCost += holdingCost;
    cashFlows.push(cashFlow);
    rows.push({
      year: t,
      value: round(price * Math.pow(1 + g, t)),
      income,
      holdingCost,
      cashFlow,
      cumulative,
      fdValue: round(totalCost * Math.pow(1 + fd, t)),
    });
  }

  const received = exitValueNet + totalIncome - totalHoldingCost;
  const netProfit = received - totalCost;
  const multiple = totalCost > 0 ? received / totalCost : 0;
  const cagr = totalCost > 0 && received > 0 ? Math.pow(received / totalCost, 1 / years) - 1 : null;
  const fdValue = round(totalCost * Math.pow(1 + fd, years));

  return {
    dutyBase,
    dutyOnCircleValue: circle > price,
    dutyRule: rule,
    rebateCapExceeded: capExceeded,
    stampDuty,
    registrationFee,
    brokerLegal,
    totalCost,
    exitValueGross,
    sellingCost,
    exitValueNet,
    totalIncome,
    totalHoldingCost,
    netProfit,
    multiple,
    cagr,
    irr: irr(cashFlows),
    grossYield: totalCost > 0 ? input.incomePerYear / totalCost : 0,
    fdValue,
    fdProfit: fdValue - totalCost,
    years: rows,
    cashFlows,
  };
}

/* ------------------------------------------------------------ formatting */

/** Indian digit grouping for an input field: 100000 -> "1,00,000". Empty for 0 or blank. */
export function groupIndian(n: number): string {
  if (!Number.isFinite(n) || n === 0) return "";
  return Math.round(n).toLocaleString("en-IN");
}

/** Digits out of a grouped field: "1,00,000" -> 100000. */
export function parseIndian(s: string): number {
  const n = Number(s.replace(/[^\d.]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

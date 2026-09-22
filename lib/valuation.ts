/**
 * Circle valuation on the full rate model (Step 9, detail D3).
 *
 * The published list is not a single number per place. A non-agricultural plot is valued by the
 * width of the road it fronts, or by a road-segment rate when it sits on a listed stretch; the
 * part of a large plot above the threshold is discounted; and agricultural land is valued by
 * frontage with a stack of percentage adjustments from the list's general-instruction pages.
 *
 * This module applies those rules and, importantly, reports which ones it used, so the page can
 * show its working rather than a bare total. Percentages and thresholds are data
 * (data/valuationRules.json), not constants, and that file is marked TODO legal-review.
 *
 * Pure: no data access beyond the rules passed in, so the same computation runs in the client
 * calculator and can be checked in isolation.
 */
import { LAKH, SQM_PER_HECTARE } from "./units";
import type { RateCategory, RateRow, RoadSegmentRow, ValuationRules } from "./schemas";

/** Which column of the non-agricultural table a plot falls in. */
export type RoadWidth = "lt9m" | "m9to18" | "ge18m";

/** Which frontage column of the agricultural table applies. */
export type AgriFrontage = "nh" | "state" | "link" | "chakmarg" | "abadi" | "general";

export type LandKind = "non-agricultural" | "commercial" | "agricultural";

/** Commercial sub-type; the list prices shop, office and godown separately. */
export type CommercialKind = "shop" | "office" | "godown";

export type ValuationInput = {
  row: RateRow;
  kind: LandKind;
  /** area in square metres */
  areaSqm: number;
  rules: ValuationRules;

  /* non-agricultural */
  roadWidth?: RoadWidth;
  /** when the plot is on a listed road stretch, its rate replaces the road-width rate */
  segment?: RoadSegmentRow | null;
  /** instruction 20 */
  nearCommercial?: boolean;

  /* commercial */
  commercialKind?: CommercialKind;

  /* agricultural */
  frontage?: AgriFrontage;
  /** instruction 22 */
  nearActivity?: boolean;
  /** instruction 17: how many roads the plot adjoins */
  adjoiningRoads?: 0 | 1 | 2;
  /** instruction 17: whether it adjoins abadi */
  adjoiningAbadi?: boolean;
};

export type AppliedRule = {
  id: string;
  instruction: string;
  label: string;
  labelHi: string;
  pct: number;
};

export type ValuationResult = {
  /** ₹ per sq m for land and commercial; ₹ per hectare for agricultural */
  baseRate: number;
  baseRateUnit: "sqm" | "hectare";
  /** where baseRate came from, for the source line */
  basis: "road-width" | "road-segment" | "commercial" | "agri-frontage";
  /** value before any percentage adjustment */
  baseValue: number;
  /** the large-plot discount, when it applied */
  largePlot: { thresholdSqm: number; pct: number; discount: number } | null;
  applied: AppliedRule[];
  /** sum of the applied percentages */
  upliftPct: number;
  /** final circle value in ₹ */
  circleValue: number;
  /** set when a rule was requested but the list forbids it here */
  notes: ValuationNote[];
};

export type ValuationNote = "segment-not-applicable-to-agricultural" | "agri-rate-missing-for-frontage";

/** Categories in which the small-plot uplift of instruction 18 applies. */
const SMALL_PLOT_CATEGORIES: RateCategory[] = ["urban", "semi-urban", "developing"];

const rule = (rules: ValuationRules, id: string) => rules.rules.find((r) => r.id === id);

const toApplied = (r: NonNullable<ReturnType<typeof rule>>): AppliedRule => ({
  id: r.id,
  instruction: r.instruction,
  label: r.label,
  labelHi: r.labelHi,
  pct: r.pct,
});

/**
 * Value a plot against one row of the published list.
 *
 * Adjustments are summed, not compounded, and every one that fired is returned. Whether the list
 * intends them to stack at all is an open question recorded in data/valuationRules.json; if the
 * answer turns out to be "highest only", change it here and the pages follow.
 */
export function valuePlot(input: ValuationInput): ValuationResult {
  const { row, kind, areaSqm, rules } = input;
  const notes: ValuationNote[] = [];
  const applied: AppliedRule[] = [];

  if (kind === "agricultural") {
    const frontage = input.frontage ?? "general";
    const lakhPerHa = row.agriLakhPerHa[frontage];
    if (lakhPerHa === null) {
      // Urban rows print no agricultural figures at all.
      notes.push("agri-rate-missing-for-frontage");
      return {
        baseRate: 0,
        baseRateUnit: "hectare",
        basis: "agri-frontage",
        baseValue: 0,
        largePlot: null,
        applied: [],
        upliftPct: 0,
        circleValue: 0,
        notes,
      };
    }
    // Instruction 24: a road-segment rate never applies to agricultural land.
    if (input.segment) notes.push("segment-not-applicable-to-agricultural");

    const ratePerHa = lakhPerHa * LAKH;
    const hectares = areaSqm / SQM_PER_HECTARE;
    const baseValue = ratePerHa * hectares;

    // Instruction 18: small plots in urban, semi-urban and developing villages, where the plot
    // does not adjoin abadi or a road.
    const standsAlone = (input.adjoiningRoads ?? 0) === 0 && !input.adjoiningAbadi;
    if (SMALL_PLOT_CATEGORIES.includes(row.category) && standsAlone) {
      const r = hectares <= 0.1 ? rule(rules, "agri-plot-upto-0-100-ha") : hectares <= 0.2 ? rule(rules, "agri-plot-0-100-to-0-200-ha") : undefined;
      if (r) applied.push(toApplied(r));
    }
    // Instruction 17: roads and abadi.
    const roads = input.adjoiningRoads ?? 0;
    const seventeen = input.adjoiningAbadi
      ? roads > 1
        ? rule(rules, "agri-many-roads-and-abadi")
        : roads === 1
          ? rule(rules, "agri-one-road-and-abadi")
          : undefined
      : roads >= 2
        ? rule(rules, "agri-two-or-more-roads-only")
        : undefined;
    if (seventeen) applied.push(toApplied(seventeen));

    // Instruction 22: within 200 m of residential or commercial activity.
    if (input.nearActivity) {
      const r = rule(rules, "agri-activity-within-200m");
      if (r) applied.push(toApplied(r));
    }

    const upliftPct = applied.reduce((s, r) => s + r.pct, 0);
    return {
      baseRate: ratePerHa,
      baseRateUnit: "hectare",
      basis: "agri-frontage",
      baseValue: Math.round(baseValue),
      largePlot: null,
      applied,
      upliftPct,
      circleValue: Math.round(baseValue * (1 + upliftPct / 100)),
      notes,
    };
  }

  /* non-agricultural and commercial: ₹ per sq m */

  let baseRate: number;
  let basis: ValuationResult["basis"];
  if (kind === "commercial") {
    const which = input.commercialKind ?? "shop";
    // A listed road stretch prices its commercial frontage too.
    baseRate = input.segment ? input.segment[which] : row.commercial[which];
    basis = input.segment ? "road-segment" : "commercial";
  } else if (input.segment) {
    baseRate = input.segment.nonAgri;
    basis = "road-segment";
  } else {
    baseRate = row.nonAgri[input.roadWidth ?? "lt9m"];
    basis = "road-width";
  }

  // Plots over the threshold: the excess is valued at largePlotPct of the rate.
  const { largePlotThresholdSqm: threshold, largePlotPct } = rules;
  let baseValue: number;
  let largePlot: ValuationResult["largePlot"] = null;
  if (areaSqm > threshold) {
    const excess = areaSqm - threshold;
    const full = threshold * baseRate;
    const discounted = excess * baseRate * (largePlotPct / 100);
    baseValue = full + discounted;
    largePlot = { thresholdSqm: threshold, pct: largePlotPct, discount: Math.round(excess * baseRate - discounted) };
  } else {
    baseValue = areaSqm * baseRate;
  }

  // Instruction 20: within 50 m of commercial activity.
  if (input.nearCommercial) {
    const r = rule(rules, "nonagri-commercial-within-50m");
    if (r) applied.push(toApplied(r));
  }

  const upliftPct = applied.reduce((s, r) => s + r.pct, 0);
  return {
    baseRate,
    baseRateUnit: "sqm",
    basis,
    baseValue: Math.round(baseValue),
    largePlot,
    applied,
    upliftPct,
    circleValue: Math.round(baseValue * (1 + upliftPct / 100)),
    notes,
  };
}

export const ROAD_WIDTHS: RoadWidth[] = ["lt9m", "m9to18", "ge18m"];
export const AGRI_FRONTAGES: AgriFrontage[] = ["nh", "state", "link", "chakmarg", "abadi", "general"];
export const COMMERCIAL_KINDS: CommercialKind[] = ["shop", "office", "godown"];

export const roadWidthLabel: Record<RoadWidth, { en: string; hi: string }> = {
  lt9m: { en: "Under 9 m", hi: "9 मीटर से कम" },
  m9to18: { en: "9–18 m", hi: "9–18 मीटर" },
  ge18m: { en: "18 m and over", hi: "18 मीटर और अधिक" },
};

export const agriFrontageLabel: Record<AgriFrontage, { en: string; hi: string }> = {
  nh: { en: "National highway", hi: "राष्ट्रीय राजमार्ग" },
  state: { en: "State or district road", hi: "राज्य या जनपदीय मार्ग" },
  link: { en: "Link road", hi: "सम्पर्क मार्ग" },
  chakmarg: { en: "Chakmarg", hi: "चकमार्ग" },
  abadi: { en: "Adjoining abadi", hi: "आबादी से लगी" },
  general: { en: "General", hi: "सामान्य" },
};

export const commercialKindLabel: Record<CommercialKind, { en: string; hi: string }> = {
  shop: { en: "Shop", hi: "दुकान" },
  office: { en: "Office", hi: "कार्यालय" },
  godown: { en: "Godown", hi: "गोदाम" },
};

export const categoryLabel: Record<RateCategory, { en: string; hi: string }> = {
  urban: { en: "Urban", hi: "नगरीय" },
  "semi-urban": { en: "Semi-urban", hi: "अर्द्धनगरीय" },
  rural: { en: "Rural", hi: "ग्रामीण" },
  developing: { en: "Developing", hi: "विकासशील" },
  notified: { en: "Notified", hi: "अधिसूचित" },
  "nagar-panchayat": { en: "Nagar panchayat", hi: "नगर पंचायत" },
};

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

/**
 * Which column of the non-agricultural table a plot falls in.
 *
 * A band key, not a fixed set: Ayodhya's list prints three columns and Lucknow's four, and the
 * keys come from the schedule (lib/rates, getRoadBands). Ayodhya's keys are still lt9m / m9to18 /
 * ge18m, so callers that name one keep working.
 */
export type RoadWidth = string;

/**
 * Which frontage column of the agricultural table applies. The first six are the Ayodhya and
 * Lucknow columns; "district" and "other" are Gorakhpur's grid rows (with its nh and link).
 */
export type AgriFrontage = "nh" | "state" | "link" | "chakmarg" | "abadi" | "general" | "district" | "other";

/** Gorakhpur's grid frontages, in printed order. */
export type AgriGridFrontage = "nh" | "district" | "link" | "other";
export const AGRI_GRID_FRONTAGES: AgriGridFrontage[] = ["nh", "district", "link", "other"];

/** Which of a grid's four plot-size slabs an area falls in: 0 up to the first limit, 3 above the third. */
export function agriSlabIndex(slabsHa: readonly [number, number, number], hectares: number): 0 | 1 | 2 | 3 {
  return hectares <= slabsHa[0] ? 0 : hectares <= slabsHa[1] ? 1 : hectares <= slabsHa[2] ? 2 : 3;
}

/** "Up to 0.040 ha", "0.040–0.100 ha", …, "Over 0.200 ha" for a grid's four slabs. */
export function agriSlabLabels(slabsHa: readonly [number, number, number], locale: "en" | "hi"): string[] {
  const f = (n: number) => n.toFixed(3);
  return locale === "hi"
    ? [`${f(slabsHa[0])} हे. तक`, `${f(slabsHa[0])}–${f(slabsHa[1])} हे.`, `${f(slabsHa[1])}–${f(slabsHa[2])} हे.`, `${f(slabsHa[2])} हे. से अधिक`]
    : [`Up to ${f(slabsHa[0])} ha`, `${f(slabsHa[0])}–${f(slabsHa[1])} ha`, `${f(slabsHa[1])}–${f(slabsHa[2])} ha`, `Over ${f(slabsHa[2])} ha`];
}

/** Gorakhpur 2025: distance from plotting or a residential colony, for agricultural land. */
export type ColonyDistance = "none" | "within50" | "50to200";

/**
 * "covered" is construction, not land: ₹ per sq m of built area, साधारण or प्रीमियम.
 *
 * Lucknow's list prices it on every row; Ayodhya's does not print the column at all, so the
 * option only appears where `row.covered` is set.
 */
export type LandKind = "non-agricultural" | "commercial" | "agricultural" | "covered";

/** Which covered-area column applies: साधारण or प्रीमियम. */
export type CoveredGrade = "ordinary" | "premium";

export const COVERED_GRADES: CoveredGrade[] = ["ordinary", "premium"];

export const coveredGradeLabel: Record<CoveredGrade, { en: string; hi: string }> = {
  ordinary: { en: "Ordinary", hi: "साधारण" },
  premium: { en: "Premium", hi: "प्रीमियम" },
};

/**
 * Commercial sub-type: a key of the schedule's commercialKinds. Ayodhya and Lucknow print shop,
 * office and godown; Gorakhpur prints shop (single, land), shopMulti and office.
 */
export type CommercialKind = string;

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

  /* covered area */
  coveredGrade?: CoveredGrade;

  /* agricultural */
  frontage?: AgriFrontage;
  /** instruction 22 */
  nearActivity?: boolean;
  /** instruction 17: how many roads the plot adjoins */
  adjoiningRoads?: 0 | 1 | 2;
  /** instruction 17: whether it adjoins abadi */
  adjoiningAbadi?: boolean;
  /** Gorakhpur 2025: distance from plotting or a colony */
  colonyDistance?: ColonyDistance;
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
  basis: "road-width" | "road-segment" | "commercial" | "agri-frontage" | "covered";
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
  /** on a farmland grid, which plot-size slab the area fell in (0–3) */
  slab?: number;
};

export type ValuationNote = "segment-not-applicable-to-agricultural" | "agri-rate-missing-for-frontage";

/** Categories in which the small-plot uplift of instruction 18 applies. */
const SMALL_PLOT_CATEGORIES: RateCategory[] = ["urban", "semi-urban", "developing"];

const rule = (rules: ValuationRules, id: string) => rules.rules.find((r) => r.id === id);

/** The rule that defines `roadWidth` as a virtual band, if any. */
const bandRule = (rules: ValuationRules, roadWidth: string | undefined) =>
  roadWidth ? rules.rules.find((r) => r.band?.key === roadWidth) : undefined;

/** Road widths a city's rules add beyond its printed columns, for a row that prints the base band. */
export const extraRoadWidths = (rules: ValuationRules, row: RateRow) =>
  rules.rules.flatMap((r) => (r.band && typeof row.nonAgri[r.band.fromKey] === "number" ? [r.band] : []));

/** A segment's rate for one commercial kind, or null where it prints none. */
function segmentCommercial(seg: RoadSegmentRow, kind: string): number | null {
  if (kind === "shop") return seg.shop;
  if (kind === "office") return seg.office;
  if (kind === "godown") return seg.godown;
  if (kind === "shopMulti") return seg.shopMulti ?? null;
  return null;
}

/** True where the city's rules carry this rule id, so the calculator only offers what applies. */
export const hasRule = (rules: ValuationRules, id: string) => rules.rules.some((r) => r.id === id);

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
    const hectares = areaSqm / SQM_PER_HECTARE;
    /*
     * A grid (Gorakhpur) prices by frontage and plot size together: the whole plot takes the rate
     * of the slab its area falls in. Otherwise one figure per frontage.
     */
    const grid = row.agriGrid ?? null;
    const slab = grid ? agriSlabIndex(grid.slabsHa, hectares) : undefined;
    const gridFrontage: AgriGridFrontage = (AGRI_GRID_FRONTAGES as string[]).includes(input.frontage ?? "")
      ? (input.frontage as AgriGridFrontage)
      : "other";
    const sixKey = (input.frontage ?? "general") as keyof RateRow["agriLakhPerHa"];
    const lakhPerHa = grid ? grid[gridFrontage][slab!] : (row.agriLakhPerHa[sixKey] ?? null);
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
        slab,
      };
    }
    // Instruction 24: a road-segment rate never applies to agricultural land.
    if (input.segment) notes.push("segment-not-applicable-to-agricultural");

    const ratePerHa = lakhPerHa * LAKH;
    const baseValue = ratePerHa * hectares;

    // Instruction 18: small plots in urban, semi-urban and developing villages, where the plot
    // does not adjoin abadi or a road.
    const standsAlone = (input.adjoiningRoads ?? 0) === 0 && !input.adjoiningAbadi;
    // A row with no printed category cannot qualify: the rule keys off being urban-ish, and three
    // of Lucknow's SROs print no category column at all. Not printed is not a licence to guess.
    if (row.category !== null && SMALL_PLOT_CATEGORIES.includes(row.category) && standsAlone) {
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

    // Gorakhpur 2025: near plotting or a colony. Only fires where the city's rules carry it.
    if (input.colonyDistance === "within50" || input.colonyDistance === "50to200") {
      const r = rule(rules, input.colonyDistance === "within50" ? "agri-colony-within-50m" : "agri-colony-50-200m");
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
      slab,
    };
  }

  /* non-agricultural and commercial: ₹ per sq m */

  let baseRate: number;
  let basis: ValuationResult["basis"];
  if (kind === "covered") {
    /*
     * Construction is valued on the built area at the printed covered rate. A road-segment rate
     * never applies: the segment prices frontage land, not what stands on it.
     */
    baseRate = row.covered?.[input.coveredGrade ?? "ordinary"] ?? 0;
    basis = "covered";
  } else if (kind === "commercial") {
    const which = input.commercialKind ?? "shop";
    // A listed road stretch prices its commercial frontage too, where it prints that kind.
    // A row with no printed commercial line has no commercial value to quote.
    const onSegment = input.segment ? segmentCommercial(input.segment, which) : null;
    baseRate = onSegment ?? row.commercial?.[which] ?? 0;
    basis = onSegment !== null ? "road-segment" : "commercial";
  } else if (input.segment && input.segment.nonAgri !== null) {
    baseRate = input.segment.nonAgri;
    basis = "road-segment";
  } else if (bandRule(rules, input.roadWidth)) {
    // A width the list prints no column for, valued off another band (Gorakhpur: over 12 m).
    const r = bandRule(rules, input.roadWidth)!;
    baseRate = row.nonAgri[r.band!.fromKey] ?? 0;
    basis = "road-width";
    applied.push(toApplied(r));
  } else {
    // Fall back to the row's cheapest printed band when the caller names none, or names one this
    // row does not carry: Lucknow Sadar-2 भरवारा prints only the first of the four columns.
    const named = input.roadWidth ? row.nonAgri[input.roadWidth] : undefined;
    const cheapest = Object.values(row.nonAgri).find((v) => typeof v === "number");
    baseRate = typeof named === "number" ? named : (cheapest ?? 0);
    basis = "road-width";
  }

  // Plots over the threshold: the excess is valued at largePlotPct of the rate. Where the rules
  // name the kinds it applies to (Gorakhpur: land only), other kinds are valued in full.
  const { largePlotThresholdSqm: threshold, largePlotPct } = rules;
  const largePlotApplies = !rules.largePlotKinds || rules.largePlotKinds.includes(kind as "non-agricultural");
  let baseValue: number;
  let largePlot: ValuationResult["largePlot"] = null;
  if (largePlotApplies && areaSqm > threshold) {
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
/** The six single-figure frontage columns of the Ayodhya and Lucknow lists. */
export type SixAgriFrontage = keyof RateRow["agriLakhPerHa"];
export const AGRI_FRONTAGES: SixAgriFrontage[] = ["nh", "state", "link", "chakmarg", "abadi", "general"];
export const COMMERCIAL_KINDS: CommercialKind[] = ["shop", "office", "godown"];

export const roadWidthLabel: Record<RoadWidth, { en: string; hi: string }> = {
  lt9m: { en: "Under 9 m", hi: "9 मीटर से कम" },
  m9to18: { en: "9–18 m", hi: "9–18 मीटर" },
  ge18m: { en: "18 m and over", hi: "18 मीटर और अधिक" },
};

export const agriFrontageLabel: Record<AgriFrontage, { en: string; hi: string }> = {
  district: { en: "District road", hi: "जनपदीय मार्ग" },
  other: { en: "Elsewhere", hi: "अन्यत्र" },
  nh: { en: "National highway", hi: "राष्ट्रीय राजमार्ग" },
  state: { en: "State or district road", hi: "राज्य या जनपदीय मार्ग" },
  link: { en: "Link road", hi: "सम्पर्क मार्ग" },
  chakmarg: { en: "Chakmarg", hi: "चकमार्ग" },
  abadi: { en: "Adjoining abadi", hi: "आबादी से लगी" },
  general: { en: "General", hi: "सामान्य" },
};

/** Gorakhpur's grid rows, as its list heads them. */
export const agriGridFrontageLabel: Record<AgriGridFrontage, { en: string; hi: string }> = {
  nh: { en: "NH or state highway", hi: "राष्ट्रीय / राज्य राजमार्ग" },
  district: { en: "District road", hi: "जनपदीय मार्ग" },
  link: { en: "Link road", hi: "सम्पर्क मार्ग" },
  other: { en: "Elsewhere", hi: "अन्यत्र" },
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

/**
 * The category as printed, or nothing where the list prints no category column.
 *
 * Mohanlalganj and both Sarojini Nagar lists have no such column, so 481 Lucknow rows have none.
 * Callers that can drop the field entirely do (the village page omits the item and its separator);
 * a table cell stays empty, because the column still has to line up. A placeholder glyph was worse
 * than blank: it read as a value, and there is nothing to read.
 *
 * The one place that needs words for it is the tehsil filter, which uses categoryFilterLabel.
 */
export const categoryText = (c: RateCategory | null, locale: "en" | "hi"): string => (c ? categoryLabel[c][locale] : "");

/** Same, but for a filter option, where a blank entry would be an unpickable empty row. */
export const categoryFilterLabel = (c: RateCategory | null, locale: "en" | "hi"): string =>
  c ? categoryLabel[c][locale] : locale === "hi" ? "श्रेणी नहीं छपी" : "No category printed";

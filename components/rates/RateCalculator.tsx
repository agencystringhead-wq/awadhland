"use client";

/**
 * Stamp duty estimate on the full rate model (spec Template 5 section 2, Step 9 detail D3).
 *
 * Replaces the three-number calculator. It values the plot with lib/valuation.ts — road width or
 * a listed road-segment rate, the large-plot discount, and the agricultural adjustments from the
 * list's general instructions — then applies the stamp duty and registration percentages, and
 * shows every rule it used so the number can be checked rather than trusted.
 *
 * Both the rules and the duty percentages are unconfirmed (data/valuationRules.json carries
 * TODO legal-review, data/stampDutyRules.json is placeholder), which is why the estimate-only
 * line is not dismissible and sits with the result, not in a footnote.
 */
import { useMemo, useState } from "react";
import { formatNumber, ui, type Locale } from "@/lib/i18n";
import { buyerCategoryLabels } from "@/lib/labels";
import { rc } from "@/lib/rate-copy";
import type { RateRow, RoadSegmentRow, StampDutyRule, ValuationRules } from "@/lib/schemas";
import { applicableRule, AREA_UNITS, toSqM, type AreaUnit, type BuyerCategory } from "@/lib/stamp-duty";
import {
  AGRI_FRONTAGES,
  agriFrontageLabel,
  COMMERCIAL_KINDS,
  commercialKindLabel,
  ROAD_WIDTHS,
  roadWidthLabel,
  valuePlot,
  type AgriFrontage,
  type CommercialKind,
  type LandKind,
  type RoadWidth,
} from "@/lib/valuation";

const KINDS: LandKind[] = ["non-agricultural", "commercial", "agricultural"];
const BUYERS: BuyerCategory[] = ["male", "female", "joint"];

export function RateCalculator({
  locale,
  row,
  segments,
  rules,
  dutyRules,
}: {
  locale: Locale;
  row: RateRow;
  /** road stretches through this village, if any */
  segments: RoadSegmentRow[];
  rules: ValuationRules;
  dutyRules: StampDutyRule[];
}) {
  const c = rc(locale);
  const [kind, setKind] = useState<LandKind>("non-agricultural");
  const [area, setArea] = useState("1000");
  const [unit, setUnit] = useState<AreaUnit>("sqft");
  const [buyer, setBuyer] = useState<BuyerCategory>("male");
  const [roadWidth, setRoadWidth] = useState<RoadWidth>("lt9m");
  const [segmentId, setSegmentId] = useState("none");
  const [commercialKind, setCommercialKind] = useState<CommercialKind>("shop");
  const [frontage, setFrontage] = useState<AgriFrontage>("general");
  const [nearCommercial, setNearCommercial] = useState(false);
  const [nearActivity, setNearActivity] = useState(false);
  const [adjoiningRoads, setAdjoiningRoads] = useState<0 | 1 | 2>(0);
  const [adjoiningAbadi, setAdjoiningAbadi] = useState(false);

  const areaNum = Number(area) > 0 ? Number(area) : 0;
  const segment = segments.find((s) => s.id === segmentId) ?? null;
  const hasAgri = AGRI_FRONTAGES.some((f) => row.agriLakhPerHa[f] !== null);

  const result = useMemo(() => {
    const areaSqm = toSqM(areaNum, unit);
    const v = valuePlot({
      row,
      kind,
      areaSqm,
      rules,
      roadWidth,
      segment: kind === "agricultural" ? null : segment,
      nearCommercial,
      commercialKind,
      frontage,
      nearActivity,
      adjoiningRoads,
      adjoiningAbadi,
    });
    // Instruction 24 is reported by valuePlot only when a segment was actually offered.
    const withNote =
      kind === "agricultural" && segment ? { ...v, notes: [...v.notes, "segment-not-applicable-to-agricultural" as const] } : v;
    const { rule, capExceeded } = applicableRule(dutyRules, buyer, withNote.circleValue);
    const stampDuty = Math.round((withNote.circleValue * rule.stampDutyPct) / 100);
    const uncapped = Math.round((withNote.circleValue * rule.registrationFeePct) / 100);
    const registrationFee = rule.registrationFeeCap !== null ? Math.min(uncapped, rule.registrationFeeCap) : uncapped;
    return { v: withNote, rule, capExceeded, stampDuty, registrationFee, total: stampDuty + registrationFee };
  }, [
    row,
    kind,
    areaNum,
    unit,
    rules,
    roadWidth,
    segment,
    nearCommercial,
    commercialKind,
    frontage,
    nearActivity,
    adjoiningRoads,
    adjoiningAbadi,
    dutyRules,
    buyer,
  ]);

  const select = "w-full rounded-lg border border-line bg-card px-3 py-2 text-sm";
  const label = "caption-mono mb-1.5 block text-muted";
  const money = (n: number) => `₹${formatNumber(n)}`;

  return (
    <div data-component="RateCalculator" className="grid gap-6 rounded-2xl border border-line bg-card p-5 md:grid-cols-[1fr_20rem] md:p-6">
      {/* inputs */}
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className={label}>{c.landKind}</span>
          <select className={select} value={kind} onChange={(e) => setKind(e.target.value as LandKind)}>
            {KINDS.map((k) => (
              <option key={k} value={k} disabled={k === "agricultural" && !hasAgri}>
                {k === "non-agricultural" ? c.kindNonAgri : k === "commercial" ? c.kindCommercial : c.kindAgri}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className={label}>{c.area}</span>
          <input className={select} type="number" min="1" inputMode="decimal" value={area} onChange={(e) => setArea(e.target.value)} />
        </label>
        <label className="block">
          <span className={label}>&nbsp;</span>
          <select className={select} value={unit} onChange={(e) => setUnit(e.target.value as AreaUnit)}>
            {AREA_UNITS.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </label>

        {kind === "non-agricultural" && (
          <label className="block">
            <span className={label}>{c.roadWidth}</span>
            <select className={select} value={roadWidth} onChange={(e) => setRoadWidth(e.target.value as RoadWidth)} disabled={segment !== null}>
              {ROAD_WIDTHS.map((w) => (
                <option key={w} value={w}>
                  {roadWidthLabel[w][locale]}
                </option>
              ))}
            </select>
          </label>
        )}

        {kind === "commercial" && (
          <label className="block">
            <span className={label}>{c.viewCommercial}</span>
            <select className={select} value={commercialKind} onChange={(e) => setCommercialKind(e.target.value as CommercialKind)}>
              {COMMERCIAL_KINDS.map((k) => (
                <option key={k} value={k}>
                  {commercialKindLabel[k][locale]}
                </option>
              ))}
            </select>
          </label>
        )}

        {kind === "agricultural" && (
          <label className="block">
            <span className={label}>{c.frontage}</span>
            <select className={select} value={frontage} onChange={(e) => setFrontage(e.target.value as AgriFrontage)}>
              {AGRI_FRONTAGES.filter((f) => row.agriLakhPerHa[f] !== null).map((f) => (
                <option key={f} value={f}>
                  {agriFrontageLabel[f][locale]}
                </option>
              ))}
            </select>
          </label>
        )}

        {segments.length > 0 && kind !== "agricultural" && (
          <label className="block sm:col-span-2">
            <span className={label}>{c.onSegment}</span>
            <select className={select} value={segmentId} onChange={(e) => setSegmentId(e.target.value)}>
              <option value="none">—</option>
              {segments.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.segmentHi.slice(0, 70)}
                </option>
              ))}
            </select>
          </label>
        )}

        <label className="block">
          <span className={label}>{c.buyer}</span>
          <select className={select} value={buyer} onChange={(e) => setBuyer(e.target.value as BuyerCategory)}>
            {BUYERS.map((b) => (
              <option key={b} value={b}>
                {buyerCategoryLabels[b][locale]}
              </option>
            ))}
          </select>
        </label>

        <fieldset className="sm:col-span-2">
          <legend className={label}>{c.rulesApplied}</legend>
          <div className="flex flex-col gap-2 text-sm">
            {kind !== "agricultural" && (
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={nearCommercial} onChange={(e) => setNearCommercial(e.target.checked)} />
                {c.nearCommercial}
              </label>
            )}
            {kind === "agricultural" && (
              <>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={nearActivity} onChange={(e) => setNearActivity(e.target.checked)} />
                  {c.nearActivity}
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={adjoiningAbadi} onChange={(e) => setAdjoiningAbadi(e.target.checked)} />
                  {c.adjoiningAbadi}
                </label>
                <label className="flex items-center gap-2">
                  {c.adjoiningRoads}
                  <select
                    className="rounded-lg border border-line bg-card px-2 py-1"
                    value={adjoiningRoads}
                    onChange={(e) => setAdjoiningRoads(Number(e.target.value) as 0 | 1 | 2)}
                  >
                    <option value={0}>0</option>
                    <option value={1}>1</option>
                    <option value={2}>2+</option>
                  </select>
                </label>
              </>
            )}
          </div>
        </fieldset>
      </div>

      {/* result */}
      <div className="rounded-xl border border-line bg-cream-deep p-4">
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-muted">{c.baseValue}</dt>
            <dd className="tabular-nums">{money(result.v.baseValue)}</dd>
          </div>
          {result.v.upliftPct !== 0 && (
            <div className="flex justify-between gap-3">
              <dt className="text-muted">
                {c.adjustments} (+{result.v.upliftPct}%)
              </dt>
              <dd className="tabular-nums">{money(result.v.circleValue - result.v.baseValue)}</dd>
            </div>
          )}
          <div className="flex justify-between gap-3 border-t border-line pt-2 font-semibold">
            <dt>{c.circleValue}</dt>
            <dd className="tabular-nums">{money(result.v.circleValue)}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted">
              {ui[locale].stampDuty} ({result.rule.stampDutyPct}%)
            </dt>
            <dd className="tabular-nums">{money(result.stampDuty)}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted">
              {c.registrationFee} ({result.rule.registrationFeePct}%)
            </dt>
            <dd className="tabular-nums">{money(result.registrationFee)}</dd>
          </div>
          <div className="flex justify-between gap-3 border-t border-line pt-2 font-semibold">
            <dt>{c.total}</dt>
            <dd className="tabular-nums">{money(result.total)}</dd>
          </div>
        </dl>

        <ul className="mt-4 space-y-1 border-t border-line pt-3 text-xs text-muted">
          {result.v.largePlot && <li>{c.largePlotNote}</li>}
          {result.v.applied.map((r) => (
            <li key={r.id}>
              +{r.pct}% — {locale === "hi" ? r.labelHi : r.label} ({r.instruction})
            </li>
          ))}
          {result.v.applied.length === 0 && !result.v.largePlot && <li>{c.noRulesApplied}</li>}
          {result.v.notes.includes("segment-not-applicable-to-agricultural") && <li>{c.segmentNotForAgri}</li>}
          {result.v.notes.includes("agri-rate-missing-for-frontage") && <li>{c.noAgriHere}</li>}
        </ul>

        <p className="mt-3 border-t border-line pt-3 text-xs font-semibold text-ink">{c.estimateOnly}</p>
      </div>
    </div>
  );
}

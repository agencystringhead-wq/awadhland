"use client";

/**
 * Plot yield calculator (spec Template 7): what a land purchase costs to get into, what it might
 * return on the reader's own assumptions, and how that compares with a fixed deposit.
 *
 * The maths is lib/yield.ts (pure, unit-tested). What it is fed is the site's own data, not new
 * constants: duty from data/stampDutyRules.json through lib/stamp-duty, the circle value from
 * lib/valuation on the picked row with that city's rules, the bigha from data/units.json, and the
 * place search from the circle rate lookup (components/PlaceSearch).
 *
 * Every input is mirrored into the query string, so Share gives a link that reloads the same
 * result, and ?loc=<row id> (from the lookup and the village pages) preselects the place.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { PlaceCombobox, useLookupData } from "@/components/PlaceSearch";
import { whatsappHref } from "@/components/WhatsAppButton";
import { formatNumber, type Locale } from "@/lib/i18n";
import type { LookupEntry, LookupHit } from "@/lib/lookup";
import type { RateRow, StampDutyRule, ValuationRules } from "@/lib/schemas";
import { extraRoadWidths, valuePlot, type LandKind } from "@/lib/valuation";
import {
  APPRECIATION_PRESETS,
  areaToSqm,
  computeYield,
  groupIndian,
  MAX_YEARS,
  MIN_YEARS,
  parseIndian,
  SQFT_PER_SQM,
  YIELD_AREA_UNITS,
  YIELD_DEFAULTS,
  type YieldAreaUnit,
} from "@/lib/yield";
import { buyerLabel, yc, yieldUnitLabel } from "@/lib/yield-copy";

type Buyer = "male" | "female" | "joint";

export type PlotYieldCalculatorProps = {
  locale: Locale;
  whatsapp: string;
  /** m² in one local bigha, from data/units.json */
  bighaSqm: number;
  dutyRules: StampDutyRule[];
  /** each city's valuation rules (lib/rates getValuationRules), for the circle value */
  rulesByCity: Record<string, ValuationRules>;
  hubs: { id: string; name: string; href: string }[];
};

type State = {
  loc: string;
  area: number;
  unit: YieldAreaUnit;
  road: string;
  land: "non-agricultural" | "agricultural";
  priceMode: "total" | "sqft";
  price: number;
  buyer: Buyer;
  broker: number;
  years: number;
  appr: number;
  income: number;
  incomeGrowth: number;
  holding: number;
  selling: number;
  fd: number;
};

const DEFAULTS: State = {
  loc: "",
  area: 1000,
  unit: "sqft",
  road: "",
  land: "non-agricultural",
  priceMode: "total",
  price: 20_00_000,
  buyer: "male",
  broker: YIELD_DEFAULTS.brokerLegalPct,
  years: YIELD_DEFAULTS.years,
  appr: YIELD_DEFAULTS.appreciationPct,
  income: 0,
  incomeGrowth: YIELD_DEFAULTS.incomeGrowthPct,
  holding: YIELD_DEFAULTS.holdingCostPerYear,
  selling: YIELD_DEFAULTS.sellingCostPct,
  fd: YIELD_DEFAULTS.fdRatePct,
};

/** Query-string keys, short so a shared link stays readable. */
const KEYS: Record<keyof State, string> = {
  loc: "loc",
  area: "a",
  unit: "u",
  road: "rw",
  land: "lt",
  priceMode: "pm",
  price: "p",
  buyer: "b",
  broker: "bk",
  years: "y",
  appr: "g",
  income: "i",
  incomeGrowth: "ig",
  holding: "h",
  selling: "s",
  fd: "fd",
};

function readState(search: string): State {
  const q = new URLSearchParams(search);
  const s: State = { ...DEFAULTS };
  const num = (k: keyof State) => {
    const v = q.get(KEYS[k]);
    const n = v === null ? NaN : Number(v);
    return Number.isFinite(n) ? n : (DEFAULTS[k] as number);
  };
  s.loc = q.get("loc") ?? "";
  s.area = num("area");
  const u = q.get(KEYS.unit) as YieldAreaUnit | null;
  if (u && YIELD_AREA_UNITS.includes(u)) s.unit = u;
  s.road = q.get(KEYS.road) ?? "";
  if (q.get(KEYS.land) === "agricultural") s.land = "agricultural";
  if (q.get(KEYS.priceMode) === "sqft") s.priceMode = "sqft";
  s.price = num("price");
  const b = q.get(KEYS.buyer);
  if (b === "female" || b === "joint") s.buyer = b;
  s.broker = num("broker");
  s.years = Math.min(MAX_YEARS, Math.max(MIN_YEARS, Math.round(num("years"))));
  s.appr = num("appr");
  s.income = num("income");
  s.incomeGrowth = num("incomeGrowth");
  s.holding = num("holding");
  s.selling = num("selling");
  s.fd = num("fd");
  return s;
}

function writeState(s: State): string {
  const q = new URLSearchParams();
  (Object.keys(KEYS) as (keyof State)[]).forEach((k) => {
    const v = s[k];
    if (v === DEFAULTS[k] || v === "") return;
    q.set(KEYS[k], String(v));
  });
  const str = q.toString();
  return str ? `?${str}` : "";
}

const field = "block w-full rounded-lg border border-line bg-card px-3 py-2.5 text-[16px] text-ink focus:border-accent";
const label = "block text-sm font-medium text-ink-soft";
const fmt = (s: string, vars: Record<string, string>) => s.replace(/\{(\w+)\}/g, (_, k: string) => vars[k] ?? "");
const inr = (n: number) => `${n < 0 ? "−" : ""}₹${formatNumber(Math.abs(Math.round(n)))}`;
const pct = (n: number | null, digits = 1) => (n === null || !Number.isFinite(n) ? "—" : `${(n * 100).toFixed(digits)}%`);

/** A rupee field with Indian grouping as you type: 100000 shows as 1,00,000. */
function MoneyInput({ id, value, onChange, placeholder }: { id: string; value: number; onChange: (n: number) => void; placeholder?: string }) {
  return (
    <div className="relative mt-1">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft">₹</span>
      <input
        id={id}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        className={`${field} pl-7 tabular-nums`}
        value={groupIndian(value)}
        placeholder={placeholder ?? "0"}
        onChange={(e) => onChange(parseIndian(e.target.value))}
      />
    </div>
  );
}

function PctInput({ id, value, onChange, step = 0.5 }: { id: string; value: number; onChange: (n: number) => void; step?: number }) {
  return (
    <div className="relative mt-1">
      <input
        id={id}
        type="number"
        inputMode="decimal"
        step={step}
        min={-50}
        max={100}
        className={`${field} pr-8 tabular-nums`}
        value={Number.isFinite(value) ? value : ""}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft">%</span>
    </div>
  );
}

export function PlotYieldCalculator({ locale, whatsapp, bighaSqm, dutyRules, rulesByCity, hubs }: PlotYieldCalculatorProps) {
  const c = yc(locale);
  const hi = locale === "hi";
  const { index, indexState, loadIndex, loadChunk, chunkFor, openById } = useLookupData();
  const [st, setSt] = useState<State>(DEFAULTS);
  const [query, setQuery] = useState("");
  const [entry, setEntry] = useState<LookupEntry | null>(null);
  const [copied, setCopied] = useState(false);
  const ready = useRef(false);
  const set = <K extends keyof State>(k: K, v: State[K]) => setSt((s) => ({ ...s, [k]: v }));

  /* read the inputs from the URL once, including a preselected place */
  useEffect(() => {
    const s = readState(window.location.search);
    setSt(s);
    ready.current = true;
    if (s.loc) {
      void openById(s.loc).then((hit) => {
        if (!hit) return;
        setEntry(hit.e);
        setQuery(hi ? hit.e[1] : hit.e[2]);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- read once, on load
  }, []);

  /* mirror the inputs into the URL, so the address bar is the share link */
  useEffect(() => {
    if (!ready.current) return;
    const url = `${window.location.pathname}${writeState(st)}`;
    window.history.replaceState(null, "", url);
  }, [st]);

  /* the picked place's record */
  const chunk = index && entry ? chunkFor(index, entry) : undefined;
  const rateChunk = chunk && chunk !== "loading" && chunk !== "error" && chunk.kind === "rates" ? chunk : null;
  // The chunk leaves out the transcriber's internal note; the valuation never reads it.
  const row = useMemo(() => {
    const r = rateChunk?.rows.find((x) => x.id === entry?.[0]);
    return r ? ({ ...r, note: null } as RateRow) : null;
  }, [rateChunk, entry]);
  const awaited = chunk && chunk !== "loading" && chunk !== "error" && chunk.kind === "frontage";
  const cityId = index && entry ? index.cities[index.sros[entry[3]].city].id : null;
  const rules = cityId ? rulesByCity[cityId] : undefined;

  // Road widths this row prints, plus any the city's rules add (Gorakhpur: over 12 m).
  const widths = useMemo(() => {
    if (!row || !rateChunk || !rules) return [];
    return [...rateChunk.bands.filter((b) => typeof row.nonAgri[b.key] === "number"), ...extraRoadWidths(rules, row)];
  }, [row, rateChunk, rules]);
  const hasAgri = !!row && (row.agriGrid ? true : Object.values(row.agriLakhPerHa).some((v) => v !== null));
  const hasLand = !!row && Object.keys(row.nonAgri).length > 0;

  // Keep the road band and land type valid for the row picked.
  useEffect(() => {
    if (!row) return;
    setSt((s) => {
      const road = widths.some((w) => w.key === s.road) ? s.road : (widths[0]?.key ?? "");
      const land = s.land === "agricultural" && !hasAgri ? "non-agricultural" : s.land === "non-agricultural" && !hasLand && hasAgri ? "agricultural" : s.land;
      return road === s.road && land === s.land ? s : { ...s, road, land };
    });
  }, [row, widths, hasAgri, hasLand]);

  const areaSqm = areaToSqm(st.area, st.unit, bighaSqm);
  const areaSqft = areaSqm * SQFT_PER_SQM;
  const priceTotal = st.priceMode === "total" ? st.price : st.price * areaSqft;

  const circleValue = useMemo(() => {
    if (!row || !rules || areaSqm <= 0) return null;
    const kind: LandKind = st.land;
    const frontage = row.agriGrid ? "other" : "general";
    const v = valuePlot({ row, kind, areaSqm, rules, roadWidth: st.road || undefined, frontage });
    return v.circleValue > 0 ? v.circleValue : null;
  }, [row, rules, areaSqm, st.land, st.road]);

  const result = useMemo(
    () =>
      computeYield({
        price: priceTotal,
        circleValue,
        buyer: st.buyer,
        dutyRules,
        brokerLegalPct: st.broker,
        years: st.years,
        appreciationPct: st.appr,
        incomePerYear: st.income,
        incomeGrowthPct: st.incomeGrowth,
        holdingCostPerYear: st.holding,
        sellingCostPct: st.selling,
        fdRatePct: st.fd,
      }),
    [priceTotal, circleValue, st, dutyRules],
  );

  const pick = (h: LookupHit) => {
    if (!index || h.type !== "place") return;
    setEntry(h.entry);
    setQuery(hi ? h.entry[1] : h.entry[2]);
    loadChunk(index, h.entry);
    set("loc", h.entry[0]);
  };
  const clearPlace = () => {
    setEntry(null);
    setQuery("");
    setSt((s) => ({ ...s, loc: "", road: "" }));
  };

  const share = async () => {
    try {
      if (navigator.share) await navigator.share({ url: window.location.href });
      else await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      /* the reader cancelled the share sheet */
    }
  };

  const placeName = entry ? (hi ? entry[1] : entry[2]) : "";
  const sizeText = `${formatNumber(st.area)} ${yieldUnitLabel[st.unit][locale]}`;
  const waText = hi
    ? `नमस्ते, मैं ${placeName ? `${placeName} में ` : ""}${sizeText} का प्लॉट देख रहा/रही हूँ, दाम ${inr(priceTotal)}। awadhland.com के कैलकुलेटर पर हिसाब लगाया: ${st.years} साल, ${st.appr}% सालाना बढ़त मानकर। इस पर बात करनी है। ${typeof window !== "undefined" ? window.location.href : ""}`
    : `Hi, I am looking at a ${sizeText} plot${placeName ? ` in ${placeName}` : ""} for ${inr(priceTotal)}. I ran it through the calculator on awadhland.com over ${st.years} years at ${st.appr}% a year. I would like to discuss it. ${typeof window !== "undefined" ? window.location.href : ""}`;

  /* ---------------------------------------------------------------- inputs */

  const presetLabel = { cautious: c.presetCautious, moderate: c.presetModerate, strong: c.presetStrong } as const;

  const inputs = (
    <form className="grid gap-4" onSubmit={(e) => e.preventDefault()}>
      <div>
        <PlaceCombobox
          locale={locale}
          index={index}
          indexState={indexState}
          onNeedIndex={() => void loadIndex()}
          query={query}
          onQuery={(q) => {
            setQuery(q);
            if (entry && q !== (hi ? entry[1] : entry[2])) clearPlace();
          }}
          onPick={pick}
          placesOnly
          label={c.place}
          optional={c.optional}
          placeholder={c.placePlaceholder}
          hint={c.placeHint}
          loadingText={c.loading}
          failedText={c.loadFailed}
          sroSuggestionText=""
          listLabel={c.listLabel}
        />
        {entry && (
          <p className="mt-2 flex flex-wrap items-center gap-x-3 text-sm">
            {awaited ? <span className="text-ink-soft">{c.placeAwaited}</span> : null}
            <button type="button" className="underline" onClick={clearPlace}>
              {c.clearPlace}
            </button>
          </p>
        )}
      </div>

      <div className="grid grid-cols-[1fr_auto] gap-2">
        <label className="block" htmlFor="py-area">
          <span className={label}>{c.area}</span>
          <input
            id="py-area"
            type="number"
            inputMode="decimal"
            min={0}
            step="any"
            className={`${field} mt-1 tabular-nums`}
            value={st.area || ""}
            onChange={(e) => set("area", Math.max(0, Number(e.target.value)))}
          />
        </label>
        <label className="block">
          <span className={label}>{c.unit}</span>
          <select className={`${field} mt-1`} value={st.unit} onChange={(e) => set("unit", e.target.value as YieldAreaUnit)}>
            {YIELD_AREA_UNITS.map((u) => (
              <option key={u} value={u}>
                {yieldUnitLabel[u][locale]}
              </option>
            ))}
          </select>
        </label>
      </div>

      {row && hasAgri && hasLand && (
        <label className="block">
          <span className={label}>{c.landKind}</span>
          <select className={`${field} mt-1`} value={st.land} onChange={(e) => set("land", e.target.value as State["land"])}>
            <option value="non-agricultural">{c.landPlot}</option>
            <option value="agricultural">{c.landFarm}</option>
          </select>
        </label>
      )}

      {row && st.land === "non-agricultural" && widths.length > 0 && (
        <label className="block">
          <span className={label}>{c.roadWidth}</span>
          <select className={`${field} mt-1`} value={st.road} onChange={(e) => set("road", e.target.value)}>
            {widths.map((w) => (
              <option key={w.key} value={w.key}>
                {hi ? w.labelHi : w.labelEn}
              </option>
            ))}
          </select>
        </label>
      )}

      <fieldset>
        <legend className={label}>{c.price}</legend>
        <div className="mt-1 inline-flex rounded-full border border-line bg-card p-0.5">
          {(["total", "sqft"] as const).map((m) => (
            <button
              key={m}
              type="button"
              aria-pressed={st.priceMode === m}
              onClick={() => {
                // Keep the same total when switching, so the result does not jump.
                const v = m === "total" ? Math.round(priceTotal) : areaSqft > 0 ? Math.round(priceTotal / areaSqft) : 0;
                setSt((s) => ({ ...s, priceMode: m, price: v }));
              }}
              className={`rounded-full px-3.5 py-1.5 text-sm ${st.priceMode === m ? "bg-ink text-card" : "text-ink-soft"}`}
            >
              {m === "total" ? c.priceTotal : c.pricePerSqft}
            </button>
          ))}
        </div>
        <MoneyInput id="py-price" value={st.price} onChange={(n) => set("price", n)} />
        {st.priceMode === "sqft" && (
          <p className="mt-1 text-xs text-muted">
            {c.priceIs}: {inr(priceTotal)}
          </p>
        )}
      </fieldset>

      <fieldset>
        <legend className={label}>{c.buyer}</legend>
        <div className="mt-1 flex flex-wrap gap-2">
          {(["male", "female", "joint"] as const).map((b) => (
            <label key={b} className={`chip cursor-pointer border ${st.buyer === b ? "border-accent bg-accent-soft text-accent-deep" : "border-line bg-card text-ink-soft"}`}>
              <input type="radio" name="py-buyer" value={b} checked={st.buyer === b} onChange={() => set("buyer", b)} className="sr-only" />
              {buyerLabel[b][locale]}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block" htmlFor="py-broker">
          <span className={label}>{c.brokerLegal}</span>
          <PctInput id="py-broker" value={st.broker} onChange={(n) => set("broker", n)} />
        </label>
        <label className="block" htmlFor="py-years">
          <span className={label}>
            {c.years}: {st.years} {c.yearsUnit}
          </span>
          <input
            id="py-years"
            type="range"
            min={MIN_YEARS}
            max={MAX_YEARS}
            step={1}
            value={st.years}
            onChange={(e) => set("years", Number(e.target.value))}
            className="mt-3 w-full accent-[var(--color-accent)]"
          />
        </label>
      </div>

      <fieldset>
        <legend className={label}>{c.appreciation}</legend>
        <div className="mt-1 flex flex-wrap gap-2">
          {APPRECIATION_PRESETS.map((p) => (
            <button
              key={p.key}
              type="button"
              aria-pressed={st.appr === p.pct}
              onClick={() => set("appr", p.pct)}
              className={`chip border ${st.appr === p.pct ? "border-accent bg-accent-soft text-accent-deep" : "border-line bg-card text-ink-soft"}`}
            >
              {presetLabel[p.key]} {p.pct}%
            </button>
          ))}
        </div>
        <PctInput id="py-appr" value={st.appr} onChange={(n) => set("appr", n)} />
        <p className="mt-1 text-xs text-muted">{c.presetsNote}</p>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block" htmlFor="py-income">
          <span className={label}>
            {c.income} <span className="font-normal text-muted">({c.optional})</span>
          </span>
          <MoneyInput id="py-income" value={st.income} onChange={(n) => set("income", n)} />
          <span className="mt-1 block text-xs text-muted">{c.incomeHint}</span>
        </label>
        <label className="block" htmlFor="py-ig">
          <span className={label}>{c.incomeGrowth}</span>
          <PctInput id="py-ig" value={st.incomeGrowth} onChange={(n) => set("incomeGrowth", n)} />
        </label>
        <label className="block" htmlFor="py-holding">
          <span className={label}>{c.holding}</span>
          <MoneyInput id="py-holding" value={st.holding} onChange={(n) => set("holding", n)} />
          <span className="mt-1 block text-xs text-muted">{c.holdingHint}</span>
        </label>
        <label className="block" htmlFor="py-selling">
          <span className={label}>{c.selling}</span>
          <PctInput id="py-selling" value={st.selling} onChange={(n) => set("selling", n)} />
        </label>
        <label className="block" htmlFor="py-fd">
          <span className={label}>{c.fdRate}</span>
          <PctInput id="py-fd" value={st.fd} onChange={(n) => set("fd", n)} step={0.25} />
        </label>
      </div>
    </form>
  );

  /* --------------------------------------------------------------- results */

  const r = result;
  const tiles = [
    { k: c.totalCost, v: inr(r.totalCost) },
    { k: c.exitValue, v: inr(r.exitValueNet), note: c.exitValueNote },
    { k: c.netProfit, v: inr(r.netProfit), tone: r.netProfit < 0 ? "text-maroon" : "" },
    { k: c.cagr, v: pct(r.cagr) },
    { k: c.irr, v: pct(r.irr) },
  ];
  const fdText = fmt(c.fdLine, {
    cost: inr(r.totalCost),
    rate: String(st.fd),
    years: String(r.years.length),
    value: inr(r.fdValue),
    profit: inr(r.fdProfit),
  });

  const results = (
    <section id="yield-print" aria-live="polite" className="grid gap-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-2xl">{c.resultsTitle}</h2>
        <span className="caption-mono text-muted">{c.beforeTax}</span>
      </div>

      {/* what was assumed, for the printed summary */}
      <dl className="hidden gap-x-6 text-sm print:grid print:grid-cols-2">
        <dt className="font-semibold">{c.printInputs}</dt>
        <dd />
        {placeName && (
          <>
            <dt>{c.place}</dt>
            <dd>{placeName}</dd>
          </>
        )}
        <dt>{c.area}</dt>
        <dd>{sizeText}</dd>
        <dt>{c.priceIs}</dt>
        <dd>{inr(priceTotal)}</dd>
        <dt>{c.buyer}</dt>
        <dd>{buyerLabel[st.buyer][locale]}</dd>
        <dt>{c.years}</dt>
        <dd>
          {st.years} {c.yearsUnit}
        </dd>
        <dt>{c.appreciation}</dt>
        <dd>{st.appr}%</dd>
        <dt>{c.income}</dt>
        <dd>
          {inr(st.income)} (+{st.incomeGrowth}%)
        </dd>
        <dt>{c.holding}</dt>
        <dd>{inr(st.holding)}</dd>
        <dt>{c.brokerLegal}</dt>
        <dd>{st.broker}%</dd>
        <dt>{c.selling}</dt>
        <dd>{st.selling}%</dd>
      </dl>

      {r.dutyOnCircleValue && (
        <p role="status" className="rounded-xl border border-gold bg-band-mid px-4 py-3 text-sm text-ink">
          {fmt(c.circleNote, { value: inr(r.dutyBase) })}
        </p>
      )}

      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {tiles.map((t, i) => (
          <div key={t.k} className={`rounded-xl border border-line bg-card p-3.5 ${i === 0 ? "col-span-2 lg:col-span-1" : ""}`}>
            <dt className="caption-mono text-muted">{t.k}</dt>
            <dd className={`mt-1 text-xl font-semibold tabular-nums ${t.tone ?? ""}`}>{t.v}</dd>
            {t.note && <dd className="text-xs text-muted">{t.note}</dd>}
          </div>
        ))}
      </dl>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-line bg-card p-4">
          <h3 className="caption-mono mb-2 text-muted">{c.breakdown}</h3>
          <dl className="divide-y divide-line text-sm">
            {[
              [c.purchasePrice, inr(priceTotal)],
              [`${c.stampDuty} (${r.dutyRule.stampDutyPct}%)`, inr(r.stampDuty)],
              [`${c.registration} (${r.dutyRule.registrationFeePct}%)`, inr(r.registrationFee)],
              [`${c.brokerLegalShort} (${st.broker}%)`, inr(r.brokerLegal)],
              [c.totalCost, inr(r.totalCost)],
              ...(circleValue !== null ? [[c.circleValue, inr(circleValue)]] : []),
            ].map(([k, v], i) => (
              <div key={k} className={`flex justify-between gap-3 py-1.5 ${i === 4 ? "font-semibold" : ""}`}>
                <dt className="text-ink-soft">{k}</dt>
                <dd className="tabular-nums">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="rounded-xl border border-line bg-card p-4">
          <dl className="divide-y divide-line text-sm">
            {[
              [c.multiple, `${r.multiple.toFixed(2)}×`],
              [c.totalIncome, inr(r.totalIncome)],
              [c.holdingTotal, inr(r.totalHoldingCost)],
              [c.grossYield, pct(r.grossYield, 2)],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-3 py-1.5">
                <dt className="text-ink-soft">{k}</dt>
                <dd className="tabular-nums">{v}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 text-sm">
            {fdText} <span className="font-semibold">{r.fdValue > r.exitValueNet + r.totalIncome - r.totalHoldingCost ? c.fdBetter : c.plotBetter}</span>
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-line bg-card p-4">
        <h3 className="caption-mono mb-3 text-muted">{c.chartTitle}</h3>
        <YieldChart locale={locale} years={r.years} start={priceTotal} startFd={r.totalCost} plotLabel={c.chartPlot} fdLabel={c.chartFd} />
      </div>

      <div className="overflow-x-auto rounded-xl border border-line bg-card">
        <table className="w-full min-w-[22rem] text-sm">
          <caption className="caption-mono px-4 pt-3 text-left text-muted">{c.tableTitle}</caption>
          <thead>
            <tr>
              {[c.year, c.value, c.incomeCol, c.cumulative].map((h, i) => (
                <th key={h} scope="col" className={`px-4 py-2 font-semibold ${i ? "text-right" : "text-left"}`}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border-t border-line px-4 py-1.5">0</td>
              <td className="border-t border-line px-4 py-1.5 text-right tabular-nums">{inr(priceTotal)}</td>
              <td className="border-t border-line px-4 py-1.5 text-right tabular-nums">—</td>
              <td className="border-t border-line px-4 py-1.5 text-right tabular-nums">{inr(-r.totalCost)}</td>
            </tr>
            {r.years.map((y) => (
              <tr key={y.year}>
                <td className="border-t border-line px-4 py-1.5">{y.year}</td>
                <td className="border-t border-line px-4 py-1.5 text-right tabular-nums">{inr(y.value)}</td>
                <td className="border-t border-line px-4 py-1.5 text-right tabular-nums">{y.income ? inr(y.income) : "—"}</td>
                <td className={`border-t border-line px-4 py-1.5 text-right tabular-nums ${y.cumulative < 0 ? "text-maroon" : ""}`}>{inr(y.cumulative)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <details className="rounded-xl border border-line bg-card p-4">
        <summary className="cursor-pointer font-semibold">{c.taxTitle}</summary>
        <p className="mt-2 text-sm text-ink-soft">{c.taxBody}</p>
      </details>

      <div className="flex flex-wrap gap-2 print:hidden">
        <button type="button" onClick={() => window.print()} className="btn btn-primary px-4 py-2.5 text-sm">
          {c.download}
        </button>
        <button type="button" onClick={() => void share()} className="btn border border-line bg-card px-4 py-2.5 text-sm text-ink hover:bg-cream-deep">
          {copied ? c.copied : c.share}
        </button>
        <a href={whatsappHref(whatsapp, waText)} rel="noopener" className="btn bg-whatsapp px-4 py-2.5 text-sm text-white hover:bg-accent-deep hover:text-white">
          {c.whatsapp}
        </a>
      </div>

      <p className="border-t border-line pt-3 text-sm font-semibold">{c.disclaimer}</p>
      <p className="text-xs text-muted">{c.estimateNote}</p>
    </section>
  );

  return (
    <div data-component="PlotYieldCalculator" className="grid gap-8 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
      <div className="print:hidden">
        <h2 className="mb-4 text-2xl">{c.inputsTitle}</h2>
        {inputs}
      </div>
      <div className="min-w-0">{results}</div>
      <noscript>
        <p className="text-ink-soft">
          {c.fallback}{" "}
          {hubs.map((h, i) => (
            <span key={h.id}>
              {i > 0 && " · "}
              <a href={h.href}>{h.name} →</a>
            </span>
          ))}
        </p>
      </noscript>
    </div>
  );
}

/* ------------------------------------------------------------------ chart */

/**
 * Plot value against the same total cost in a fixed deposit, year 0 to exit. Inline SVG: the page
 * loads no chart library (CLAUDE.md allows no third-party scripts here).
 */
function YieldChart({
  locale,
  years,
  start,
  startFd,
  plotLabel,
  fdLabel,
}: {
  locale: Locale;
  years: { year: number; value: number; fdValue: number }[];
  start: number;
  startFd: number;
  plotLabel: string;
  fdLabel: string;
}) {
  const W = 640;
  const H = 240;
  const pad = { l: 64, r: 12, t: 12, b: 28 };
  const plot = [start, ...years.map((y) => y.value)];
  const fd = [startFd, ...years.map((y) => y.fdValue)];
  const max = Math.max(...plot, ...fd, 1);
  const min = Math.min(...plot, ...fd, 0);
  const n = plot.length - 1 || 1;
  const x = (i: number) => pad.l + (i / n) * (W - pad.l - pad.r);
  const y = (v: number) => pad.t + (1 - (v - min) / (max - min || 1)) * (H - pad.t - pad.b);
  const line = (vals: number[]) => vals.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const ticks = [0, 0.5, 1].map((f) => min + f * (max - min));
  const short = (v: number) =>
    v >= 1e7 ? `₹${(v / 1e7).toFixed(1)} ${locale === "hi" ? "क." : "cr"}` : v >= 1e5 ? `₹${(v / 1e5).toFixed(1)} ${locale === "hi" ? "ला." : "L"}` : `₹${formatNumber(v)}`;
  return (
    <figure>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${plotLabel} / ${fdLabel}`} className="h-auto w-full">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} stroke="var(--color-line)" strokeWidth="1" />
            <text x={pad.l - 6} y={y(t) + 4} textAnchor="end" fontSize="11" fill="var(--color-muted)">
              {short(t)}
            </text>
          </g>
        ))}
        {[0, n].map((i) => (
          <text key={i} x={x(i)} y={H - 8} textAnchor={i ? "end" : "start"} fontSize="11" fill="var(--color-muted)">
            {i}
          </text>
        ))}
        <path d={line(fd)} fill="none" stroke="var(--color-muted)" strokeWidth="2" strokeDasharray="5 4" />
        <path d={line(plot)} fill="none" stroke="var(--color-accent)" strokeWidth="2.5" />
      </svg>
      <figcaption className="mt-2 flex flex-wrap gap-4 text-xs text-ink-soft">
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-5 bg-accent" /> {plotLabel}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-0 w-5 border-t-2 border-dashed border-muted" /> {fdLabel}
        </span>
      </figcaption>
    </figure>
  );
}

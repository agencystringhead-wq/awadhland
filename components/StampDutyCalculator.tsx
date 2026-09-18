"use client";

/**
 * Stamp duty calculator (spec Template 7 and Template 5, section 2). Client-side only: inputs
 * come from the prerendered circle-rate schedule and stamp duty rules passed as props; nothing is
 * fetched. Computation lives in lib/stamp-duty.ts. The result carries a WhatsApp button that
 * prefills the inputs and figures into the message.
 */
import { useMemo, useState } from "react";
import { Calculator } from "@/components/Calculator";
import { whatsappHref } from "@/components/WhatsAppButton";
import { formatDate, formatNumber, type Locale, ui } from "@/lib/i18n";
import { buyerCategoryLabels } from "@/lib/labels";
import { AREA_UNITS, BUYER_CATEGORIES, LAND_TYPES, computeStampDuty, type AreaUnit, type BuyerCategory, type LandType } from "@/lib/stamp-duty";
import type { StampDutyCalculatorData } from "@/lib/tools";

export type StampDutyCalculatorProps = {
  locale: Locale;
  data: StampDutyCalculatorData;
  /** wa.me number for the "send this to us" button */
  whatsapp: string;
  /** preselect a city (circle-rate page) */
  defaultCityId?: string;
  /** preselect a locality (locality page, later) */
  defaultLocalityId?: string;
  title: string;
};

const field = "block w-full rounded-lg border border-line bg-card px-3 py-2 text-[15px] text-ink focus:border-accent";
const label = "block text-sm font-medium text-ink-soft";

export function StampDutyCalculator({ locale, data, whatsapp, defaultCityId, defaultLocalityId, title }: StampDutyCalculatorProps) {
  const t = ui[locale];
  const cities = data.cities;
  const [cityId, setCityId] = useState(() => (cities.some((c) => c.id === defaultCityId) ? defaultCityId! : (cities[0]?.id ?? "")));
  const city = cities.find((c) => c.id === cityId) ?? cities[0];
  const [localityId, setLocalityId] = useState(() =>
    city?.localities.some((l) => l.id === defaultLocalityId) ? defaultLocalityId! : (city?.localities[0]?.id ?? ""),
  );
  const locality = city?.localities.find((l) => l.id === localityId) ?? city?.localities[0];
  const [landType, setLandType] = useState<LandType>("residential");
  const [areaText, setAreaText] = useState("");
  const [unit, setUnit] = useState<AreaUnit>("sqft");
  const [buyer, setBuyer] = useState<BuyerCategory>("male");

  const area = Number(areaText.replace(/,/g, ""));
  const valid = Number.isFinite(area) && area > 0 && locality !== undefined;

  const result = useMemo(
    () => (valid && locality ? computeStampDuty({ rate: locality, landType, area, unit, buyer, rules: data.rules }) : null),
    [valid, locality, landType, area, unit, buyer, data.rules],
  );

  const unitLabel: Record<AreaUnit, string> = {
    sqft: t.sqFt,
    sqm: t.unitSqM,
    sqyd: t.sqYd,
    acre: t.acre,
    hectare: t.unitHectare,
  };
  const landLabel: Record<LandType, string> = { residential: t.residential, commercial: t.commercial, agricultural: t.agricultural };

  const onCity = (id: string) => {
    setCityId(id);
    const next = cities.find((c) => c.id === id);
    setLocalityId(next?.localities[0]?.id ?? "");
  };

  const message =
    result && city && locality
      ? locale === "hi"
        ? `नमस्ते, मैंने awadhland.com के स्टाम्प ड्यूटी कैलकुलेटर से हिसाब लगाया: ${locality.name}, ${city.name}, ${landLabel[landType]}, ${formatNumber(area)} ${unitLabel[unit]}, ${buyerCategoryLabels[buyer].hi} ख़रीदार। सर्किल मूल्य ₹${formatNumber(result.circleValue)}, स्टाम्प ड्यूटी ₹${formatNumber(result.stampDuty)}, रजिस्ट्री ₹${formatNumber(result.registrationFee)}, कुल ₹${formatNumber(result.total)}। इस पर बात करनी है।`
        : `Hi, I used the stamp duty calculator on awadhland.com: ${locality.name}, ${city.name}, ${landLabel[landType]}, ${formatNumber(area)} ${unitLabel[unit]}, ${buyerCategoryLabels[buyer].en} buyer. Circle value ₹${formatNumber(result.circleValue)}, stamp duty ₹${formatNumber(result.stampDuty)}, registration ₹${formatNumber(result.registrationFee)}, total ₹${formatNumber(result.total)}. I would like to talk about it.`
      : "";

  const inputs = (
    <form className="grid gap-4 sm:grid-cols-2" onSubmit={(e) => e.preventDefault()}>
      {cities.length > 1 && (
        <div className="sm:col-span-2">
          <label htmlFor="sd-city" className={label}>
            {t.city}
          </label>
          <select id="sd-city" className={`${field} mt-1`} value={city?.id ?? ""} onChange={(e) => onCity(e.target.value)}>
            {cities.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      )}
      <div className="sm:col-span-2">
        <label htmlFor="sd-locality" className={label}>
          {t.locality}
        </label>
        <select id="sd-locality" className={`${field} mt-1`} value={locality?.id ?? ""} onChange={(e) => setLocalityId(e.target.value)}>
          {(city?.localities ?? []).map((l) => (
            <option key={l.id} value={l.id}>
              {l.name} · {l.tehsil}
            </option>
          ))}
        </select>
      </div>
      <div className="sm:col-span-2">
        <label htmlFor="sd-land" className={label}>
          {t.landType}
        </label>
        <select id="sd-land" className={`${field} mt-1`} value={landType} onChange={(e) => setLandType(e.target.value as LandType)}>
          {LAND_TYPES.map((k) => (
            <option key={k} value={k}>
              {landLabel[k]}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="sd-area" className={label}>
          {t.area}
        </label>
        <input
          id="sd-area"
          className={`${field} mt-1 tabular-nums`}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          placeholder="1200"
          value={areaText}
          onChange={(e) => setAreaText(e.target.value)}
        />
      </div>
      <div>
        <label htmlFor="sd-unit" className={label}>
          {t.areaUnit}
        </label>
        <select id="sd-unit" className={`${field} mt-1`} value={unit} onChange={(e) => setUnit(e.target.value as AreaUnit)}>
          {AREA_UNITS.map((u) => (
            <option key={u} value={u}>
              {unitLabel[u]}
            </option>
          ))}
        </select>
      </div>
      <fieldset className="sm:col-span-2">
        <legend className={label}>{t.buyerCategory}</legend>
        <div className="mt-1 flex flex-wrap gap-2">
          {BUYER_CATEGORIES.map((b) => (
            <label
              key={b}
              className={`chip cursor-pointer border ${buyer === b ? "border-accent bg-accent-soft text-accent-deep" : "border-line bg-card text-ink-soft"}`}
            >
              <input type="radio" name="sd-buyer" value={b} checked={buyer === b} onChange={() => setBuyer(b)} className="sr-only" />
              {buyerCategoryLabels[b][locale]}
            </label>
          ))}
        </div>
      </fieldset>
    </form>
  );

  const money = (n: number) => `₹${formatNumber(n)}`;

  const output =
    result && city && locality ? (
      <div data-testid="sd-result">
        <dl className="divide-y divide-line">
          <div className="flex items-baseline justify-between gap-4 py-2 text-sm">
            <dt className="text-muted">{t.rateUsed}</dt>
            <dd className="text-right tabular-nums">
              {money(result.ratePerUnit)} {result.rateUnit === "hectare" ? t.perHectare : t.perSqM}
              <span className="block text-xs text-muted">
                {locality.href ? <a href={locality.href}>{locality.name}</a> : locality.name}, {t.effective} {formatDate(city.effectiveFrom, locale)}
              </span>
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-4 py-2">
            <dt className="text-ink-soft">{t.circleValue}</dt>
            <dd className="font-medium tabular-nums">{money(result.circleValue)}</dd>
          </div>
          <div className="flex items-baseline justify-between gap-4 py-2">
            <dt className="text-ink-soft">
              {t.stampDuty} <span className="text-sm text-muted">{result.stampDutyPct}%</span>
            </dt>
            <dd className="font-medium tabular-nums">{money(result.stampDuty)}</dd>
          </div>
          <div className="flex items-baseline justify-between gap-4 py-2">
            <dt className="text-ink-soft">
              {t.registrationFee} <span className="text-sm text-muted">{result.registrationFeePct}%</span>
            </dt>
            <dd className="font-medium tabular-nums">{money(result.registrationFee)}</dd>
          </div>
          <div className="flex items-baseline justify-between gap-4 py-3">
            <dt className="font-semibold">{t.totalPayable}</dt>
            <dd className="text-2xl font-semibold tabular-nums">{money(result.total)}</dd>
          </div>
        </dl>
        {result.rebateCapExceeded && <p className="mt-2 text-sm text-maroon">{t.rebateCapNote}</p>}
        <p className="mt-3 text-sm text-muted">{t.calculatorNote}</p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <a href={whatsappHref(whatsapp, message)} rel="noopener" className="btn bg-whatsapp text-white hover:bg-accent-deep hover:text-white px-4 py-2.5 text-sm">
            {t.sendToWhatsapp}
          </a>
          <a href={city.circleRatesHref} className="text-sm">
            {t.fullCircleRateTable} →
          </a>
        </div>
      </div>
    ) : (
      <p className="text-ink-soft">{t.enterArea}</p>
    );

  return (
    <Calculator
      title={title}
      inputs={inputs}
      result={output}
      fallback={
        <>
          {t.toolFallback}{" "}
          {city && (
            <a href={city.circleRatesHref}>
              {city.name} {t.circleRates} →
            </a>
          )}
        </>
      }
    />
  );
}

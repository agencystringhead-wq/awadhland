import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/Breadcrumb";
import { LeadForm } from "@/components/LeadForm";
import { Section } from "@/components/Section";
import { SourceStamp } from "@/components/SourceStamp";
import { TehsilRateTable } from "@/components/rates/TehsilRateTable";
import { InForceNote } from "@/components/rates/InForceNote";
import { tableColumns, toChunkRow } from "@/lib/rate-chunks";
import { getBroker, getCity } from "@/lib/data";
import { formatDate, formatNumber, localePath, pick, ui, type Locale } from "@/lib/i18n";
import { rc } from "@/lib/rate-copy";
import {
  getCurrentRateSchedule,
  getRoadSegmentsByTehsil,
  getRowsByTehsil,
  getTehsil,
  getTehsilSummary,
  getRateBands,
  getRoadBands,
  getValuationRules,
  rowEffectiveFrom,
} from "@/lib/rates";
import { sameAlternate } from "@/lib/routes";
import { agriUnitLabel } from "@/lib/units";
import { getFrontageOnlySros } from "@/lib/frontage";
import { FrontageTehsilTemplate } from "./FrontageTemplates";
import { PageShell } from "./PageShell";

const th = "px-3 py-2.5 text-left font-semibold whitespace-nowrap";
const td = "px-3 py-2 border-t border-line";
const numeric = "text-right tabular-nums";

/** Rows prerendered into the HTML; the rest arrive from the tehsil chunk on demand. */
const PRERENDERED_ROWS = 100;

/**
 * Template 5a: one tehsil of a published rate list. The full village table, then the road-segment
 * table, then the valuation rules the list prints. Every table carries its own source line naming
 * the SRO and the printed page, because the five SROs publish separately.
 */
export function RateTehsilTemplate({ locale, cityId, tehsilId }: { locale: Locale; cityId: string; tehsilId: string }) {
  // No rate list yet, only the khasra frontage list: a village index instead of a rate table.
  if (getFrontageOnlySros(cityId).includes(tehsilId)) return <FrontageTehsilTemplate locale={locale} cityId={cityId} tehsilId={tehsilId} />;
  const city = getCity(cityId);
  const tehsil = getTehsil(cityId, tehsilId);
  const schedule = getCurrentRateSchedule(cityId);
  const summary = getTehsilSummary(cityId, tehsilId);
  if (!city || !tehsil || !schedule || !summary || summary.rowCount === 0) notFound();

  const t = ui[locale];
  const c = rc(locale);
  const broker = getBroker();
  const rows = getRowsByTehsil(cityId, tehsilId);
  const segments = getRoadSegmentsByTehsil(cityId, tehsilId);
  const bands = getRateBands(cityId, tehsilId);
  // Road-width columns of this city’s list (three for Ayodhya, four for Lucknow). Distinct from
  // `bands` above, which groups rows that share an identical rate profile.
  const roadBands = getRoadBands(cityId, tehsilId);
  const roadBandKeys = roadBands.map((b) => b.key);
  const cols = tableColumns(schedule, tehsilId);
  // "Shop" in Ayodhya and Lucknow; Gorakhpur's shop figure is the land rate for a single shop.
  const shopLabel = cols.commercial.find((k) => k.key === "shop") ?? cols.commercial[0];
  const rules = getValuationRules(cityId);
  // The SRO's own date: Gorakhpur's Sadar-2 and Campierganj are on the 2015 list, the rest 2016.
  const effectiveFrom = rowEffectiveFrom(schedule, tehsilId);
  const cityName = pick(locale, city.name, city.nameHi);
  const tehsilName = pick(locale, tehsil.name, tehsil.nameHi);
  const sro = pick(locale, tehsil.sroName, tehsil.sroNameHi);
  const doc = schedule.sourceDocs.find((d) => d.sro === tehsilId);

  /** "IGRSUP list, <SRO>, effective 7 June 2025, printed page N" */
  const sourceLine = (page?: string) =>
    locale === "hi"
      ? `आईजीआरएसयूपी सूची, ${sro}, ${formatDate(effectiveFrom, locale)} से लागू${page ? `, मुद्रित पृष्ठ ${page}` : ""}`
      : `IGRSUP list, ${sro}, effective ${formatDate(effectiveFrom, locale)}${page ? `, printed page ${page}` : ""}`;

  // Gorakhpur's village rows carry no printed page, so its line names the SRO and date only.
  const pages = [...new Set(rows.flatMap((r) => (r.page ? [r.page] : [])))].sort();
  const segmentPages = [...new Set(segments.map((r) => r.page))].sort();

  return (
    <PageShell
      locale={locale}
      alternate={sameAlternate(locale, `/${cityId}/circle-rates/${tehsilId}/`)}
      pageLabel={`${tehsilName} · ${t.circleRates}`}
    >
      {/* header */}
      <section className="border-b border-line bg-cream-deep/60">
        <div className="container-site pb-8 md:pb-10">
          <Breadcrumb
            items={[
              { label: t.home, href: localePath(locale, "/") },
              { label: cityName, href: localePath(locale, `/${cityId}/`) },
              { label: t.circleRates, href: localePath(locale, `/${cityId}/circle-rates/`) },
              { label: tehsilName },
            ]}
          />
          <h1>
            {tehsilName} {t.circleRates}
          </h1>
          <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-ink-soft">
            <span>{sro}</span>
            <span aria-hidden="true">·</span>
            <span>
              {t.effective} <time dateTime={effectiveFrom}>{formatDate(effectiveFrom, locale)}</time>
            </span>
            <span aria-hidden="true">·</span>
            <span>
              {formatNumber(summary.rowCount)} {c.rowsInTehsil}
            </span>
            {segments.length > 0 && (
              <>
                <span aria-hidden="true">·</span>
                <span>
                  {formatNumber(segments.length)} {c.segmentsInTehsil}
                </span>
              </>
            )}
            {doc && (
              <>
                <span aria-hidden="true">·</span>
                <a href={doc.archiveUrl ?? doc.igrsupUrl} rel="noopener">
                  {t.sourcePdf}
                </a>
              </>
            )}
          </p>
          <InForceNote locale={locale} cityId={cityId} sro={tehsilId} className="mt-4" />
        </div>
      </section>

      {/* full village table, first 100 rows prerendered (BUILD-SPEC Template 5) */}
      <Section id="table" title={c.fullTable}>
        <TehsilRateTable
          locale={locale}
          cityId={cityId}
          tehsilId={tehsilId}
          firstRows={rows.slice(0, PRERENDERED_ROWS).map((r) => toChunkRow(r, cols))}
          bands={roadBands}
          commercialColumns={cols.commercial}
          agriColumns={cols.agri}
          total={rows.length}
          categories={[...new Set(rows.map((r) => r.category))]}
          wards={[...new Set(rows.flatMap((r) => (r.wardHi ? [r.wardHi] : [])))].sort((a, b) => a.localeCompare(b, "hi"))}
        />
        <p className="mt-4 text-sm text-muted">
          {sourceLine()}
          {pages.length > 0 && `, ${c.printedPage} ${pages[0]}–${pages.at(-1)}`}
        </p>

        {/*
          Every village as a plain link, server-rendered. The table above paginates, so without
          this the link graph into the village pages would depend on JavaScript.
        */}
        {rows.length > PRERENDERED_ROWS && (
          <details className="mt-8 rounded-xl border border-line bg-card p-4">
            <summary className="cursor-pointer font-semibold">
              {locale === "hi" ? `सभी ${formatNumber(rows.length)} गाँव, अ से ज्ञ` : `All ${formatNumber(rows.length)} villages, A to Z`}
            </summary>
            <ul className="mt-4 columns-2 gap-6 text-sm sm:columns-3 lg:columns-4">
              {[...rows]
                .sort((a, b) => pick(locale, a.nameEn, a.nameHi).localeCompare(pick(locale, b.nameEn, b.nameHi), locale))
                .map((r) => (
                  <li key={r.id} className="mb-1 break-inside-avoid">
                    <a href={localePath(locale, `/${cityId}/circle-rates/${tehsilId}/${r.slug}/`)}>{pick(locale, r.nameEn, r.nameHi)}</a>
                  </li>
                ))}
            </ul>
          </details>
        )}
      </Section>

      {/* villages that share an identical rate set (step 9b, point 5) */}
      {bands.length > 0 && (
        <Section id="bands" title={c.rateBandsTitle}>
          <p className="lede mb-6 max-w-2xl">{c.rateBandsLede}</p>
          <ul className="space-y-4">
            {bands.map((band) => {
              const first = band.rows[0];
              // Cheapest and dearest printed band on this row, whatever the city prints.
              const printed = roadBandKeys.map((k) => first.nonAgri[k]).filter((v) => typeof v === "number");
              const firstLow = printed[0] ?? 0;
              const firstHigh = printed[printed.length - 1] ?? 0;
              return (
                <li key={band.key} className="rounded-xl border border-line bg-card p-4">
                  <p className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                    <span className="tabular-nums">
                      {c.landRates} ₹{formatNumber(firstLow)}–{formatNumber(firstHigh)} {c.perSqM}
                    </span>
                    <span className="tabular-nums text-ink-soft">
                      {pick(locale, shopLabel.labelEn, shopLabel.labelHi)} ₹{first.commercial ? formatNumber(first.commercial.shop) : "—"}
                    </span>
                    {first.agriLakhPerHa.general !== null && (
                      <span className="tabular-nums text-ink-soft">
                        {/* the unit label is written as a column header ("₹ lakh / hectare"), so inline it reads with the sign first */}
                        {c.agriRates} ₹{formatNumber(first.agriLakhPerHa.general)} {agriUnitLabel["lakh-per-hectare"][locale].replace("₹ ", "")}
                      </span>
                    )}
                    <span className="caption-mono ml-auto text-muted">
                      {band.rows.length} {c.villagesAtThisRate}
                    </span>
                  </p>
                  <p className="mt-2.5 text-[14.5px] leading-[1.7] text-ink-soft">
                    {band.rows.map((r, i) => (
                      <span key={r.id}>
                        {i > 0 && ", "}
                        <a href={localePath(locale, `/${cityId}/circle-rates/${tehsilId}/${r.slug}/`)}>{pick(locale, r.nameEn, r.nameHi)}</a>
                      </span>
                    ))}
                  </p>
                </li>
              );
            })}
          </ul>
        </Section>
      )}

      {/* road segments */}
      {segments.length > 0 && (
        <Section id="segments" title={c.roadSegments} tone="sand">
          <p className="lede mb-6 max-w-2xl">{c.roadSegmentsLede}</p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[42rem] border-collapse text-sm">
              <thead className="bg-card">
                <tr>
                  <th scope="col" className={th}>
                    {c.segment}
                  </th>
                  <th scope="col" className={th}>
                    {c.village}
                  </th>
                  <th scope="col" className={`${th} ${numeric}`}>
                    {c.segmentLand}
                  </th>
                  <th scope="col" className={`${th} ${numeric}`}>
                    {c.viewCommercial}
                  </th>
                </tr>
              </thead>
              <tbody>
                {segments.map((s) => {
                  const row = s.rateRowId ? rows.find((r) => r.id === s.rateRowId) : undefined;
                  return (
                    <tr key={s.id}>
                      <td className={td}>{s.segmentHi}</td>
                      <td className={td}>
                        {row ? (
                          <a href={localePath(locale, `/${cityId}/circle-rates/${tehsilId}/${row.slug}/`)}>
                            {pick(locale, row.nameEn, row.nameHi)}
                          </a>
                        ) : (
                          s.villageHi
                        )}
                      </td>
                      {/* A Gorakhpur stretch can print land only, or commercial only. */}
                      <td className={`${td} ${numeric}`}>{s.nonAgri === null ? "—" : `₹${formatNumber(s.nonAgri)}`}</td>
                      <td className={`${td} ${numeric}`}>{s.shop === null ? "—" : `₹${formatNumber(s.shop)}`}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-sm text-muted">
            {sourceLine()}
            {segmentPages.length > 0 && `, ${c.printedPage} ${segmentPages[0]}–${segmentPages.at(-1)}`}
          </p>
        </Section>
      )}

      {/* valuation rules */}
      <Section id="rules" title={c.valuationRulesTitle}>
        <div className="grid gap-4 md:grid-cols-2">
          {rules.rules.map((r) => (
            <div key={r.id} className="rounded-xl border border-line bg-card p-4">
              <p className="flex items-baseline justify-between gap-3">
                <span className="font-semibold">{locale === "hi" ? r.labelHi : r.label}</span>
                <span className="caption-mono whitespace-nowrap text-muted">
                  {r.pct > 0 ? "+" : ""}
                  {r.pct}% · {r.instruction}
                </span>
              </p>
              <p className="mt-2 text-sm text-ink-soft">{locale === "hi" ? r.descriptionHi : r.description}</p>
            </div>
          ))}
          <div className="rounded-xl border border-line bg-card p-4">
            <p className="font-semibold">{locale === "hi" ? "बड़ा प्लॉट" : "Large plot"}</p>
            <p className="mt-2 text-sm text-ink-soft">
              {locale === "hi"
                ? `${formatNumber(rules.largePlotThresholdSqm)} वर्ग मीटर से बड़े अकृषिक प्लॉट में, उससे ऊपर का हिस्सा दर के ${rules.largePlotPct}% पर आँका जाता है।`
                : `On a non-agricultural plot over ${formatNumber(rules.largePlotThresholdSqm)} sq m, the part above that is valued at ${rules.largePlotPct}% of the rate.`}
            </p>
          </div>
        </div>
        <p className="mt-5 text-sm font-semibold">{c.estimateOnly}</p>
        <SourceStamp locale={locale} sources={rules.sources} updatedAt={rules.updatedAt} effectiveFrom={rules.effectiveFrom} />
      </Section>

      <Section id="enquiry" tone="sand">
        <LeadForm
          locale={locale}
          broker={broker}
          pageLabel={`${tehsilName} · ${t.circleRates}`}
          city={cityId}
          context={`${tehsil.name} tehsil circle rates`}
        />
      </Section>
    </PageShell>
  );
}

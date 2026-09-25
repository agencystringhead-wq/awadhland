import { notFound } from "next/navigation";
import { BeforeYouBuyCard } from "@/components/BeforeYouBuyCard";
import { Breadcrumb } from "@/components/Breadcrumb";
import { BrokerNote } from "@/components/BrokerNote";
import { FAQ } from "@/components/FAQ";
import { JsonLd } from "@/components/JsonLd";
import { LeadForm } from "@/components/LeadForm";
import { Section } from "@/components/Section";
import { SourceStamp } from "@/components/SourceStamp";
import { InForceNote } from "@/components/rates/InForceNote";
import { RateCalculator } from "@/components/rates/RateCalculator";
import { getBroker, getBuildableLocalities, getCity, getStampDutyRules, getVillageNote } from "@/lib/data";
import { formatDate, formatNumber, localePath, pick, ui, type Locale } from "@/lib/i18n";
import { rc } from "@/lib/rate-copy";
import {
  baseRate,
  getCommercialKinds,
  getCurrentRateSchedule,
  getRoadBands,
  getRoadSegmentsForRow,
  getRowBySlug,
  getSimilarRows,
  getTehsil,
  getTehsilMedian,
  getValuationRules,
  rowEffectiveFrom,
} from "@/lib/rates";
import { faqPage } from "@/lib/jsonld";
import { sameAlternate } from "@/lib/routes";
import { getVillageContent, villageCopy } from "@/lib/village-content";
import { applicableRule, toSqM } from "@/lib/stamp-duty";
import {
  agriFrontageLabel,
  AGRI_FRONTAGES,
  AGRI_GRID_FRONTAGES,
  agriGridFrontageLabel,
  agriSlabLabels,
  categoryText,
  coveredGradeLabel,
  COVERED_GRADES,
  extraRoadWidths,
  valuePlot,
} from "@/lib/valuation";
import { agriUnitLabel, lakhPerHaToRupeesPerBigha, lakhPerHaToRupeesPerSqm } from "@/lib/units";
import { getFrontageOnlySros } from "@/lib/frontage";
import { FrontageVillageTemplate } from "./FrontageTemplates";
import { PageShell } from "./PageShell";

const th = "px-3 py-2 text-left font-semibold";
const td = "px-3 py-2 border-t border-line";
const numeric = "text-right tabular-nums";

/** Small three-column table used for each of the land, commercial and agricultural blocks. */
function RateBlock({ title, rows, note }: { title: string; rows: { label: string; value: string }[]; note?: string }) {
  return (
    <div className="rounded-xl border border-line bg-card p-4">
      <h3 className="caption-mono mb-3 text-muted">{title}</h3>
      <table className="w-full text-sm">
        <tbody>
          {rows.map((r) => (
            <tr key={r.label}>
              <th scope="row" className={`${th} font-normal text-ink-soft`}>
                {r.label}
              </th>
              <td className={`${td} ${numeric}`}>{r.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {note && <p className="mt-3 text-xs text-muted">{note}</p>}
    </div>
  );
}

/**
 * Template 5b: one row of a published rate list. All 16 figures, the road stretches that pass
 * through the village, a worked example, where the row sits against the tehsil, and the nearest
 * rows by rate.
 *
 * Most of these pages ship noindex (lib/pages.ts decides), so the content is written for someone
 * who arrived from the tehsil table or a search, not for a search engine.
 */
export function RateVillageTemplate({
  locale,
  cityId,
  tehsilId,
  villageSlug,
}: {
  locale: Locale;
  cityId: string;
  tehsilId: string;
  villageSlug: string;
}) {
  // An SRO whose rate list has not arrived builds its villages from the khasra frontage list, at
  // the URLs its rate rows will take.
  if (getFrontageOnlySros(cityId).includes(tehsilId)) {
    return <FrontageVillageTemplate locale={locale} cityId={cityId} tehsilId={tehsilId} villageSlug={villageSlug} />;
  }
  const city = getCity(cityId);
  const tehsil = getTehsil(cityId, tehsilId);
  const schedule = getCurrentRateSchedule(cityId);
  const row = getRowBySlug(cityId, tehsilId, villageSlug);
  if (!city || !tehsil || !schedule || !row) notFound();

  const t = ui[locale];
  const c = rc(locale);
  const broker = getBroker();
  /*
   * Written page content for this row (step 9b). Every figure in it was checked against the row
   * before it was wired, so the prose and the tables below cannot disagree. A row without content
   * would still render: the tables, calculator and comparison are computed from the row itself.
   */
  const content = getVillageContent(row.id);
  const copy = content ? villageCopy(content, locale) : undefined;
  const note = getVillageNote(row.id);
  const noteText = note ? pick(locale, note.brokerNote, note.brokerNoteHi) : undefined;
  const rules = getValuationRules(cityId);
  const dutyRules = getStampDutyRules();
  /*
   * The stretches through this village, from the rate file's own rateRowId. The content's
   * roadSegmentIds restate the same relationship rather than adding to it — validate checks the
   * two agree — so there is nothing to union in, and each links to the tehsil page's segment table
   * where the whole stretch and its other villages are listed.
   */
  const segments = getRoadSegmentsForRow(cityId, row.id);
  // This SRO's own labels for the columns: Gorakhpur's SROs print the same four under different widths.
  const roadBands = getRoadBands(cityId, tehsilId);
  const commercialKinds = getCommercialKinds(cityId);
  const effectiveFrom = rowEffectiveFrom(schedule, row.sro);
  const base = baseRate(row);
  const hasLand = Object.keys(row.nonAgri).length > 0;
  const similar = getSimilarRows(cityId, row);
  const median = getTehsilMedian(cityId, tehsilId);
  const cityName = pick(locale, city.name, city.nameHi);
  const tehsilName = pick(locale, tehsil.name, tehsil.nameHi);
  const sro = pick(locale, tehsil.sroName, tehsil.sroNameHi);
  const name = pick(locale, row.nameEn, row.nameHi);
  const other = pick(locale, row.nameHi, row.nameEn);

  const hasAgri = AGRI_FRONTAGES.some((f) => row.agriLakhPerHa[f] !== null);
  // A list that prices farmland on a grid (Gorakhpur) shows the grid, and hides the block
  // entirely on a row with none rather than printing an empty one.
  const gridCity = schedule.rows.some((r) => r.agriGrid);
  const grid = row.agriGrid ?? null;
  const extraWidths = extraRoadWidths(rules, row);


  /*
   * The scanned SRO list. pdfPath is a repo path to a gitignored file, so it is never linked;
   * archiveUrl is the R2 copy once it exists, and until then the IGRSUP page is what a reader can
   * actually open.
   */
  const sourceDoc = schedule.sourceDocs.find((d) => d.sro === row.sro);
  const sourceHref = sourceDoc?.archiveUrl ?? sourceDoc?.igrsupUrl ?? schedule.sources[0]?.url;

  /** The locality pages that cover this row, so the reader can get the fuller write-up. */
  // Only localities that have a page in this locale: the thin-page guard can withhold one whose
  // copy is still seeded, and linking to it would 404.
  const coveringLocalities = getBuildableLocalities(locale)
    .buildable.filter((l) => l.cityId === cityId)
    .filter((l) => (l.rateRefs ?? []).some((r) => r.rateRowId === row.id));

  // Gorakhpur's rows carry no printed page; the line then names the SRO and date only.
  const sourceLine =
    locale === "hi"
      ? `आईजीआरएसयूपी सूची, ${sro}, ${formatDate(effectiveFrom, locale)} से लागू${row.page ? `, मुद्रित पृष्ठ ${row.page}` : ""}`
      : `IGRSUP list, ${sro}, effective ${formatDate(effectiveFrom, locale)}${row.page ? `, printed page ${row.page}` : ""}`;

  /* Worked example: 1,000 sq ft in the first road band, male and female buyer. */
  const exampleSqm = toSqM(1000, "sqft");
  const example = valuePlot({ row, kind: "non-agricultural", areaSqm: exampleSqm, rules, roadWidth: roadBands[0]?.key });
  const exampleLede =
    roadBands[0]?.key === "lt9m" ? c.workedExampleLede : c.workedExampleLedeBand.replace("{band}", (locale === "hi" ? roadBands[0]?.labelHi : roadBands[0]?.labelEn)?.toLowerCase() ?? "");
  const duty = (buyer: "male" | "female") => {
    const { rule } = applicableRule(dutyRules, buyer, example.circleValue);
    return Math.round((example.circleValue * rule.stampDutyPct) / 100);
  };

  const delta = median !== null && base > 0 ? Math.round(((base - median) / median) * 100) : null;
  const money = (n: number) => `₹${formatNumber(n)}`;

  return (
    <PageShell
      locale={locale}
      alternate={sameAlternate(locale, `/${cityId}/circle-rates/${tehsilId}/${row.slug}/`)}
      pageLabel={`${name} · ${t.circleRates}`}
    >
      <section className="border-b border-line bg-cream-deep/60">
        <div className="container-site pb-8 md:pb-10">
          <Breadcrumb
            items={[
              { label: t.home, href: localePath(locale, "/") },
              { label: cityName, href: localePath(locale, `/${cityId}/`) },
              { label: t.circleRates, href: localePath(locale, `/${cityId}/circle-rates/`) },
              { label: tehsilName, href: localePath(locale, `/${cityId}/circle-rates/${tehsilId}/`) },
              { label: name },
            ]}
          />
          <h1>{copy?.h1 ?? name}</h1>
          <p className="mt-2 text-lg text-ink-soft">{other}</p>
          {copy?.lede && <p className="lede mt-4 max-w-3xl">{copy.lede}</p>}
          <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-ink-soft">
            <span>{tehsilName}</span>
            {row.wardHi && (
              <>
                <span aria-hidden="true">·</span>
                <span>{row.wardHi}</span>
              </>
            )}
            {/* Omitted entirely where the list prints no category column, separator and all. */}
            {row.category && (
              <>
                <span aria-hidden="true">·</span>
                <span>{categoryText(row.category, locale)}</span>
              </>
            )}
            <span aria-hidden="true">·</span>
            <span>
              {c.serial} {row.serial}
              {row.vcode ? ` · ${c.vcode} ${row.vcode}` : ""}
            </span>
          </p>
          <InForceNote locale={locale} cityId={cityId} sro={row.sro} className="mt-4" />
        </div>
      </section>

      {/* A broker's note is the one thing here the schedule cannot say, so it leads. */}
      {noteText && note?.brokerNoteDate && (
        <Section>
          <BrokerNote locale={locale} note={noteText} date={note.brokerNoteDate} broker={broker} />
        </Section>
      )}

      {/* all 16 figures, under the written explanation of them */}
      <Section id="rates" title={t.circleRates}>
        {copy?.ratesText?.length ? (
          <div className="prose-site mb-6 max-w-3xl text-[17px] leading-relaxed">
            {copy.ratesText.map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
        ) : null}
        <div className="grid gap-4 md:grid-cols-3">
          {/* One row per band this SRO prints, and only the ones this row fills. */}
          {hasLand ? (
            <RateBlock
              title={`${c.landRates} · ${c.perSqM}`}
              rows={roadBands.map((b) => ({
                label: locale === "hi" ? b.labelHi : b.labelEn,
                value: typeof row.nonAgri[b.key] === "number" ? money(row.nonAgri[b.key]) : "—",
              }))}
              note={
                // A width the list prints no column for, valued by the city's own rule (Gorakhpur: over 12 m).
                extraWidths.length > 0
                  ? extraWidths
                      .map((w) => {
                        const r = rules.rules.find((x) => x.band?.key === w.key)!;
                        const v = Math.round((row.nonAgri[w.fromKey] * (100 + r.pct)) / 100);
                        return `${locale === "hi" ? w.labelHi : w.labelEn}: ${money(v)} ${c.perSqM} (${c.rule2025})`;
                      })
                      .join(" · ")
                  : undefined
              }
            />
          ) : (
            <div className="rounded-xl border border-line bg-card p-4">
              <h3 className="caption-mono mb-3 text-muted">{c.landRates}</h3>
              <p className="text-sm text-ink-soft">{c.noLandRate}</p>
            </div>
          )}
          {/* Hidden where the row prints no commercial line: an all-dash block says nothing. */}
          {row.commercial && (
            <RateBlock
              title={`${c.commercialRates} · ${c.perSqM}`}
              rows={commercialKinds.map((k) => ({
                label: locale === "hi" ? k.labelHi : k.labelEn,
                value: typeof row.commercial![k.key] === "number" ? money(row.commercial![k.key]) : "—",
              }))}
              note={row.commercialFrom ? c.commercialAmended.replace("{date}", formatDate(row.commercialFrom, locale)) : undefined}
            />
          )}
          {/* Sadar-2 (Gorakhpur) prices commercial property by monthly rent instead. */}
          {row.commercialRent && (
            <RateBlock title={c.rentTitle} rows={[{ label: c.rentUnit, value: money(row.commercialRent) }]} note={c.rentNote} />
          )}
          {/* Construction rates, on lists that price covered area. Ayodhya prints no such column. */}
          {row.covered && (
            <RateBlock
              title={`${c.coveredRates} · ${c.perSqM}`}
              rows={COVERED_GRADES.map((g) => ({ label: coveredGradeLabel[g][locale], value: money(row.covered![g]) }))}
            />
          )}
          {grid ? null : hasAgri ? (
            <RateBlock
              title={`${c.agriRates} · ${agriUnitLabel["lakh-per-hectare"][locale]}`}
              rows={AGRI_FRONTAGES.map((f) => {
                const v = row.agriLakhPerHa[f];
                return {
                  label: agriFrontageLabel[f][locale],
                  value: v === null ? "—" : formatNumber(v),
                };
              })}
              note={
                row.agriLakhPerHa.general !== null
                  ? locale === "hi"
                    ? `सामान्य दर ≈ ₹${formatNumber(Math.round(lakhPerHaToRupeesPerSqm(row.agriLakhPerHa.general)))} ${c.perSqM} ≈ ₹${formatNumber(Math.round(lakhPerHaToRupeesPerBigha(row.agriLakhPerHa.general)))} प्रति बीघा`
                    : `General ≈ ₹${formatNumber(Math.round(lakhPerHaToRupeesPerSqm(row.agriLakhPerHa.general)))} ${c.perSqM} ≈ ₹${formatNumber(Math.round(lakhPerHaToRupeesPerBigha(row.agriLakhPerHa.general)))} per bigha`
                  : undefined
              }
            />
          ) : gridCity ? null : (
            <div className="rounded-xl border border-line bg-card p-4">
              <h3 className="caption-mono mb-3 text-muted">{c.agriRates}</h3>
              <p className="text-sm text-ink-soft">{c.noAgriHere}</p>
            </div>
          )}
        </div>
        {/* Gorakhpur: farmland by frontage and plot size, all sixteen figures. */}
        {grid && (
          <div className="mt-4 rounded-xl border border-line bg-card p-4">
            <h3 className="caption-mono mb-3 text-muted">
              {c.agriRates} · {agriUnitLabel["lakh-per-hectare"][locale]}
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[32rem] text-sm">
                <thead>
                  <tr>
                    <th scope="col" className={th}>
                      {c.frontage}
                    </th>
                    {agriSlabLabels(grid.slabsHa, locale).map((l) => (
                      <th key={l} scope="col" className={`${th} ${numeric}`}>
                        {l}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {AGRI_GRID_FRONTAGES.map((f) => (
                    <tr key={f}>
                      <th scope="row" className={`${th} border-t border-line font-normal text-ink-soft`}>
                        {agriGridFrontageLabel[f][locale]}
                      </th>
                      {grid[f].map((v, i) => (
                        <td key={i} className={`${td} ${numeric}`}>
                          {v === null ? "—" : formatNumber(v)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-xs text-muted">
              {c.agriGridNote}
              {grid.other[3] !== null &&
                (locale === "hi"
                  ? ` अन्यत्र, सबसे बड़े प्लॉट ≈ ₹${formatNumber(Math.round(lakhPerHaToRupeesPerSqm(grid.other[3])))} ${c.perSqM} ≈ ₹${formatNumber(Math.round(lakhPerHaToRupeesPerBigha(grid.other[3])))} प्रति बीघा।`
                  : ` Elsewhere, largest plots ≈ ₹${formatNumber(Math.round(lakhPerHaToRupeesPerSqm(grid.other[3])))} ${c.perSqM} ≈ ₹${formatNumber(Math.round(lakhPerHaToRupeesPerBigha(grid.other[3])))} per bigha.`)}
            </p>
          </div>
        )}
        {copy?.commercialText && <p className="prose-site mt-6 max-w-3xl text-[17px] leading-relaxed">{copy.commercialText}</p>}
        {copy?.agriText && <p className="prose-site mt-4 max-w-3xl text-[17px] leading-relaxed">{copy.agriText}</p>}
        <p className="mt-6 text-sm text-muted">{sourceLine}</p>
      </Section>

      {/* worked plot sizes, straight from the content */}
      {copy?.plotExamples?.length ? (
        <Section id="plots" title={c.workedExample}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[30rem] border-collapse text-sm">
              <thead className="bg-card">
                <tr>
                  <th scope="col" className={th}>
                    {c.plotSize}
                  </th>
                  {/* The worked examples are computed on the narrowest and widest band. */}
                  <th scope="col" className={`${th} ${numeric}`}>
                    {locale === "hi" ? roadBands[0].labelHi : roadBands[0].labelEn}
                  </th>
                  <th scope="col" className={`${th} ${numeric}`}>
                    {locale === "hi" ? roadBands.at(-1)!.labelHi : roadBands.at(-1)!.labelEn}
                  </th>
                </tr>
              </thead>
              <tbody>
                {copy.plotExamples.map((ex) => (
                  <tr key={ex.label}>
                    <td className={td}>{ex.label}</td>
                    <td className={`${td} ${numeric}`}>{ex.narrow}</td>
                    <td className={`${td} ${numeric}`}>{ex.wide}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {copy.plotExamplesNote && <p className="mt-3 text-sm text-muted">{copy.plotExamplesNote}</p>}
        </Section>
      ) : null}

      {/* road segments through this village */}
      {segments.length > 0 && (
        <Section id="segments" title={c.segmentsHere} tone="sand">
          <p className="lede mb-5 max-w-2xl">{copy?.roadSegmentsText ?? c.roadSegmentsLede}</p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[34rem] border-collapse text-sm">
              <thead className="bg-card">
                <tr>
                  <th scope="col" className={th}>
                    {c.segment}
                  </th>
                  <th scope="col" className={`${th} ${numeric}`}>
                    {c.segmentLand}
                  </th>
                  <th scope="col" className={`${th} ${numeric}`}>
                    {pick(locale, commercialKinds[0].labelEn, commercialKinds[0].labelHi)}
                  </th>
                </tr>
              </thead>
              <tbody>
                {segments.map((s) => (
                  <tr key={s.id}>
                    <td className={td}>
                      <a href={`${localePath(locale, `/${cityId}/circle-rates/${tehsilId}/`)}#segments`}>{s.segmentHi}</a>
                    </td>
                    <td className={`${td} ${numeric}`}>{s.nonAgri === null ? "—" : money(s.nonAgri)}</td>
                    <td className={`${td} ${numeric}`}>{s.shop === null ? "—" : money(s.shop)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      {/* worked example -- omitted on a row the list prints no land rate for */}
      {base > 0 && (
      <Section id="example" title={c.workedExample}>
        <p className="lede mb-5 max-w-2xl">{exampleLede}</p>
        <dl className="grid gap-4 sm:grid-cols-3">
          {[
            { k: c.circleValue, v: money(example.circleValue) },
            { k: c.stampDutyMale, v: money(duty("male")) },
            { k: c.stampDutyFemale, v: money(duty("female")) },
          ].map((x) => (
            <div key={x.k} className="rounded-xl border border-line bg-card p-4">
              <dt className="caption-mono text-muted">{x.k}</dt>
              <dd className="mt-1 text-2xl tabular-nums">{x.v}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-4 text-sm font-semibold">{c.estimateOnly}</p>
      </Section>
      )}

      {/* the valuation instructions that apply here */}
      {copy?.rulesText?.length ? (
        <Section id="rules" title={c.rulesTitle}>
          <ul className="max-w-3xl space-y-3 text-[17px] leading-relaxed">
            {copy.rulesText.map((r, i) => (
              <li key={i} className="border-l-2 border-line pl-4">
                {r}
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {/* calculator prefilled with this row */}
      <Section
        id="calculator"
        title={c.calculatorTitle}
        tone="sand"
        aside={<a href={`${localePath(locale, "/tools/plot-yield-calculator/")}?loc=${encodeURIComponent(row.id)}`}>{t.whatCouldThisEarn} →</a>}
      >
        <RateCalculator
          locale={locale}
          row={row}
          segments={segments}
          bands={roadBands}
          commercialKinds={commercialKinds}
          rules={rules}
          dutyRules={dutyRules}
        />
      </Section>

      {/* questions people ask, also emitted as FAQPage */}
      {copy?.faq?.length ? (
        <Section id="faq">
          <JsonLd data={faqPage(copy.faq)} />
          <FAQ title={t.faq} items={copy.faq} />
        </Section>
      ) : null}

      {/* comparison and neighbours */}
      <Section id="compare" title={c.comparedToTehsil}>
        {median !== null && delta !== null && (
          <p className="lede max-w-2xl">
            {locale === "hi"
              ? `${row.nameHi} की आधार दर ₹${formatNumber(base)} ${c.perSqM} है। ${tehsilName} तहसील का मध्यक ₹${formatNumber(median)} है — यह गाँव ${delta === 0 ? c.atMedian : `${Math.abs(delta!)}% ${delta! > 0 ? c.aboveMedian : c.belowMedian}`}।`
              : `${row.nameEn}'s base rate is ₹${formatNumber(base)} ${c.perSqM}. The ${tehsilName} tehsil median is ₹${formatNumber(median)} — this village is ${delta === 0 ? c.atMedian : `${Math.abs(delta!)}% ${delta! > 0 ? c.aboveMedian : c.belowMedian}`}.`}
          </p>
        )}

        {similar.length > 0 && (
          <>
            <h3 className="mt-8 mb-3 font-semibold">{c.similarVillages}</h3>
            <ul className="divide-y divide-line rounded-xl border border-line bg-card">
              {similar.map((s) => (
                <li key={s.id} className="flex items-baseline justify-between gap-4 px-4 py-2.5">
                  <a href={localePath(locale, `/${cityId}/circle-rates/${tehsilId}/${s.slug}/`)}>{pick(locale, s.nameEn, s.nameHi)}</a>
                  <span className="tabular-nums text-sm">{money(baseRate(s))}</span>
                </li>
              ))}
            </ul>
          </>
        )}

        {coveringLocalities.length > 0 && (
          <p className="mt-6 text-sm">
            {c.partOfLocality}:{" "}
            {coveringLocalities.map((l, i) => (
              <span key={l.id}>
                {i > 0 && ", "}
                <a href={localePath(locale, `/${cityId}/${l.id}/`)}>{pick(locale, l.name, l.nameHi)}</a>
              </span>
            ))}
          </p>
        )}

        {copy?.sourceLine && (
          <p className="mt-6 text-sm text-muted">
            <a href={sourceHref} rel="noopener">
              {copy.sourceLine}
            </a>
          </p>
        )}
        <SourceStamp locale={locale} sources={schedule.sources} updatedAt={schedule.updatedAt} effectiveFrom={effectiveFrom} />
      </Section>

      <Section>
        <BeforeYouBuyCard locale={locale} className="max-w-2xl" />
      </Section>

      <Section id="enquiry" tone="sand">
        <LeadForm locale={locale} broker={broker} pageLabel={`${name} · ${t.circleRates}`} city={cityId} context={`${row.nameEn}, ${tehsil.name} tehsil`} />
      </Section>
    </PageShell>
  );
}

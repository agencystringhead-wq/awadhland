import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/Breadcrumb";
import { BrokerNote } from "@/components/BrokerNote";
import { FAQ } from "@/components/FAQ";
import { JsonLd } from "@/components/JsonLd";
import { LeadForm } from "@/components/LeadForm";
import { Section } from "@/components/Section";
import { SourceStamp } from "@/components/SourceStamp";
import { RateCalculator } from "@/components/rates/RateCalculator";
import { getBroker, getBuildableLocalities, getCity, getStampDutyRules, getVillageNote } from "@/lib/data";
import { formatDate, formatNumber, localePath, pick, ui, type Locale } from "@/lib/i18n";
import { rc } from "@/lib/rate-copy";
import {
  getCurrentRateSchedule,
  getRoadSegmentsForRow,
  getRowBySlug,
  getSimilarRows,
  getTehsil,
  getTehsilMedian,
  getValuationRules,
} from "@/lib/rates";
import { faqPage } from "@/lib/jsonld";
import { sameAlternate } from "@/lib/routes";
import { getVillageContent, resolvedSegmentIds, villageCopy } from "@/lib/village-content";
import { applicableRule, toSqM } from "@/lib/stamp-duty";
import { agriFrontageLabel, AGRI_FRONTAGES, categoryLabel, commercialKindLabel, COMMERCIAL_KINDS, roadWidthLabel, ROAD_WIDTHS, valuePlot } from "@/lib/valuation";
import { agriUnitLabel, lakhPerHaToRupeesPerBigha, lakhPerHaToRupeesPerSqm } from "@/lib/units";
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
  const rules = getValuationRules();
  const dutyRules = getStampDutyRules();
  /*
   * Two sources agree on which stretches run through a village: the rate file matches segment rows
   * to the row id, and the written content names them by its own ids. The union is used so a
   * stretch the content knows about is not dropped, and each links to the tehsil page's segment
   * table where the whole stretch and its other villages are listed.
   */
  const segmentsById = new Map(getRoadSegmentsForRow(cityId, row.id).map((x) => [x.id, x]));
  const allSegments = getCurrentRateSchedule(cityId)?.roadSegments ?? [];
  if (content) {
    for (const id of resolvedSegmentIds(content)) {
      const seg = allSegments.find((x) => x.id === id);
      if (seg && !segmentsById.has(seg.id)) segmentsById.set(seg.id, seg);
    }
  }
  const segments = [...segmentsById.values()];
  const similar = getSimilarRows(cityId, row);
  const median = getTehsilMedian(cityId, tehsilId);
  const cityName = pick(locale, city.name, city.nameHi);
  const tehsilName = pick(locale, tehsil.name, tehsil.nameHi);
  const sro = pick(locale, tehsil.sroName, tehsil.sroNameHi);
  const name = pick(locale, row.nameEn, row.nameHi);
  const other = pick(locale, row.nameHi, row.nameEn);

  const hasAgri = AGRI_FRONTAGES.some((f) => row.agriLakhPerHa[f] !== null);


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

  const sourceLine =
    locale === "hi"
      ? `आईजीआरएसयूपी सूची, ${sro}, ${formatDate(schedule.effectiveFrom, locale)} से लागू, मुद्रित पृष्ठ ${row.page}`
      : `IGRSUP list, ${sro}, effective ${formatDate(schedule.effectiveFrom, locale)}, printed page ${row.page}`;

  /* Worked example: 1,000 sq ft on a road under 9 m, male and female buyer. */
  const exampleSqm = toSqM(1000, "sqft");
  const example = valuePlot({ row, kind: "non-agricultural", areaSqm: exampleSqm, rules, roadWidth: "lt9m" });
  const duty = (buyer: "male" | "female") => {
    const { rule } = applicableRule(dutyRules, buyer, example.circleValue);
    return Math.round((example.circleValue * rule.stampDutyPct) / 100);
  };

  const delta = median !== null ? Math.round(((row.nonAgri.lt9m - median) / median) * 100) : null;
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
            <span aria-hidden="true">·</span>
            <span>{categoryLabel[row.category][locale]}</span>
            <span aria-hidden="true">·</span>
            <span>
              {c.serial} {row.serial}
              {row.vcode ? ` · ${c.vcode} ${row.vcode}` : ""}
            </span>
          </p>
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
          <RateBlock
            title={`${c.landRates} · ${c.perSqM}`}
            rows={ROAD_WIDTHS.map((w) => ({ label: roadWidthLabel[w][locale], value: money(row.nonAgri[w]) }))}
          />
          <RateBlock
            title={`${c.commercialRates} · ${c.perSqM}`}
            rows={COMMERCIAL_KINDS.map((k) => ({ label: commercialKindLabel[k][locale], value: money(row.commercial[k]) }))}
          />
          {hasAgri ? (
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
          ) : (
            <div className="rounded-xl border border-line bg-card p-4">
              <h3 className="caption-mono mb-3 text-muted">{c.agriRates}</h3>
              <p className="text-sm text-ink-soft">{c.noAgriHere}</p>
            </div>
          )}
        </div>
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
                  <th scope="col" className={`${th} ${numeric}`}>
                    {roadWidthLabel.lt9m[locale]}
                  </th>
                  <th scope="col" className={`${th} ${numeric}`}>
                    {roadWidthLabel.ge18m[locale]}
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
                    {commercialKindLabel.shop[locale]}
                  </th>
                </tr>
              </thead>
              <tbody>
                {segments.map((s) => (
                  <tr key={s.id}>
                    <td className={td}>
                      <a href={`${localePath(locale, `/${cityId}/circle-rates/${tehsilId}/`)}#segments`}>{s.segmentHi}</a>
                    </td>
                    <td className={`${td} ${numeric}`}>{money(s.nonAgri)}</td>
                    <td className={`${td} ${numeric}`}>{money(s.shop)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      {/* worked example */}
      <Section id="example" title={c.workedExample}>
        <p className="lede mb-5 max-w-2xl">{c.workedExampleLede}</p>
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
      <Section id="calculator" title={c.calculatorTitle} tone="sand">
        <RateCalculator locale={locale} row={row} segments={segments} rules={rules} dutyRules={dutyRules} />
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
        {median !== null && (
          <p className="lede max-w-2xl">
            {locale === "hi"
              ? `${row.nameHi} की आधार दर ₹${formatNumber(row.nonAgri.lt9m)} ${c.perSqM} है। ${tehsilName} तहसील का मध्यक ₹${formatNumber(median)} है — यह गाँव ${delta === 0 ? c.atMedian : `${Math.abs(delta!)}% ${delta! > 0 ? c.aboveMedian : c.belowMedian}`}।`
              : `${row.nameEn}'s base rate is ₹${formatNumber(row.nonAgri.lt9m)} ${c.perSqM}. The ${tehsilName} tehsil median is ₹${formatNumber(median)} — this village is ${delta === 0 ? c.atMedian : `${Math.abs(delta!)}% ${delta! > 0 ? c.aboveMedian : c.belowMedian}`}.`}
          </p>
        )}

        {similar.length > 0 && (
          <>
            <h3 className="mt-8 mb-3 font-semibold">{c.similarVillages}</h3>
            <ul className="divide-y divide-line rounded-xl border border-line bg-card">
              {similar.map((s) => (
                <li key={s.id} className="flex items-baseline justify-between gap-4 px-4 py-2.5">
                  <a href={localePath(locale, `/${cityId}/circle-rates/${tehsilId}/${s.slug}/`)}>{pick(locale, s.nameEn, s.nameHi)}</a>
                  <span className="tabular-nums text-sm">{money(s.nonAgri.lt9m)}</span>
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
        <SourceStamp locale={locale} sources={schedule.sources} updatedAt={schedule.updatedAt} effectiveFrom={schedule.effectiveFrom} />
      </Section>

      <Section id="enquiry" tone="sand">
        <LeadForm locale={locale} broker={broker} pageLabel={`${name} · ${t.circleRates}`} city={cityId} context={`${row.nameEn}, ${tehsil.name} tehsil`} />
      </Section>
    </PageShell>
  );
}

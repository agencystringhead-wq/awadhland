import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/Breadcrumb";
import { DistrictRateSearch } from "@/components/rates/DistrictRateSearch";
import { CircleRateTable } from "@/components/CircleRateTable";
import { FAQ } from "@/components/FAQ";
import { LeadForm } from "@/components/LeadForm";
import { Section } from "@/components/Section";
import { SourceStamp } from "@/components/SourceStamp";
import { StampDutyCalculator } from "@/components/StampDutyCalculator";
import { circleRatesCopy } from "@/lib/content";
import { getBroker, getCircleRateSchedulesByCity, getCity, getLocalitiesByCity, getStampDutyRules } from "@/lib/data";
import { circleRateFaq } from "@/lib/faq";
import { formatDate, formatNumber, localePath, pick, ui, type Locale } from "@/lib/i18n";
import { buyerCategoryLabels } from "@/lib/labels";
import { rc, tehsilSelectorTitle } from "@/lib/rate-copy";
import { InForceNote } from "@/components/rates/InForceNote";
import { getCurrentRateSchedule, getTehsilsByCity, getTehsilSummary } from "@/lib/rates";
import { builtLocalityIds, sameAlternate } from "@/lib/routes";
import { frontageToolHref, stampDutyCalculatorData } from "@/lib/tools";
import { getFrontageOnlySros, getFrontageVillages } from "@/lib/frontage";
import { fc } from "@/lib/frontage-copy";
import { PageShell } from "./PageShell";

const th = "px-4 py-2.5 font-semibold";

/**
 * Template 5: circle-rate page, one per city. Section 2 is the stamp duty calculator fixed to this
 * city, with the rules it applies shown under it.
 */
export function CircleRatesTemplate({ locale, cityId }: { locale: Locale; cityId: string }) {
  const city = getCity(cityId);
  const schedules = getCircleRateSchedulesByCity(cityId);
  /*
   * Two independent sources can put a city on this page, and a city may have either, or both.
   *
   * `schedules` is the narrow locality-level view in circleRates.json. Lucknow's and Gorakhpur's
   * entries there are seed data and are withheld by scheduleIsSourced, so this list is empty for
   * them. `rateSchedule` below is the full transcribed मूल्यांकन सूची, which Lucknow now has:
   * 1,449 real rows across seven SROs.
   *
   * So the page renders what the city actually has. Lucknow gets its SRO cards, its district
   * search and its 1,449 village pages, and simply does not show the locality table it has no
   * sourced figures for. Requiring the narrow schedule would have left every one of those village
   * pages orphaned behind a hub that refused to build.
   */
  const rateScheduleForGate = getCurrentRateSchedule(cityId);
  if (!city || (schedules.length === 0 && !rateScheduleForGate)) notFound();
  const [current, ...revisions] = schedules;
  const t = ui[locale];
  const broker = getBroker();
  const cityName = pick(locale, city.name, city.nameHi);
  const pageLabel = `${cityName} · ${t.circleRates}`;
  const localityNames = Object.fromEntries(getLocalitiesByCity(city.id).map((l) => [l.id, pick(locale, l.name, l.nameHi)]));
  const rules = getStampDutyRules();
  const faq = current ? circleRateFaq(city, current, schedules.length, locale) : [];
  const c = rc(locale);
  // The full published list, when this city has one transcribed. Drives the tehsil cards and the
  // district search; the narrow circleRates.json above still drives the calculator and the table.
  const rateSchedule = getCurrentRateSchedule(city.id);
  const tehsils = getTehsilsByCity(city.id);
  const summaries = rateSchedule
    ? tehsils.flatMap((th) => {
        const s = getTehsilSummary(city.id, th.id);
        return s && s.rowCount > 0 ? [s] : [];
      })
    : [];
  // Registered SROs with no transcribed list. They get a card that says so, and no link.
  const pending = tehsils.filter((th) => th.ratesStatus === "pending");
  // Of those, the ones with a khasra frontage list: their card links to a village index.
  const frontageOnly = getFrontageOnlySros(city.id);
  const f = fc(locale);
  const listJoin = (xs: string[], l: Locale) => (xs.length < 2 ? xs.join("") : `${xs.slice(0, -1).join(", ")} ${l === "hi" ? "और" : "and"} ${xs.at(-1)}`);

  return (
    <PageShell locale={locale} alternate={sameAlternate(locale, `/${city.id}/circle-rates/`)} pageLabel={pageLabel}>
      {/* 1. Header */}
      <section className="border-b border-line bg-cream-deep/60">
        <div className="container-site pb-8 md:pb-10">
          <Breadcrumb
            items={[
              { label: t.home, href: localePath(locale, "/") },
              { label: cityName, href: localePath(locale, `/${city.id}/`) },
              { label: t.circleRates },
            ]}
          />
          <h1>
            {cityName} {t.circleRates}
          </h1>
          {/* The lookup, above the fold: most readers arrive wanting one village's rate. */}
          <p className="mt-4">
            <a href={`${localePath(locale, "/tools/circle-rate-lookup/")}?city=${city.id}`} className="btn btn-primary gap-2 px-5 py-3 text-[15px]">
              {t.circleRateLookup}: {locale === "hi" ? "गाँव या मोहल्ले का नाम लिखें" : "type a village or mohalla"} →
            </a>
          </p>
          {/* Only where the locality-level schedule is sourced; Lucknow's header comes from the
              transcribed list below instead. */}
          {current ? (
            <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-ink-soft">
              <span>
                {t.effective} <time dateTime={current.effectiveFrom}>{formatDate(current.effectiveFrom, locale)}</time>
              </span>
              <span aria-hidden="true">·</span>
              <a href={current.sourceUrl} rel="noopener">
                {t.sourcePdf}
              </a>
              {current.archiveUrl && (
                <>
                  <span aria-hidden="true">·</span>
                  <a href={current.archiveUrl} rel="noopener">
                    {t.archivedCopy}
                  </a>
                </>
              )}
              <span aria-hidden="true">·</span>
              <span>
                {schedules.length} {schedules.length === 1 ? t.revision : t.revisions}
              </span>
            </p>
          ) : (
            rateSchedule && (
              <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-ink-soft">
                <span>
                  {t.effective}{" "}
                  <time dateTime={rateSchedule.effectiveFrom}>{formatDate(rateSchedule.effectiveFrom, locale)}</time>
                </span>
                <span aria-hidden="true">·</span>
                <span>
                  {formatNumber(rateSchedule.rows.length)} {locale === "hi" ? "पंक्तियाँ" : "rows"}
                </span>
              </p>
            )
          )}
          {/* The five SROs publish separately, so the order date and each document are named here. */}
          {rateSchedule && (
            <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
              <span>
                {locale === "hi" ? "कलेक्टर आदेश" : "Collector order"}{" "}
                <time dateTime={rateSchedule.orderDate}>{formatDate(rateSchedule.orderDate, locale)}</time>
              </span>
              {rateSchedule.sourceDocs.map((d) => {
                const th = tehsils.find((x) => x.id === d.sro);
                return (
                  <span key={d.sro}>
                    <span aria-hidden="true">· </span>
                    <a href={d.archiveUrl ?? d.igrsupUrl} rel="noopener">
                      {th ? pick(locale, th.name, th.nameHi) : d.sro}
                    </a>
                  </span>
                );
              })}
            </p>
          )}
          <InForceNote locale={locale} cityId={city.id} className="mt-4" />
        </div>
      </section>

      {/* Tehsil selector: one card per sub-registrar list */}
      {rateSchedule && summaries.length > 0 && (
        <Section id="tehsils" title={tehsilSelectorTitle(locale, summaries.length)}>
          <p className="lede mb-6 max-w-2xl">{c.tehsilSelectorLede}</p>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {summaries.map((s) => (
              <li key={s.tehsil.id}>
                <a
                  href={localePath(locale, `/${city.id}/circle-rates/${s.tehsil.id}/`)}
                  className="block h-full rounded-2xl border border-line bg-card p-5 transition-colors hover:bg-cream-deep"
                >
                  <h3 className="text-xl">{pick(locale, s.tehsil.name, s.tehsil.nameHi)}</h3>
                  <p className="caption-mono mt-1 text-muted">{pick(locale, s.tehsil.sroName, s.tehsil.sroNameHi)}</p>
                  <dl className="mt-4 space-y-1.5 text-sm">
                    <div className="flex justify-between gap-3">
                      <dt className="text-muted">{c.rowsInTehsil}</dt>
                      <dd className="tabular-nums">{formatNumber(s.rowCount)}</dd>
                    </div>
                    {s.minNonAgri !== null && s.maxNonAgri !== null && (
                      <div className="flex justify-between gap-3">
                        <dt className="text-muted">{c.landRange}</dt>
                        <dd className="tabular-nums">
                          ₹{formatNumber(s.minNonAgri)}–{formatNumber(s.maxNonAgri)}
                        </dd>
                      </div>
                    )}
                    {s.topSegmentRate !== null && (
                      <div className="flex justify-between gap-3">
                        <dt className="text-muted">{c.topSegment}</dt>
                        <dd className="tabular-nums">₹{formatNumber(s.topSegmentRate)}</dd>
                      </div>
                    )}
                    {s.segmentCount > 0 && (
                      <div className="flex justify-between gap-3">
                        <dt className="text-muted">{c.segmentsInTehsil}</dt>
                        <dd className="tabular-nums">{formatNumber(s.segmentCount)}</dd>
                      </div>
                    )}
                  </dl>
                </a>
              </li>
            ))}
            {/*
             * SROs whose list has not been transcribed yet. Named, not linked: Lucknow has ten
             * SROs and seven are in, and a hub that silently showed seven would read as the whole
             * district. Saying which three are missing is the difference between an incomplete
             * list and a wrong one.
             */}
            {pending.map((th) => {
              // A pending SRO with a khasra frontage list has a village index; link it.
              const villages = frontageOnly.includes(th.id) ? getFrontageVillages(city.id, th.id).length : 0;
              const body = (
                <>
                  <h3 className="text-xl text-ink-soft">{pick(locale, th.name, th.nameHi)}</h3>
                  <p className="caption-mono mt-1 text-muted">{pick(locale, th.sroName, th.sroNameHi)}</p>
                  <p className="mt-4 text-sm text-muted">{villages > 0 ? f.ratesAwaited : c.ratesPending}</p>
                  {villages > 0 && (
                    <p className="mt-1.5 text-sm">
                      {formatNumber(villages)} {f.villagesInSro} · {f.cardFrontage}
                    </p>
                  )}
                </>
              );
              return (
                <li key={th.id}>
                  {villages > 0 ? (
                    <a
                      href={localePath(locale, `/${city.id}/circle-rates/${th.id}/`)}
                      className="block h-full rounded-2xl border border-dashed border-line bg-cream-deep/40 p-5 transition-colors hover:bg-cream-deep"
                    >
                      {body}
                    </a>
                  ) : (
                    <div className="block h-full rounded-2xl border border-dashed border-line bg-cream-deep/40 p-5">{body}</div>
                  )}
                </li>
              );
            })}
          </ul>
          {frontageOnly.length > 0 && (
            <div className="mt-6 rounded-2xl border border-line bg-card p-5 md:flex md:items-center md:justify-between md:gap-6">
              <div>
                <p className="font-semibold">{f.checkTitle}</p>
                <p className="mt-1 max-w-2xl text-sm text-ink-soft">{f.hubToolLede.replace("{sros}", listJoin(pending.filter((th) => frontageOnly.includes(th.id)).map((th) => pick(locale, th.name, th.nameHi)), locale))}</p>
              </div>
              <a href={frontageToolHref(locale)} className="btn btn-primary mt-4 shrink-0 gap-2 px-5 py-3 text-[15px] md:mt-0">
                {f.hubToolCta} →
              </a>
            </div>
          )}
        </Section>
      )}

      {/* District-wide search across every row of the published list */}
      {rateSchedule && summaries.length > 0 && (
        <Section id="search" title={c.searchTitle} tone="sand">
          <p className="lede mb-6 max-w-2xl">{c.searchLede}</p>
          <DistrictRateSearch
            locale={locale}
            cityId={city.id}
            tehsilIds={summaries.map((s) => s.tehsil.id)}
            tehsilNames={Object.fromEntries(summaries.map((s) => [s.tehsil.id, pick(locale, s.tehsil.name, s.tehsil.nameHi)]))}
          />
        </Section>
      )}

      {/* 2. Calculator, fixed to this city, with the rules it applies shown under it */}
      <Section id="stamp-duty" title={t.stampDutyRules}>
        <div className="mb-6">
          <StampDutyCalculator
            locale={locale}
            data={stampDutyCalculatorData(locale, city.id)}
            whatsapp={broker.whatsapp}
            defaultCityId={city.id}
            title={t.stampDuty}
          />
        </div>
        <div className="card overflow-x-auto">
          <table className="w-full text-[15px]">
            <thead className="bg-cream-deep text-left text-sm text-ink-soft">
              <tr>
                <th className={th}>{t.buyer}</th>
                <th className={`${th} text-right`}>{t.stampDuty}</th>
                <th className={`${th} text-right`}>{t.registrationFee}</th>
                <th className={th}>{t.effective}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rules.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-2.5 font-medium">{buyerCategoryLabels[r.buyerCategory][locale]}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{r.stampDutyPct}%</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">
                    {r.registrationFeePct}%{r.registrationFeeCap !== null && ` (≤ ₹${formatNumber(r.registrationFeeCap)})`}
                  </td>
                  <td className="px-4 py-2.5 text-ink-soft">
                    <a href={r.sourceUrl} rel="noopener">
                      {formatDate(r.effectiveFrom, locale)}
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* 3. Full table of locality-level rates, where the city has a sourced narrow schedule. */}
      {current && (
      <Section title={t.schedule}>
        <CircleRateTable
          locale={locale}
          cityId={city.id}
          rows={current.rates}
          localityNames={localityNames}
          linkableLocalityIds={[...builtLocalityIds(locale)]}
          interactive
        />
        <SourceStamp locale={locale} sources={current.sources} updatedAt={current.updatedAt} effectiveFrom={current.effectiveFrom} />
      </Section>
      )}

      {/* 4. How circle rates work */}
      <Section id="how" title={t.howCircleRatesWork}>
        <div className="prose-site max-w-3xl text-[17px] leading-relaxed">
          {circleRatesCopy[locale].paragraphs.map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>
      </Section>

      {/* 5. Revision history: past schedules only */}
      {revisions.length > 0 && (
        <Section id="revisions" title={t.revisionHistory}>
          <div className="card overflow-x-auto">
            <table className="w-full text-[15px]">
              <thead className="bg-cream-deep text-left text-sm text-ink-soft">
                <tr>
                  <th className={th}>{t.effective}</th>
                  <th className={`${th} text-right`}>{t.rows}</th>
                  <th className={th}>{t.sourcePdf}</th>
                  <th className={th}>{t.archivedCopy}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {revisions.map((s) => (
                  <tr key={s.id}>
                    <td className="px-4 py-2.5 font-medium">
                      <time dateTime={s.effectiveFrom}>{formatDate(s.effectiveFrom, locale)}</time>
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{s.rates.length}</td>
                    <td className="px-4 py-2.5">
                      <a href={s.sourceUrl} rel="noopener">
                        {t.sourcePdf}
                      </a>
                    </td>
                    <td className="px-4 py-2.5">
                      {s.archiveUrl ? (
                        <a href={s.archiveUrl} rel="noopener">
                          {t.archivedCopy}
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      {/* 6. FAQ */}
      <Section>
        <FAQ title={t.faq} items={faq} />
      </Section>

      {/* 7. Lead form prefilled with city */}
      <Section>
        <LeadForm locale={locale} broker={broker} pageLabel={pageLabel} city={city.id} />
      </Section>
    </PageShell>
  );
}

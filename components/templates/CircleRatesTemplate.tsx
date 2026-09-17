import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/Breadcrumb";
import { CircleRateTable } from "@/components/CircleRateTable";
import { FAQ } from "@/components/FAQ";
import { LeadForm } from "@/components/LeadForm";
import { Section } from "@/components/Section";
import { SourceStamp } from "@/components/SourceStamp";
import { circleRatesCopy } from "@/lib/content";
import { getBroker, getCircleRateSchedulesByCity, getCity, getLocalitiesByCity, getStampDutyRules } from "@/lib/data";
import { circleRateFaq } from "@/lib/faq";
import { formatDate, formatNumber, localePath, pick, ui, type Locale } from "@/lib/i18n";
import { buyerCategoryLabels } from "@/lib/labels";
import { builtLocalityIds, sameAlternate } from "@/lib/routes";
import { PageShell } from "./PageShell";

const th = "px-4 py-2.5 font-semibold";

/**
 * Template 5: circle-rate page, one per city. The stamp duty calculator (section 2) is the step 5
 * tool; until then the section shows the rules it will use.
 */
export function CircleRatesTemplate({ locale, cityId }: { locale: Locale; cityId: string }) {
  const city = getCity(cityId);
  const schedules = getCircleRateSchedulesByCity(cityId);
  if (!city || schedules.length === 0) notFound();
  const [current, ...revisions] = schedules;
  const t = ui[locale];
  const broker = getBroker();
  const cityName = pick(locale, city.name, city.nameHi);
  const pageLabel = `${cityName} · ${t.circleRates}`;
  const localityNames = Object.fromEntries(getLocalitiesByCity(city.id).map((l) => [l.id, pick(locale, l.name, l.nameHi)]));
  const rules = getStampDutyRules();
  const faq = circleRateFaq(city, current, schedules.length, locale);

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
        </div>
      </section>

      {/* 2. Calculator: step 5. The rules it will read are shown so the data is visible now. */}
      <Section title={t.stampDutyRules}>
        <p className="mb-4 max-w-3xl text-ink-soft">{t.calculatorComing}</p>
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

      {/* 3. Full table: sortable, filterable, printable */}
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

      {/* 4. How circle rates work */}
      <Section title={t.howCircleRatesWork}>
        <div className="prose-site max-w-3xl text-[17px] leading-relaxed">
          {circleRatesCopy[locale].paragraphs.map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>
      </Section>

      {/* 5. Revision history: past schedules only */}
      {revisions.length > 0 && (
        <Section title={t.revisionHistory}>
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

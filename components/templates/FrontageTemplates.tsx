import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/Breadcrumb";
import { LeadForm } from "@/components/LeadForm";
import { Section } from "@/components/Section";
import { SourceStamp } from "@/components/SourceStamp";
import { getBroker, getCity } from "@/lib/data";
import {
  FRONTAGE_CATEGORIES,
  frontageLabel,
  frontageShortLabel,
  getFrontage,
  getFrontageSourceDoc,
  getFrontageVillageBySlug,
  getFrontageVillages,
  glossNote,
} from "@/lib/frontage";
import { fc } from "@/lib/frontage-copy";
import { formatDate, formatNumber, localePath, pick, ui, type Locale } from "@/lib/i18n";
import { getTehsil } from "@/lib/rates";
import { sameAlternate } from "@/lib/routes";
import type { FrontageFile, FrontageVillage, Tehsil } from "@/lib/schemas";
import { frontageToolHref } from "@/lib/tools";
import { PageShell } from "./PageShell";

const th = "px-3 py-2.5 text-left font-semibold whitespace-nowrap";
const td = "px-3 py-2 border-t border-line";
const numeric = "text-right tabular-nums";

/**
 * "IGRSUP khasra frontage list, Sub-Registrar, Malihabad, part of the valuation list effective
 * 1 Aug 2025, PDF pages 12–13". Each SRO is cited on its own, as the rate lists are.
 */
function sourceLine(locale: Locale, list: FrontageFile, tehsil: Tehsil, pages: string | null) {
  const c = fc(locale);
  const doc = list.sourceDocs.find((d) => d.sro === tehsil.id);
  const sro = pick(locale, tehsil.sroName, tehsil.sroNameHi);
  const parts = [c.sourceLine, sro, `${c.partOfList} ${formatDate(list.effectiveFrom, locale)}`];
  if (doc?.downloadDated) parts.push(`${c.downloadDated} ${formatDate(doc.downloadDated, locale)}`);
  if (pages) parts.push(`${/[,–]/.test(pages) ? c.pdfPages : c.pdfPage} ${pages}`);
  return parts.join(", ");
}

/** The "rates awaited" block every frontage page leads with (the brief fixes its first line). */
function RatesAwaited({ locale, cityId }: { locale: Locale; cityId: string }) {
  const c = fc(locale);
  return (
    <div className="rounded-2xl border border-dashed border-line bg-cream-deep/40 p-5 md:p-6">
      <p className="text-lg font-semibold">{c.ratesAwaited}</p>
      <p className="mt-2 max-w-3xl text-ink-soft">{c.ratesAwaitedLede}</p>
      <p className="mt-3 text-sm">
        <a href={localePath(locale, `/${cityId}/circle-rates/`)}>
          {c.otherSros} →
        </a>
      </p>
    </div>
  );
}

/** Four counters, one per frontage heading. */
function FrontageCounts({ locale, village }: { locale: Locale; village: FrontageVillage }) {
  const c = fc(locale);
  return (
    <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {FRONTAGE_CATEGORIES.map((cat) => (
        <div key={cat} className="rounded-xl border border-line bg-card p-4">
          <dt className="caption-mono text-muted">{frontageShortLabel[cat][locale]}</dt>
          <dd className="mt-1 text-3xl tabular-nums">{formatNumber(village.counts[cat])}</dd>
          <dd className="mt-1 text-sm text-ink-soft">
            {c.plots} · {frontageLabel[cat][locale]}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/* -------------------------------------------------------------------- SRO page */

/**
 * Template 5a for an SRO that has only its khasra frontage list: every village in printed serial
 * order with its four counts, each linked to its page. Noindex until the rate list lands
 * (lib/pages.ts); the table is server-rendered, so the link graph into the villages needs no JS.
 */
export function FrontageTehsilTemplate({ locale, cityId, tehsilId }: { locale: Locale; cityId: string; tehsilId: string }) {
  const city = getCity(cityId);
  const tehsil = getTehsil(cityId, tehsilId);
  const list = getFrontage(cityId);
  const villages = getFrontageVillages(cityId, tehsilId);
  if (!city || !tehsil || !list || villages.length === 0) notFound();

  const t = ui[locale];
  const c = fc(locale);
  const broker = getBroker();
  const cityName = pick(locale, city.name, city.nameHi);
  const tehsilName = pick(locale, tehsil.name, tehsil.nameHi);
  const sro = pick(locale, tehsil.sroName, tehsil.sroNameHi);
  const doc = getFrontageSourceDoc(cityId, tehsilId);
  const pageLabel = `${tehsilName} · ${t.circleRates}`;

  return (
    <PageShell locale={locale} alternate={sameAlternate(locale, `/${cityId}/circle-rates/${tehsilId}/`)} pageLabel={pageLabel}>
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
            {tehsilName}: {c.sroH1}
          </h1>
          <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-ink-soft">
            <span>{sro}</span>
            <span aria-hidden="true">·</span>
            <span>
              {formatNumber(villages.length)} {c.villagesInSro}
            </span>
            {doc && (
              <>
                <span aria-hidden="true">·</span>
                <a href={doc.archiveUrl ?? doc.igrsupUrl} rel="noopener">
                  {t.sourcePdf}
                </a>
              </>
            )}
          </p>
        </div>
      </section>

      <Section>
        <RatesAwaited locale={locale} cityId={cityId} />
        <p className="mt-6">
          <a href={frontageToolHref(locale, tehsilId)} className="btn btn-primary gap-2 px-5 py-3 text-[15px]">
            {c.checkTitle} →
          </a>
        </p>
      </Section>

      <Section id="villages" title={c.frontageTable}>
        <p className="lede mb-6 max-w-3xl">{c.frontageTableLede}</p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[40rem] border-collapse text-sm">
            <thead className="bg-card">
              <tr>
                <th scope="col" className={`${th} ${numeric}`}>
                  {c.serial}
                </th>
                <th scope="col" className={th}>
                  {c.village}
                </th>
                {FRONTAGE_CATEGORIES.map((cat) => (
                  <th key={cat} scope="col" className={`${th} ${numeric}`}>
                    {frontageShortLabel[cat][locale]}
                  </th>
                ))}
                <th scope="col" className={th}>
                  {c.remarks}
                </th>
              </tr>
            </thead>
            <tbody>
              {villages.map((v) => (
                <tr key={v.id}>
                  <td className={`${td} ${numeric} text-muted`}>{v.serial}</td>
                  <td className={td}>
                    <a href={localePath(locale, `/${cityId}/circle-rates/${tehsilId}/${v.slug}/`)}>{pick(locale, v.nameEn, v.nameHi)}</a>
                    {locale === "en" && <span className="ml-2 text-ink-soft">{v.nameHi}</span>}
                  </td>
                  {FRONTAGE_CATEGORIES.map((cat) => (
                    <td key={cat} className={`${td} ${numeric}`}>
                      {v.counts[cat] > 0 ? formatNumber(v.counts[cat]) : <span className="text-muted">—</span>}
                    </td>
                  ))}
                  <td className={`${td} text-ink-soft`}>{v.notesHi.length > 0 ? c.hasRemark : <span className="text-muted">—</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-sm text-muted">{sourceLine(locale, list, tehsil, doc ? `1–${doc.pageCount}` : null)}</p>
        <p className="mt-2 text-sm font-semibold">{c.verify}</p>
        <SourceStamp locale={locale} sources={list.sources} updatedAt={list.updatedAt} effectiveFrom={list.effectiveFrom} />
      </Section>

      <Section id="enquiry" tone="sand">
        <LeadForm locale={locale} broker={broker} pageLabel={pageLabel} city={cityId} context={`${tehsil.name} SRO khasra frontage list`} />
      </Section>
    </PageShell>
  );
}

/* ---------------------------------------------------------------- village page */

/**
 * Template 5b for a village known only from its SRO's khasra frontage list. In place of the rate
 * tables: the "rates awaited" line, the four frontage counts, the roads the list names, the list's
 * own remarks, and the plot check prefilled with this village. Noindex (lib/pages.ts).
 */
export function FrontageVillageTemplate({
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
  const list = getFrontage(cityId);
  const village = getFrontageVillageBySlug(cityId, tehsilId, villageSlug);
  if (!city || !tehsil || !list || !village) notFound();

  const t = ui[locale];
  const c = fc(locale);
  const broker = getBroker();
  const cityName = pick(locale, city.name, city.nameHi);
  const tehsilName = pick(locale, tehsil.name, tehsil.nameHi);
  const name = pick(locale, village.nameEn, village.nameHi);
  const other = pick(locale, village.nameHi, village.nameEn);
  const pageLabel = `${name} · ${t.circleRates}`;
  const tehsilHref = localePath(locale, `/${cityId}/circle-rates/${tehsilId}/`);

  // Six villages around this one in the printed order, which is roughly how the list walks the SRO.
  const all = getFrontageVillages(cityId, tehsilId);
  const at = all.findIndex((v) => v.id === village.id);
  const start = Math.max(0, Math.min(at - 3, all.length - 7));
  const nearby = all.slice(start, start + 7).filter((v) => v.id !== village.id);

  return (
    <PageShell locale={locale} alternate={sameAlternate(locale, `/${cityId}/circle-rates/${tehsilId}/${village.slug}/`)} pageLabel={pageLabel}>
      <section className="border-b border-line bg-cream-deep/60">
        <div className="container-site pb-8 md:pb-10">
          <Breadcrumb
            items={[
              { label: t.home, href: localePath(locale, "/") },
              { label: cityName, href: localePath(locale, `/${cityId}/`) },
              { label: t.circleRates, href: localePath(locale, `/${cityId}/circle-rates/`) },
              { label: tehsilName, href: tehsilHref },
              { label: name },
            ]}
          />
          <h1>{name}</h1>
          <p className="mt-2 text-lg text-ink-soft">{other}</p>
          <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-ink-soft">
            <span>{pick(locale, tehsil.sroName, tehsil.sroNameHi)}</span>
            <span aria-hidden="true">·</span>
            <span>
              {c.serial} {village.serial}
            </span>
          </p>
        </div>
      </section>

      <Section>
        <RatesAwaited locale={locale} cityId={cityId} />
      </Section>

      <Section id="frontage" title={c.frontageTitle}>
        <p className="lede mb-6 max-w-3xl">{c.frontageLede}</p>
        <FrontageCounts locale={locale} village={village} />

        {village.roadsHi.length > 0 && (
          <div className="mt-8">
            <h3 className="font-semibold">{c.roadsTitle}</h3>
            <p className="mt-1 max-w-3xl text-sm text-ink-soft">{c.roadsLede}</p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {village.roadsHi.map((r) => (
                <li key={r} className="rounded-full border border-line bg-card px-3 py-1 text-sm" lang="hi">
                  {r}
                </li>
              ))}
            </ul>
          </div>
        )}

        {village.notesHi.length > 0 && (
          <div className="mt-8">
            <h3 className="font-semibold">{c.remarksTitle}</h3>
            <ul className="mt-3 max-w-3xl space-y-3">
              {village.notesHi.map((n) => {
                const gloss = locale === "en" ? glossNote(n) : null;
                return (
                  <li key={n} className="border-l-2 border-line pl-4">
                    {gloss && <p>{gloss}</p>}
                    <p lang="hi" className={gloss ? "mt-1 text-sm text-ink-soft" : ""}>
                      {n}
                    </p>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        <p className="mt-6 text-sm text-muted">{sourceLine(locale, list, tehsil, village.pages)}</p>
      </Section>

      <Section id="check" title={c.checkTitle} tone="sand">
        <p className="lede mb-5 max-w-2xl">{c.checkLede}</p>
        <a href={frontageToolHref(locale, tehsilId, village.slug)} className="btn btn-primary gap-2 px-5 py-3 text-[15px]">
          {c.checkCta} {name} →
        </a>
        <p className="mt-5 text-sm font-semibold">{c.verify}</p>
      </Section>

      <Section id="nearby" title={locale === "hi" ? `${tehsilName} ${c.moreVillages}` : `${c.moreVillages} ${tehsilName}`}>
        <ul className="divide-y divide-line rounded-xl border border-line bg-card">
          {nearby.map((v) => (
            <li key={v.id} className="flex items-baseline justify-between gap-4 px-4 py-2.5">
              <a href={localePath(locale, `/${cityId}/circle-rates/${tehsilId}/${v.slug}/`)}>{pick(locale, v.nameEn, v.nameHi)}</a>
              <span className="caption-mono text-muted">
                {c.serial} {v.serial}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm">
          <a href={tehsilHref}>{locale === "hi" ? `${tehsilName} ${c.allVillages}` : `${c.allVillages} ${tehsilName}`} →</a>
        </p>
        <SourceStamp locale={locale} sources={list.sources} updatedAt={list.updatedAt} effectiveFrom={list.effectiveFrom} />
      </Section>

      <Section id="enquiry" tone="sand">
        <LeadForm locale={locale} broker={broker} pageLabel={pageLabel} city={cityId} context={`${village.nameEn}, ${tehsil.name} SRO`} />
      </Section>
    </PageShell>
  );
}

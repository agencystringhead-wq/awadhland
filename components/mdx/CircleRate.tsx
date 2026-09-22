import { getBuildableLocalities, getCity, getLocalities } from "@/lib/data";
import { getLocalityRate } from "@/lib/rates";
import { formatDate, formatNumber, localePath, pick, ui, type Locale } from "@/lib/i18n";

export type CircleRateProps = {
  /** locality id from localities.json */
  locality: string;
  locale: Locale;
};

/**
 * Guide MDX component: the current circle rate of one locality, pulled from the record at build
 * (spec Template 6, section 3). Links to the locality page when it is built in this locale, and to
 * the city's circle-rate table always. Ids are checked by validate.ts before this renders.
 *
 * Reads through getLocalityRate, so a locality mapped into the published list quotes its real rows
 * rather than a legacy figure the import has since removed.
 */
export function CircleRate({ locality: id, locale }: CircleRateProps) {
  const t = ui[locale];
  const l = getLocalities().find((x) => x.id === id);
  if (!l) throw new Error(`<CircleRate locality="${id}">: unknown locality`);
  const r = getLocalityRate(l);
  if (!r) throw new Error(`<CircleRate locality="${id}">: no circleRate and no rateRefs`);
  const city = getCity(l.cityId);
  if (!city) throw new Error(`<CircleRate locality="${id}">: unknown city ${l.cityId}`);
  const name = pick(locale, l.name, l.nameHi);
  const built = getBuildableLocalities(locale).buildable.some((x) => x.id === l.id);
  const rows = [
    { label: t.residential, value: `₹${formatNumber(r.residential)} ${t.perSqM}` },
    { label: t.commercial, value: `₹${formatNumber(r.commercial)} ${t.perSqM}` },
    // Urban rows print no agricultural figure, so the row is dropped rather than shown as zero.
    ...(r.agricultural !== null ? [{ label: t.agricultural, value: `₹${formatNumber(r.agricultural)} ${t.perHectare}` }] : []),
  ];
  return (
    <figure data-component="CircleRate" className="card mdx-block my-8 overflow-hidden">
      <figcaption className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-line bg-cream-deep px-5 py-3">
        <span className="font-semibold">
          {t.circleRate} · {built ? <a href={localePath(locale, `/${city.id}/${l.id}/`)}>{name}</a> : name}
        </span>
        <span className="text-sm text-muted">
          {t.effective} {formatDate(r.effectiveFrom, locale)}
        </span>
      </figcaption>
      <dl className="grid gap-x-6 gap-y-2 px-5 py-4 sm:grid-cols-3">
        {rows.map((row) => (
          <div key={row.label} className="flex flex-col-reverse">
            <dd className="font-medium tabular-nums">{row.value}</dd>
            <dt className="text-sm text-muted">{row.label}</dt>
          </div>
        ))}
      </dl>
      <p className="flex flex-wrap gap-x-4 gap-y-1 border-t border-line px-5 py-2.5 text-sm">
        <a href={r.sourceUrl} rel="noopener" className="text-muted">
          {t.source}
        </a>
        <a href={localePath(locale, `/${city.id}/circle-rates/`)}>{t.fullCircleRateTable} →</a>
      </p>
    </figure>
  );
}

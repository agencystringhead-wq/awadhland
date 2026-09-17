import type { Locale } from "@/lib/i18n";
import { formatDate, formatNumber, localePath, ui } from "@/lib/i18n";
import type { CircleRateRow } from "@/lib/schemas";

export type CircleRateTableProps = {
  locale: Locale;
  cityId: string;
  rows: CircleRateRow[];
  /** locality id to display name, for the current locale */
  localityNames: Record<string, string>;
  /** locality ids that have a built page in this locale; others render without a link */
  linkableLocalityIds: string[];
  /** Hide the effective-date column when every row shares the schedule date (hub summary) */
  compact?: boolean;
};

/**
 * Values render in the published units (₹/sq m, ₹/hectare), never converted in storage.
 * Client-side sorting and filtering are added with the circle-rate page in step 3; the
 * print stylesheet lives in globals.css when that page lands.
 */
export function CircleRateTable({ locale, cityId, rows, localityNames, linkableLocalityIds, compact = false }: CircleRateTableProps) {
  const t = ui[locale];
  const num = "text-right tabular-nums";
  return (
    <div data-component="CircleRateTable" className="card overflow-x-auto">
      <table className="w-full text-[15px]">
        <thead className="bg-cream-deep text-left text-sm text-ink-soft">
          <tr>
            <th className="px-4 py-2.5 font-semibold">{t.locality}</th>
            <th className="px-4 py-2.5 font-semibold">{t.tehsil}</th>
            <th className={`px-4 py-2.5 font-semibold ${num}`}>
              {t.residential} <span className="font-normal text-muted">₹/{t.unitSqM}</span>
            </th>
            <th className={`px-4 py-2.5 font-semibold ${num}`}>
              {t.commercial} <span className="font-normal text-muted">₹/{t.unitSqM}</span>
            </th>
            <th className={`px-4 py-2.5 font-semibold ${num}`}>
              {t.agricultural} <span className="font-normal text-muted">₹/{t.unitHectare}</span>
            </th>
            {!compact && <th className="px-4 py-2.5 font-semibold">{t.effective}</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.map((r) => {
            const name = localityNames[r.localityId] ?? r.localityId;
            return (
              <tr key={r.localityId}>
                <td className="px-4 py-2.5 font-medium">
                  {linkableLocalityIds.includes(r.localityId) ? (
                    <a href={localePath(locale, `/${cityId}/${r.localityId}/`)} className="no-underline hover:underline">
                      {name}
                    </a>
                  ) : (
                    name
                  )}
                </td>
                <td className="px-4 py-2.5 text-ink-soft">{r.tehsil}</td>
                <td className={`px-4 py-2.5 ${num}`}>{formatNumber(r.residential)}</td>
                <td className={`px-4 py-2.5 ${num}`}>{formatNumber(r.commercial)}</td>
                <td className={`px-4 py-2.5 ${num}`}>{formatNumber(r.agricultural)}</td>
                {!compact && (
                  <td className="px-4 py-2.5 text-ink-soft">
                    <time dateTime={r.effectiveFrom}>{formatDate(r.effectiveFrom, locale)}</time>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

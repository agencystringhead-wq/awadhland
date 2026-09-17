import type { Locale } from "@/lib/i18n";
import { localePath } from "@/lib/i18n";
import type { CircleRateRow } from "@/lib/schemas";

export type CircleRateTableProps = {
  locale: Locale;
  cityId: string;
  rows: CircleRateRow[];
  /** locality id to display name, for the current locale */
  localityNames: Record<string, string>;
  /** locality ids that have a built page in this locale; others render without a link */
  linkableLocalityIds: string[];
};

/** Stub. Values render in the published units (₹/sq m, ₹/hectare). Sorting, filtering and print styles in step 3. */
export function CircleRateTable({ locale, cityId, rows, localityNames, linkableLocalityIds }: CircleRateTableProps) {
  return (
    <table data-component="CircleRateTable">
      <thead>
        <tr>
          <th>Locality</th>
          <th>Tehsil</th>
          <th>Residential ₹/sq m</th>
          <th>Commercial ₹/sq m</th>
          <th>Agricultural ₹/hectare</th>
          <th>Effective</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => {
          const name = localityNames[r.localityId] ?? r.localityId;
          return (
            <tr key={r.localityId}>
              <td>
                {linkableLocalityIds.includes(r.localityId) ? (
                  <a href={localePath(locale, `/${cityId}/${r.localityId}/`)}>{name}</a>
                ) : (
                  name
                )}
              </td>
              <td>{r.tehsil}</td>
              <td>{r.residential}</td>
              <td>{r.commercial}</td>
              <td>{r.agricultural}</td>
              <td>{r.effectiveFrom}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

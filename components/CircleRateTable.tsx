"use client";

/**
 * Circle-rate table. Values render in the published units (₹/sq m, ₹/hectare) and are never
 * converted in storage. The full HTML is prerendered at build; the small client layer adds
 * sorting, tehsil and land-type filters and a print button (spec Template 5, section 3).
 * With `interactive` off (hub summary) it is a plain table.
 */
import { useMemo, useState } from "react";
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
  /** Show sort, filter and print controls */
  interactive?: boolean;
};

type LandType = "all" | "residential" | "commercial" | "agricultural";
type SortKey = "locality" | "tehsil" | "residential" | "commercial" | "agricultural";

export function CircleRateTable({
  locale,
  cityId,
  rows,
  localityNames,
  linkableLocalityIds,
  compact = false,
  interactive = false,
}: CircleRateTableProps) {
  const t = ui[locale];
  const [tehsil, setTehsil] = useState("all");
  const [landType, setLandType] = useState<LandType>("all");
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "locality", dir: 1 });

  const tehsils = useMemo(() => [...new Set(rows.map((r) => r.tehsil))].sort(), [rows]);
  const name = (id: string) => localityNames[id] ?? id;

  const visible = useMemo(() => {
    const filtered = tehsil === "all" ? rows : rows.filter((r) => r.tehsil === tehsil);
    return [...filtered].sort((a, b) => {
      const va = sort.key === "locality" ? name(a.localityId) : sort.key === "tehsil" ? a.tehsil : a[sort.key];
      const vb = sort.key === "locality" ? name(b.localityId) : sort.key === "tehsil" ? b.tehsil : b[sort.key];
      const cmp = typeof va === "number" && typeof vb === "number" ? va - vb : String(va).localeCompare(String(vb), locale);
      return cmp * sort.dir;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, tehsil, sort, locale, localityNames]);

  const show = (col: Exclude<LandType, "all">) => landType === "all" || landType === col;
  const num = "text-right tabular-nums";
  const select = "rounded-lg border border-line bg-card px-2.5 py-1.5 text-sm";

  const th = (key: SortKey, label: string, cls = "") => (
    <th className={`px-4 py-2.5 font-semibold ${cls}`}>
      {interactive ? (
        <button
          type="button"
          onClick={() => setSort((s) => ({ key, dir: s.key === key ? ((s.dir * -1) as 1 | -1) : 1 }))}
          className="inline-flex items-center gap-1 text-left hover:text-accent"
          aria-sort={sort.key === key ? (sort.dir === 1 ? "ascending" : "descending") : undefined}
        >
          {label}
          {sort.key === key && <span aria-hidden="true">{sort.dir === 1 ? "▲" : "▼"}</span>}
        </button>
      ) : (
        label
      )}
    </th>
  );

  return (
    <div data-component="CircleRateTable">
      {interactive && (
        <div className="no-print mb-3 flex flex-wrap items-center gap-3 text-sm">
          <label className="flex items-center gap-2">
            <span className="text-muted">{t.filterTehsil}</span>
            <select value={tehsil} onChange={(e) => setTehsil(e.target.value)} className={select}>
              <option value="all">{t.all}</option>
              {tehsils.map((x) => (
                <option key={x} value={x}>
                  {x}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2">
            <span className="text-muted">{t.filterLandType}</span>
            <select value={landType} onChange={(e) => setLandType(e.target.value as LandType)} className={select}>
              <option value="all">{t.all}</option>
              <option value="residential">{t.residential}</option>
              <option value="commercial">{t.commercial}</option>
              <option value="agricultural">{t.agricultural}</option>
            </select>
          </label>
          <span className="text-muted">
            {t.showing} {visible.length} {t.of} {rows.length} {t.rows}
          </span>
          <button
            type="button"
            onClick={() => window.print()}
            className="btn ml-auto border border-line bg-card text-ink hover:bg-cream-deep px-3.5 py-1.5 text-sm"
          >
            {t.print}
          </button>
        </div>
      )}
      <div className="card overflow-x-auto">
        <table className="w-full text-[15px]">
          <thead className="bg-cream-deep text-left text-sm text-ink-soft">
            <tr>
              {th("locality", t.locality)}
              {th("tehsil", t.tehsil)}
              {show("residential") && th("residential", `${t.residential} ₹/${t.unitSqM}`, num)}
              {show("commercial") && th("commercial", `${t.commercial} ₹/${t.unitSqM}`, num)}
              {show("agricultural") && th("agricultural", `${t.agricultural} ₹/${t.unitHectare}`, num)}
              {!compact && <th className="px-4 py-2.5 font-semibold">{t.effective}</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {visible.map((r) => (
              <tr key={r.localityId}>
                <td className="px-4 py-2.5 font-medium">
                  {linkableLocalityIds.includes(r.localityId) ? (
                    <a href={localePath(locale, `/${cityId}/${r.localityId}/`)} className="no-underline hover:underline">
                      {name(r.localityId)}
                    </a>
                  ) : (
                    name(r.localityId)
                  )}
                </td>
                <td className="px-4 py-2.5 text-ink-soft">{r.tehsil}</td>
                {show("residential") && <td className={`px-4 py-2.5 ${num}`}>{formatNumber(r.residential)}</td>}
                {show("commercial") && <td className={`px-4 py-2.5 ${num}`}>{formatNumber(r.commercial)}</td>}
                {show("agricultural") && <td className={`px-4 py-2.5 ${num}`}>{formatNumber(r.agricultural)}</td>}
                {!compact && (
                  <td className="px-4 py-2.5 text-ink-soft">
                    <time dateTime={r.effectiveFrom}>{formatDate(r.effectiveFrom, locale)}</time>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

"use client";

/**
 * The village rate table for one tehsil (spec Template 5a; BUILD-SPEC Template 5, "paginates at
 * 100 rows server-side at build (static chunks), with client filtering within the chunk").
 *
 * Only the first 100 rows are prerendered. Sadar has 554, and Next serialises a prerendered tree
 * into the RSC flight payload as well as the HTML, so every row costs twice — a full 554-row
 * table produced a 3.2 MB page, which no amount of care elsewhere would have made fast. Sorting,
 * filtering or "show all" fetches the tehsil's chunk from scripts/build-rate-chunks.ts and takes
 * over from there.
 *
 * The complete list of villages still ships as static HTML, as a plain link list under the table,
 * so the link graph into the village pages does not depend on JavaScript.
 *
 * Values render in the published units and are never converted in storage.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { formatNumber, localePath, pick, type Locale } from "@/lib/i18n";
import { rc } from "@/lib/rate-copy";
import type { ChunkRow, RateChunk } from "@/lib/rate-chunks";
import type { RateCategory, RoadBand } from "@/lib/schemas";
import {
  AGRI_FRONTAGES,
  agriFrontageLabel,
  categoryFilterLabel,
  categoryText,
  COMMERCIAL_KINDS,
  commercialKindLabel,
} from "@/lib/valuation";

type View = "land" | "commercial" | "agricultural";
type SortKey = "name" | "ward" | "category" | `v${number}`;

const VIEWS: View[] = ["land", "commercial", "agricultural"];
const th = "px-3 py-2.5 text-left font-semibold whitespace-nowrap";
const td = "px-3 py-2 border-t border-line";
const numeric = "text-right tabular-nums";

export function TehsilRateTable({
  locale,
  cityId,
  tehsilId,
  firstRows,
  bands,
  total,
  categories,
  wards,
}: {
  locale: Locale;
  cityId: string;
  tehsilId: string;
  /** the first 100 rows, prerendered */
  firstRows: ChunkRow[];
  /** this city's road-width columns, in the same order as each row's land array */
  bands: RoadBand[];
  total: number;
  categories: (RateCategory | null)[];
  wards: string[];
}) {
  const c = rc(locale);
  const [view, setView] = useState<View>("land");
  const [category, setCategory] = useState("all");
  const [ward, setWard] = useState("all");
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 } | null>(null);
  const [allRows, setAllRows] = useState<ChunkRow[] | null>(null);
  const [loading, setLoading] = useState(false);

  const needsAll = allRows !== null;

  const loadAll = useCallback(async () => {
    if (allRows || loading) return;
    setLoading(true);
    try {
      const res = await fetch(`/rates/${cityId}-${tehsilId}.json`);
      if (!res.ok) throw new Error(String(res.status));
      const chunk = (await res.json()) as RateChunk;
      setAllRows(chunk.rows);
    } catch {
      // Leave the prerendered rows in place; the controls keep working within them.
      setAllRows(firstRows);
    } finally {
      setLoading(false);
    }
  }, [allRows, loading, cityId, tehsilId, firstRows]);

  // Any control that can reach beyond the first 100 rows pulls the chunk first.
  useEffect(() => {
    if (sort !== null || category !== "all" || ward !== "all") void loadAll();
  }, [sort, category, ward, loadAll]);

  const source = allRows ?? firstRows;

  const rows = useMemo(() => {
    let out = source;
    // "none" is the option for rows whose list prints no category column.
    if (category !== "all") out = out.filter((r) => (r.c ?? "none") === category);
    if (ward !== "all") out = out.filter((r) => (r.w ?? "") === ward);
    if (sort) {
      const { key, dir } = sort;
      const col = key.startsWith("v") ? Number(key.slice(1)) : -1;
      const group = view === "land" ? "r" : view === "commercial" ? "m" : "a";
      out = [...out].sort((a, b) => {
        if (col >= 0) {
          const na = (a[group] as (number | null)[])[col];
          const nb = (b[group] as (number | null)[])[col];
          // Blank agricultural cells (urban rows) sort last whichever way the column runs.
          if (na === null && nb === null) return 0;
          if (na === null) return 1;
          if (nb === null) return -1;
          return (na - nb) * dir;
        }
        const va = key === "name" ? (locale === "hi" ? a.h : a.n) : key === "ward" ? (a.w ?? "") : categoryText(a.c, locale);
        const vb = key === "name" ? (locale === "hi" ? b.h : b.n) : key === "ward" ? (b.w ?? "") : categoryText(b.c, locale);
        return va.localeCompare(vb, locale) * dir;
      });
    }
    return out;
  }, [source, category, ward, sort, view, locale]);

  const toggle = (key: SortKey) => setSort((s) => (s?.key === key ? { key, dir: s.dir === 1 ? -1 : 1 } : { key, dir: 1 }));
  const ariaSort = (key: SortKey) => (sort?.key === key ? (sort.dir === 1 ? "ascending" : "descending") : undefined);

  // Land columns come from the schedule — three for Ayodhya, four for Lucknow — so this table
  // never assumes a count. The other two views are fixed by the list's own printed columns.
  const columns = view === "land" ? bands : view === "commercial" ? COMMERCIAL_KINDS : AGRI_FRONTAGES;
  const columnLabel = (i: number) =>
    view === "land"
      ? locale === "hi"
        ? bands[i].labelHi
        : bands[i].labelEn
      : view === "commercial"
        ? commercialKindLabel[COMMERCIAL_KINDS[i]][locale]
        : agriFrontageLabel[AGRI_FRONTAGES[i]][locale];
  const cellValue = (r: ChunkRow, i: number) => {
    const v = view === "land" ? r.r[i] : view === "commercial" ? (r.m?.[i] ?? null) : r.a[i];
    return v === null || v === undefined ? "—" : formatNumber(v);
  };

  const select = "rounded-lg border border-line bg-card px-3 py-2 text-sm";
  const sortableTh = `${th} cursor-pointer select-none`;

  return (
    <div data-component="TehsilRateTable">
      <div className="mb-5 flex flex-wrap items-end gap-x-4 gap-y-3">
        <fieldset>
          <legend className="caption-mono mb-1.5 block text-muted">{c.viewLabel}</legend>
          <div className="inline-flex rounded-full border border-line bg-card p-0.5">
            {VIEWS.map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => {
                  setView(v);
                  setSort(null);
                }}
                aria-pressed={view === v}
                className={`rounded-full px-3.5 py-1.5 text-sm ${view === v ? "bg-ink text-card" : "text-ink-soft"}`}
              >
                {v === "land" ? c.viewLand : v === "commercial" ? c.viewCommercial : c.viewAgricultural}
              </button>
            ))}
          </div>
        </fieldset>

        <label className="block">
          <span className="caption-mono mb-1.5 block text-muted">{c.filterCategory}</span>
          <select className={select} value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="all">{c.allCategories}</option>
            {categories.map((k) => (
              <option key={k ?? "none"} value={k ?? "none"}>
                {categoryFilterLabel(k, locale)}
              </option>
            ))}
          </select>
        </label>

        {wards.length > 0 && (
          <label className="block">
            <span className="caption-mono mb-1.5 block text-muted">{c.filterWard}</span>
            <select className={select} value={ward} onChange={(e) => setWard(e.target.value)}>
              <option value="all">{c.allWards}</option>
              {wards.map((w) => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
            </select>
          </label>
        )}

        <p className="text-sm text-muted">
          {c.showing} {formatNumber(rows.length)} {c.of} {formatNumber(total)} {c.rows}
          {!needsAll && total > firstRows.length && (
            <button type="button" className="ml-3 underline" onClick={() => void loadAll()} disabled={loading}>
              {loading ? c.searchLoading : `${c.showAll} ${formatNumber(total)}`}
            </button>
          )}
          {(category !== "all" || ward !== "all" || sort !== null) && (
            <button
              type="button"
              className="ml-3 underline"
              onClick={() => {
                setCategory("all");
                setWard("all");
                setSort(null);
              }}
            >
              {c.clearFilters}
            </button>
          )}
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[46rem] border-collapse text-sm">
          <caption className="caption-mono pb-3 text-left text-muted">
            {view === "land" ? c.landColumns : view === "commercial" ? c.commercialColumns : c.agriColumns}
          </caption>
          <thead className="bg-cream-deep">
            <tr>
              <th scope="col" className={sortableTh} onClick={() => toggle("name")} aria-sort={ariaSort("name")}>
                {c.village}
              </th>
              <th scope="col" className={sortableTh} onClick={() => toggle("ward")} aria-sort={ariaSort("ward")}>
                {c.ward}
              </th>
              <th scope="col" className={sortableTh} onClick={() => toggle("category")} aria-sort={ariaSort("category")}>
                {c.category}
              </th>
              {columns.map((_, i) => (
                <th
                  key={i}
                  scope="col"
                  className={`${sortableTh} ${numeric}`}
                  onClick={() => toggle(`v${i}` as SortKey)}
                  aria-sort={ariaSort(`v${i}` as SortKey)}
                >
                  {columnLabel(i)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.i}>
                <td className={td}>
                  <a href={localePath(locale, `/${cityId}/circle-rates/${tehsilId}/${r.s}/`)}>{pick(locale, r.n, r.h)}</a>
                  <span className="block text-xs text-muted">{pick(locale, r.h, r.n)}</span>
                </td>
                <td className={`${td} text-muted`}>{r.w ?? "—"}</td>
                <td className={td}>{categoryText(r.c, locale)}</td>
                {columns.map((_, i) => (
                  <td key={i} className={`${td} ${numeric}`}>
                    {cellValue(r, i)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

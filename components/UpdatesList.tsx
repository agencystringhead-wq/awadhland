"use client";

/**
 * Updates archive filters (spec Template 8 index, sections 2 and 3): city, agency, type and year,
 * client-side over the static list. The full list is prerendered; filters only hide rows.
 */
import { useEffect, useMemo, useState } from "react";
import type { Locale } from "@/lib/i18n";
import { pick, ui } from "@/lib/i18n";
import type { City, Update } from "@/lib/schemas";
import { UpdateRow, updateTypeLabels } from "./UpdateRow";

export type UpdatesListProps = {
  locale: Locale;
  /** Newest first */
  updates: Update[];
  cities: Pick<City, "id" | "name" | "nameHi">[];
};

export function UpdatesList({ locale, updates, cities }: UpdatesListProps) {
  const t = ui[locale];
  const [city, setCity] = useState("all");
  const [agency, setAgency] = useState("all");
  const [type, setType] = useState("all");
  const [year, setYear] = useState("all");

  // The mega menu links here with ?city= and ?type=; apply them after mount so the static HTML matches.
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const c = q.get("city");
    const ty = q.get("type");
    if (c) setCity(c);
    if (ty) setType(ty);
  }, []);

  const agencyOf = (u: Update) => (u.agency === "other" ? (u.agencyName ?? "other") : u.agency);
  const agencies = useMemo(() => [...new Set(updates.map(agencyOf))].sort(), [updates]);
  const types = useMemo(() => [...new Set(updates.map((u) => u.type))], [updates]);
  const years = useMemo(() => [...new Set(updates.map((u) => u.date.slice(0, 4)))].sort().reverse(), [updates]);
  const usedCities = useMemo(() => cities.filter((c) => updates.some((u) => u.cityIds.includes(c.id))), [cities, updates]);

  const visible = updates.filter(
    (u) =>
      (city === "all" || u.cityIds.includes(city)) &&
      (agency === "all" || agencyOf(u) === agency) &&
      (type === "all" || u.type === type) &&
      (year === "all" || u.date.startsWith(year)),
  );

  const select = "rounded-lg border border-line bg-card px-2.5 py-1.5 text-sm";
  const field = (label: string, value: string, onChange: (v: string) => void, options: { value: string; label: string }[]) => (
    <label className="flex items-center gap-2">
      <span className="text-muted">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className={select}>
        <option value="all">{t.all}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );

  return (
    <div data-component="UpdatesList">
      <div className="no-print mb-4 flex flex-wrap items-center gap-3 text-sm">
        {field(
          t.filterCity,
          city,
          setCity,
          usedCities.map((c) => ({ value: c.id, label: pick(locale, c.name, c.nameHi) })),
        )}
        {field(
          t.filterAgency,
          agency,
          setAgency,
          agencies.map((a) => ({ value: a, label: a })),
        )}
        {field(
          t.filterType,
          type,
          setType,
          types.map((x) => ({ value: x, label: updateTypeLabels[x][locale] })),
        )}
        {field(
          t.filterYear,
          year,
          setYear,
          years.map((y) => ({ value: y, label: y })),
        )}
        <span className="text-muted">
          {t.showing} {visible.length} {t.of} {updates.length}
        </span>
      </div>
      <div className="card px-5">
        {visible.length === 0 && <p className="py-6 text-muted">{t.noMatches}</p>}
        {visible.map((u) => (
          <UpdateRow key={u.id} locale={locale} update={u} cities={cities} />
        ))}
      </div>
    </div>
  );
}

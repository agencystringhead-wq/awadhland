"use client";

/**
 * Search every village in the district, in either script (spec Template 5, rebuilt section).
 *
 * The 1,630 rows are far too many to inline on the city page, so the per-tehsil chunks written by
 * scripts/build-rate-chunks.ts are fetched on the first keystroke and cached for the session.
 * Nothing is fetched on page load, so the page weight is unchanged for readers who do not search.
 *
 * Matching is deliberately forgiving: Latin and Devanagari both work, and a Latin query is also
 * compared against a loosened form of the name so "rikabganj", "rikabgunj" and "rikab" all find
 * रिकाबगंज. This is a lookup, not a ranking problem, so it stays simple and explainable.
 */
import { useCallback, useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { formatNumber, localePath, pick, type Locale } from "@/lib/i18n";
import { rc } from "@/lib/rate-copy";
import { categoryLabel } from "@/lib/valuation";
import type { ChunkRow, RateChunk } from "@/lib/rate-chunks";

type Hit = ChunkRow & { tehsil: string };

const MAX_HITS = 25;

/** Collapses the spellings that differ without changing the sound: double letters, h after a stop. */
const loosen = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-zऀ-ॿ]/g, "")
    .replace(/(.)\1+/g, "$1")
    .replace(/([kgcjtdpb])h/g, "$1")
    .replace(/w/g, "v")
    .replace(/z/g, "j")
    .replace(/[uo]/g, "u")
    .replace(/[ie]/g, "i");

export function DistrictRateSearch({
  locale,
  cityId,
  tehsilIds,
  tehsilNames,
}: {
  locale: Locale;
  cityId: string;
  tehsilIds: string[];
  /** tehsil id → display name in the current locale */
  tehsilNames: Record<string, string>;
}) {
  const c = rc(locale);
  const inputId = useId();
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState<Hit[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const started = useRef(false);

  const load = useCallback(async () => {
    if (started.current) return;
    started.current = true;
    setLoading(true);
    try {
      const chunks = await Promise.all(
        tehsilIds.map(async (t) => {
          const res = await fetch(`/rates/${cityId}-${t}.json`);
          if (!res.ok) throw new Error(`${res.status} for ${t}`);
          return (await res.json()) as RateChunk;
        }),
      );
      setRows(chunks.flatMap((ch) => ch.rows.map((r) => ({ ...r, tehsil: ch.tehsil }))));
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, [cityId, tehsilIds]);

  // Fetch on the first keystroke, not on mount.
  useEffect(() => {
    if (query.length > 0) void load();
  }, [query, load]);

  const q = query.trim();
  const hits: Hit[] = (() => {
    if (!rows || q.length === 0) return [];
    const devanagari = /[ऀ-ॿ]/.test(q);
    if (devanagari) return rows.filter((r) => r.h.includes(q)).slice(0, MAX_HITS);
    const lower = q.toLowerCase();
    const loose = loosen(q);
    const exact = rows.filter((r) => r.n.toLowerCase().includes(lower));
    if (exact.length >= MAX_HITS) return exact.slice(0, MAX_HITS);
    const seen = new Set(exact.map((r) => r.i));
    const fuzzy = rows.filter((r) => !seen.has(r.i) && loose.length >= 3 && loosen(r.n).includes(loose));
    return [...exact, ...fuzzy].slice(0, MAX_HITS);
  })();

  return (
    <div data-component="DistrictRateSearch">
      <label htmlFor={inputId} className="caption-mono mb-2 block text-muted">
        {c.searchTitle}
      </label>
      <input
        id={inputId}
        type="search"
        autoComplete="off"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={c.searchPlaceholder}
        className="w-full max-w-xl rounded-xl border border-line bg-card px-4 py-3 text-base"
      />

      <div className="mt-4" aria-live="polite">
        {q.length === 0 && <p className="text-sm text-muted">{c.searchHint}</p>}
        {q.length > 0 && loading && <p className="text-sm text-muted">{c.searchLoading}</p>}
        {q.length > 0 && failed && (
          <p className="text-sm text-muted">
            {c.searchNoResults}{" "}
            {tehsilIds.map((t, i) => (
              <span key={t}>
                {i > 0 && " · "}
                <Link href={localePath(locale, `/${cityId}/circle-rates/${t}/`)}>{tehsilNames[t]}</Link>
              </span>
            ))}
          </p>
        )}
        {q.length > 0 && !loading && !failed && rows && hits.length === 0 && <p className="text-sm text-muted">{c.searchNoResults}</p>}
        {hits.length > 0 && (
          <>
            <p className="caption-mono mb-2 text-muted">
              {formatNumber(hits.length)}
              {hits.length === MAX_HITS ? "+" : ""} {c.searchResultCount}
            </p>
            <ul className="divide-y divide-line rounded-xl border border-line bg-card">
              {hits.map((r) => (
                <li key={r.i} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-4 py-3">
                  <span>
                    <Link href={localePath(locale, `/${cityId}/circle-rates/${r.tehsil}/${r.s}/`)} className="font-medium">
                      {pick(locale, r.n, r.h)}
                    </Link>
                    <span className="ml-2 text-sm text-muted">
                      {pick(locale, r.h, r.n)} · {tehsilNames[r.tehsil]} · {categoryLabel[r.c][locale]}
                    </span>
                  </span>
                  <span className="tabular-nums text-sm">
                    ₹{formatNumber(r.r[0])} <span className="text-muted">{c.perSqM}</span>
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}

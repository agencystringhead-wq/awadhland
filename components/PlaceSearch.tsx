"use client";

/**
 * The place typeahead the circle rate lookup and the plot yield calculator share: one search box
 * over the build-time index in public/lookup/, the same ranking (lib/lookup), the same keyboard
 * handling. The index loads on first focus; a place's full record loads from its SRO's chunk.
 */
import { useCallback, useId, useState } from "react";
import type { Locale } from "@/lib/i18n";
import {
  hydrateIndex,
  LOOKUP_INDEX_PATH,
  lookupChunkPath,
  searchLookup,
  type LookupChunk,
  type LookupEntry,
  type LookupHit,
  type LookupIndex,
  type LookupIndexWire,
} from "@/lib/lookup";

export type ChunkState = LookupChunk | "loading" | "error" | undefined;

/** The index and the per-SRO chunks, each fetched once per page. */
export function useLookupData() {
  const [index, setIndex] = useState<LookupIndex | null>(null);
  const [indexState, setIndexState] = useState<"idle" | "loading" | "failed">("idle");
  const [chunks, setChunks] = useState<Record<string, LookupChunk | "loading" | "error">>({});

  const loadIndex = useCallback(async (): Promise<LookupIndex | null> => {
    if (index) return index;
    setIndexState("loading");
    try {
      const r = await fetch(LOOKUP_INDEX_PATH);
      if (!r.ok) throw new Error(String(r.status));
      const idx = hydrateIndex((await r.json()) as LookupIndexWire);
      setIndex(idx);
      setIndexState("idle");
      return idx;
    } catch {
      setIndexState("failed");
      return null;
    }
  }, [index]);

  const chunkUrl = (idx: LookupIndex, e: LookupEntry) => {
    const s = idx.sros[e[3]];
    return lookupChunkPath(idx.cities[s.city].id, s.id);
  };

  const loadChunk = useCallback(
    (idx: LookupIndex, e: LookupEntry) => {
      const url = chunkUrl(idx, e);
      if (chunks[url] !== undefined) return;
      setChunks((m) => ({ ...m, [url]: "loading" }));
      fetch(url)
        .then((r) => (r.ok ? (r.json() as Promise<LookupChunk>) : Promise.reject(new Error(String(r.status)))))
        .then((j) => setChunks((m) => ({ ...m, [url]: j })))
        .catch(() => setChunks((m) => ({ ...m, [url]: "error" })));
    },
    [chunks],
  );

  const chunkFor = (idx: LookupIndex, e: LookupEntry): ChunkState => chunks[chunkUrl(idx, e)];

  /** Resolve a deep-linked id to its entry, loading the index and the chunk. */
  const openById = useCallback(
    async (id: string) => {
      const idx = await loadIndex();
      const e = idx?.entries.find((x) => x[0] === id);
      if (idx && e) loadChunk(idx, e);
      return idx && e ? { idx, e } : null;
    },
    [loadIndex, loadChunk],
  );

  return { index, indexState, loadIndex, loadChunk, chunkFor, openById };
}

export type PlaceComboboxProps = {
  locale: Locale;
  index: LookupIndex | null;
  indexState: "idle" | "loading" | "failed";
  onNeedIndex: () => void;
  query: string;
  onQuery: (q: string) => void;
  onPick: (hit: LookupHit) => void;
  city?: string;
  sro?: string;
  /** leave out whole-SRO suggestions (the yield calculator needs a place) */
  placesOnly?: boolean;
  label: string;
  placeholder: string;
  hint: string;
  loadingText: string;
  failedText: string;
  sroSuggestionText: string;
  listLabel: string;
  optional?: string;
};

const field = "block w-full rounded-lg border border-line bg-card px-3 py-2.5 text-[16px] text-ink focus:border-accent";

export function PlaceCombobox(p: PlaceComboboxProps) {
  const hi = p.locale === "hi";
  const uid = useId();
  const listId = `${uid}-list`;
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  const hits: LookupHit[] =
    p.index && p.query.trim().length >= 2
      ? searchLookup(p.index, p.query, { city: p.city || undefined, sro: p.sro || undefined }).filter((h) => !p.placesOnly || h.type === "place")
      : [];
  const showList = open && hits.length > 0;

  const pick = (h: LookupHit) => {
    setOpen(false);
    p.onPick(h);
  };

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((a) => Math.min(a + 1, Math.max(hits.length - 1, 0)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      if (showList && hits[active]) {
        e.preventDefault();
        pick(hits[active]);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div className="relative">
      <label htmlFor={`${uid}-q`} className="block text-sm font-medium text-ink-soft">
        {p.label}
        {p.optional && <span className="ml-1 font-normal text-muted">({p.optional})</span>}
      </label>
      <input
        id={`${uid}-q`}
        type="search"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={showList}
        aria-controls={listId}
        aria-activedescendant={showList && hits[active] ? `${uid}-opt-${active}` : undefined}
        autoComplete="off"
        spellCheck={false}
        className={`${field} mt-1`}
        placeholder={p.placeholder}
        value={p.query}
        onFocus={() => {
          p.onNeedIndex();
          setOpen(true);
        }}
        onChange={(e) => {
          p.onQuery(e.target.value);
          setActive(0);
          setOpen(true);
        }}
        onKeyDown={onKey}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
      />
      <p className="mt-1 text-xs text-muted">{p.indexState === "loading" ? p.loadingText : p.indexState === "failed" ? p.failedText : p.hint}</p>

      {showList && (
        <ul
          id={listId}
          role="listbox"
          aria-label={p.listLabel}
          className="absolute left-0 right-0 z-20 mt-1 max-h-[26rem] overflow-y-auto rounded-xl border border-line bg-card shadow-lg"
        >
          {hits.map((h, i) => {
            const s = p.index!.sros[h.type === "sro" ? h.sro : h.entry[3]];
            const cityName = hi ? p.index!.cities[s.city].nameHi : p.index!.cities[s.city].name;
            const sroName = hi ? s.nameHi : s.name;
            return (
              <li
                key={h.type === "sro" ? `sro-${h.sro}` : h.entry[0]}
                id={`${uid}-opt-${i}`}
                role="option"
                aria-selected={i === active}
                className={`cursor-pointer px-4 py-2.5 ${i === active ? "bg-cream-deep" : ""}`}
                onMouseDown={(ev) => {
                  ev.preventDefault();
                  pick(h);
                }}
                onMouseEnter={() => setActive(i)}
              >
                {h.type === "sro" ? (
                  <>
                    <span className="font-semibold">{sroName}</span>
                    <span className="block text-sm text-ink-soft">
                      {p.sroSuggestionText} · {cityName}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="font-semibold">{hi ? h.entry[1] : h.entry[2]}</span>
                    {h.entry[7] && <span className="ml-2 text-sm text-muted">{h.entry[7]}</span>}
                    <span className="block text-sm text-ink-soft">
                      {sroName} · {cityName}
                    </span>
                  </>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

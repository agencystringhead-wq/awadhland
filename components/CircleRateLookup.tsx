"use client";

/**
 * Circle rate lookup (spec Template 7): one search box across every village, mohalla and colony of
 * Ayodhya, Lucknow and Gorakhpur, in Hindi or English, then the full published rates for the one
 * picked.
 *
 * Nothing is in the page's HTML beyond the form. The search index (public/lookup/index.json,
 * ~175 KB gzipped) loads when the box is first focused or a deep link needs it; the chosen place's
 * full record loads from its SRO's chunk. The ranking and the normaliser live in lib/lookup, shared
 * with the build script that writes the index.
 *
 * Deep links: ?id=<rate row id> opens that result; ?city=<id> preselects the city filter (the
 * circle-rate hubs link here that way). Picking a result rewrites ?id= so the address bar is the
 * share link.
 */
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { whatsappHref } from "@/components/WhatsAppButton";
import { formatDate, formatNumber, localePath, type Locale } from "@/lib/i18n";
import {
  hydrateIndex,
  LOOKUP_INDEX_PATH,
  lookupChunkPath,
  perSqFt,
  searchLookup,
  type LookupChunk,
  type LookupEntry,
  type LookupHit,
  type LookupIndex,
  type LookupIndexWire,
} from "@/lib/lookup";
import { gridFrontageLabel, lc, lookupCategoryLabel, sixFrontageLabel, slabLabels } from "@/lib/lookup-copy";

type Chunk = LookupChunk;
type RatesChunk = Extract<Chunk, { kind: "rates" }>;
type FrontageChunkT = Extract<Chunk, { kind: "frontage" }>;

export type CircleRateLookupProps = {
  locale: Locale;
  whatsapp: string;
  /** m² in one local bigha, from data/units.json, with its label */
  bighaSqm: number;
  bighaLabel: string;
  /** circle-rate hub per city, for the JavaScript-off fallback */
  hubs: { id: string; name: string; href: string }[];
  /** the khasra plot-check tool, for SROs whose rates are awaited */
  plotCheckHref: string;
};

const field = "block w-full rounded-lg border border-line bg-card px-3 py-2.5 text-[16px] text-ink focus:border-accent";
const label = "block text-sm font-medium text-ink-soft";
const fmt = (s: string, vars: Record<string, string>) => s.replace(/\{(\w+)\}/g, (_, k: string) => vars[k] ?? "");

export function CircleRateLookup({ locale, whatsapp, bighaSqm, bighaLabel, hubs, plotCheckHref }: CircleRateLookupProps) {
  const c = lc(locale);
  const hi = locale === "hi";
  const uid = useId();
  const listId = `${uid}-list`;
  const inputRef = useRef<HTMLInputElement>(null);

  const [index, setIndex] = useState<LookupIndex | null>(null);
  const [indexState, setIndexState] = useState<"idle" | "loading" | "failed">("idle");
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("");
  const [sro, setSro] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [selected, setSelected] = useState<LookupEntry | null>(null);
  const [chunks, setChunks] = useState<Record<string, Chunk | "loading" | "error">>({});

  /* the index, loaded once, on first need */
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

  /* a result's SRO chunk */
  const sroOf = useCallback((idx: LookupIndex, e: LookupEntry) => idx.sros[e[3]], []);
  const loadChunk = useCallback(
    (idx: LookupIndex, e: LookupEntry) => {
      const s = sroOf(idx, e);
      const url = lookupChunkPath(idx.cities[s.city].id, s.id);
      if (chunks[url] !== undefined) return;
      setChunks((m) => ({ ...m, [url]: "loading" }));
      fetch(url)
        .then((r) => (r.ok ? (r.json() as Promise<Chunk>) : Promise.reject(new Error(String(r.status)))))
        .then((j) => setChunks((m) => ({ ...m, [url]: j })))
        .catch(() => setChunks((m) => ({ ...m, [url]: "error" })));
    },
    [chunks, sroOf],
  );

  /* deep links: ?id= opens a result, ?city= preselects the filter */
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const cityParam = q.get("city");
    if (cityParam) setCity(cityParam);
    const id = q.get("id");
    if (!id) return;
    void loadIndex().then((idx) => {
      const e = idx?.entries.find((x) => x[0] === id);
      if (idx && e) {
        setSelected(e);
        loadChunk(idx, e);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- read once, on load
  }, []);

  const hits: LookupHit[] = useMemo(
    () => (index && query.trim().length >= 2 ? searchLookup(index, query, { city: city || undefined, sro: sro || undefined }) : []),
    [index, query, city, sro],
  );
  useEffect(() => setActive(0), [query, city, sro]);

  const hrefFor = (idx: LookupIndex, e: LookupEntry) => {
    const s = idx.sros[e[3]];
    return localePath(locale, `/${idx.cities[s.city].id}/circle-rates/${s.id}/${e[4]}/`);
  };

  const choose = (h: LookupHit) => {
    if (!index) return;
    if (h.type === "sro") {
      const s = index.sros[h.sro];
      window.location.href = localePath(locale, `/${index.cities[s.city].id}/circle-rates/${s.id}/`);
      return;
    }
    setSelected(h.entry);
    setOpen(false);
    setQuery(hi ? h.entry[1] : h.entry[2]);
    loadChunk(index, h.entry);
    const u = new URL(window.location.href);
    u.searchParams.set("id", h.entry[0]);
    window.history.replaceState(null, "", u.toString());
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
      if (open && hits[active]) {
        e.preventDefault();
        choose(hits[active]);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const sroOptions = index ? index.sros.map((s, i) => ({ s, i })).filter(({ s }) => !city || index.cities[s.city].id === city) : [];
  const showList = open && query.trim().length >= 2 && index !== null;

  /* ---------------------------------------------------------------- result */

  const result = (() => {
    if (!selected || !index) return null;
    const s = sroOf(index, selected);
    const cityRec = index.cities[s.city];
    const chunk = chunks[lookupChunkPath(cityRec.id, s.id)];
    if (chunk === undefined || chunk === "loading") return <p className="mt-6 text-ink-soft">{c.resultLoading}</p>;
    if (chunk === "error") return <p className="mt-6 text-maroon">{c.loadFailed}</p>;
    return chunk.kind === "frontage" ? (
      <AwaitedCard locale={locale} entry={selected} index={index} chunk={chunk} plotCheckHref={plotCheckHref} pageHref={hrefFor(index, selected)} whatsapp={whatsapp} />
    ) : (
      <RateCard
        locale={locale}
        entry={selected}
        index={index}
        chunk={chunk}
        pageHref={hrefFor(index, selected)}
        whatsapp={whatsapp}
        bighaSqm={bighaSqm}
        bighaLabel={bighaLabel}
      />
    );
  })();

  const noMatch = index !== null && query.trim().length >= 2 && hits.length === 0 && !selected;

  return (
    <div data-component="CircleRateLookup" className="w-full">
      <div className="grid gap-4">
        <div className="relative">
          <label htmlFor={`${uid}-q`} className={label}>
            {c.searchLabel}
          </label>
          <input
            ref={inputRef}
            id={`${uid}-q`}
            type="search"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={showList && hits.length > 0}
            aria-controls={listId}
            aria-activedescendant={showList && hits[active] ? `${uid}-opt-${active}` : undefined}
            autoComplete="off"
            spellCheck={false}
            className={`${field} mt-1`}
            placeholder={c.searchPlaceholder}
            value={query}
            onFocus={() => {
              void loadIndex();
              setOpen(true);
            }}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
              if (selected) setSelected(null);
            }}
            onKeyDown={onKey}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
          />
          <p className="mt-1 text-xs text-muted">{indexState === "loading" ? c.loading : indexState === "failed" ? c.loadFailed : c.searchHint}</p>

          {showList && hits.length > 0 && (
            <ul
              id={listId}
              role="listbox"
              aria-label={c.suggestionsLabel}
              className="absolute left-0 right-0 z-20 mt-1 max-h-[26rem] overflow-y-auto rounded-xl border border-line bg-card shadow-lg"
            >
              {hits.map((h, i) => {
                const s = index!.sros[h.type === "sro" ? h.sro : h.entry[3]];
                const cityName = hi ? index!.cities[s.city].nameHi : index!.cities[s.city].name;
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
                      choose(h);
                    }}
                    onMouseEnter={() => setActive(i)}
                  >
                    {h.type === "sro" ? (
                      <>
                        <span className="font-semibold">{sroName}</span>
                        <span className="block text-sm text-ink-soft">
                          {c.sroSuggestion} · {cityName}
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

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className={label}>{c.city}</span>
            <select
              className={`${field} mt-1`}
              value={city}
              onFocus={() => void loadIndex()}
              onChange={(e) => {
                setCity(e.target.value);
                setSro("");
              }}
            >
              <option value="">{c.all}</option>
              {(index?.cities ?? hubs.map((h) => ({ id: h.id, name: h.name, nameHi: h.name }))).map((x) => (
                <option key={x.id} value={x.id}>
                  {hi ? x.nameHi : x.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className={label}>{c.sro}</span>
            <select className={`${field} mt-1`} value={sro} onFocus={() => void loadIndex()} onChange={(e) => setSro(e.target.value)}>
              <option value="">{c.all}</option>
              {sroOptions.map(({ s, i }) => (
                <option key={i} value={s.id}>
                  {hi ? s.nameHi : s.name}
                  {!city && index ? ` · ${hi ? index.cities[s.city].nameHi : index.cities[s.city].name}` : ""}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {noMatch && (
        <div className="mt-6 rounded-2xl border border-dashed border-line bg-cream-deep/40 p-5">
          <p className="font-semibold">{c.noMatchTitle}</p>
          <p className="mt-1 text-ink-soft">{c.noMatchBody}</p>
          <a
            href={whatsappHref(whatsapp, hi ? `नमस्ते, मुझे इस जगह का सर्किल रेट चाहिए: ${query}. खसरा नंबर: ` : `Hi, I need the circle rate for: ${query}. Khasra number: `)}
            rel="noopener"
            className="btn mt-4 bg-whatsapp px-4 py-2.5 text-sm text-white hover:bg-accent-deep hover:text-white"
          >
            {c.noMatchCta}
          </a>
        </div>
      )}

      {result}

      <noscript>
        <p className="mt-4 text-ink-soft">
          {c.fallback}{" "}
          {hubs.map((h, i) => (
            <span key={h.id}>
              {i > 0 && " · "}
              <a href={h.href}>{h.name} →</a>
            </span>
          ))}
        </p>
      </noscript>
    </div>
  );
}

/* ------------------------------------------------------------------ cards */

/** effectiveFrom is omitted on an awaited card: there are no rates yet for a date to apply to. */
function CardHeader({ locale, entry, index, effectiveFrom, extra }: { locale: Locale; entry: LookupEntry; index: LookupIndex; effectiveFrom?: string; extra?: React.ReactNode }) {
  const c = lc(locale);
  const hi = locale === "hi";
  const s = index.sros[entry[3]];
  const cityRec = index.cities[s.city];
  return (
    <header>
      <h2 className="text-2xl">{hi ? entry[1] : entry[2]}</h2>
      <p className="text-lg text-ink-soft">{hi ? entry[2] : entry[1]}</p>
      <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-sm text-ink-soft">
        <span>{hi ? s.nameHi : s.name}</span>
        <span aria-hidden="true">·</span>
        <span>{hi ? cityRec.nameHi : cityRec.name}</span>
        {extra}
        {effectiveFrom && (
          <>
            <span aria-hidden="true">·</span>
            <span>
              {c.effective} <time dateTime={effectiveFrom}>{formatDate(effectiveFrom, locale)}</time>
            </span>
          </>
        )}
      </p>
    </header>
  );
}

function Actions({ locale, pageHref, calcHref, whatsapp, message }: { locale: Locale; pageHref: string; calcHref: string | null; whatsapp: string; message: string }) {
  const c = lc(locale);
  const [copied, setCopied] = useState(false);
  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ url });
      else await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      /* the reader cancelled the share sheet */
    }
  };
  const btn = "btn px-4 py-2.5 text-sm";
  return (
    <div className="mt-6 flex flex-wrap gap-2">
      {calcHref && (
        <a href={calcHref} className={`${btn} btn-primary`}>
          {c.calculate}
        </a>
      )}
      <a href={pageHref} className={`${btn} border border-line bg-card text-ink hover:bg-cream-deep`}>
        {c.openPage}
      </a>
      <button type="button" onClick={() => void share()} className={`${btn} border border-line bg-card text-ink hover:bg-cream-deep`}>
        {copied ? c.copied : c.share}
      </button>
      <a href={whatsappHref(whatsapp, message)} rel="noopener" className={`${btn} bg-whatsapp text-white hover:bg-accent-deep hover:text-white`}>
        {c.whatsapp}
      </a>
    </div>
  );
}

function RateCard({
  locale,
  entry,
  index,
  chunk,
  pageHref,
  whatsapp,
  bighaSqm,
  bighaLabel,
}: {
  locale: Locale;
  entry: LookupEntry;
  index: LookupIndex;
  chunk: RatesChunk;
  pageHref: string;
  whatsapp: string;
  bighaSqm: number;
  bighaLabel: string;
}) {
  const c = lc(locale);
  const hi = locale === "hi";
  const row = chunk.rows.find((r) => r.id === entry[0]);
  if (!row) return <p className="mt-6 text-maroon">{c.loadFailed}</p>;
  const s = index.sros[entry[3]];
  const sroName = hi ? s.nameHi : s.name;
  const money = (n: number) => `₹${formatNumber(n)}`;
  const bigha = (lakhPerHa: number) => money(Math.round((lakhPerHa * 100_000 * bighaSqm) / 10_000));
  const bands = chunk.bands.filter((b) => typeof row.nonAgri[b.key] === "number");
  const kinds = chunk.commercialKinds.filter((k) => typeof row.commercial?.[k.key] === "number");
  const six = (Object.keys(sixFrontageLabel) as (keyof typeof sixFrontageLabel)[]).filter((f) => row.agriLakhPerHa[f] !== null);
  const grid = row.agriGrid ?? null;
  const segments = chunk.segments.filter((g) => g.rateRowId === row.id);
  const box = "rounded-xl border border-line bg-card p-4";
  const h3 = "caption-mono mb-3 text-muted";
  const tellApart = [row.wardHi, row.category ? lookupCategoryLabel[row.category][locale] : null].filter(Boolean);

  // Gorakhpur's 2016 list is in force by a 2020 order; its 2015-list SROs carry their own note.
  const inForce =
    chunk.cityId === "gorakhpur" ? (chunk.effectiveFrom === "2016-08-03" ? c.gorakhpurFinePrint : chunk.inForceNote ? (hi ? chunk.inForceNote.hi : chunk.inForceNote.en) : null) : null;

  const message = hi
    ? `नमस्ते, मैंने awadhland.com पर सर्किल रेट देखा: ${row.nameHi}, ${sroName}। ${bands[0] ? `भूमि ${money(row.nonAgri[bands[0].key])} प्रति वर्ग मीटर। ` : ""}इस पर बात करनी है।`
    : `Hi, I looked up the circle rate on awadhland.com: ${row.nameEn}, ${sroName}. ${bands[0] ? `Land ${money(row.nonAgri[bands[0].key])} per sq m. ` : ""}I would like to talk about it.`;

  return (
    <article aria-live="polite" className="mt-6 rounded-2xl border border-line bg-cream-deep/50 p-4 sm:p-6">
      <CardHeader
        locale={locale}
        entry={entry}
        index={index}
        effectiveFrom={chunk.effectiveFrom}
        extra={tellApart.map((t) => (
          <span key={t} className="contents">
            <span aria-hidden="true">·</span>
            <span>{t}</span>
          </span>
        ))}
      />

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {/* land, every printed band; the ₹/sq ft line under each */}
        <section className={box}>
          <h3 className={h3}>
            {c.land} · {c.perSqM}
          </h3>
          {bands.length > 0 ? (
            <dl className="divide-y divide-line">
              {bands.map((b) => (
                <div key={b.key} className="flex items-baseline justify-between gap-3 py-2">
                  <dt className="text-ink-soft">{hi ? b.labelHi : b.labelEn}</dt>
                  <dd className="text-right tabular-nums">
                    <span className="font-semibold">{money(row.nonAgri[b.key])}</span>
                    <span className="block text-xs text-muted">
                      {money(perSqFt(row.nonAgri[b.key]))} {c.perSqFt}
                    </span>
                  </dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="text-sm text-ink-soft">{c.noLand}</p>
          )}
        </section>

        {(kinds.length > 0 || row.commercialRent) && (
          <section className={box}>
            <h3 className={h3}>
              {c.commercial} · {c.perSqM}
            </h3>
            <dl className="divide-y divide-line">
              {kinds.map((k) => (
                <div key={k.key} className="flex items-baseline justify-between gap-3 py-2">
                  <dt className="text-ink-soft">{hi ? k.labelHi : k.labelEn}</dt>
                  <dd className="font-semibold tabular-nums">{money(row.commercial![k.key])}</dd>
                </div>
              ))}
              {row.commercialRent && (
                <div className="flex items-baseline justify-between gap-3 py-2">
                  <dt className="text-ink-soft">{c.commercialRent}</dt>
                  <dd className="font-semibold tabular-nums">{money(row.commercialRent)}</dd>
                </div>
              )}
            </dl>
            {row.commercialFrom && <p className="mt-2 text-xs text-muted">{fmt(c.commercialAmended, { date: formatDate(row.commercialFrom, locale) })}</p>}
          </section>
        )}

        {six.length > 0 && !grid && (
          <section className={box}>
            <h3 className={h3}>
              {c.agri} · {c.lakhPerHa}
            </h3>
            <dl className="divide-y divide-line">
              {six.map((f) => (
                <div key={f} className="flex items-baseline justify-between gap-3 py-2">
                  <dt className="text-ink-soft">{sixFrontageLabel[f][locale]}</dt>
                  <dd className="text-right tabular-nums">
                    <span className="font-semibold">{formatNumber(row.agriLakhPerHa[f]!)}</span>
                    <span className="block text-xs text-muted">
                      {bigha(row.agriLakhPerHa[f]!)} {c.perBigha}
                    </span>
                  </dd>
                </div>
              ))}
            </dl>
            <p className="mt-2 text-xs text-muted">{bighaLabel}</p>
          </section>
        )}
      </div>

      {grid && (
        <section className={`${box} mt-4`}>
          <h3 className={h3}>
            {c.agri} · {c.lakhPerHa}
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[30rem] text-sm">
              <thead>
                <tr>
                  <th scope="col" className="px-2 py-2 text-left font-semibold">
                    {c.frontage}
                  </th>
                  {slabLabels(grid.slabsHa, locale).map((l) => (
                    <th key={l} scope="col" className="px-2 py-2 text-right font-semibold">
                      {l}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(Object.keys(gridFrontageLabel) as (keyof typeof gridFrontageLabel)[]).map((f) => (
                  <tr key={f}>
                    <th scope="row" className="border-t border-line px-2 py-2 text-left font-normal text-ink-soft">
                      {gridFrontageLabel[f][locale]}
                    </th>
                    {grid[f].map((v, i) => (
                      <td key={i} className="border-t border-line px-2 py-2 text-right tabular-nums">
                        {v === null ? (
                          "—"
                        ) : (
                          <>
                            {formatNumber(v)}
                            <span className="block text-[11px] text-muted">{bigha(v)}</span>
                          </>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-xs text-muted">
            {c.agriGridNote} {c.perBigha}: {bighaLabel}.
          </p>
        </section>
      )}

      {segments.length > 0 && (
        <section className={`${box} mt-4`}>
          <h3 className={h3}>{c.mainRoads}</h3>
          <p className="mb-3 text-sm text-ink-soft">{c.mainRoadsLede}</p>
          <ul className="divide-y divide-line">
            {segments.map((g) => (
              <li key={g.id} className="py-2">
                <p lang="hi">{g.segmentHi}</p>
                <p className="mt-0.5 text-sm tabular-nums text-ink-soft">
                  {g.nonAgri !== null && (
                    <span className="mr-4">
                      {c.roadLand} {money(g.nonAgri)} {c.perSqM}
                    </span>
                  )}
                  {g.shop !== null && (
                    <span>
                      {c.roadShop} {money(g.shop)}
                    </span>
                  )}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <Actions locale={locale} pageHref={pageHref} calcHref={`${pageHref}#calculator`} whatsapp={whatsapp} message={message} />

      <p className="mt-5 border-t border-line pt-3 text-xs text-muted">
        {fmt(c.finePrint, { sro: sroName, date: formatDate(chunk.effectiveFrom, locale) })}
        {inForce && ` ${inForce}`}
      </p>
    </article>
  );
}

function AwaitedCard({
  locale,
  entry,
  index,
  chunk,
  plotCheckHref,
  pageHref,
  whatsapp,
}: {
  locale: Locale;
  entry: LookupEntry;
  index: LookupIndex;
  chunk: FrontageChunkT;
  plotCheckHref: string;
  pageHref: string;
  whatsapp: string;
}) {
  const c = lc(locale);
  const hi = locale === "hi";
  const s = index.sros[entry[3]];
  const v = chunk.villages.find((x) => x.id === entry[0]);
  const sroName = hi ? s.nameHi : s.name;
  const message = hi
    ? `नमस्ते, मुझे ${entry[1]} (${sroName}) का सर्किल रेट चाहिए।`
    : `Hi, I need the circle rate for ${entry[2]} (${sroName}).`;
  return (
    <article aria-live="polite" className="mt-6 rounded-2xl border border-line bg-cream-deep/50 p-4 sm:p-6">
      <CardHeader locale={locale} entry={entry} index={index} />
      <div className="mt-5 rounded-xl border border-dashed border-line bg-card p-4">
        <p className="font-semibold">{c.awaitedTitle}</p>
        <p className="mt-1 text-sm text-ink-soft">{c.awaitedBody}</p>
        <a href={`${plotCheckHref}?sro=${s.id}${v ? `&village=${v.slug}` : ""}`} className="btn btn-primary mt-4 px-4 py-2.5 text-sm">
          {c.awaitedCta} →
        </a>
      </div>
      <Actions locale={locale} pageHref={pageHref} calcHref={null} whatsapp={whatsapp} message={message} />
      <p className="mt-5 border-t border-line pt-3 text-xs text-muted">{fmt(c.finePrintFrontage, { sro: sroName, date: formatDate(chunk.effectiveFrom, locale) })}</p>
    </article>
  );
}

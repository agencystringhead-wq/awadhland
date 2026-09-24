"use client";

/**
 * "Check your plot" (spec Template 7): SRO -> village -> khasra number -> which frontage heading
 * the district's list puts it under.
 *
 * The pickers come prerendered from props. The khasra numbers do not: one village's list is
 * fetched from public/frontage/ when it is picked (scripts/build-frontage-chunks.ts), typically
 * 2–6 KB, so the tool never loads the 58,000-row list.
 *
 * Matching is on khasra_base, the leading digits, so "123" finds "123क" and "123/2". Entries the
 * transcriber was unsure of say "verify at the Tehsil", and the Tehsil line is always shown next
 * to a result.
 */
import { useEffect, useMemo, useState } from "react";
import { Calculator } from "@/components/Calculator";
import { whatsappHref } from "@/components/WhatsAppButton";
import type { FrontageChunk } from "@/lib/frontage";
import { fc, frontageLabel } from "@/lib/frontage-copy";
import type { Locale } from "@/lib/i18n";
import type { FrontageCheckData } from "@/lib/tools";

const field = "block w-full rounded-lg border border-line bg-card px-3 py-2 text-[15px] text-ink focus:border-accent";
const label = "block text-sm font-medium text-ink-soft";

/** Devanagari digits to ASCII, so "१२३" matches "123". */
const asciiDigits = (s: string) => s.replace(/[०-९]/g, (d) => String(d.charCodeAt(0) - 0x0966));

/** Leading digits without leading zeros: "0123/2" -> "123". Null when the input starts with no digit. */
export function khasraBase(input: string): string | null {
  const m = /^\s*(\d+)/.exec(asciiDigits(input));
  return m ? m[1].replace(/^0+(?=\d)/, "") : null;
}

const norm = (s: string) => asciiDigits(s).replace(/\s+/g, "").replace(/^0+(?=\d)/, "").toLowerCase();

type Match = FrontageChunk["plots"][number] & { how: "exact" | "base" | "range" };

export function findKhasra(chunk: FrontageChunk, input: string): Match[] {
  const base = khasraBase(input);
  if (base === null) return [];
  const want = norm(input);
  const n = Number(base);
  // "294284" printed without a comma was split into 294 and 284, which carry the flag. The fused
  // original stays in the list as printed; it is just as doubtful, so it gets the flag too.
  const fused = new Set(chunk.plots.flatMap((p) => /^split from (\S+)/.exec(p.u ?? "")?.[1] ?? []));
  const out: Match[] = [];
  for (const q of chunk.plots) {
    const p = fused.has(q.k) && !q.u ? { ...q, u: "printed without a comma" } : q;
    if (p.b === base) out.push({ ...p, how: norm(p.k) === want ? "exact" : "base" });
    else {
      // A printed range, "1193-1198", covers every number in it.
      const r = /^(\d+)-(\d+)$/.exec(p.k);
      if (r && n > Number(r[1]) && n <= Number(r[2])) out.push({ ...p, how: "range" });
    }
  }
  const rank = { exact: 0, base: 1, range: 2 } as const;
  return out.sort((a, b) => rank[a.how] - rank[b.how]);
}

export type KhasraFrontageCheckProps = {
  locale: Locale;
  data: FrontageCheckData;
  whatsapp: string;
  title: string;
  /** preselect, from a village page; the query string (?sro=&village=) wins when present */
  defaultSro?: string;
  defaultVillage?: string;
};

export function KhasraFrontageCheck({ locale, data, whatsapp, title, defaultSro, defaultVillage }: KhasraFrontageCheckProps) {
  const c = fc(locale);
  // One city today (Lucknow). The pickers flatten across cities so a second list needs no new UI.
  const sros = data.cities.flatMap((city) => city.sros.map((s) => ({ ...s, cityName: city.name })));
  const [sroId, setSroId] = useState(() => (sros.some((s) => s.id === defaultSro) ? defaultSro! : (sros[0]?.id ?? "")));
  const sro = sros.find((s) => s.id === sroId) ?? sros[0];
  const [villageSlug, setVillageSlug] = useState(() =>
    sro?.villages.some((v) => v.slug === defaultVillage) ? defaultVillage! : (sro?.villages[0]?.slug ?? ""),
  );
  const village = sro?.villages.find((v) => v.slug === villageSlug) ?? sro?.villages[0];
  const [khasra, setKhasra] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [chunks, setChunks] = useState<Record<string, FrontageChunk | "loading" | "error">>({});
  // False until the query string has been read, so the default village is not fetched for nothing.
  const [queryRead, setQueryRead] = useState(false);

  /* A village page links here with ?sro=…&village=…; a static page can only read that client-side. */
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const s = sros.find((x) => x.id === q.get("sro"));
    if (s) {
      setSroId(s.id);
      const v = s.villages.find((x) => x.slug === q.get("village"));
      setVillageSlug(v?.slug ?? s.villages[0]?.slug ?? "");
    }
    setQueryRead(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- read once, on load
  }, []);

  /* Fetch the picked village's list once; keep it for the session. */
  const chunkUrl = village?.chunk;
  const chunk = chunkUrl ? chunks[chunkUrl] : undefined;
  useEffect(() => {
    if (!queryRead || !chunkUrl || chunks[chunkUrl] !== undefined) return;
    setChunks((m) => ({ ...m, [chunkUrl]: "loading" }));
    fetch(chunkUrl)
      .then((r) => (r.ok ? (r.json() as Promise<FrontageChunk>) : Promise.reject(new Error(String(r.status)))))
      .then((j) => setChunks((m) => ({ ...m, [chunkUrl]: j })))
      .catch(() => setChunks((m) => ({ ...m, [chunkUrl]: "error" })));
  }, [queryRead, chunkUrl, chunks]);

  const ready = chunk !== undefined && chunk !== "loading" && chunk !== "error" ? chunk : null;
  const query = submitted.trim();
  const base = query ? khasraBase(query) : null;
  const matches = useMemo(() => (ready && base !== null ? findKhasra(ready, query) : []), [ready, base, query]);

  const onSro = (id: string) => {
    setSroId(id);
    setVillageSlug(sros.find((s) => s.id === id)?.villages[0]?.slug ?? "");
    setSubmitted("");
  };

  const roadName = (m: Match) => (ready && m.r !== undefined ? ready.roads[m.r] : null);

  const message =
    query && village && sro
      ? locale === "hi"
        ? `नमस्ते, मैंने awadhland.com पर गाटा जाँचा: ${village.name}, ${sro.name}, खसरा ${query}। ${
            matches.length ? matches.map((m) => `${m.k}: ${frontageLabel[m.c].hi}${m.u ? " (तहसील से पुष्टि करें)" : ""}`).join("; ") : "सूची में नहीं मिला"
          }। इस पर बात करनी है।`
        : `Hi, I checked a plot on awadhland.com: ${village.name}, ${sro.name}, khasra ${query}. ${
            matches.length ? matches.map((m) => `${m.k}: ${frontageLabel[m.c].en}${m.u ? " (verify at the Tehsil)" : ""}`).join("; ") : "Not on the list"
          }. I would like to talk about it.`
      : "";

  const inputs = (
    <form
      className="grid gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        setSubmitted(khasra);
      }}
    >
      <div>
        <label htmlFor="kf-sro" className={label}>
          {c.toolSro}
        </label>
        <select id="kf-sro" className={`${field} mt-1`} value={sro?.id ?? ""} onChange={(e) => onSro(e.target.value)}>
          {sros.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} · {s.cityName}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="kf-village" className={label}>
          {c.toolVillage}
        </label>
        <select
          id="kf-village"
          className={`${field} mt-1`}
          value={village?.slug ?? ""}
          onChange={(e) => {
            setVillageSlug(e.target.value);
            setSubmitted("");
          }}
        >
          {(sro?.villages ?? []).map((v) => (
            <option key={v.slug} value={v.slug}>
              {v.name} · {v.other}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="kf-khasra" className={label}>
          {c.toolKhasra}
        </label>
        <div className="mt-1 flex gap-2">
          <input
            id="kf-khasra"
            className={`${field} tabular-nums`}
            type="text"
            autoComplete="off"
            placeholder="123"
            value={khasra}
            onChange={(e) => setKhasra(e.target.value)}
          />
          <button type="submit" className="btn btn-primary shrink-0 px-4 py-2 text-sm">
            {c.toolCheck}
          </button>
        </div>
        <p className="mt-1 text-xs text-muted">{c.toolKhasraHint}</p>
      </div>
    </form>
  );

  const verify = <p className="mt-4 border-t border-line pt-3 text-sm font-semibold">{c.verify}</p>;

  const output = (() => {
    if (!village) return <p className="text-ink-soft">{c.toolPrompt}</p>;
    if (chunk === "error") return <p className="text-maroon">{c.toolLoadFailed}</p>;
    if (!query) return <p className="text-ink-soft">{c.toolPrompt}</p>;
    if (base === null) return <p className="text-ink-soft">{c.toolNoDigits}</p>;
    if (!ready) return <p className="text-ink-soft">{c.toolLoading}</p>;
    const howLabel = { exact: c.toolExact, base: c.toolSameBase, range: c.toolRange } as const;
    return (
      <div data-testid="kf-result">
        {matches.length > 0 ? (
          <>
            <p className="text-lg font-semibold">
              {locale === "hi" ? `खसरा ${query} ${c.toolFound}` : `Khasra ${query} ${c.toolFound}`}
            </p>
            <p className="mt-1 text-sm text-muted">
              {c.toolFoundLede} {base}
            </p>
            <ul className="mt-3 divide-y divide-line">
              {matches.map((m, i) => (
                <li key={`${m.k}-${m.c}-${m.r ?? ""}-${i}`} className="py-2.5">
                  <p className="flex flex-wrap items-baseline justify-between gap-x-3">
                    <span className="font-semibold tabular-nums">{m.k}</span>
                    <span className="caption-mono text-muted">{howLabel[m.how]}</span>
                  </p>
                  <p className="text-ink">{frontageLabel[m.c][locale]}</p>
                  {roadName(m) && (
                    <p className="text-sm text-ink-soft">
                      {c.toolRoad}: {roadName(m)}
                    </p>
                  )}
                  {m.u && <p className="mt-1 text-sm font-semibold text-maroon">{c.verifyShort}</p>}
                </li>
              ))}
            </ul>
          </>
        ) : (
          <>
            <p className="text-lg font-semibold">
              {locale === "hi" ? `खसरा ${query} ${c.toolNotFound}` : `Khasra ${query} ${c.toolNotFound}`}
            </p>
            <p className="mt-2 text-sm text-ink-soft">{c.toolNotFoundLede}</p>
          </>
        )}
        {village.allAbadi && <p className="mt-3 rounded-lg bg-card p-3 text-sm text-ink">{c.toolAllAbadi}</p>}
        {verify}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <a href={whatsappHref(whatsapp, message)} rel="noopener" className="btn bg-whatsapp text-white hover:bg-accent-deep hover:text-white px-4 py-2.5 text-sm">
            {c.toolSendWhatsapp}
          </a>
          <a href={village.href} className="text-sm">
            {c.toolVillagePage}: {village.name} →
          </a>
        </div>
      </div>
    );
  })();

  return (
    <Calculator
      title={title}
      inputs={inputs}
      result={output}
      fallback={
        <>
          {c.toolFallback}{" "}
          {sros.map((s, i) => (
            <span key={s.id}>
              {i > 0 && " · "}
              <a href={s.href}>{s.name} →</a>
            </span>
          ))}
        </>
      }
    />
  );
}

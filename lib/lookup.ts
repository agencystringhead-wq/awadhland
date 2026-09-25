/**
 * Circle rate lookup: the search index shape, the normaliser and the ranking.
 *
 * Plain module with no data imports, so the build script that writes the index and the client
 * component that reads it share one normaliser and one ranking by construction. A query and a name
 * that normalise differently on the two sides would silently never match.
 *
 * The index (public/lookup/index.json, scripts/build-lookup-index.ts) carries only what a
 * suggestion needs. The full rate record comes from one per-SRO chunk, fetched when a result is
 * picked.
 */
import { transliterate } from "./devanagari";
import type { FrontageVillage, RateRow, RoadBand, RoadSegmentRow } from "./schemas";

/* -------------------------------------------------------------------- normalise */

/**
 * Latin key. Lowercase, letters only, and the spellings that differ without changing the sound
 * collapsed: v/b/w, sh/s, ph/f, z/j, q/k, aa/a, ee/i, oo/u, and any doubled letter.
 */
export function romanKey(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z]/g, "")
    .replace(/ph/g, "f")
    .replace(/sh/g, "s")
    .replace(/[bw]/g, "v")
    .replace(/z/g, "j")
    .replace(/q/g, "k")
    .replace(/ee/g, "i")
    .replace(/oo/g, "u")
    .replace(/(.)\1+/g, "$1");
}

/**
 * Consonant skeleton of a Latin key: aspirate pairs folded (kh/k, bh/b...), then the vowels after
 * the first letter dropped. It is what lets "chinhut" and "chinahat" find "chinhat", and "gomti
 * nagar" find the romaniser's "gomtingar": all of them reduce to the same consonants. Only the
 * aspirate pairs fold; the h of chin-hat is a real consonant and stays.
 */
export function skeleton(key: string): string {
  if (!key) return "";
  const folded = key.replace(/([kgcjtdvp])h/g, "$1");
  return (folded[0] + folded.slice(1).replace(/[aeiou]/g, "")).replace(/(.)\1+/g, "$1");
}

/**
 * Devanagari key: spaces, dots and abbreviation marks gone, nukta and chandrabindu removed, and
 * long vowels folded into short ones (रूस्तमपुर / रुस्तमपुर, पिपराईच / पिपराइच), because printed lists
 * spell the same place both ways.
 */
export function devKey(s: string): string {
  return s
    .normalize("NFC")
    .replace(/[़ँ]/g, "")
    .replace(/[\s.\-–—/(),0०]/g, "")
    .replace(/ी/g, "ि")
    .replace(/ू/g, "ु")
    .replace(/ई/g, "इ")
    .replace(/ऊ/g, "उ")
    .replace(/ॅ/g, "")
    .replace(/(.)\1+/g, "$1");
}

export const hasDevanagari = (s: string) => /[ऀ-ॿ]/.test(s);

/* ------------------------------------------------------------------------ index */

export type LookupCity = { id: string; name: string; nameHi: string };
export type LookupSro = { city: number; id: string; name: string; nameHi: string; frontage: boolean };

/**
 * One searchable place, as shipped. A tuple because there are about 7,400 of them:
 * [id, nameHi, nameEn, sroIndex, slug, romanKey, aliasKeys, tellApart]
 * aliasKeys are romanKey|devKey pairs of other names the place goes by (a covering locality).
 * tellApart is set only where one SRO prints the same name twice: the ward or pargana, else the
 * serial, so the two suggestions do not read as a duplicate.
 * The skeleton and the Devanagari key are derived on load (hydrateIndex): shipping them cost a
 * third of the gzipped index for something the browser computes in a few milliseconds.
 */
export type LookupEntryWire = [string, string, string, number, string, string, string[], string];

/** An entry with its derived keys: [...wire, skeleton, devKey]. */
export type LookupEntry = [string, string, string, number, string, string, string[], string, string, string];

export type LookupIndexWire = {
  generatedAt: string;
  cities: LookupCity[];
  sros: LookupSro[];
  entries: LookupEntryWire[];
};

export type LookupIndex = Omit<LookupIndexWire, "entries"> & { entries: LookupEntry[] };

/** Add the derived keys to every entry. Run once, when the index arrives. */
export function hydrateIndex(wire: LookupIndexWire): LookupIndex {
  return { ...wire, entries: wire.entries.map((e) => [...e, skeleton(e[5]), devKey(e[1])] as LookupEntry) };
}

/* ------------------------------------------------------------------------ search */

/**
 * A suggestion: a place, or a whole SRO when the query names one ("khajni", "bakshi ka talab").
 * An SRO suggestion opens the SRO's page, which lists every village in it.
 */
export type LookupHit = { type: "place"; entry: LookupEntry; score: number } | { type: "sro"; sro: number; score: number };

const STOPWORDS = new Set(["village", "gaon", "gav", "gram", "mohalla", "muhalla", "colony", "kalony", "ward", "tehsil", "sro", "गाँव", "गांव", "ग्राम", "मोहल्ला", "कॉलोनी", "कालोनी", "तहसील"]);

/**
 * Rank the index for a query.
 *
 * Tokens that name a city ("gorakhpur rustampur") filter to that city; tokens that name an SRO
 * ("ayodhya sadar", "bakshi ka talab village") boost that SRO's places, and when nothing else is
 * left in the query they become the query. What remains is matched as one name, strongest first:
 * exact key, key prefix, exact skeleton, skeleton prefix, key contained, skeleton contained, and a
 * one-edit skeleton match for longer names. Same name in two SROs gives two hits.
 */
export function searchLookup(
  index: LookupIndex,
  query: string,
  opts: { city?: string; sro?: string; limit?: number } = {},
): LookupHit[] {
  const limit = opts.limit ?? 8;
  const raw = query.trim();
  if (raw.replace(/\s/g, "").length < 2) return [];

  // Split into words, in either script.
  let words = raw.split(/[\s,]+/).filter(Boolean);
  words = words.filter((w) => !STOPWORDS.has(w.toLowerCase()));

  // City words become a filter.
  let cityFilter = opts.city ? index.cities.findIndex((c) => c.id === opts.city) : -1;
  words = words.filter((w) => {
    const k = hasDevanagari(w) ? devKey(w) : romanKey(w);
    const hit = index.cities.findIndex((c) => romanKey(c.name) === k || devKey(c.nameHi) === k);
    if (hit >= 0) {
      if (cityFilter < 0) cityFilter = hit;
      return false;
    }
    return true;
  });

  // SRO words: boost the SRO; keep them in the name query only if nothing else is left.
  const sroMatch = (text: string) => {
    const rk = hasDevanagari(text) ? romanKey(transliterate(text)) : romanKey(text);
    const dk = hasDevanagari(text) ? devKey(text) : "";
    return index.sros
      .map((s, i) => ({ s, i }))
      .filter(({ s }) => (cityFilter < 0 || s.city === cityFilter) && (romanKey(s.name) === rk || (dk && devKey(s.nameHi) === dk) || romanKey(s.name.replace(/-/g, "")) === rk))
      .map(({ i }) => i);
  };
  const joinedAll = words.join(" ");
  let boostSros = sroMatch(joinedAll);
  let nameWords = words;
  if (boostSros.length === 0 && words.length > 1) {
    // "ayodhya sadar gram" -> try each word, and the tail after one.
    for (let i = 0; i < words.length && boostSros.length === 0; i++) {
      const found = sroMatch(words[i]);
      if (found.length) {
        boostSros = found;
        nameWords = words.filter((_, j) => j !== i);
      }
    }
  }
  const sroFilter = opts.sro ? index.sros.findIndex((s) => s.id === opts.sro && (cityFilter < 0 || s.city === cityFilter)) : -1;

  const nameQuery = nameWords.join(" ");
  const onlySro = nameWords.length === 0 || (boostSros.length > 0 && nameWords.join(" ") === joinedAll && sroMatch(nameQuery).length > 0);
  const dev = hasDevanagari(nameQuery);
  const qd = dev ? devKey(nameQuery) : "";
  const qr = romanKey(dev ? transliterate(nameQuery) : nameQuery);
  const qs = skeleton(qr);

  const hits: LookupHit[] = [];
  // The query names an SRO outright: offer the SRO itself first.
  if (onlySro) for (const i of boostSros) if (sroFilter < 0 || sroFilter === i) hits.push({ type: "sro", sro: i, score: 99 });

  for (const e of index.entries) {
    const sro = index.sros[e[3]];
    if (cityFilter >= 0 && sro.city !== cityFilter) continue;
    if (sroFilter >= 0 && e[3] !== sroFilter) continue;

    let score = 0;
    const [, , , , , rk, aliases, , sk, dk] = e;
    if (qd && dk) score = Math.max(score, dk === qd ? 100 : dk.startsWith(qd) ? 92 : dk.includes(qd) ? 70 : 0);
    if (qr) {
      score = Math.max(
        score,
        rk === qr ? 98 : rk.startsWith(qr) ? 90 : sk === qs ? 86 : qs.length >= 4 && sk.startsWith(qs) ? 80 : rk.includes(qr) && qr.length >= 3 ? 66 : qs.length >= 4 && sk.includes(qs) ? 60 : 0,
      );
      if (score === 0 && qs.length >= 4 && Math.abs(sk.length - qs.length) <= 1 && editDistance(sk, qs) <= 1) score = 55;
    }
    for (const a of aliases) {
      const [ark, adk] = a.split("|");
      if ((qr && (ark === qr || ark.startsWith(qr))) || (qd && adk && adk.startsWith(qd))) score = Math.max(score, 84);
    }
    if (score === 0) continue;
    if (boostSros.includes(e[3])) score += 8;
    // Among equals, the spelling closest to what was typed ("rikabgunj" -> Rikabganj before
    // Rakabganj), then the shorter name ("Chinhat" before "Faizabad Road Purvi (Chinhat Tak)").
    if (qr) score -= Math.min(editDistance(rk.slice(0, qr.length + 2), qr), 6) / 2;
    score -= Math.min(rk.length, 40) / 100;
    hits.push({ type: "place", entry: e, score });
  }
  const name = (h: LookupHit) => (h.type === "place" ? h.entry[2] : index.sros[h.sro].name);
  hits.sort((a, b) => b.score - a.score || name(a).localeCompare(name(b)));
  return hits.slice(0, limit);
}

function editDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    prev = cur;
  }
  return prev[n];
}

/* ------------------------------------------------------------------------ chunks */

/** One SRO's full records, fetched when a result from it is picked. */
export type LookupChunk =
  | {
      kind: "rates";
      cityId: string;
      sro: string;
      effectiveFrom: string;
      sourceUrl: string;
      bands: RoadBand[];
      commercialKinds: { key: string; labelEn: string; labelHi: string }[];
      inForceNote: { en: string; hi: string } | null;
      rows: Omit<RateRow, "note">[];
      segments: Omit<RoadSegmentRow, "note">[];
    }
  | {
      kind: "frontage";
      cityId: string;
      sro: string;
      effectiveFrom: string;
      villages: Omit<FrontageVillage, "printedCounts">[];
    };

export const lookupChunkPath = (cityId: string, sro: string) => `/lookup/${cityId}-${sro}.json`;
export const LOOKUP_INDEX_PATH = "/lookup/index.json";

/** ₹/sq m → ₹/sq ft, rounded, for the line under each land rate. */
export const SQFT_PER_SQM = 10.764;
export const perSqFt = (perSqm: number) => Math.round(perSqm / SQFT_PER_SQM);

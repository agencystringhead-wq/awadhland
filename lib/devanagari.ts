/**
 * Devanagari → Latin for village and road-segment names (Step 9, detail D1).
 *
 * The published rate lists name every village in Devanagari only, so `nameEn` and the URL slug
 * are derived here. Three passes:
 *
 *   1. Tokenise into syllables. A consonant carries an inherent "a" unless a virama or a matra
 *      says otherwise, so the schwa is explicit before anything decides whether to drop it.
 *   2. Hindi schwa deletion. Written Devanagari keeps every inherent "a"; spoken Hindi drops most
 *      of them, which is why रिकाबगंज is Rikabganj and not "rikabaganja". No transliteration
 *      library does this (they render the script, not the phonology), so the rule is implemented
 *      below and tuned against the names actually in these lists.
 *   3. Render to plain ASCII using the romanisation conventions Indian place names use in English
 *      (sh, ch, kh, ph), with no diacritics, so slugs are typable and URL-safe.
 *
 * Output is deliberately conservative: where the conventional English spelling of a place differs
 * from its phonology (सिविल लाइन → "Civil Lines"), scripts/name-overrides.json wins. This module
 * only has to be right often enough that the override list stays small.
 *
 * Pure and dependency-free: the import script and the build both call it and must agree.
 */

/** Consonant → ASCII. Inherent "a" is added by the tokeniser, not baked in here. */
const CONSONANTS: Record<string, string> = {
  क: "k", ख: "kh", ग: "g", घ: "gh", ङ: "n",
  च: "ch", छ: "chh", ज: "j", झ: "jh", ञ: "n",
  ट: "t", ठ: "th", ड: "d", ढ: "dh", ण: "n",
  त: "t", थ: "th", द: "d", ध: "dh", न: "n",
  प: "p", फ: "ph", ब: "b", भ: "bh", म: "m",
  य: "y", र: "r", ल: "l", व: "v", ळ: "l",
  श: "sh", ष: "sh", स: "s", ह: "h",
  // Nukta forms, both precomposed and as base + U+093C (handled in normalise()).
  क़: "q", ख़: "kh", ग़: "g", ज़: "z", ड़: "r", ढ़: "rh", फ़: "f", य़: "y",
};

/** Independent vowel → ASCII. */
const VOWELS: Record<string, string> = {
  अ: "a", आ: "a", इ: "i", ई: "i", उ: "u", ऊ: "u",
  ऋ: "ri", ॠ: "ri", ए: "e", ऐ: "ai", ओ: "o", औ: "au",
  ऑ: "o", ऍ: "e", // candra forms, used for English loans (ऑफिस)
};

/** Matra (dependent vowel sign) → ASCII. An absent matra means the inherent schwa. */
const MATRAS: Record<string, string> = {
  "ा": "a",  // ा
  "ि": "i",  // ि
  "ी": "i",  // ी
  "ु": "u",  // ु
  "ू": "u",  // ू
  "ृ": "ri", // ृ
  "े": "e",  // े
  "ै": "ai", // ै
  "ो": "o",  // ो
  "ौ": "au", // ौ
  "ॉ": "o",  // ॉ  candra O — sanscript leaves this one untransliterated
  "ॅ": "e",  // ॅ  candra E
};

const VIRAMA = "्";
const NUKTA = "़";
const ANUSVARA = "ं";
const CHANDRABINDU = "ँ";
const VISARGA = "ः";
const AVAGRAHA = "ऽ";
const DIGITS: Record<string, string> = { "०": "0", "१": "1", "२": "2", "३": "3", "४": "4", "५": "5", "६": "6", "७": "7", "८": "8", "९": "9" };

/** Base + nukta pairs that have no precomposed form in the source text. */
const NUKTA_PAIRS: Record<string, string> = { क: "q", ख: "kh", ग: "g", ज: "z", ड: "r", ढ: "rh", फ: "f", य: "y" };

/** Consonants that tolerate a following consonant cluster when their own schwa is dropped. */
const NASALS = new Set(["n", "m", "ng"]);

/**
 * One written syllable: an onset consonant (possibly empty, for independent vowels), its vowel,
 * and any nasal coda. `schwa` marks a vowel that was never written — only those may be deleted.
 */
type Syllable = {
  onset: string;
  vowel: string;
  /** nasal coda from anusvara or candrabindu */
  coda: string;
  /** true when `vowel` is the unwritten inherent "a" */
  schwa: boolean;
};

/** Normalises the forms that vary between transcribers: precomposed nuktas, ZWJ/ZWNJ. */
function normalise(text: string): string {
  let s = text.normalize("NFC").replace(/[​-‍﻿]/g, "");
  // Decompose precomposed nukta letters so one code path handles both spellings.
  s = s.normalize("NFD");
  return s;
}

function tokenise(word: string): Syllable[] {
  const chars = [...normalise(word)];
  const out: Syllable[] = [];
  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];

    if (DIGITS[ch]) {
      out.push({ onset: DIGITS[ch], vowel: "", coda: "", schwa: false });
      continue;
    }
    if (ch === AVAGRAHA || ch === VISARGA) continue;

    if (ANUSVARA === ch || CHANDRABINDU === ch) {
      // Nasalises the syllable already emitted.
      const prev = out.at(-1);
      if (prev) prev.coda = "n";
      continue;
    }

    if (VOWELS[ch]) {
      out.push({ onset: "", vowel: VOWELS[ch], coda: "", schwa: false });
      continue;
    }

    let ascii = CONSONANTS[ch];
    if (!ascii) {
      // Not Devanagari (Latin, punctuation, space handled by the caller): pass through.
      if (/\S/.test(ch)) out.push({ onset: ch, vowel: "", coda: "", schwa: false });
      continue;
    }

    // base + nukta
    if (chars[i + 1] === NUKTA) {
      ascii = NUKTA_PAIRS[ch] ?? ascii;
      i++;
    }

    const next = chars[i + 1];
    if (next === VIRAMA) {
      out.push({ onset: ascii, vowel: "", coda: "", schwa: false });
      i++;
    } else if (next !== undefined && MATRAS[next]) {
      out.push({ onset: ascii, vowel: MATRAS[next], coda: "", schwa: false });
      i++;
    } else {
      out.push({ onset: ascii, vowel: "a", coda: "", schwa: true });
    }
  }
  return out;
}

const hasVowel = (s: Syllable | undefined) => s !== undefined && s.vowel !== "";

/**
 * Hindi schwa deletion, right to left.
 *
 * Word-final schwas go first (गंज → "ganj"), then medial ones, but only where dropping the vowel
 * still leaves something pronounceable: the following syllable must carry its own vowel, and the
 * preceding one must carry a vowel or be a nasal. The nasal exception is what makes
 * परमानन्दपुर come out as "parmanandpur" rather than "parmananda-pur".
 */
function deleteSchwas(syllables: Syllable[]): Syllable[] {
  const s = syllables.map((x) => ({ ...x }));
  if (s.length < 2) return s; // न stays "na"

  const last = s.at(-1)!;
  if (last.schwa && last.coda === "") {
    last.vowel = "";
    last.schwa = false;
  }

  for (let i = s.length - 2; i > 0; i--) {
    const cur = s[i];
    if (!cur.schwa || cur.coda !== "") continue;
    const prev = s[i - 1];
    const next = s[i + 1];
    if (!hasVowel(next)) continue;
    // A following independent vowel (no onset) keeps the schwa: बरई is Barai, not "Bari".
    if (next.onset === "") continue;
    if (!hasVowel(prev) && !NASALS.has(prev.onset)) continue;
    cur.vowel = "";
    cur.schwa = false;
  }
  return s;
}

const renderWord = (word: string) =>
  deleteSchwas(tokenise(word))
    .map((s) => s.onset + s.vowel + s.coda)
    .join("");

/**
 * Devanagari → plain ASCII, preserving word breaks and hyphens.
 * Text already in Latin passes through unchanged.
 */
export function transliterate(text: string): string {
  return text
    .split(/(\s+|-)/)
    .map((part) => (/^[\s-]*$/.test(part) ? part : renderWord(part)))
    .join("")
    .replace(/\s+/g, " ")
    .trim();
}

/** Title Case for display: "rikabganj" → "Rikabganj". Small joining words stay lower. */
const MINOR = new Set(["ka", "ki", "ke", "aur", "va"]);
export function titleCase(text: string): string {
  return text
    .split(" ")
    .map((w, i) => (i > 0 && MINOR.has(w.toLowerCase()) ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(" ");
}

/** ASCII → URL slug. Strips anything that is not a letter, digit or separator. */
export function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Display name and slug for one Devanagari name, before overrides are applied. */
export function romanise(nameHi: string): { nameEn: string; slug: string } {
  const ascii = transliterate(nameHi);
  return { nameEn: titleCase(ascii), slug: slugify(ascii) };
}

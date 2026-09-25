import type { Locale } from "@/lib/i18n";
import { getInForceNote } from "@/lib/rates";

/**
 * Which list is in force, where a city's schedule says (Gorakhpur: the 2016 list, kept in force by
 * the Collector's order of 04-08-2020, rules updated in 2025; the 2015 list for Sadar-2 and
 * Campierganj). Renders nothing for a city whose schedule carries no such line.
 */
export function InForceNote({ locale, cityId, sro, className = "" }: { locale: Locale; cityId: string; sro?: string; className?: string }) {
  const note = getInForceNote(cityId, sro);
  if (!note) return null;
  return (
    <p data-component="InForceNote" className={`max-w-3xl rounded-xl border border-line bg-card px-4 py-3 text-sm text-ink-soft ${className}`}>
      {locale === "hi" ? note.hi : note.en}
    </p>
  );
}

import type { Locale } from "@/lib/i18n";
import { formatDate, ui } from "@/lib/i18n";
import type { Source } from "@/lib/schemas";

export type SourceStampProps = {
  locale: Locale;
  sources: Source[];
  updatedAt: string;
  /** e.g. circle rate effectiveFrom */
  effectiveFrom?: string;
  /**
   * Label the date "Circle rates as of …" instead of "Page updated". For a rate section on a page that
   * has its own page-level stamp (the city hub), so two stamps never both claim to be the page's date.
   */
  ratesAsOf?: boolean;
};

/** "Source · effective date · page updated". Required on every data page (CLAUDE.md). */
export function SourceStamp({ locale, sources, updatedAt, effectiveFrom, ratesAsOf }: SourceStampProps) {
  const t = ui[locale];
  const [before, after] = t.ratesAsOf.split("{date}");
  const date = <time dateTime={updatedAt}>{formatDate(updatedAt, locale)}</time>;
  return (
    <p data-component="SourceStamp" className="mt-8 border-t border-line pt-4 text-sm text-muted">
      {t.source}:{" "}
      {sources.map((s, i) => (
        <span key={s.url + s.label}>
          {i > 0 && ", "}
          <a href={s.url} rel="noopener">
            {s.label}
          </a>
        </span>
      ))}
      {effectiveFrom && (
        <>
          {" "}
          · {t.effective} <time dateTime={effectiveFrom}>{formatDate(effectiveFrom, locale)}</time>
        </>
      )}{" "}
      ·{" "}
      {ratesAsOf ? (
        <>
          {before}
          {date}
          {after}
        </>
      ) : (
        <>
          {t.pageUpdated} {date}
        </>
      )}
    </p>
  );
}

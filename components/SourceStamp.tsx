import type { Locale } from "@/lib/i18n";
import { formatDate, ui } from "@/lib/i18n";
import type { Source } from "@/lib/schemas";

export type SourceStampProps = {
  locale: Locale;
  sources: Source[];
  updatedAt: string;
  /** e.g. circle rate effectiveFrom */
  effectiveFrom?: string;
};

/** Stub. "Source · effective date · page updated". Required on every data page (CLAUDE.md). */
export function SourceStamp({ locale, sources, updatedAt, effectiveFrom }: SourceStampProps) {
  const t = ui[locale];
  return (
    <p data-component="SourceStamp">
      {t.source}:{" "}
      {sources.map((s, i) => (
        <span key={s.url + s.label}>
          {i > 0 && ", "}
          <a href={s.url}>{s.label}</a>
        </span>
      ))}
      {effectiveFrom && (
        <>
          {" "}
          · {t.effective} <time dateTime={effectiveFrom}>{formatDate(effectiveFrom, locale)}</time>
        </>
      )}{" "}
      · {t.pageUpdated} <time dateTime={updatedAt}>{formatDate(updatedAt, locale)}</time>
    </p>
  );
}

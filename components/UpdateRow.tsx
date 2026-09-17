import type { Locale } from "@/lib/i18n";
import { formatDate, localePath, pick } from "@/lib/i18n";
import type { Update } from "@/lib/schemas";

export type UpdateRowProps = {
  locale: Locale;
  update: Pick<Update, "id" | "date" | "title" | "titleHi" | "agency" | "agencyName" | "type" | "cityIds" | "summary" | "summaryHi">;
};

/** Stub. */
export function UpdateRow({ locale, update }: UpdateRowProps) {
  return (
    <article data-component="UpdateRow">
      <time dateTime={update.date}>{formatDate(update.date, locale)}</time>
      <h3>
        <a href={localePath(locale, `/updates/${update.id}/`)}>{pick(locale, update.title, update.titleHi)}</a>
      </h3>
      <p>
        {update.type} · {update.agency === "other" ? update.agencyName : update.agency} · {update.cityIds.join(", ")}
      </p>
      <p>{pick(locale, update.summary, update.summaryHi)[0]}</p>
    </article>
  );
}

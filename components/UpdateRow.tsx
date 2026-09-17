import type { Locale } from "@/lib/i18n";
import { formatDate, localePath, pick } from "@/lib/i18n";
import type { City, Update } from "@/lib/schemas";

export const updateTypeLabels: Record<Update["type"], Record<Locale, string>> = {
  "circle-rate": { en: "Circle rate", hi: "सर्किल रेट" },
  "master-plan": { en: "Master plan", hi: "मास्टर प्लान" },
  project: { en: "Project", hi: "प्रोजेक्ट" },
  rera: { en: "RERA", hi: "रेरा" },
  policy: { en: "Policy", hi: "नीति" },
  court: { en: "Court", hi: "अदालत" },
};

export type UpdateRowProps = {
  locale: Locale;
  update: Pick<Update, "id" | "date" | "title" | "titleHi" | "agency" | "agencyName" | "type" | "cityIds" | "summary" | "summaryHi">;
  /** For city chips; ids not found render as the raw id */
  cities?: Pick<City, "id" | "name" | "nameHi">[];
};

export function UpdateRow({ locale, update, cities = [] }: UpdateRowProps) {
  const cityName = (id: string) => {
    const c = cities.find((x) => x.id === id);
    return c ? pick(locale, c.name, c.nameHi) : id;
  };
  return (
    <article data-component="UpdateRow" className="grid gap-1 border-b border-line py-4 last:border-b-0 md:grid-cols-[8rem_1fr] md:gap-6">
      <time dateTime={update.date} className="text-sm text-muted">
        {formatDate(update.date, locale)}
      </time>
      <div>
        <h3 className="text-base">
          <a href={localePath(locale, `/updates/${update.id}/`)} className="text-ink no-underline hover:text-accent">
            {pick(locale, update.title, update.titleHi)}
          </a>
        </h3>
        <p className="mt-1.5 flex flex-wrap gap-1.5">
          <span className="chip bg-cream-deep">{updateTypeLabels[update.type][locale]}</span>
          <span className="chip bg-cream-deep">{update.agency === "other" ? update.agencyName : update.agency}</span>
          {update.cityIds.map((id) => (
            <span key={id} className="chip bg-accent-soft">
              {cityName(id)}
            </span>
          ))}
        </p>
        <p className="mt-2 line-clamp-2 text-[15px] text-ink-soft">{pick(locale, update.summary, update.summaryHi)[0]}</p>
      </div>
    </article>
  );
}

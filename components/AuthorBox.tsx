import { BrokerCard } from "@/components/BrokerCard";
import { localePath, ui, type Locale } from "@/lib/i18n";
import type { City, TeamMember } from "@/lib/schemas";

export type AuthorBoxProps = {
  locale: Locale;
  /** The team.json record when the guide's author is the broker; undefined for the "wwiser" editorial byline */
  member?: TeamMember;
  cities: Pick<City, "id" | "name" | "nameHi">[];
  pageLabel: string;
};

/** Spec Template 6, section 6: BrokerCard for a team author, or the editorial byline with a link to the methodology page. */
export function AuthorBox({ locale, member, cities, pageLabel }: AuthorBoxProps) {
  const t = ui[locale];
  if (member) return <BrokerCard locale={locale} broker={member} areas={cities} pageLabel={pageLabel} />;
  return (
    <section data-component="AuthorBox" className="card p-5 md:p-6">
      <p className="text-sm font-semibold text-accent">{t.by}</p>
      <h3 className="mt-1 text-xl">{t.editorialByline}</h3>
      <p className="mt-2 max-w-prose text-[15px] text-ink-soft">
        {t.editorialNote} <a href={localePath(locale, "/methodology/")}>{t.methodology} →</a>
      </p>
    </section>
  );
}

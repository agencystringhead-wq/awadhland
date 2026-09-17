import type { Locale } from "@/lib/i18n";
import { localePath, pick, ui } from "@/lib/i18n";
import type { City, Locality, TeamMember } from "@/lib/schemas";
import { Badges } from "./Badges";

export type FooterProps = {
  locale: Locale;
  cities: Pick<City, "id" | "name" | "nameHi">[];
  /** Only localities with a built page in this locale, so the index never links to a 404. */
  localities: Pick<Locality, "id" | "cityId" | "name" | "nameHi">[];
  broker: Pick<TeamMember, "reraNumber" | "reraUrl" | "yearsActive" | "name" | "nameHi">;
};

/** Full index, badges band, legal links, RERA disclosure. Standard pages (disclaimer, privacy, terms) are built later. */
export function Footer({ locale, cities, localities, broker }: FooterProps) {
  const t = ui[locale];
  const legal = [
    { label: t.about, href: localePath(locale, "/about/") },
    { label: t.methodology, href: localePath(locale, "/methodology/") },
    { label: t.contact, href: localePath(locale, "/contact/") },
    { label: t.disclaimer, href: localePath(locale, "/disclaimer/") },
    { label: t.privacy, href: localePath(locale, "/privacy/") },
    { label: t.terms, href: localePath(locale, "/terms/") },
  ];
  return (
    <footer data-component="Footer" className="mt-16 border-t border-line bg-cream-deep">
      <div className="container-site py-6">
        <Badges locale={locale} broker={broker} citiesCovered={cities.length} />
      </div>
      <div className="container-site grid gap-10 border-t border-line py-12 md:grid-cols-4">
        {cities.map((c) => (
          <section key={c.id}>
            <h2 className="text-base">
              <a href={localePath(locale, `/${c.id}/`)} className="text-ink no-underline hover:text-accent">
                {pick(locale, c.name, c.nameHi)}
              </a>
            </h2>
            <ul className="mt-3 space-y-1.5 text-[15px]">
              <li>
                <a href={localePath(locale, `/${c.id}/circle-rates/`)} className="text-ink-soft no-underline hover:text-accent">
                  {t.circleRates}
                </a>
              </li>
              {localities
                .filter((l) => l.cityId === c.id)
                .map((l) => (
                  <li key={l.id}>
                    <a href={localePath(locale, `/${c.id}/${l.id}/`)} className="text-ink-soft no-underline hover:text-accent">
                      {pick(locale, l.name, l.nameHi)}
                    </a>
                  </li>
                ))}
            </ul>
          </section>
        ))}
        <section>
          <h2 className="text-base">{t.siteName}</h2>
          <ul className="mt-3 space-y-1.5 text-[15px]">
            <li>
              <a href={localePath(locale, "/updates/")} className="text-ink-soft no-underline hover:text-accent">
                {t.updates}
              </a>
            </li>
            {legal.map((l) => (
              <li key={l.href}>
                <a href={l.href} className="text-ink-soft no-underline hover:text-accent">
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </section>
      </div>
      <div className="container-site border-t border-line py-6 text-sm text-muted">
        <p>{t.footerTagline}</p>
        <p className="mt-2">
          {t.reraDisclosure}: {pick(locale, broker.name, broker.nameHi)}
          {broker.reraNumber && (
            <>
              {" · "}
              {broker.reraUrl ? <a href={broker.reraUrl}>{broker.reraNumber}</a> : broker.reraNumber}
            </>
          )}
        </p>
        <p className="mt-2">{t.builtBy}</p>
      </div>
    </footer>
  );
}

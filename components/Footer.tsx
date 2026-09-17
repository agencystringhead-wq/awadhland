import type { Locale } from "@/lib/i18n";
import { localePath, pick, ui } from "@/lib/i18n";
import type { City, Locality } from "@/lib/schemas";

export type FooterProps = {
  locale: Locale;
  cities: Pick<City, "id" | "name" | "nameHi">[];
  /** Only localities with a built page in this locale, so the index never links to a 404. */
  localities: Pick<Locality, "id" | "cityId" | "name" | "nameHi">[];
};

/** Stub. Full index, legal links, RERA disclosure. Disclaimer and RERA pages are built later. */
export function Footer({ locale, cities, localities }: FooterProps) {
  const t = ui[locale];
  return (
    <footer data-component="Footer">
      {cities.map((c) => (
        <section key={c.id}>
          <h2>
            <a href={localePath(locale, `/${c.id}/`)}>{pick(locale, c.name, c.nameHi)}</a>
          </h2>
          <ul>
            <li>
              <a href={localePath(locale, `/${c.id}/circle-rates/`)}>{t.circleRates}</a>
            </li>
            {localities
              .filter((l) => l.cityId === c.id)
              .map((l) => (
                <li key={l.id}>
                  <a href={localePath(locale, `/${c.id}/${l.id}/`)}>{pick(locale, l.name, l.nameHi)}</a>
                </li>
              ))}
          </ul>
        </section>
      ))}
      <ul>
        <li>
          <a href={localePath(locale, "/updates/")}>{t.updates}</a>
        </li>
        <li>
          <a href={localePath(locale, "/about/")}>{t.about}</a>
        </li>
        <li>{t.disclaimer}</li>
        <li>{t.reraDisclosure}</li>
      </ul>
    </footer>
  );
}

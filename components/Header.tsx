import type { Locale } from "@/lib/i18n";
import { localePath, ui } from "@/lib/i18n";
import type { City, TeamMember } from "@/lib/schemas";
import { WhatsAppButton } from "./WhatsAppButton";

export type AlternateLink = {
  /** Same page in the other tree, or the fallback (other tree's city hub or home) when it does not exist. */
  href: string;
  /** True when the same page does not exist in the other tree; the toggle shows a one-line notice. */
  missing: boolean;
};

export type HeaderProps = {
  locale: Locale;
  alternate: AlternateLink;
  cities: Pick<City, "id" | "name" | "nameHi">[];
  broker?: Pick<TeamMember, "phone" | "whatsapp">;
};

/** Stub. Sticky header with nav, language toggle, WhatsApp and Call. Styling and mobile menu in step 2. */
export function Header({ locale, alternate, cities, broker }: HeaderProps) {
  const t = ui[locale];
  return (
    <header data-component="Header">
      <a href={localePath(locale, "/")}>Awadhland</a>
      <nav>
        <ul>
          {cities.map((c) => (
            <li key={c.id}>
              <a href={localePath(locale, `/${c.id}/`)}>{locale === "hi" ? c.nameHi : c.name}</a>
            </li>
          ))}
          <li>{t.circleRates}</li>
          <li>{t.guides}</li>
          <li>{t.tools}</li>
          <li>
            <a href={localePath(locale, "/updates/")}>{t.updates}</a>
          </li>
        </ul>
      </nav>
      <a href={alternate.href} hrefLang={locale === "en" ? "hi-IN" : "en-IN"}>
        {t.languageToggle}
      </a>
      {alternate.missing && <p>{t.alternateMissing}</p>}
      {broker && (
        <>
          <WhatsAppButton number={broker.whatsapp} text="" label={t.whatsapp} />
          <a href={`tel:${broker.phone}`}>{t.call}</a>
        </>
      )}
    </header>
  );
}

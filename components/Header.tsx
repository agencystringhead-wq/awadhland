import type { Locale } from "@/lib/i18n";
import { localePath, pick, ui, whatsappText } from "@/lib/i18n";
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
  broker: Pick<TeamMember, "phone" | "whatsapp">;
  /** Human name of the current page for the prefilled WhatsApp message */
  pageLabel: string;
};

/**
 * Sticky header. Desktop: logo, nav, language toggle, WhatsApp + Call. Mobile: logo, Menu, WhatsApp.
 * The mobile menu is a <details> element, so it works with no JavaScript.
 */
export function Header({ locale, alternate, cities, broker, pageLabel }: HeaderProps) {
  const t = ui[locale];
  const heroCity = cities[0];
  const nav: { label: string; href: string }[] = [
    ...cities.map((c) => ({ label: pick(locale, c.name, c.nameHi), href: localePath(locale, `/${c.id}/`) })),
    ...(heroCity ? [{ label: t.circleRates, href: localePath(locale, `/${heroCity.id}/circle-rates/`) }] : []),
    { label: t.guides, href: `${localePath(locale, "/")}#guides` },
    { label: t.tools, href: `${localePath(locale, "/")}#tools` },
    { label: t.updates, href: localePath(locale, "/updates/") },
  ];
  const waText = whatsappText(locale, pageLabel);
  const toggle = (
    <a
      href={alternate.href}
      hrefLang={locale === "en" ? "hi-IN" : "en-IN"}
      lang={locale === "en" ? "hi" : "en"}
      className="btn border border-line bg-card text-ink hover:bg-cream-deep px-3.5 py-2 text-sm"
      title={alternate.missing ? t.alternateMissing : undefined}
    >
      {t.languageToggle}
    </a>
  );

  return (
    <header data-component="Header" className="sticky top-0 z-40 border-b border-line bg-cream/95 backdrop-blur">
      <div className="container-site flex h-16 items-center justify-between gap-4">
        <a href={localePath(locale, "/")} className="flex items-center gap-2 text-ink no-underline hover:text-ink">
          <span aria-hidden="true" className="grid size-8 place-items-center rounded-lg bg-accent text-sm font-semibold text-white">
            A
          </span>
          <span className="text-lg font-semibold tracking-tight">{t.siteName}</span>
        </a>

        <nav aria-label="Main" className="hidden items-center gap-5 md:flex">
          {nav.map((n) => (
            <a key={n.href + n.label} href={n.href} className="text-[15px] font-medium text-ink-soft no-underline hover:text-accent">
              {n.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {toggle}
          <a href={`tel:${broker.phone}`} className="btn border border-line bg-card text-ink hover:bg-cream-deep px-3.5 py-2 text-sm">
            {t.call}
          </a>
          <WhatsAppButton number={broker.whatsapp} text={waText} label={t.whatsapp} variant="compact" />
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <WhatsAppButton number={broker.whatsapp} text={waText} label={t.whatsapp} variant="compact" />
          <details className="group relative">
            <summary className="btn cursor-pointer border border-line bg-card text-ink px-3.5 py-2 text-sm">{t.menu}</summary>
            <div className="absolute right-0 mt-2 w-64 card p-3">
              <nav aria-label="Main" className="flex flex-col">
                {nav.map((n) => (
                  <a key={n.href + n.label} href={n.href} className="rounded-lg px-3 py-2 text-[15px] font-medium text-ink no-underline hover:bg-cream-deep">
                    {n.label}
                  </a>
                ))}
              </nav>
              <div className="mt-2 flex flex-wrap gap-2 border-t border-line pt-3">
                {toggle}
                <a href={`tel:${broker.phone}`} className="btn border border-line bg-card text-ink px-3.5 py-2 text-sm">
                  {t.call}
                </a>
              </div>
            </div>
          </details>
        </div>
      </div>
      {alternate.missing && (
        <p className="border-t border-line bg-cream-deep py-1.5 text-center text-sm text-ink-soft">
          <span className="container-site block">{t.alternateMissing}</span>
        </p>
      )}
    </header>
  );
}

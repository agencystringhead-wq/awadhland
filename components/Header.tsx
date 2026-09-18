import type { Locale } from "@/lib/i18n";
import { localePath, pick, ui, whatsappText } from "@/lib/i18n";
import type { City, TeamMember } from "@/lib/schemas";
import { Button, PhoneIcon, WhatsAppIcon } from "./ui/Button";
import { whatsappHref } from "./WhatsAppButton";

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

/** Fraunces wordmark with the accent italic full stop, as the reference's logo does. */
export function Logo({ locale, size = "md" }: { locale: Locale; size?: "md" | "lg" }) {
  const t = ui[locale];
  return (
    <a
      href={localePath(locale, "/")}
      className={`font-display text-ink no-underline hover:text-ink ${size === "lg" ? "text-[32px]" : "text-[26px]"} font-medium leading-none tracking-[-0.034em]`}
    >
      {t.siteName}
      <span aria-hidden="true" className="serif-italic text-accent">
        .
      </span>
    </a>
  );
}

/**
 * Sticky header (reference §10, main row): gradient surface with the inset highlight, no
 * backdrop-filter. Logo left, primary nav centre, right cluster = language toggle pill, Call
 * outline, WhatsApp filled. Mobile: logo, WhatsApp, Menu as a <details> so it works without JS.
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
  const wa = whatsappHref(broker.whatsapp, whatsappText(locale, pageLabel));
  const toggle = (
    <Button
      href={alternate.href}
      variant="soft"
      size="sm"
      hrefLang={locale === "en" ? "hi-IN" : "en-IN"}
      lang={locale === "en" ? "hi" : "en"}
      title={alternate.missing ? t.alternateMissing : undefined}
    >
      {t.languageToggle}
    </Button>
  );
  const call = (
    <Button href={`tel:${broker.phone}`} variant="secondary" size="sm" icon={<PhoneIcon />}>
      {t.call}
    </Button>
  );
  const whatsapp = (
    <Button href={wa} variant="primary" size="sm" icon={<WhatsAppIcon />}>
      {t.whatsapp}
    </Button>
  );

  return (
    <header
      data-component="Header"
      className="sticky top-0 z-40 border-b border-line bg-[linear-gradient(#fdf9f1_0%,#f6f1e8_55%,#ede5d2_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),inset_0_-1px_0_rgba(40,30,15,0.06),0_2px_0_rgba(40,30,15,0.03)]"
    >
      <div className="container-site flex h-[72px] items-center justify-between gap-6">
        <Logo locale={locale} />

        <nav aria-label="Main" className="hidden items-center gap-7 lg:flex">
          {nav.map((n) => (
            <a key={n.href + n.label} href={n.href} className="text-[15px] font-medium text-ink-soft no-underline hover:text-accent-deep">
              {n.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2.5 lg:flex">
          {toggle}
          {call}
          {whatsapp}
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          {whatsapp}
          <details className="group relative">
            <summary className="btn btn-soft btn-sm cursor-pointer">{t.menu}</summary>
            <div className="card absolute right-0 mt-2 w-64 p-3">
              <nav aria-label="Main" className="flex flex-col">
                {nav.map((n) => (
                  <a
                    key={n.href + n.label}
                    href={n.href}
                    className="rounded-sm px-3 py-2 text-[15px] font-medium text-ink no-underline hover:bg-cream-deep"
                  >
                    {n.label}
                  </a>
                ))}
              </nav>
              <div className="mt-2 flex flex-wrap gap-2 border-t border-line pt-3">
                {toggle}
                {call}
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

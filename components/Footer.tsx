import type { Locale } from "@/lib/i18n";
import { brokerIsRegistered } from "@/lib/guards";
import { builtSitePaths } from "@/lib/pages";
import { getPublishedSros } from "@/lib/rates";
import { localePath, pick, ui, whatsappText } from "@/lib/i18n";
import type { City, Locality, TeamMember } from "@/lib/schemas";
import { Logo } from "./Header";
import { Button, PhoneIcon, WhatsAppIcon } from "./ui/Button";
import { whatsappHref } from "./WhatsAppButton";

export type FooterProps = {
  locale: Locale;
  cities: Pick<City, "id" | "name" | "nameHi">[];
  /** Only localities with a built page in this locale, so the index never links to a 404. */
  localities: Pick<Locality, "id" | "cityId" | "name" | "nameHi">[];
  broker: Pick<TeamMember, "reraNumber" | "reraUrl" | "yearsActive" | "name" | "nameHi" | "phone" | "whatsapp">;
};

/**
 * Mega footer (reference §11): sand background, 72/32 padding; four index columns with mono
 * heads, 1px rules between them and 13.5px links. Column 1 is the brand, columns 2–4 are the
 * cities from data with their locality index. Final row: site links, legal, RERA disclosure, credit.
 */
export function Footer({ locale, cities, localities, broker }: FooterProps) {
  const t = ui[locale];
  // Link only pages that were actually built. docs/BUILD-SPEC.md lists /methodology/, /contact/
  // and /disclaimer/ as well, and they will appear here on their own the moment they exist —
  // until then they are left out rather than shipped as a 404 in the footer of every page.
  const built = builtSitePaths(locale);
  const links = (items: { label: string; sitePath?: string; href?: string }[]) =>
    items
      .filter((l) => !l.sitePath || built.has(l.sitePath))
      .map((l) => ({ label: l.label, href: l.href ?? localePath(locale, l.sitePath!) }));

  const site = links([
    { label: t.guides, href: `${localePath(locale, "/")}#guides` },
    { label: t.tools, href: `${localePath(locale, "/")}#tools` },
    { label: t.circleRateLookup, sitePath: "/tools/circle-rate-lookup/" },
    { label: t.plotYieldCalculator, sitePath: "/tools/plot-yield-calculator/" },
    { label: t.updates, sitePath: "/updates/" },
    { label: t.about, sitePath: "/about/" },
    { label: t.methodology, sitePath: "/methodology/" },
    { label: t.contact, sitePath: "/contact/" },
  ]);
  const legal = links([
    { label: t.disclaimer, sitePath: "/disclaimer/" },
    { label: t.privacy, sitePath: "/privacy/" },
    { label: t.terms, sitePath: "/terms/" },
  ]);
  const col = "md:border-l md:border-line md:px-6";
  const link = "text-[13.5px] leading-[1.32] text-ink-soft no-underline hover:text-accent-deep";
  return (
    <footer data-component="Footer" className="border-t border-line bg-cream-deep pb-8 pt-14 md:pt-[72px]">
      <div className="container-site">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4 lg:gap-0">
          {/* 1. Brand */}
          <div className="lg:pr-6">
            <Logo locale={locale} size="lg" />
            <p className="mt-4 max-w-[320px] text-sm leading-[1.55] text-muted">{brokerIsRegistered(broker) ? t.footerBlurb : t.footerBlurbUnregistered}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button href={whatsappHref(broker.whatsapp, whatsappText(locale, t.siteName))} variant="primary" size="sm" icon={<WhatsAppIcon />}>
                {t.whatsapp}
              </Button>
              <Button href={`tel:${broker.phone}`} variant="soft" size="sm" icon={<PhoneIcon />}>
                {t.call}
              </Button>
            </div>
          </div>

          {/* 2–4. City index columns from data */}
          {cities.map((c) => {
            const list = localities.filter((l) => l.cityId === c.id);
            return (
              <section key={c.id} className={col}>
                <h2 className="caption-mono font-semibold text-ink">
                  <a href={localePath(locale, `/${c.id}/`)} className="text-ink no-underline hover:text-accent-deep">
                    {pick(locale, c.name, c.nameHi)}
                  </a>
                </h2>
                <p className="mb-4 border-b border-line pb-3.5 pt-1 text-[11.5px] leading-[1.35] text-muted">
                  {list.length > 0 ? `${list.length} ${t.localities}` : `${getPublishedSros(c.id).length} ${t.sroLists}`}
                  {/* Only cities whose schedule is sourced have a rate page (lib/guards.ts). */}
                  {built.has(`/${c.id}/circle-rates/`) && (
                    <>
                      {" · "}
                      <a href={localePath(locale, `/${c.id}/circle-rates/`)} className="text-muted">
                        {t.circleRates}
                      </a>
                    </>
                  )}
                </p>
                {/*
                 * A city with no published locality pages lists its sub-registrar rate lists
                 * instead. Lucknow has 1,449 sourced rate rows and 36 localities still in draft,
                 * so its column was a heading over an empty list.
                 */}
                <ul className="space-y-3.5">
                  {list.length > 0
                    ? list.map((l) => (
                        <li key={l.id} className="pl-[11px] -indent-[11px]">
                          <a href={localePath(locale, `/${c.id}/${l.id}/`)} className={link}>
                            {pick(locale, l.name, l.nameHi)}
                          </a>
                        </li>
                      ))
                    : getPublishedSros(c.id).map((s) => (
                        <li key={s.id} className="pl-[11px] -indent-[11px]">
                          <a href={localePath(locale, `/${c.id}/circle-rates/${s.id}/`)} className={link}>
                            {pick(locale, s.name, s.nameHi)}
                          </a>
                        </li>
                      ))}
                  <li className="pt-1">
                    <a href={localePath(locale, `/${c.id}/`)} className="text-[13.5px] font-semibold text-accent-deep no-underline hover:underline">
                      {t.allLocalitiesIn} {pick(locale, c.name, c.nameHi)} →
                    </a>
                  </li>
                </ul>
              </section>
            );
          })}
        </div>

        {/* Final row */}
        <div className="mt-14 border-t border-line pt-6">
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            {site.map((l) => (
              <li key={l.href + l.label}>
                <a href={l.href} className="text-[13.5px] font-medium text-ink no-underline hover:text-accent-deep">
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
          <div className="mt-6 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-3 border-t border-line pt-5">
            <p className="font-mono text-xs text-ink-soft">© {new Date().getFullYear()} awadhland.com · {pick(locale, broker.name, broker.nameHi)}</p>
            <ul className="flex flex-wrap gap-x-6 text-xs text-muted">
              {legal.map((l) => (
                <li key={l.href}>
                  <a href={l.href} className="text-muted no-underline hover:text-accent-deep">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <p className="mt-4 text-xs text-muted">
            {t.reraDisclosure}: {pick(locale, broker.name, broker.nameHi)}
            {broker.reraNumber && (
              <>
                {" · UP RERA "}
                {broker.reraUrl ? (
                  <a href={broker.reraUrl} rel="noopener" className="text-muted">
                    {broker.reraNumber}
                  </a>
                ) : (
                  broker.reraNumber
                )}
              </>
            )}
            {" · "}
            {t.footerTagline}
          </p>
          <p className="serif-italic mt-2 text-xs text-muted">{t.builtBy}</p>
        </div>
      </div>
    </footer>
  );
}

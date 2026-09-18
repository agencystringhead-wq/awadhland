import type { Locale } from "@/lib/i18n";
import { localePath, ui, whatsappText } from "@/lib/i18n";
import { navCopy, type NavItem, type NavKey } from "@/lib/nav";
import type { TeamMember } from "@/lib/schemas";
import { MegaPanel } from "./MegaMenu";
import { StickyNav } from "./StickyNav";
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
  nav: NavItem[];
  active?: NavKey;
  broker: Pick<TeamMember, "phone" | "whatsapp">;
  /** Human name of the current page for the prefilled WhatsApp message */
  pageLabel: string;
};

/** "awadh.land" wordmark: Fraunces 38px 500 −0.034em with the accent italic dot (§15). */
export function Logo({ locale, size = "md" }: { locale: Locale; size?: "sm" | "md" | "lg" }) {
  const px = size === "lg" ? "text-[38px]" : size === "md" ? "text-[29px]" : "text-[22px]";
  return (
    <a
      href={localePath(locale, "/")}
      className={`inline-flex flex-col items-start gap-[3px] font-display font-medium leading-none tracking-[-0.034em] text-ink no-underline hover:text-ink [text-shadow:0_1px_0_rgba(255,255,255,.6)] ${px}`}
    >
      <span className="whitespace-nowrap">
        awadh
        <span className="serif-italic font-medium text-accent-deep">.</span>
        land
      </span>
      {size === "lg" && <span className="mt-1.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.24em] text-muted [text-shadow:0_1px_0_rgba(255,255,255,.5)]">{navCopy[locale].brand.est}</span>}
    </a>
  );
}

/** +91 · 98765 · 43210 in the display serif, as the reference sets "941 · 352 · 1006". */
export function PhoneDots({ e164, className = "" }: { e164: string; className?: string }) {
  const m = /^(\+91)(\d{5})(\d{5})$/.exec(e164);
  const parts = m ? [m[1], m[2], m[3]] : [e164];
  return (
    <a href={`tel:${e164}`} className={`font-display font-semibold tracking-[-0.02em] text-ink no-underline tabular-nums [text-shadow:0_1px_0_rgba(255,255,255,.7)] ${className}`}>
      {parts.join(" · ")}
    </a>
  );
}

/**
 * Three-tier header (Step 3, docs/DESIGN-REFERENCE.md §15). Tier 1 is TopStrip (PageShell);
 * this renders tier 2 (brand bar) and tier 3 (sand nav with mega panels). Tier 3 sticks with a
 * glass backdrop once the others scroll away. Below 1024px: wordmark + phone + WhatsApp, and the
 * nav becomes a full-screen <details> menu with one accordion per cell, no JavaScript required.
 */
export function Header({ locale, alternate, nav, active, broker, pageLabel }: HeaderProps) {
  const t = ui[locale];
  const c = navCopy[locale].brand;
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

  return (
    // display: contents so the sticky tier 3 is constrained by the page, not by this wrapper's box
    <header data-component="Header" className="contents">
      {/* Tier 2: brand bar */}
      <div className="bar-brand">
        <div className="container-site flex items-center justify-between gap-4 py-3.5">
          <span className="hidden lg:inline-flex">
            <Logo locale={locale} size="lg" />
          </span>
          <span className="lg:hidden">
            <Logo locale={locale} size="md" />
          </span>

          {/* Desktop cluster */}
          <div className="hidden items-center gap-7 lg:flex">
            <div className="hidden text-right min-[1180px]:block">
              <div className="mb-1 text-[14px] italic text-muted">{c.whatsappLabel}</div>
              <PhoneDots e164={broker.phone} className="text-[32px]" />
            </div>
            <div aria-hidden="true" className="hidden h-11 w-px bg-[linear-gradient(180deg,transparent,rgba(40,30,15,.18),transparent)] min-[1180px]:block" />
            {toggle}
            <a href={`tel:${broker.phone}`} className="btn btn-outline-accent gap-2 px-5 py-3.5 text-[15px]">
              <PhoneIcon />
              {c.call}
            </a>
            <a href={wa} rel="noopener" className="btn btn-primary gap-2.5 px-7 py-4 text-[16px]">
              <WhatsAppIcon />
              {c.whatsapp}
            </a>
          </div>

          {/* Mobile cluster: phone icon, WhatsApp, menu */}
          <div className="flex items-center gap-1.5 lg:hidden">
            <a href={`tel:${broker.phone}`} aria-label={c.call} className="btn btn-outline-accent size-10 p-0">
              <PhoneIcon />
            </a>
            <a href={wa} rel="noopener" className="btn btn-primary gap-2 px-4 py-2.5 text-[14px]">
              <WhatsAppIcon />
              {t.whatsapp}
            </a>
          </div>
        </div>
      </div>

      {/* Tier 3: nav. Desktop tiles with mega panels; mobile full-screen accordion menu. */}
      <StickyNav className="hidden lg:block">
        <nav aria-label="Main" className="bar-nav group/nav [[data-stuck=true]_&]:bar-nav-stuck">
          <div className="container-site relative flex items-stretch">
            {/* Compact controls, revealed only when stuck */}
            <div className="hidden items-center pr-4 [[data-stuck=true]_&]:flex">
              <Logo locale={locale} size="sm" />
            </div>
            {nav.map((item) => (
              <div key={item.key} className="nav-cell">
                <a href={item.href} className="nav-tile [[data-stuck=true]_&]:py-3.5 [[data-stuck=true]_&]:text-[18px]" aria-current={active === item.key ? "page" : undefined}>
                  <span>{item.label}</span>
                  <span className="nav-tile-sub [[data-stuck=true]_&]:hidden">{item.sub}</span>
                </a>
                <div className="mega-panel">
                  <MegaPanel locale={locale} item={item} layout="panel" />
                </div>
              </div>
            ))}
            <div className="hidden items-center pl-4 [[data-stuck=true]_&]:flex">
              <a href={wa} rel="noopener" className="btn btn-primary btn-sm gap-2">
                <WhatsAppIcon />
                {t.whatsapp}
              </a>
            </div>
          </div>
        </nav>
      </StickyNav>

      <details className="mobile-menu lg:hidden">
        <summary className="bar-nav flex cursor-pointer items-center justify-between px-[18px] py-3 text-[15px] font-semibold text-ink sm:px-6">
          <span>{c.menu}</span>
          <span aria-hidden="true" className="text-muted">
            ☰
          </span>
        </summary>
        <div className="mobile-menu-panel">
          <div className="flex items-center justify-between border-b border-line px-[18px] py-3">
            <Logo locale={locale} size="md" />
            <div className="flex items-center gap-2">
              {toggle}
              <a href="#" aria-label={c.close} className="btn btn-soft btn-sm">
                ✕
              </a>
            </div>
          </div>
          <div className="divide-y divide-line px-[18px] pb-24">
            {nav.map((item) => (
              <details key={item.key} className="group/acc">
                <summary className="flex cursor-pointer items-baseline justify-between gap-3 py-4">
                  <span>
                    <span className="font-display text-[22px] font-semibold tracking-[-0.02em] text-ink">{item.label}</span>
                    <span className="ml-2 text-[13.5px] italic text-muted">{item.sub}</span>
                  </span>
                  <span aria-hidden="true" className="text-muted transition group-open/acc:rotate-180">
                    ⌄
                  </span>
                </summary>
                <div className="pb-5">
                  <a href={item.href} className="mb-3 inline-block text-[13.5px] font-semibold text-accent-deep no-underline">
                    {item.label} →
                  </a>
                  <MegaPanel locale={locale} item={item} layout="stack" />
                </div>
              </details>
            ))}
          </div>
        </div>
      </details>

      {alternate.missing && (
        <p className="border-t border-line bg-cream-deep py-1.5 text-center text-sm text-ink-soft">
          <span className="container-site block">{t.alternateMissing}</span>
        </p>
      )}
    </header>
  );
}

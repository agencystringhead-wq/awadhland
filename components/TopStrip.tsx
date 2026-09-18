import type { Locale } from "@/lib/i18n";
import { pick } from "@/lib/i18n";
import { navCopy } from "@/lib/nav";
import type { City, TeamMember } from "@/lib/schemas";

export type TopStripProps = {
  locale: Locale;
  cities: Pick<City, "id" | "name" | "nameHi">[];
  broker: Pick<TeamMember, "yearsActive" | "reraUrl">;
};

/** Five stars. Amber on the dark strip, gold elsewhere. */
export function Stars({ size = 11, count = 5, className = "text-gold" }: { size?: number; count?: number; className?: string }) {
  return (
    <span aria-hidden="true" className={`inline-flex gap-0.5 ${className}`}>
      {Array.from({ length: count }, (_, i) => (
        <svg key={i} width={size} height={size} viewBox="0 0 20 20" fill="currentColor">
          <path d="M10 1.5l2.6 5.4 5.9.8-4.3 4.1 1.1 5.9L10 14.9l-5.3 2.8 1.1-5.9L1.5 7.7l5.9-.8z" />
        </svg>
      ))}
    </span>
  );
}

/**
 * Tier 1 (docs/DESIGN-REFERENCE.md §15): dark strip, 45px, amber dot + bold first item, then
 * hairline-separated items; right: stars + "UP RERA registered · N years". Below 1024px only the
 * dot and the first item remain.
 */
export function TopStrip({ locale, cities, broker }: TopStripProps) {
  const c = navCopy[locale].strip;
  const items = [c.hours, cities.map((x) => pick(locale, x.name, x.nameHi)).join(" · "), c.sourced];
  return (
    <div data-component="TopStrip" className="strip-dark">
      <div className="container-site relative flex h-[45px] items-center justify-between gap-6 whitespace-nowrap">
        <div className="flex min-w-0 items-center gap-3.5">
          <span className="flex items-center gap-2.5">
            <span aria-hidden="true" className="dot-amber" />
            <span className="font-semibold text-white [text-shadow:0_1px_0_rgba(0,0,0,.7),0_0_8px_rgba(255,200,140,.15)]">{c.taking}</span>
          </span>
          {items.map((item) => (
            <span key={item} className="hidden items-center gap-3.5 lg:flex">
              <span aria-hidden="true" className="strip-hairline" />
              <span>{item}</span>
            </span>
          ))}
        </div>
        <p className="hidden shrink-0 items-center gap-2 text-[rgb(255_235_210_/_0.78)] lg:flex">
          <Stars className="text-[oklch(86%_0.17_75)] [text-shadow:0_0_8px_oklch(78%_0.16_70_/_0.4)]" />
          <span>
            {broker.reraUrl ? (
              <a href={broker.reraUrl} rel="noopener" className="text-inherit no-underline hover:text-white">
                {c.rera}
              </a>
            ) : (
              c.rera
            )}{" "}
            · {broker.yearsActive} {c.years}
          </span>
        </p>
      </div>
    </div>
  );
}

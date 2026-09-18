import type { Locale } from "@/lib/i18n";
import { pick, ui } from "@/lib/i18n";
import type { City, TeamMember } from "@/lib/schemas";

export type TopStripProps = {
  locale: Locale;
  cities: Pick<City, "id" | "name" | "nameHi">[];
  broker: Pick<TeamMember, "yearsActive" | "reraUrl">;
};

/** Five gold stars, 11px. */
export function Stars({ size = 11, count = 5 }: { size?: number; count?: number }) {
  return (
    <span aria-hidden="true" className="inline-flex gap-0.5 text-gold">
      {Array.from({ length: count }, (_, i) => (
        <svg key={i} width={size} height={size} viewBox="0 0 20 20" fill="currentColor">
          <path d="M10 1.5l2.6 5.4 5.9.8-4.3 4.1 1.1 5.9L10 14.9l-5.3 2.8 1.1-5.9L1.5 7.7l5.9-.8z" />
        </svg>
      ))}
    </span>
  );
}

/**
 * Thin bar above the header: muted sand, small uppercase mono, items separated by 1px hairlines.
 * Left: RERA · hours · cities · every rate sourced. Right: stars + "Google reviews · N years".
 * The reference's strip is dark ink; the brief asks for muted sand, so sand it is.
 */
export function TopStrip({ locale, cities, broker }: TopStripProps) {
  const t = ui[locale];
  const left: { text: string; href?: string }[] = [
    { text: t.reraRegisteredShort, href: broker.reraUrl ?? undefined },
    { text: t.hours },
    ...cities.map((c) => ({ text: pick(locale, c.name, c.nameHi) })),
    { text: t.everyRateSourced },
  ];
  const sep = <span aria-hidden="true" className="mx-1 hidden h-3.5 w-px bg-line sm:inline-block" />;
  return (
    <div data-component="TopStrip" className="border-b border-line bg-sand">
      <div className="container-site flex h-9 items-center justify-between gap-4 overflow-hidden">
        <ul className="flex min-w-0 items-center gap-2.5 whitespace-nowrap caption-mono text-ink-soft">
          {left.map((item, i) => (
            <li key={item.text} className={`items-center gap-2.5 ${i < 2 ? "flex" : "hidden md:flex"}`}>
              {i > 0 && sep}
              {i === 0 && <span aria-hidden="true" className="dot-gold mr-0.5 size-1.5" />}
              {item.href ? (
                <a href={item.href} rel="noopener" className="text-ink no-underline hover:text-accent">
                  {item.text}
                </a>
              ) : (
                <span className={i === 0 ? "text-ink" : undefined}>{item.text}</span>
              )}
            </li>
          ))}
        </ul>
        {/* TODO(reviews): rating and count come from data/reviews.json in Phase C; placeholder copy until then */}
        <p className="hidden shrink-0 items-center gap-2.5 caption-mono text-ink-soft md:flex">
          <Stars />
          <span>
            {t.googleReviews} · {broker.yearsActive} {t.yearsShort}
          </span>
        </p>
      </div>
    </div>
  );
}

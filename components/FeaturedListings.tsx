import { formatDate, pick, type Locale } from "@/lib/i18n";
import { formatPriceRange, formatRate } from "@/lib/listings";
import type { Listing } from "@/lib/schemas";
import { WhatsAppButton } from "./WhatsAppButton";

export type FeaturedListingsLabels = {
  kinds: Record<Listing["kind"], string>;
  negotiable: string;
  confirmed: string;
  ask: string;
  representative: string;
  /** Prefilled WhatsApp message; {id} is replaced with the listing id */
  message: string;
  footnote: string;
};

/** Line icons for the illustrated header, 48px box, stroke currentColor. */
const kindIcon: Record<Listing["kind"], React.ReactNode> = {
  "commercial-plot": <path d="M6 38h36M10 38V20l14-9 14 9v18M19 38V27h10v11M16 22h3m10 0h3" />,
  "residential-plot": <path d="M6 38h36M12 38V22l12-9 12 9v16M20 38v-8h8v8" />,
  "commercial-land": <path d="M4 38h40M8 38l8-12 6 6 8-14 10 20M14 14a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />,
  "agricultural-land": <path d="M4 38h40M10 38c0-8 4-12 8-14m0 14c0-10 6-16 12-18m0 18c0-6 4-10 8-11" />,
  hotel: <path d="M10 40V8h28v32M6 40h36M16 14h4m8 0h4M16 21h4m8 0h4M16 28h4m8 0h4M21 40v-6h6v6" />,
};

/**
 * Homepage row of properties for sale (not in BUILD-SPEC; added on the owner's request, Oct 2026).
 * Four cards on desktop, two on tablet, a swipeable row on phones. Location is broad by design:
 * the card names an area and a distance range, and the exact spot is shared on WhatsApp.
 */
export function FeaturedListings({ locale, listings, whatsapp, labels }: { locale: Locale; listings: Listing[]; whatsapp: string; labels: FeaturedListingsLabels }) {
  if (listings.length === 0) return null;
  return (
    <div data-component="FeaturedListings">
      <ul className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-3 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-4 [scrollbar-width:thin]">
        {listings.map((l) => (
          <li key={l.id} className="w-[82vw] max-w-[340px] shrink-0 snap-start sm:w-auto sm:max-w-none">
            <article className="card flex h-full flex-col overflow-hidden p-0">
              <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-accent-soft via-cream-deep to-sand text-accent-deep">
                {l.image ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={l.image.src} alt="" width={l.image.width} height={l.image.height} loading="lazy" decoding="async" className="h-full w-full object-cover" />
                    <span className="absolute bottom-2.5 left-2.5 rounded-full bg-ink/70 px-2.5 py-1 text-[11px] font-medium text-white">{labels.representative}</span>
                  </>
                ) : (
                  <svg aria-hidden="true" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className="absolute inset-0 m-auto h-20 w-20 opacity-70">
                    {kindIcon[l.kind]}
                  </svg>
                )}
                <span className="absolute left-3 top-3 rounded-full bg-card/90 px-2.5 py-1 font-mono text-[11.5px] font-semibold tracking-wide text-ink">{l.id}</span>
                {l.negotiable && <span className="absolute right-3 top-3 rounded-full bg-accent px-2.5 py-1 text-[11.5px] font-semibold text-white">{labels.negotiable}</span>}
              </div>
              <div className="flex flex-1 flex-col px-5 pb-5 pt-4">
                <p className="caption-mono text-accent-deep">
                  {labels.kinds[l.kind]} · {pick(locale, l.area, l.areaHi)}
                </p>
                <h3 className="mt-1.5 text-[19px] leading-snug">{pick(locale, l.proximity, l.proximityHi)}</h3>
                <p className="mt-2 text-[14.5px] text-ink-soft">{pick(locale, l.size, l.sizeHi)}</p>
                <p className="mt-4 font-display text-[26px] leading-none text-ink">{formatPriceRange(l.priceMinInr, l.priceMaxInr, locale)}</p>
                <p className="mt-1.5 text-[13.5px] text-muted">
                  {formatRate(l, locale)}
                  {l.priceNote && <span className="block">{pick(locale, l.priceNote, l.priceNoteHi)}</span>}
                </p>
                <p className="mt-3 text-[14.5px] font-medium text-ink">{pick(locale, l.highlight, l.highlightHi)}</p>
                <div className="mt-auto pt-5">
                  <p className="caption-mono mb-3">
                    {labels.confirmed} <time dateTime={l.confirmedAt}>{formatDate(l.confirmedAt, locale)}</time>
                  </p>
                  <WhatsAppButton number={whatsapp} text={labels.message.replace("{id}", l.id)} label={`${labels.ask} ${l.id}`} variant="compact" />
                </div>
              </div>
            </article>
          </li>
        ))}
      </ul>
      <p className="mt-5 text-[13px] text-muted">{labels.footnote}</p>
    </div>
  );
}

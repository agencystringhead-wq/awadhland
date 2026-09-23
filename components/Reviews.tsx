import type { Locale } from "@/lib/i18n";
import { formatDate, pick } from "@/lib/i18n";
import type { Reviews as ReviewsData } from "@/lib/schemas";
import { Stars } from "./TopStrip";
import { Divider } from "./ui/Divider";

export type ReviewsProps = {
  locale: Locale;
  data: ReviewsData;
  labels: { verified: string; seeProfile: string; disclaimer: string };
  /** Number of review cards to show */
  limit?: number;
};

/**
  * Rating tile (reference §8): big serif score, stars, mono count, hairline, profile link.
  * Renders nothing until the profile carries a real rating — the site does not show a score it
  * cannot point at (spec Template 9).
  */
export function RatingTile({ locale, data, labels }: Omit<ReviewsProps, "limit">) {
  void locale;
  if (data.rating === null) return null;
  return (
    <div data-component="RatingTile" className="card-raised rounded-[16px] px-7 py-[26px]">
      <p className="font-display text-[68px] font-[380] leading-none tracking-[-0.02em] text-accent-deep tabular-nums">{data.rating.toFixed(1)}</p>
      <div className="mt-3 flex items-center gap-3">
        <Stars size={17} />
        <span className="caption-mono">
          {data.count} {labels.verified}
        </span>
      </div>
      <Divider className="my-4" />
      {data.profileUrl && (
        <a href={data.profileUrl} rel="noopener" className="text-[13.5px] font-semibold text-accent-deep no-underline hover:underline">
          {labels.seeProfile}
        </a>
      )}
    </div>
  );
}

/**
 * Reviews block (spec Template 9, brief C11): four sub-score tiles, three review cards with name,
 * date and purpose, and the disclaimer. Reviews are shown as written; textHi is a person's translation.
 */
export function Reviews({ locale, data, labels, limit = 3 }: ReviewsProps) {
  // Nothing to show until the profile has reviews: a heading over an empty list and a dangling
  // "see the profile" line reads worse than no block at all (spec Template 3, empty fields).
  if (data.reviews.length === 0) return null;
  return (
    <div data-component="Reviews">
      <ul className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {data.categories.map((c) => (
          <li key={c.label} className="card flex flex-col-reverse gap-2.5 rounded-[12px] px-5 py-4">
            <span className="caption-mono">{pick(locale, c.label, c.labelHi)}</span>
            <span className="font-display text-[22px] font-[460] leading-none tabular-nums">{c.score.toFixed(1)}</span>
          </li>
        ))}
      </ul>
      <ul className="mt-6 grid gap-6 md:grid-cols-3">
        {data.reviews.slice(0, limit).map((r) => (
          <li key={r.id} className="card flex flex-col p-7">
            <div className="flex items-center justify-between gap-3">
              <Stars size={13} count={r.rating} />
              <span className="caption-mono text-[9.5px]">{pick(locale, r.purpose, r.purposeHi)}</span>
            </div>
            <blockquote className="mt-4 font-display text-[17px] font-light leading-[1.5] text-ink-soft">“{pick(locale, r.text, r.textHi)}”</blockquote>
            <Divider dotted className="mt-auto pt-0 mb-3.5 mt-5" />
            <p className="font-display text-[15px] font-medium text-ink">{r.name}</p>
            <p className="caption-mono mt-0.5 text-[9.5px]">
              {pick(locale, r.purpose, r.purposeHi)} · <time dateTime={r.date}>{formatDate(r.date, locale)}</time>
            </p>
          </li>
        ))}
      </ul>
      <p className="serif-italic mt-6 text-[13px] text-muted">
        {labels.disclaimer}{" "}
        {data.profileUrl && (
          <a href={data.profileUrl} rel="noopener" className="not-italic font-sans font-medium text-accent-deep">
            {labels.seeProfile}
          </a>
        )}
      </p>
    </div>
  );
}

import type { Locale } from "@/lib/i18n";
import { formatDate } from "@/lib/i18n";

export type Review = {
  author: string;
  /** Shown exactly as written on Google; never edited */
  text: string;
  date: string;
  /** e.g. "bought a plot", "NRI purchase", "commercial land" */
  purpose: string;
};

export type ReviewsProps = {
  locale: Locale;
  rating?: number;
  count?: number;
  /** Google Business Profile URL */
  profileUrl?: string;
  reviews: Review[];
};

/**
 * Stub. There is no reviews data file in the spec's data model yet, so callers pass an empty list
 * and the block renders nothing (empty sections are omitted).
 */
export function Reviews({ locale, rating, count, profileUrl, reviews }: ReviewsProps) {
  if (reviews.length === 0 && rating === undefined) return null;
  return (
    <section data-component="Reviews">
      {rating !== undefined && (
        <p>
          {rating} ({count})
        </p>
      )}
      <ul>
        {reviews.map((r) => (
          <li key={r.author + r.date}>
            <blockquote>{r.text}</blockquote>
            <p>
              {r.author} · <time dateTime={r.date}>{formatDate(r.date, locale)}</time> · {r.purpose}
            </p>
          </li>
        ))}
      </ul>
      {profileUrl && <a href={profileUrl}>Google</a>}
    </section>
  );
}

import type { Locale } from "@/lib/i18n";
import { formatDate, ui } from "@/lib/i18n";

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
 * There is no reviews data file in the spec's data model yet, so callers pass an empty list
 * and the block renders nothing (empty sections are omitted).
 */
export function Reviews({ locale, rating, count, profileUrl, reviews }: ReviewsProps) {
  if (reviews.length === 0 && rating === undefined) return null;
  const t = ui[locale];
  return (
    <section data-component="Reviews">
      {rating !== undefined && (
        <p className="text-lg font-semibold">
          Google ★ {rating}
          {count !== undefined && <span className="text-muted"> ({count})</span>}
        </p>
      )}
      <ul className="mt-4 grid gap-4 md:grid-cols-2">
        {reviews.map((r) => (
          <li key={r.author + r.date} className="card p-5">
            <blockquote className="text-ink">{r.text}</blockquote>
            <p className="mt-3 text-sm text-muted">
              {r.author} · <time dateTime={r.date}>{formatDate(r.date, locale)}</time> · {r.purpose}
            </p>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-sm text-muted">
        {t.reviewsOnGoogle}
        {profileUrl && (
          <>
            {" "}
            <a href={profileUrl} rel="noopener">
              {t.seeGoogleProfile}
            </a>
          </>
        )}
      </p>
    </section>
  );
}

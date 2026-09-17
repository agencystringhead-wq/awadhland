import type { Locale } from "@/lib/i18n";
import { formatDate, localePath } from "@/lib/i18n";
import type { GuideFrontmatter } from "@/lib/schemas";

export type GuideCardProps = {
  locale: Locale;
  guide: Pick<GuideFrontmatter, "slug" | "title" | "summary" | "publishedAt">;
  /** minutes, computed from the MDX body in step 4 */
  readTimeMin?: number;
};

/** Stub. */
export function GuideCard({ locale, guide, readTimeMin }: GuideCardProps) {
  return (
    <article data-component="GuideCard">
      <h3>
        <a href={localePath(locale, `/guides/${guide.slug}/`)}>{guide.title}</a>
      </h3>
      <p>{guide.summary}</p>
      <p>
        <time dateTime={guide.publishedAt}>{formatDate(guide.publishedAt, locale)}</time>
        {readTimeMin !== undefined && <> · {readTimeMin} min</>}
      </p>
    </article>
  );
}

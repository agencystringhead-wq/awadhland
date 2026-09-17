import type { Locale } from "@/lib/i18n";
import { formatDate, localePath, ui } from "@/lib/i18n";
import type { GuideFrontmatter } from "@/lib/schemas";

export type GuideCardProps = {
  locale: Locale;
  guide: Pick<GuideFrontmatter, "slug" | "title" | "summary" | "publishedAt">;
  readTimeMin: number;
};

export function GuideCard({ locale, guide, readTimeMin }: GuideCardProps) {
  const t = ui[locale];
  return (
    <article data-component="GuideCard" className="card flex h-full flex-col gap-2 p-5">
      <h3>
        <a href={localePath(locale, `/guides/${guide.slug}/`)} className="text-ink no-underline hover:text-accent">
          {guide.title}
        </a>
      </h3>
      <p className="line-clamp-3 text-[15px] text-ink-soft">{guide.summary}</p>
      <p className="mt-auto pt-2 text-sm text-muted">
        <time dateTime={guide.publishedAt}>{formatDate(guide.publishedAt, locale)}</time> · {readTimeMin} {t.readTime}
      </p>
    </article>
  );
}

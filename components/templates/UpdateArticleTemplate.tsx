import { Breadcrumb } from "@/components/Breadcrumb";
import { DeadlineBanner } from "@/components/DeadlineBanner";
import { formatPhone } from "@/components/Hero";
import { JsonLd } from "@/components/JsonLd";
import { LeadForm } from "@/components/LeadForm";
import { Section } from "@/components/Section";
import { SourceStamp } from "@/components/SourceStamp";
import { TableOfContents } from "@/components/TableOfContents";
import { updateTypeLabels } from "@/components/UpdateRow";
import { getBroker, getCities, getUpdate, getUpdates } from "@/lib/data";
import { formatDate, localePath, pick, SITE_URL, ui, type Locale } from "@/lib/i18n";
import { agencyLabel } from "@/lib/labels";
import { article as newsArticle, faqPage } from "@/lib/jsonld";
import { renderUpdateArticle } from "@/lib/mdx";
import { getPage } from "@/lib/pages";
import { updateArticleAlternate } from "@/lib/routes";
import type { UpdateArticle } from "@/lib/update-articles";
import { PageShell } from "./PageShell";

/** Today in India as YYYY-MM-DD; the build's answer to "has the deadline passed", corrected in the browser. */
const todayIST = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());

/**
 * Template 8 entry, long-form variant: the record in data/updates.json supplies the chips, dates and
 * previous/next; the article file supplies headline, body, FAQ and meta. Section order: deadline
 * banner, header, key takeaways, contents, body, sources, lead block with the phone number.
 */
export async function UpdateArticleTemplate({ locale, article }: { locale: Locale; article: UpdateArticle }) {
  const u = getUpdate(article.id)!;
  const fm = article.frontmatter;
  const t = ui[locale];
  const broker = getBroker();
  const cities = getCities();
  const pageUrl = `${SITE_URL}${localePath(locale, `/updates/${u.id}/`)}`;
  const { takeaways, body, disclaimer } = await renderUpdateArticle(article, { locale, cities });

  const all = getUpdates();
  const idx = all.findIndex((x) => x.id === u.id);
  const newer = idx > 0 ? all[idx - 1] : undefined;
  const older = idx < all.length - 1 ? all[idx + 1] : undefined;

  return (
    <PageShell locale={locale} alternate={updateArticleAlternate(locale, article)} pageLabel={article.title}>
      <JsonLd
        data={[
          newsArticle({
            headline: article.title,
            description: fm.meta_description,
            url: pageUrl,
            datePublished: u.publishedAt ?? u.date,
            dateModified: u.updatedAt,
            locale,
            author: { name: "Awadhland", url: `${SITE_URL}/` },
            // The same build-time card the page declares in og:image; Google asks Article markup for an image.
            image: getPage(locale, `/updates/${u.id}/`)?.ogPath,
            type: fm.schema_type ?? "NewsArticle",
            keywords: [fm.primary_keyword, ...(fm.secondary_keywords ?? [])],
          }),
          faqPage(article.faq),
        ]}
      />

      {/* 1. Header, with the deadline banner above the headline */}
      <header className="border-b border-line bg-cream-deep/60">
        <div className="container-site pb-8 md:pb-10">
          <Breadcrumb
            items={[
              { label: t.home, href: localePath(locale, "/") },
              { label: t.updates, href: localePath(locale, "/updates/") },
              { label: article.title },
            ]}
          />
          {fm.deadline && (
            <div className="mb-5 max-w-3xl">
              <DeadlineBanner
                deadline={fm.deadline}
                dateLabel={formatDate(fm.deadline, locale)}
                labels={{ open: t.deadlineLabel, closed: t.deadlineClosed, was: t.deadlineWas }}
                closedAtBuild={todayIST() > fm.deadline}
              />
            </div>
          )}
          <h1 className="max-w-4xl">{article.title}</h1>
          <p className="mt-3 text-sm text-muted">
            <time dateTime={u.date}>{article.dateline || formatDate(u.date, locale)}</time>
          </p>
          <p className="mt-3 flex flex-wrap gap-1.5">
            <span className="chip bg-cream-deep">{updateTypeLabels[u.type][locale]}</span>
            <span className="chip bg-cream-deep">{agencyLabel(u.agency, u.agencyName)}</span>
            {u.cityIds.map((id) => {
              const c = cities.find((x) => x.id === id);
              return (
                <a key={id} href={localePath(locale, `/${id}/`)} className="chip bg-accent-soft no-underline">
                  {c ? pick(locale, c.name, c.nameHi) : id}
                </a>
              );
            })}
          </p>
        </div>
      </header>

      <div className="container-site section">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_16rem] lg:gap-16">
          <article className="min-w-0 max-w-[46rem]">
            {/* 2. Key takeaways, highlighted */}
            {takeaways && (
              <aside data-component="KeyTakeaways" className="card mb-8 border-accent/40 bg-accent-soft/50 p-6">
                <h2 className="text-xl">{takeaways.heading}</h2>
                <div className="prose-guide mt-3">{takeaways.content}</div>
              </aside>
            )}

            {/* 3. Contents, collapsed on small screens; the sticky copy is in the aside */}
            {article.headings.length > 1 && (
              <details className="card mb-8 px-5 py-3 lg:hidden">
                <summary className="cursor-pointer text-sm font-semibold">{t.onThisPage}</summary>
                <div className="pb-2 pt-3">
                  <TableOfContents label={t.onThisPage} headings={article.headings} />
                </div>
              </details>
            )}

            {/* 4. Body */}
            <div className="prose-guide">{body}</div>

            {/* 5. Sources, from frontmatter: new tab, nofollow */}
            <section data-component="ArticleSources" className="mt-12 border-t border-line pt-6">
              <h2 className="text-lg">{t.articleSources}</h2>
              <ul className="mt-3 space-y-1.5 text-[15px]">
                {fm.sources.map((s) => (
                  <li key={s.url}>
                    <a href={s.url} target="_blank" rel="noopener nofollow">
                      {s.title}
                    </a>
                  </li>
                ))}
              </ul>
              {disclaimer && <div className="prose-guide mt-5 text-[15px] text-ink-soft">{disclaimer}</div>}
            </section>
          </article>

          <aside className="hidden lg:block">
            {article.headings.length > 1 && (
              <div className="sticky top-24">
                <p className="mb-3 text-sm font-semibold text-muted">{t.onThisPage}</p>
                <TableOfContents label={t.onThisPage} headings={article.headings} />
              </div>
            )}
          </aside>
        </div>
      </div>

      {/* Previous and next, chronological */}
      {(older || newer) && (
        <Section>
          <nav aria-label={t.updates} className="grid gap-4 md:grid-cols-2">
            {older ? (
              <a href={localePath(locale, `/updates/${older.id}/`)} className="card p-4 no-underline hover:bg-cream-deep">
                <span className="text-sm text-muted">← {t.previous}</span>
                <span className="mt-1 block font-medium text-ink">{pick(locale, older.title, older.titleHi)}</span>
              </a>
            ) : (
              <span />
            )}
            {newer && (
              <a href={localePath(locale, `/updates/${newer.id}/`)} className="card p-4 text-right no-underline hover:bg-cream-deep">
                <span className="text-sm text-muted">{t.next} →</span>
                <span className="mt-1 block font-medium text-ink">{pick(locale, newer.title, newer.titleHi)}</span>
              </a>
            )}
          </nav>
        </Section>
      )}

      {/* 6. Lead block, then the number in large type */}
      <Section>
        <LeadForm locale={locale} broker={broker} pageLabel={`${t.askWhatThisMeans}: ${article.title}`} city={u.cityIds[0]} context={`update ${u.id}`} />
        <p className="mt-8 text-center">
          <span className="block text-sm text-muted">{t.callUs}</span>
          <a href={`tel:${broker.phone}`} className="font-display text-4xl tabular-nums text-ink no-underline hover:text-accent md:text-6xl">
            {formatPhone(broker.phone)}
          </a>
        </p>
        <SourceStamp locale={locale} sources={u.sources} updatedAt={u.updatedAt} />
      </Section>
    </PageShell>
  );
}

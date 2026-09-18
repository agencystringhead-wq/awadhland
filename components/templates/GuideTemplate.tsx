import { notFound } from "next/navigation";
import { AuthorBox } from "@/components/AuthorBox";
import { Breadcrumb } from "@/components/Breadcrumb";
import { FAQ } from "@/components/FAQ";
import { GuideCard } from "@/components/GuideCard";
import { JsonLd } from "@/components/JsonLd";
import { LeadForm } from "@/components/LeadForm";
import { article } from "@/lib/jsonld";
import { SITE_URL } from "@/lib/i18n";
import { Section } from "@/components/Section";
import { TableOfContents } from "@/components/TableOfContents";
import { getBroker, getCities, getTeamMember } from "@/lib/data";
import { getGuide, getRelatedGuides, heroImageSrc } from "@/lib/guides";
import { formatDate, localePath, pick, ui, type Locale } from "@/lib/i18n";
import { renderGuideBody } from "@/lib/mdx";
import { guideAlternate } from "@/lib/routes";
import { PageShell } from "./PageShell";

/** Hero images are committed at this size (spec Images rule: explicit width and height). */
const HERO = { width: 1200, height: 675 };

/** Template 6: long-form guide from one MDX file. Hindi guides are separate files, never translations at build. */
export async function GuideTemplate({ locale, slug }: { locale: Locale; slug: string }) {
  const guide = getGuide(locale, slug);
  if (!guide) notFound();
  const fm = guide.frontmatter;
  const t = ui[locale];
  const broker = getBroker();
  const cities = getCities();
  const pageLabel = fm.title;
  const author = fm.author === "wwiser" ? undefined : getTeamMember(fm.author);
  const authorName = author ? pick(locale, author.name, author.nameHi) : t.editorialByline;
  const cityTags = fm.cityIds.flatMap((id) => cities.filter((c) => c.id === id));
  const related = getRelatedGuides(locale, guide);
  const hero = heroImageSrc(fm.heroImage);
  const { content, headings } = await renderGuideBody(guide.body, { locale, broker, pageLabel });

  return (
    <PageShell locale={locale} alternate={guideAlternate(locale, fm.pairedSlug, fm.cityIds)} pageLabel={pageLabel}>
      <JsonLd
        data={article({
          headline: fm.title,
          description: fm.summary,
          url: `${SITE_URL}${localePath(locale, `/guides/${fm.slug}/`)}`,
          datePublished: fm.publishedAt,
          dateModified: fm.updatedAt,
          locale,
          author: author ? { name: authorName, url: `${SITE_URL}${localePath(locale, "/about/")}` } : { name: authorName },
          image: hero,
        })}
      />
      {/* 1. Header */}
      <header className="border-b border-line bg-cream-deep/60">
        <div className="container-site pb-8 md:pb-10">
          <Breadcrumb items={[{ label: t.home, href: localePath(locale, "/") }, { label: t.guides, href: `${localePath(locale, "/")}#guides` }, { label: fm.title }]} />
          <div className="max-w-3xl">
            <h1>{fm.title}</h1>
            <p className="mt-4 text-lg text-ink-soft">{fm.summary}</p>
            <p className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm text-muted">
              <span>
                {t.by} <span className="text-ink">{authorName}</span>
              </span>
              <span>
                {t.published} <time dateTime={fm.publishedAt}>{formatDate(fm.publishedAt, locale)}</time>
              </span>
              {fm.updatedAt !== fm.publishedAt && (
                <span>
                  {t.updated} <time dateTime={fm.updatedAt}>{formatDate(fm.updatedAt, locale)}</time>
                </span>
              )}
              <span>
                {guide.readTimeMin} {t.readTime}
              </span>
            </p>
            {cityTags.length > 0 && (
              <p className="mt-3 flex flex-wrap gap-2">
                {cityTags.map((c) => (
                  <a key={c.id} href={localePath(locale, `/${c.id}/`)} className="chip bg-card border border-line no-underline hover:border-accent">
                    {pick(locale, c.name, c.nameHi)}
                  </a>
                ))}
              </p>
            )}
          </div>
        </div>
      </header>

      <div className="container-site section">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_16rem] lg:gap-16">
          <article className="min-w-0 max-w-[46rem]">
            {hero && (
              // Plain img on purpose: media is pre-encoded WebP on R2 (CLAUDE.md), and next/image adds client JS.
              // eslint-disable-next-line @next/next/no-img-element
              <img src={hero} alt="" width={HERO.width} height={HERO.height} className="mb-8 h-auto w-full rounded-card bg-cream-deep" />
            )}

            {/* 2. Table of contents, collapsed on small screens; the sticky copy is in the aside */}
            {headings.length > 1 && (
              <details className="card mb-8 px-5 py-3 lg:hidden">
                <summary className="cursor-pointer text-sm font-semibold">{t.onThisPage}</summary>
                <div className="pb-2 pt-3">
                  <TableOfContents label={t.onThisPage} headings={headings} />
                </div>
              </details>
            )}

            {/* 3. Body with data components; 4. mid-article CTA is placed inside by the renderer */}
            <div className="prose-guide">{content}</div>

            {/* 5. FAQ from frontmatter */}
            {fm.faq.length > 0 && (
              <div className="mt-14">
                <FAQ title={t.faq} items={fm.faq} />
              </div>
            )}

            {/* 6. Author box */}
            <div className="mt-14">
              <AuthorBox locale={locale} member={author} cities={cities} pageLabel={pageLabel} />
            </div>
          </article>

          <aside className="hidden lg:block">
            {headings.length > 1 && (
              <div className="sticky top-24">
                <p className="mb-3 text-sm font-semibold text-muted">{t.onThisPage}</p>
                <TableOfContents label={t.onThisPage} headings={headings} />
              </div>
            )}
          </aside>
        </div>
      </div>

      {/* 7. Related guides */}
      {related.length > 0 && (
        <Section title={t.relatedGuides} className="border-t border-line bg-cream-deep/40">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((g) => (
              <GuideCard key={g.frontmatter.slug} locale={locale} guide={g.frontmatter} readTimeMin={g.readTimeMin} />
            ))}
          </div>
        </Section>
      )}

      {/* 8. Lead form, prefilled with the first city tag when present */}
      <Section>
        <LeadForm locale={locale} broker={broker} pageLabel={pageLabel} city={fm.cityIds[0]} />
      </Section>
    </PageShell>
  );
}

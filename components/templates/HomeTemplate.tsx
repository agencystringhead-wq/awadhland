import { CityCard } from "@/components/CityCard";
import { EnquiryForm } from "@/components/EnquiryForm";
import { GuideCard } from "@/components/GuideCard";
import { Hero, formatPhone } from "@/components/Hero";
import { HowWeWork } from "@/components/HowWeWork";
import { RatingTile, Reviews } from "@/components/Reviews";
import { Section } from "@/components/Section";
import { StatGrid, type Stat } from "@/components/ui/StatGrid";
import { WhatChanged } from "@/components/WhatChanged";
import { WhyWeExist } from "@/components/WhyWeExist";
import { fill, homeCopy, homeStory } from "@/lib/content";
import { getBroker, getBuildableLocalities, getCircleRateSchedules, getCities, getCityStats, getPublishedProjects, getReviews, getUpdates } from "@/lib/data";
import { getGuides } from "@/lib/guides";
import { formatDate, formatNumber, localePath, ui, type Locale } from "@/lib/i18n";
import { isToolSlug } from "@/lib/tools";
import { sameAlternate } from "@/lib/routes";
import { PageShell } from "./PageShell";

/** Icon tiles for the four tools: calculator, search, checklist, chart. 20px, stroke 1.6, currentColor. */
const toolIcons: Record<string, React.ReactNode> = {
  "stamp-duty-calculator": <path d="M7 3h10a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zM9 7h6M9 11h2m4 0h0M9 15h2m4 0h0M9 18h6" />,
  "circle-rate-lookup": <path d="M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zm5 12 4 4M8 11h6" />,
  "land-safety-checklist": <path d="M5 4h14v16H5zM8 9l1.5 1.5L12 8M8 14l1.5 1.5L12 13M14 9h3M14 14h3" />,
  "plot-yield-calculator": <path d="M4 19h16M6 16l4-5 3 3 5-7" />,
};

/** Template 1, Step 2 Phase C: the homepage as a story. Copy from lib/content.ts homeStory, data blocks computed at build. */
export function HomeTemplate({ locale }: { locale: Locale }) {
  const t = ui[locale];
  const copy = homeCopy[locale];
  const story = homeStory[locale];
  const cities = getCities();
  const broker = getBroker();
  const reviews = getReviews();
  const hasReviews = reviews.rating !== null && reviews.reviews.length > 0;
  const updates = getUpdates();
  const guides = getGuides(locale);
  const localities = getBuildableLocalities(locale).buildable;
  const pageLabel = t.siteName;
  // A situation card names a guide by slug, and not every guide is written in both languages yet.
  // Link it only where it exists in this locale; elsewhere the card still states the situation.
  const guideSlugs = new Set(guides.map((g) => g.frontmatter.slug));
  const guideHref = (slug: string) => (guideSlugs.has(slug) ? localePath(locale, `/guides/${slug}/`) : null);
  // The spec lists four tools; only the built ones are linked (lib/tools.ts TOOL_SLUGS).
  const builtTool = (slug: string) => isToolSlug(slug);
  const vars = { years: broker.yearsActive, phone: formatPhone(broker.phone) };

  /* C2. By the numbers: computed from /data on every build, never fetched. */
  const lastUpdated = [...cities, ...localities, ...getPublishedProjects(), ...updates]
    .map((r) => r.updatedAt)
    .sort()
    .at(-1);
  const stats: Stat[] = [
    { value: formatNumber(getCircleRateSchedules().reduce((n, s) => n + s.rates.length, 0)), label: story.stats.circleRateEntries },
    { value: formatNumber(localities.length), label: story.stats.localities },
    { value: formatNumber(getPublishedProjects().length), label: story.stats.projects },
    { value: formatNumber(broker.yearsActive), label: story.stats.years },
    { value: story.stats.reraValue, label: story.stats.rera, href: broker.reraUrl ?? undefined },
    { value: formatNumber(cities.length), label: story.stats.cities },
    { value: story.stats.languagesValue, label: story.stats.languages },
    { value: lastUpdated ? formatDate(lastUpdated, locale) : "—", label: story.stats.lastUpdated },
  ];

  const arrow = "mt-auto pt-5 text-[13.5px] font-semibold text-accent-deep no-underline hover:underline";

  return (
    <PageShell locale={locale} alternate={sameAlternate(locale, "/")} pageLabel={pageLabel}>
      {/* C1. Hero */}
      <Hero locale={locale} story={story} broker={broker} reviewsUrl={reviews.profileUrl ?? undefined} />

      {/* C2. By the numbers */}
      <StatGrid stats={stats} columns={8} />

      {/* C3. What changed */}
      {updates.length > 0 && (
        <Section size="base" {...story.changed} aside={<a href={localePath(locale, "/updates/")} className="font-semibold text-accent-deep no-underline hover:underline">{story.changed.all}</a>}>
          <WhatChanged locale={locale} updates={updates.slice(0, 3)} cities={cities} allLabel={story.changed.all} />
        </Section>
      )}

      {/* C4. Cities in one row: Ayodhya spans two of four columns, Lucknow and Gorakhpur one each */}
      <Section size="lg" tone="surface" hairline {...story.cities}>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {cities.map((c, i) => (
            <CityCard key={c.id} locale={locale} city={c} stats={getCityStats(c.id, locale)} hero={i === 0} labels={story.cities} />
          ))}
        </div>
      </Section>

      {/* C5. Why we exist: narrow block, three pillars */}
      <Section size="xl" narrow {...story.why}>
        <WhyWeExist locale={locale} pillars={story.why.pillars} />
      </Section>

      {/* C6. Your situation: six glass cards */}
      <Section size="lg" tone="sand" hairline {...story.situations}>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {copy.situations.map((s, i) => (
            <li key={s.title} className="card-glass flex flex-col px-6 py-7">
              <span className="caption-mono mb-2.5 block">{String(i + 1).padStart(2, "0")}</span>
              <h3>
                {guideHref(s.guideSlug) ? (
                  <a href={guideHref(s.guideSlug)!} className="text-ink no-underline hover:text-accent-deep">
                    {s.title}
                  </a>
                ) : (
                  <span className="text-ink">{s.title}</span>
                )}
              </h3>
              <p className="mt-2 line-clamp-2 text-[14.5px] leading-[1.5] text-ink-soft">{s.body}</p>
              {guideHref(s.guideSlug) && (
                <a href={guideHref(s.guideSlug)!} className={arrow}>
                  {story.situations.open}
                </a>
              )}
            </li>
          ))}
        </ul>
      </Section>

      {/* C7. How we work */}
      <Section size="base" tone="surface" hairline {...story.how}>
        <HowWeWork locale={locale} steps={story.how.steps} feeNote={story.how.feeNote} />
      </Section>

      {/* C8. Free tools */}
      <Section id="tools" size="lg" {...story.tools}>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {copy.tools.map((tool) => (
            <li key={tool.slug} className="card flex flex-col p-7">
              <span aria-hidden="true" className="mb-5 grid size-11 place-items-center rounded-[10px] bg-accent-soft text-accent-deep">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  {toolIcons[tool.slug]}
                </svg>
              </span>
              <h3>
                {builtTool(tool.slug) ? (
                  <a href={localePath(locale, `/tools/${tool.slug}/`)} className="text-ink no-underline hover:text-accent-deep">
                    {tool.title}
                  </a>
                ) : (
                  <span className="text-ink">{tool.title}</span>
                )}
              </h3>
              <p className="mt-2 text-[14.5px] leading-[1.5] text-ink-soft">{tool.body}</p>
              {builtTool(tool.slug) ? (
                <a href={localePath(locale, `/tools/${tool.slug}/`)} className={arrow}>
                  {story.tools.tryIt}
                </a>
              ) : (
                <span className={`${arrow} text-muted`}>{ui[locale].comingSoon}</span>
              )}
            </li>
          ))}
        </ul>
      </Section>

      {/* C9. Before you pay a rupee: anchor for the hero's primary button */}
      <Section
        id="checklist"
        size="lg"
        tone="surface"
        hairline
        {...story.checklist}
        aside={guideHref(copy.checklistGuideSlug) ? <a href={guideHref(copy.checklistGuideSlug)!} className="font-semibold text-accent-deep no-underline hover:underline">{story.checklist.fullGuide}</a> : undefined}
      >
        <ol className="grid md:grid-cols-2 md:gap-x-12">
          {copy.checklist.map((item, i) => (
            <li key={item.title} className="flex gap-5 border-t border-line py-5">
              <span aria-hidden="true" className="chip grid size-9 shrink-0 place-items-center p-0 font-mono text-xs font-semibold text-accent-deep">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <h3 className="text-[19px]">{item.title}</h3>
                <p className="mt-1 text-[14.5px] leading-[1.5] text-ink-soft">{item.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </Section>

      {/* C10. Latest guides */}
      {guides.length > 0 && (
        <Section id="guides" size="base" {...story.guides}>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {guides.slice(0, 4).map((g) => (
              <GuideCard key={g.frontmatter.slug} locale={locale} guide={g.frontmatter} readTimeMin={g.readTimeMin} />
            ))}
          </div>
        </Section>
      )}

{/* C11. Reviews: rating tile beside the heading, four sub-score tiles, three cards.
          Omitted entirely until the Google profile has real reviews — the site does not ship a
          trust block it cannot source (spec Template 9). */}
      {hasReviews && (
        <Section size="lg" tone="sand" hairline {...story.reviews} aside={<div className="w-full max-w-[380px] lg:w-[380px]"><RatingTile locale={locale} data={reviews} labels={story.reviews} /></div>}>
          <Reviews locale={locale} data={reviews} labels={story.reviews} />
        </Section>
      )}

      {/* C12. Lead form band: full-width gradient panel, copy left, large form right */}
      <Section id="lead-form" size="lg" tone="gradient" hairline>
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_620px] lg:gap-16">
          <div>
            <span className="eyebrow mb-5 block text-accent-deep">
              <span aria-hidden="true">— </span>
              {story.band.eyebrow}
            </span>
            <h2 className="h-section">
              {story.band.heading} <span className="italic-touch">{story.band.accent}</span>
            </h2>
            <p className="lede mt-5 max-w-[480px]">{story.band.lede}</p>
            <p className="mt-8 flex flex-wrap items-center gap-x-2 gap-y-1 label-mono text-[11px]">
              {story.band.trust.map((item, i) => (
                <span key={item} className="flex items-center gap-2">
                  {i > 0 && <span aria-hidden="true">·</span>}
                  {fill(item, vars)}
                </span>
              ))}
            </p>
          </div>
          <div className="card-raised px-6 py-7 md:px-[30px]">
            <EnquiryForm
              locale={locale}
              variant="band"
              copy={story.form}
              whatsapp={broker.whatsapp}
              phoneDisplay={formatPhone(broker.phone)}
              trust={story.form.trust.map((s) => fill(s, vars))}
            />
          </div>
        </div>
      </Section>
    </PageShell>
  );
}

import { BrokerCard } from "@/components/BrokerCard";
import { CityCard } from "@/components/CityCard";
import { GuideCard } from "@/components/GuideCard";
import { LeadForm } from "@/components/LeadForm";
import { Section } from "@/components/Section";
import { TrustBar } from "@/components/TrustBar";
import { WhatChanged } from "@/components/WhatChanged";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { homeCopy } from "@/lib/content";
import { getBroker, getBuildableLocalities, getCircleRateSchedules, getCities, getCityStats, getProjects, getUpdates } from "@/lib/data";
import { getGuides } from "@/lib/guides";
import { formatDate, formatNumber, localePath, ui, whatsappText, type Locale } from "@/lib/i18n";
import { sameAlternate } from "@/lib/routes";
import { PageShell } from "./PageShell";

/** Template 1: homepage. Hand-authored copy from lib/content.ts, data blocks computed at build. */
export function HomeTemplate({ locale }: { locale: Locale }) {
  const t = ui[locale];
  const copy = homeCopy[locale];
  const cities = getCities();
  const broker = getBroker();
  const updates = getUpdates();
  const guides = getGuides(locale);
  const localities = getBuildableLocalities(locale).buildable;
  const pageLabel = t.siteName;

  // Section 2 counters: computed from /data on every build, never fetched.
  const counters: { value: string; label: string }[] = [
    { value: formatNumber(cities.length), label: t.cities },
    { value: formatNumber(localities.length), label: t.localities },
    { value: formatNumber(getProjects().length), label: t.projectsTracked },
    { value: formatNumber(getCircleRateSchedules().reduce((n, s) => n + s.rates.length, 0)), label: t.circleRateEntries },
  ];
  const lastUpdated = [...cities, ...localities, ...getProjects(), ...updates]
    .map((r) => r.updatedAt)
    .sort()
    .at(-1);

  const guideHref = (slug: string) => localePath(locale, `/guides/${slug}/`);

  return (
    <PageShell locale={locale} alternate={sameAlternate(locale, "/")} pageLabel={pageLabel}>
      {/* 2. Hero */}
      <section className="section border-b border-line bg-cream-deep/60">
        <div className="container-site">
          <TrustBar locale={locale} broker={broker} />
          <div className="mt-6 grid gap-10 md:grid-cols-[1.4fr_1fr] md:items-start">
            <div>
              <h1 className="max-w-2xl">{copy.heroTitle}</h1>
              <p className="mt-4 max-w-xl text-lg text-ink-soft">{copy.heroPromise}</p>
              <div className="mt-6">
                <WhatsAppButton number={broker.whatsapp} text={whatsappText(locale, pageLabel)} label={t.talkOnWhatsapp} />
              </div>
              <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
                {counters.map((c) => (
                  <div key={c.label} className="flex flex-col-reverse">
                    <dd className="text-2xl font-semibold tabular-nums">{c.value}</dd>
                    <dt className="text-sm text-muted">{c.label}</dt>
                  </div>
                ))}
              </dl>
              {lastUpdated && (
                <p className="mt-3 text-sm text-muted">
                  {t.lastUpdated} <time dateTime={lastUpdated}>{formatDate(lastUpdated, locale)}</time>
                </p>
              )}
            </div>
            {/* 8. Broker card sits beside the hero on desktop */}
            <BrokerCard locale={locale} broker={broker} areas={cities} pageLabel={pageLabel} />
          </div>
        </div>
      </section>

      {/* 3. What changed */}
      <Section>
        <WhatChanged locale={locale} updates={updates.slice(0, 3)} cities={cities} />
      </Section>

      {/* 4. City cards: hero city first and larger */}
      <Section title={t.citiesTitle}>
        <div className="grid gap-4 md:grid-cols-3">
          {cities.map((c, i) => (
            <CityCard key={c.id} locale={locale} city={c} stats={getCityStats(c.id, locale)} hero={i === 0} />
          ))}
        </div>
      </Section>

      {/* 5. Your situation */}
      <Section title={t.yourSituation}>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {copy.situations.map((s) => (
            <li key={s.title} className="card flex flex-col p-5">
              <h3>
                <a href={guideHref(s.guideSlug)} className="text-ink no-underline hover:text-accent">
                  {s.title}
                </a>
              </h3>
              <p className="mt-1.5 text-[15px] text-ink-soft">{s.body}</p>
              <a href="#lead-form" className="mt-auto pt-4 text-sm font-medium">
                {t.talkOnWhatsapp} →
              </a>
            </li>
          ))}
        </ul>
      </Section>

      {/* 6. Free tools */}
      <Section id="tools" title={t.freeTools}>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {copy.tools.map((tool) => (
            <li key={tool.slug} className="card p-5">
              <h3>
                <a href={localePath(locale, `/tools/${tool.slug}/`)} className="text-ink no-underline hover:text-accent">
                  {tool.title}
                </a>
              </h3>
              <p className="mt-1.5 text-[15px] text-ink-soft">{tool.body}</p>
            </li>
          ))}
        </ul>
      </Section>

      {/* 7. Before you pay a rupee */}
      <Section title={t.beforeYouPay} aside={<a href={guideHref(copy.checklistGuideSlug)}>{t.fullChecklist} →</a>}>
        <ol className="grid gap-x-8 gap-y-4 md:grid-cols-2">
          {copy.checklist.map((item, i) => (
            <li key={item.title} className="flex gap-4">
              <span
                aria-hidden="true"
                className="grid size-8 shrink-0 place-items-center rounded-full bg-accent-soft text-sm font-semibold text-accent-deep"
              >
                {i + 1}
              </span>
              <div>
                <h3 className="text-base">{item.title}</h3>
                <p className="text-[15px] text-ink-soft">{item.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </Section>

      {/* 9. Latest guides */}
      {guides.length > 0 && (
        <Section id="guides" title={t.latestGuides}>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {guides.slice(0, 4).map((g) => (
              <GuideCard key={g.frontmatter.slug} locale={locale} guide={g.frontmatter} readTimeMin={g.readTimeMin} />
            ))}
          </div>
        </Section>
      )}

      {/* 10. Lead form */}
      <Section>
        <LeadForm locale={locale} broker={broker} pageLabel={pageLabel} />
      </Section>
    </PageShell>
  );
}

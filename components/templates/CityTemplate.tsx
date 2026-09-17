import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/Breadcrumb";
import { BrokerNote } from "@/components/BrokerNote";
import { CircleRateTable } from "@/components/CircleRateTable";
import { GuideCard } from "@/components/GuideCard";
import { LeadForm } from "@/components/LeadForm";
import { LocalityMap, type MapLocality } from "@/components/LocalityMap";
import { PriceTrend } from "@/components/PriceTrend";
import { ProjectCard } from "@/components/ProjectCard";
import { Section } from "@/components/Section";
import { SourceStamp } from "@/components/SourceStamp";
import { TrustBar } from "@/components/TrustBar";
import { UpdateRow } from "@/components/UpdateRow";
import {
  getBroker,
  getBuildableLocalities,
  getCities,
  getCity,
  getCityPriceSeries,
  getCityStats,
  getCurrentCircleRateSchedule,
  getLocalitiesByCity,
  getProjectsByCity,
  getUpdates,
} from "@/lib/data";
import { getGuides } from "@/lib/guides";
import { formatNumber, localePath, pick, ui, type Locale } from "@/lib/i18n";
import { builtLocalityIds, sameAlternate } from "@/lib/routes";
import { PageShell } from "./PageShell";

/** Template 2: city hub. Hand-authored intro and broker note from cities.json; everything else filtered by cityId. */
export function CityTemplate({ locale, cityId }: { locale: Locale; cityId: string }) {
  const city = getCity(cityId);
  if (!city) notFound();
  const t = ui[locale];
  const broker = getBroker();
  const name = pick(locale, city.name, city.nameHi);
  const otherScriptName = pick(locale, city.nameHi, city.name);
  const pageLabel = name;

  const stats = getCityStats(city.id, locale);
  const localities = getBuildableLocalities(locale).buildable.filter((l) => l.cityId === city.id);
  // The guard already requires lat/lng; this narrows the type for the map without repeating the check elsewhere.
  const mapLocalities: MapLocality[] = localities.flatMap((l) =>
    l.lat !== undefined && l.lng !== undefined ? [{ ...l, lat: l.lat, lng: l.lng }] : [],
  );
  const projects = getProjectsByCity(city.id);
  const schedule = getCurrentCircleRateSchedule(city.id);
  const topRates = schedule ? [...schedule.rates].sort((a, b) => b.residential - a.residential).slice(0, 10) : [];
  const localityNames = Object.fromEntries(getLocalitiesByCity(city.id).map((l) => [l.id, pick(locale, l.name, l.nameHi)]));
  const series = getCityPriceSeries(city.id);
  const guides = getGuides(locale).filter((g) => g.frontmatter.cityIds.includes(city.id));
  const updates = getUpdates()
    .filter((u) => u.cityIds.includes(city.id))
    .slice(0, 5);
  const brokerNote = pick(locale, city.brokerNote, city.brokerNoteHi);

  // Section 10: alphabetical, grouped by tehsil (localities without a tehsil go under the city name).
  const byTehsil = new Map<string, typeof localities>();
  for (const l of [...localities].sort((a, b) => pick(locale, a.name, a.nameHi).localeCompare(pick(locale, b.name, b.nameHi), locale))) {
    const key = l.tehsil ?? name;
    byTehsil.set(key, [...(byTehsil.get(key) ?? []), l]);
  }

  const counters = [
    { value: formatNumber(stats.localityCount), label: t.localities },
    { value: formatNumber(stats.projectCount), label: t.projectsTracked },
  ];

  return (
    <PageShell locale={locale} alternate={sameAlternate(locale, `/${city.id}/`)} pageLabel={pageLabel}>
      {/* 1. Hero */}
      <section className="border-b border-line bg-cream-deep/60">
        <div className="container-site pb-10 md:pb-14">
          <Breadcrumb items={[{ label: t.home, href: localePath(locale, "/") }, { label: name }]} />
          <TrustBar locale={locale} broker={broker} />
          <h1 className="mt-5">
            {name}{" "}
            <span lang={locale === "hi" ? "en" : "hi"} className="font-normal text-muted">
              {otherScriptName}
            </span>
          </h1>
          <p className="mt-4 max-w-3xl text-lg text-ink-soft">{pick(locale, city.intro, city.introHi)}</p>
          <dl className="mt-6 flex flex-wrap gap-x-10 gap-y-4">
            {stats.askingRange && (
              <div className="flex flex-col-reverse">
                <dd className="text-2xl font-semibold tabular-nums">
                  ₹{formatNumber(stats.askingRange.low)}–{formatNumber(stats.askingRange.high)}
                </dd>
                <dt className="text-sm text-muted">{t.perSqFt}</dt>
              </div>
            )}
            {counters.map((c) => (
              <div key={c.label} className="flex flex-col-reverse">
                <dd className="text-2xl font-semibold tabular-nums">{c.value}</dd>
                <dt className="text-sm text-muted">{c.label}</dt>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* 2. Locality map */}
      {mapLocalities.length > 0 && (
        <Section>
          <LocalityMap locale={locale} localities={mapLocalities} />
        </Section>
      )}

      {/* 3. High-potential areas */}
      {stats.topLocalities.length > 0 && (
        <Section title={t.topAreas} aside={<a href={localePath(locale, "/methodology/")}>{t.methodology} →</a>}>
          <ol className="card divide-y divide-line px-5">
            {stats.topLocalities.slice(0, 10).map((l, i) => (
              <li key={l.id} className="flex items-start gap-4 py-3.5">
                <span className="w-6 shrink-0 pt-0.5 text-sm tabular-nums text-muted">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <a href={localePath(locale, `/${city.id}/${l.id}/`)} className="font-semibold no-underline hover:underline">
                    {pick(locale, l.name, l.nameHi)}
                  </a>
                  <p className="text-[15px] text-ink-soft">{topAreaReason(l, locale)}</p>
                </div>
                <span className="shrink-0 rounded-chip bg-accent-soft px-2.5 py-0.5 text-sm font-semibold tabular-nums text-accent-deep">
                  {l.score}
                </span>
              </li>
            ))}
          </ol>
        </Section>
      )}

      {/* 4. Government projects */}
      {projects.length > 0 && (
        <Section title={t.governmentProjects}>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((p) => (
              <ProjectCard key={p.id} locale={locale} project={p} />
            ))}
          </div>
        </Section>
      )}

      {/* 5. Circle rates summary */}
      {schedule && (
        <Section title={t.circleRates} aside={<a href={localePath(locale, `/${city.id}/circle-rates/`)}>{t.fullCircleRateTable} →</a>}>
          <CircleRateTable
            locale={locale}
            cityId={city.id}
            rows={topRates}
            localityNames={localityNames}
            linkableLocalityIds={[...builtLocalityIds(locale)]}
            compact
          />
          <SourceStamp locale={locale} sources={schedule.sources} updatedAt={schedule.updatedAt} effectiveFrom={schedule.effectiveFrom} />
        </Section>
      )}

      {/* 6. Price trend */}
      {series.length > 0 && (
        <Section title={t.priceTrend}>
          <PriceTrend locale={locale} series={series} />
        </Section>
      )}

      {/* 7. Broker note */}
      {brokerNote && city.brokerNoteDate && (
        <Section>
          <BrokerNote locale={locale} note={brokerNote} date={city.brokerNoteDate} broker={broker} />
        </Section>
      )}

      {/* 8. Guides for this city */}
      {guides.length > 0 && (
        <Section title={t.guidesForCity}>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {guides.slice(0, 4).map((g) => (
              <GuideCard key={g.frontmatter.slug} locale={locale} guide={g.frontmatter} readTimeMin={g.readTimeMin} />
            ))}
          </div>
        </Section>
      )}

      {/* 9. Recent updates */}
      {updates.length > 0 && (
        <Section title={t.recentUpdates} aside={<a href={localePath(locale, "/updates/")}>{t.allUpdates} →</a>}>
          <div className="card px-5">
            {updates.map((u) => (
              <UpdateRow key={u.id} locale={locale} update={u} cities={getCities()} />
            ))}
          </div>
        </Section>
      )}

      {/* 10. All localities */}
      {localities.length > 0 && (
        <Section title={t.allLocalities}>
          <div className="grid gap-8 md:grid-cols-3">
            {[...byTehsil.entries()].map(([tehsil, list]) => (
              <div key={tehsil}>
                <h3 className="text-base text-muted">{tehsil}</h3>
                <ul className="mt-2 space-y-1.5">
                  {list.map((l) => (
                    <li key={l.id}>
                      <a href={localePath(locale, `/${city.id}/${l.id}/`)} className="no-underline hover:underline">
                        {pick(locale, l.name, l.nameHi)}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* 11. Lead form, prefilled with city */}
      <Section>
        <LeadForm locale={locale} broker={broker} pageLabel={pageLabel} city={city.id} />
        <SourceStamp locale={locale} sources={city.sources} updatedAt={city.updatedAt} />
      </Section>
    </PageShell>
  );
}

/**
 * One-line reason for the high-potential list. The spec names no field for it; the investment
 * fit reason is written as a one-liner, so it is used first, then the first narrative sentence.
 */
function topAreaReason(l: ReturnType<typeof getBuildableLocalities>["buildable"][number], locale: Locale): string {
  const fit = l.fit?.investment;
  if (fit) return pick(locale, fit.reason, fit.reasonHi);
  const first = pick(locale, l.narrative?.drivers[0], l.narrative?.driversHi?.[0]) ?? "";
  return first.split(/(?<=[.।])\s/)[0];
}

import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/Breadcrumb";
import { BrokerNote } from "@/components/BrokerNote";
import { FAQ } from "@/components/FAQ";
import { JsonLd } from "@/components/JsonLd";
import { KeyFacts, type KeyFact } from "@/components/KeyFacts";
import { CircleRatesHere } from "@/components/rates/CircleRatesHere";
import { place } from "@/lib/jsonld";
import { SITE_URL } from "@/lib/i18n";
import { LeadForm } from "@/components/LeadForm";
import { LocalityCard } from "@/components/LocalityCard";
import { PriceBandChip } from "@/components/PriceBandChip";
import { ProjectCard } from "@/components/ProjectCard";
import { Section } from "@/components/Section";
import { SourceStamp } from "@/components/SourceStamp";
import { getBroker, getBuildableLocalities, getCity, getLocality, getPublishedProjectsByCity } from "@/lib/data";
import { localityFaq } from "@/lib/faq";
import { distanceKm, geometryCentroid } from "@/lib/geo";
import { hasSourcedLandUse, missingMinimumFields } from "@/lib/guards";
import { formatDate, formatNumber, localePath, pick, ui, type Locale } from "@/lib/i18n";
import { fitRatingLabels, landUseLabels } from "@/lib/labels";
import { rc } from "@/lib/rate-copy";
import { getLocalityRate } from "@/lib/rates";
import { localityAlternate } from "@/lib/routes";
import type { FitEntry } from "@/lib/schemas";
import { PageShell } from "./PageShell";

const NEARBY_PROJECT_KM = 5;
const NEARBY_LOCALITIES = 6;

const fitClass: Record<FitEntry["rating"], string> = { good: "bg-band-low", mixed: "bg-band-mid", poor: "bg-band-high" };

/** Template 3: locality page, fully data-driven from one record. Empty fields omit their section. */
export function LocalityTemplate({ locale, cityId, localityId }: { locale: Locale; cityId: string; localityId: string }) {
  const city = getCity(cityId);
  const locality = getLocality(cityId, localityId);
  // Guarded in generateStaticParams too; this keeps a thin record from rendering if params ever drift.
  if (!city || !locality || missingMinimumFields(locality, locale).length > 0) notFound();
  const l = locality;
  const t = ui[locale];
  const broker = getBroker();
  const name = pick(locale, l.name, l.nameHi);
  const otherScriptName = pick(locale, l.nameHi, l.name);
  const cityName = pick(locale, city.name, city.nameHi);
  const pageLabel = `${name}, ${cityName}`;
  const here = { lat: l.lat!, lng: l.lng! };
  // Same-city localities with a page in this locale: the only ones nearby cards and "part of" may link to.
  const siblings = getBuildableLocalities(locale).buildable.filter((x) => x.cityId === city.id && x.id !== l.id);
  const parent = l.parentLocalityId ? siblings.find((x) => x.id === l.parentLocalityId) : undefined;

  /* 2. Key facts */
  const facts: KeyFact[] = [];
  // When the locality is mapped into the published list, the "Circle rates here" block below
  // carries every row that covers it, so the single legacy figure is not repeated up here.
  const hasRateRefs = (l.rateRefs ?? []).length > 0;
  const localityRate = getLocalityRate(l);
  if (l.circleRate && !hasRateRefs) {
    const r = l.circleRate;
    const eff = `${t.effective} ${formatDate(r.effectiveFrom, locale)}`;
    facts.push(
      { label: `${t.circleRate} · ${t.residential}`, value: `₹${formatNumber(r.residential)} ${t.perSqM}, ${eff}`, sourceUrl: r.sourceUrl },
      { label: `${t.circleRate} · ${t.commercial}`, value: `₹${formatNumber(r.commercial)} ${t.perSqM}, ${eff}`, sourceUrl: r.sourceUrl },
      {
        label: `${t.circleRate} · ${t.agricultural}`,
        value: `₹${formatNumber(r.agricultural)} ${t.perHectare}, ${eff}`,
        sourceUrl: r.sourceUrl,
      },
    );
  }
  if (l.askingRange) {
    facts.push({
      label: t.askingRange,
      value: `₹${formatNumber(l.askingRange.low)}–${formatNumber(l.askingRange.high)} ${t.perSqFt}, ${t.asOf} ${formatDate(l.askingRange.asOf, locale)}`,
    });
  }
  if (hasSourcedLandUse(l)) {
    facts.push({
      label: t.landUse,
      // hasSourcedLandUse guarantees both are present.
      value: `${landUseLabels[l.landUse!][locale]}, ${t.perMasterPlan} ${l.landUseSource!}`,
    });
  }

  /* 3. Distances: straight-line at build, drive times from the record */
  const distances = city.anchors.map((anchor) => ({ anchor, km: distanceKm(here, anchor), driveMin: l.driveTimes?.[anchor.id] }));

  /* 5. Projects within 5 km by footprint centroid; projects without geometry count if they list this locality */
  const nearbyProjects = getPublishedProjectsByCity(city.id)
    .map((p) => {
      const c = geometryCentroid(p.geometry);
      return { project: p, km: c ? distanceKm(here, c) : undefined };
    })
    .filter(({ project, km }) => (km !== undefined ? km <= NEARBY_PROJECT_KM : project.affectedLocalityIds.includes(l.id)))
    .sort((a, b) => (a.km ?? Infinity) - (b.km ?? Infinity));

  /* 10. Six nearest localities that have a page in this locale */
  const nearby = siblings
    .filter((x) => x.lat !== undefined && x.lng !== undefined)
    .map((x) => ({ locality: x, km: distanceKm(here, { lat: x.lat!, lng: x.lng! }) }))
    .sort((a, b) => a.km - b.km)
    .slice(0, NEARBY_LOCALITIES);

  const narrative = pick(locale, l.narrative!.drivers, l.narrative!.driversHi);
  const pros = pick(locale, l.pros, l.prosHi) ?? [];
  const cons = pick(locale, l.cons, l.consHi) ?? [];
  const risks = pick(locale, l.risks, l.risksHi) ?? [];
  const brokerNote = pick(locale, l.brokerNote, l.brokerNoteHi);
  const faq = localityFaq(l, city, locale, distances);

  const fitColumn = (label: string, entry: FitEntry | undefined) =>
    entry === undefined ? null : (
    <div key={label} className="card p-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-base">{label}</h3>
        <span className={`chip ${fitClass[entry.rating]}`}>{fitRatingLabels[entry.rating][locale]}</span>
      </div>
      <p className="mt-2 text-[15px] text-ink-soft">{pick(locale, entry.reason, entry.reasonHi)}</p>
      </div>
    );

  const listCard = (title: string, items: string[], mark: string, markClass: string) => (
    <div className="card p-5">
      <h2 className="text-lg">{title}</h2>
      <ul className="mt-3 space-y-2 text-[15px]">
        {items.map((x) => (
          <li key={x} className="flex gap-2">
            <span aria-hidden="true" className={markClass}>
              {mark}
            </span>
            {x}
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <PageShell locale={locale} alternate={localityAlternate(locale, city.id, l.id)} pageLabel={pageLabel}>
      <JsonLd data={place(l, city, locale, `${SITE_URL}${localePath(locale, `/${city.id}/${l.id}/`)}`)} />
      {l.status === "draft" && (
        <p data-component="DraftNotice" className="border-b border-line bg-maroon-soft/60 py-2 text-center text-sm text-maroon">
          <span className="container-site block">{t.draftNotice}</span>
        </p>
      )}
      {/* 1. Header */}
      <section className="border-b border-line bg-cream-deep/60">
        <div className="container-site pb-8 md:pb-10">
          <Breadcrumb
            items={[
              { label: t.home, href: localePath(locale, "/") },
              { label: cityName, href: localePath(locale, `/${city.id}/`) },
              { label: name },
            ]}
          />
          <h1>
            {name}{" "}
            <span lang={locale === "hi" ? "en" : "hi"} className="font-normal text-muted">
              {otherScriptName}
            </span>
          </h1>
          <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-ink-soft">
            {l.tehsil && <span>{l.tehsil}</span>}
            {l.pincode && (
              <span>
                {t.pincode} {l.pincode}
              </span>
            )}
            {l.priceBand && <PriceBandChip locale={locale} band={l.priceBand} />}
            {l.parentLocalityId && (
              <span>
                {t.partOf}{" "}
                {parent ? (
                  <a href={localePath(locale, `/${city.id}/${parent.id}/`)}>{pick(locale, parent.name, parent.nameHi)}</a>
                ) : (
                  l.parentLocalityId
                )}
              </span>
            )}
          </p>
        </div>
      </section>

      {/* 2. Key facts */}
      {facts.length > 0 && (
        <Section title={t.keyFacts}>
          <KeyFacts facts={facts} />
        </Section>
      )}

      {/* 2b. Every row of the published list that covers this locality (Step 9 C4) */}
      {hasRateRefs && (
        <Section id="circle-rates" title={rc(locale).circleRatesHere}>
          <CircleRatesHere locale={locale} locality={l} />
        </Section>
      )}

      {/* 3. Distances */}
      {distances.length > 0 && (
        <Section title={t.distances}>
          <div className="card overflow-x-auto">
            <table className="w-full text-[15px]">
              <thead className="bg-cream-deep text-left text-sm text-ink-soft">
                <tr>
                  <th className="px-4 py-2.5 font-semibold">{t.anchor}</th>
                  <th className="px-4 py-2.5 text-right font-semibold">{t.distance}</th>
                  <th className="px-4 py-2.5 text-right font-semibold">{t.driveTime}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {distances.map(({ anchor, km, driveMin }) => (
                  <tr key={anchor.id}>
                    <td className="px-4 py-2.5 font-medium">{pick(locale, anchor.name, anchor.nameHi)}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">
                      {km} {t.km}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-ink-soft">
                      {driveMin !== undefined ? `${driveMin} ${t.minutes}` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      {/* 4. Why the price is moving */}
      <Section title={t.whyPriceMoving}>
        <div className="prose-site max-w-3xl text-[17px] leading-relaxed">
          {narrative.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      </Section>

      {/* 5. Projects nearby */}
      {nearbyProjects.length > 0 && (
        <Section title={t.projectsNearby}>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {nearbyProjects.map(({ project, km }) => (
              <ProjectCard key={project.id} locale={locale} project={project} distanceKm={km} />
            ))}
          </div>
        </Section>
      )}

      {/* 6. Who it suits */}
      {l.fit && (
        <Section title={t.whoItSuits}>
          {/* Only the categories the record actually carries; the grid tracks how many. */}
          <div className="grid gap-4 md:grid-cols-3">
            {fitColumn(t.residential, l.fit.residential)}
            {fitColumn(t.commercial, l.fit.commercial)}
            {fitColumn(t.investment, l.fit.investment)}
          </div>
        </Section>
      )}

      {/* 7. Pros and cons */}
      {(pros.length > 0 || cons.length > 0) && (
        <Section>
          <div className="grid gap-4 md:grid-cols-2">
            {pros.length > 0 && listCard(t.pros, pros, "+", "text-accent")}
            {cons.length > 0 && listCard(t.cons, cons, "−", "text-maroon")}
          </div>
        </Section>
      )}

      {/* 8. Watch-outs, only when data exists */}
      {risks.length > 0 && (
        <Section title={t.watchOuts}>
          <ul className="card space-y-2 border-l-4 border-l-maroon p-5 text-[15px]">
            {risks.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </Section>
      )}

      {/* 9. Broker note */}
      {brokerNote && l.brokerNoteDate && (
        <Section>
          <BrokerNote locale={locale} note={brokerNote} date={l.brokerNoteDate} broker={broker} />
        </Section>
      )}

      {/* 10. Nearby localities */}
      {nearby.length > 0 && (
        <Section title={t.nearbyLocalities}>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {nearby.map(({ locality: x, km }) => (
              <LocalityCard key={x.id} locale={locale} locality={x} distanceKm={km} />
            ))}
          </div>
        </Section>
      )}

      {/* 11. FAQ */}
      {faq.length > 0 && (
        <Section>
          <FAQ title={t.faq} items={faq} />
        </Section>
      )}

      {/* 12. Source stamp, 13. Lead form prefilled with city and locality */}
      <Section>
        <LeadForm locale={locale} broker={broker} pageLabel={pageLabel} city={city.id} locality={l.id} />
        <SourceStamp locale={locale} sources={l.sources} updatedAt={l.updatedAt} effectiveFrom={localityRate?.effectiveFrom} />
      </Section>
    </PageShell>
  );
}

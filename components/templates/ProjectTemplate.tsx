import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/Breadcrumb";
import { KeyFacts, type KeyFact } from "@/components/KeyFacts";
import { LeadForm } from "@/components/LeadForm";
import { LocalityMap, type MapLocality } from "@/components/LocalityMap";
import { ProjectCard } from "@/components/ProjectCard";
import { Section } from "@/components/Section";
import { SourceStamp } from "@/components/SourceStamp";
import { StatusChip } from "@/components/StatusChip";
import { UpdateRow } from "@/components/UpdateRow";
import { getBroker, getBuildableLocalities, getCities, getCity, getLocalities, getProject, getProjects, getUpdates } from "@/lib/data";
import { formatDate, formatNumber, localePath, pick, ui, type Locale } from "@/lib/i18n";
import { agencyLabel, impactLevelClass, impactLevelLabels } from "@/lib/labels";
import { builtLocalityIds, sameAlternate } from "@/lib/routes";
import { PageShell } from "./PageShell";

/** Template 4: government project page, rendered from one projects.json record. */
export function ProjectTemplate({ locale, slug }: { locale: Locale; slug: string }) {
  const project = getProject(slug);
  if (!project) notFound();
  const p = project;
  const t = ui[locale];
  const broker = getBroker();
  const city = getCity(p.cityId);
  const name = pick(locale, p.name, p.nameHi);
  const pageLabel = name;
  const built = builtLocalityIds(locale);
  const localityName = (id: string) => {
    const l = getLocalities().find((x) => x.id === id);
    return l ? pick(locale, l.name, l.nameHi) : id;
  };
  const localityLink = (id: string) =>
    built.has(id) ? (
      <a href={localePath(locale, `/${p.cityId}/${id}/`)} className="font-medium">
        {localityName(id)}
      </a>
    ) : (
      <span className="font-medium">{localityName(id)}</span>
    );

  /* 2. Fact box, empty values omitted */
  const facts: KeyFact[] = [{ label: t.agency, value: agencyLabel(p.agency, p.agencyName) }];
  if (p.budgetCr !== null) facts.push({ label: t.budget, value: `₹${formatNumber(p.budgetCr)} ${t.crore}` });
  if (p.announcedOn) facts.push({ label: t.announced, value: formatDate(p.announcedOn, locale) });
  if (p.expectedCompletion) facts.push({ label: t.expectedCompletion, value: p.expectedCompletion });
  if (p.extent) facts.push({ label: t.extent, value: `${formatNumber(p.extent.value)} ${p.extent.unit === "km" ? t.km : t.hectares}` });

  /* 4. Map: footprint over the affected localities that have a page in this locale */
  const affected = getBuildableLocalities(locale).buildable.filter((l) => p.affectedLocalityIds.includes(l.id));
  const mapLocalities: MapLocality[] = affected.flatMap((l) =>
    l.lat !== undefined && l.lng !== undefined ? [{ ...l, lat: l.lat, lng: l.lng }] : [],
  );

  const milestones = [...p.milestones].sort((a, b) => a.date.localeCompare(b.date));
  const relatedUpdates = getUpdates().filter((u) => u.projectIds.includes(p.id));
  const relatedProjects = getProjects().filter((x) => x.id !== p.id && (x.cityId === p.cityId || x.agency === p.agency));
  const description = pick(locale, p.description, p.descriptionHi);

  return (
    <PageShell locale={locale} alternate={sameAlternate(locale, `/projects/${p.id}/`)} pageLabel={pageLabel}>
      {/* 1. Header */}
      <section className="border-b border-line bg-cream-deep/60">
        <div className="container-site pb-8 md:pb-10">
          <Breadcrumb
            items={[
              { label: t.home, href: localePath(locale, "/") },
              ...(city ? [{ label: pick(locale, city.name, city.nameHi), href: localePath(locale, `/${city.id}/`) }] : []),
              { label: name },
            ]}
          />
          <p className="flex flex-wrap items-center gap-2 text-sm text-ink-soft">
            <span>{agencyLabel(p.agency, p.agencyName)}</span>
            <StatusChip locale={locale} status={p.status} />
          </p>
          <h1 className="mt-3">{name}</h1>
          {city && (
            <p className="mt-2 text-ink-soft">
              <a href={localePath(locale, `/${city.id}/`)}>{pick(locale, city.name, city.nameHi)}</a>
            </p>
          )}
        </div>
      </section>

      {/* 2. Fact box */}
      <Section title={t.factBox}>
        <KeyFacts facts={facts} />
        <p className="mt-3 text-sm text-muted">
          {t.source}:{" "}
          {p.sources.map((s, i) => (
            <span key={s.url + s.label}>
              {i > 0 && ", "}
              <a href={s.url} rel="noopener">
                {s.label}
              </a>
            </span>
          ))}
        </p>
      </Section>

      {/* 3. What it is */}
      <Section title={t.whatItIs}>
        <div className="prose-site max-w-3xl text-[17px] leading-relaxed">
          {description.map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>
      </Section>

      {/* 4. Map */}
      {(p.geometry || mapLocalities.length > 0) && (
        <Section title={t.footprint}>
          <LocalityMap locale={locale} localities={mapLocalities} overlay={p.geometry} />
        </Section>
      )}

      {/* 5. Effect on land */}
      {p.impacts.length > 0 && (
        <Section title={t.effectOnLand}>
          <div className="card overflow-x-auto">
            <table className="w-full text-[15px]">
              <thead className="bg-cream-deep text-left text-sm text-ink-soft">
                <tr>
                  <th className="px-4 py-2.5 font-semibold">{t.locality}</th>
                  <th className="px-4 py-2.5 font-semibold">{t.expectedEffect}</th>
                  <th className="px-4 py-2.5 font-semibold">{t.reason}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {p.impacts.map((i) => (
                  <tr key={i.localityId}>
                    <td className="px-4 py-2.5">{localityLink(i.localityId)}</td>
                    <td className="px-4 py-2.5">
                      <span className={`chip ${impactLevelClass[i.level]}`}>{impactLevelLabels[i.level][locale]}</span>
                    </td>
                    <td className="px-4 py-2.5 text-ink-soft">{pick(locale, i.reason, i.reasonHi)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      {/* 6. Timeline */}
      {milestones.length > 0 && (
        <Section title={t.timeline}>
          <ol className="card divide-y divide-line px-5">
            {milestones.map((m) => (
              <li key={m.date + m.text} className="grid gap-1 py-3.5 md:grid-cols-[8rem_1fr] md:gap-6">
                <time dateTime={m.date} className="text-sm text-muted">
                  {formatDate(m.date, locale)}
                </time>
                <p>
                  {pick(locale, m.text, m.textHi)}{" "}
                  <a href={m.sourceUrl} rel="noopener" className="text-sm text-muted">
                    [{t.source.toLowerCase()}]
                  </a>
                </p>
              </li>
            ))}
          </ol>
        </Section>
      )}

      {/* 7. Related updates */}
      {relatedUpdates.length > 0 && (
        <Section title={t.relatedUpdates}>
          <div className="card px-5">
            {relatedUpdates.map((u) => (
              <UpdateRow key={u.id} locale={locale} update={u} cities={getCities()} />
            ))}
          </div>
        </Section>
      )}

      {/* 8. Related projects: same city or same agency */}
      {relatedProjects.length > 0 && (
        <Section title={t.relatedProjects}>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {relatedProjects.map((x) => (
              <ProjectCard key={x.id} locale={locale} project={x} />
            ))}
          </div>
        </Section>
      )}

      {/* 9. Lead form prefilled with city and "interested near <project>" */}
      <Section>
        <LeadForm
          locale={locale}
          broker={broker}
          pageLabel={`${t.interestedNear} ${name}`}
          city={p.cityId}
          context={`interested near ${p.id}`}
        />
        <SourceStamp locale={locale} sources={p.sources} updatedAt={p.updatedAt} />
      </Section>
    </PageShell>
  );
}

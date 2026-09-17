import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/Breadcrumb";
import { LeadForm } from "@/components/LeadForm";
import { Section } from "@/components/Section";
import { SourceStamp } from "@/components/SourceStamp";
import { updateTypeLabels } from "@/components/UpdateRow";
import { UpdatesList } from "@/components/UpdatesList";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { getBroker, getCities, getLocalities, getProject, getUpdate, getUpdates } from "@/lib/data";
import { formatDate, localePath, pick, ui, whatsappText, type Locale } from "@/lib/i18n";
import { agencyLabel } from "@/lib/labels";
import { builtLocalityIds, sameAlternate } from "@/lib/routes";
import { PageShell } from "./PageShell";

/** Template 8 index: every notice, newest first, with client-side filters. */
export function UpdatesIndexTemplate({ locale }: { locale: Locale }) {
  const t = ui[locale];
  const broker = getBroker();
  const updates = getUpdates();
  const cities = getCities();
  return (
    <PageShell locale={locale} alternate={sameAlternate(locale, "/updates/")} pageLabel={t.updates}>
      {/* 1. Header */}
      <section className="border-b border-line bg-cream-deep/60">
        <div className="container-site pb-8 md:pb-10">
          <Breadcrumb items={[{ label: t.home, href: localePath(locale, "/") }, { label: t.updates }]} />
          <h1>{t.updatesTagline}</h1>
          <p className="mt-3 text-ink-soft">
            {updates.length} {t.entries}
            {updates[0] && (
              <>
                {" · "}
                {t.lastEntry} <time dateTime={updates[0].date}>{formatDate(updates[0].date, locale)}</time>
              </>
            )}
          </p>
        </div>
      </section>

      {/* 2. Filters and 3. List */}
      <Section>
        <UpdatesList locale={locale} updates={updates} cities={cities} />
      </Section>

      {/* 4. Subscribe: JotForm in step 7 */}
      <Section>
        <section data-component="Subscribe" className="card bg-accent-soft/60 p-6 md:p-8">
          <h2>{t.subscribe}</h2>
          <p className="mt-2 max-w-prose text-ink-soft">{t.subscribeNote}</p>
          <div className="mt-5">
            <WhatsAppButton
              number={broker.whatsapp}
              text={whatsappText(locale, `${t.updates} · ${t.subscribe}`)}
              label={t.talkOnWhatsapp}
            />
          </div>
        </section>
      </Section>
    </PageShell>
  );
}

/** Template 8 entry. */
export function UpdateTemplate({ locale, slug }: { locale: Locale; slug: string }) {
  const update = getUpdate(slug);
  if (!update) notFound();
  const u = update;
  const t = ui[locale];
  const broker = getBroker();
  const title = pick(locale, u.title, u.titleHi);
  const cities = getCities();
  const built = builtLocalityIds(locale);

  /* 5. Previous and next, chronological (getUpdates is newest first) */
  const all = getUpdates();
  const idx = all.findIndex((x) => x.id === u.id);
  const newer = idx > 0 ? all[idx - 1] : undefined;
  const older = idx < all.length - 1 ? all[idx + 1] : undefined;

  const affectedLocalities = u.localityIds.map((id) => {
    const l = getLocalities().find((x) => x.id === id);
    return { id, cityId: l?.cityId, name: l ? pick(locale, l.name, l.nameHi) : id, built: built.has(id) };
  });
  const affectedProjects = u.projectIds.map((id) => {
    const p = getProject(id);
    return { id, name: p ? pick(locale, p.name, p.nameHi) : id };
  });

  return (
    <PageShell locale={locale} alternate={sameAlternate(locale, `/updates/${u.id}/`)} pageLabel={title}>
      {/* 1. Header */}
      <section className="border-b border-line bg-cream-deep/60">
        <div className="container-site pb-8 md:pb-10">
          <Breadcrumb
            items={[
              { label: t.home, href: localePath(locale, "/") },
              { label: t.updates, href: localePath(locale, "/updates/") },
              { label: title },
            ]}
          />
          <p className="text-sm text-muted">
            <time dateTime={u.date}>{formatDate(u.date, locale)}</time>
          </p>
          <h1 className="mt-2 max-w-4xl">{title}</h1>
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
      </section>

      <Section>
        <div className="grid gap-10 lg:grid-cols-[1fr_20rem]">
          <div>
            {/* 3. Plain-language summary */}
            <h2 className="text-lg">{t.plainSummary}</h2>
            <div className="prose-site mt-3 max-w-3xl text-[17px] leading-relaxed">
              {pick(locale, u.summary, u.summaryHi).map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          </div>
          <aside className="space-y-6">
            {/* 2. Source */}
            <div className="card p-5">
              <h2 className="text-base">{t.source}</h2>
              <ul className="mt-2 space-y-1.5 text-[15px]">
                <li>
                  <a href={u.sourceUrl} rel="noopener">
                    {t.originalNotice}
                  </a>
                </li>
                {u.archiveUrl && (
                  <li>
                    <a href={u.archiveUrl} rel="noopener">
                      {t.archivedCopy}
                    </a>
                  </li>
                )}
              </ul>
            </div>
            {/* 4. Affected */}
            {(affectedLocalities.length > 0 || affectedProjects.length > 0) && (
              <div className="card p-5">
                <h2 className="text-base">{t.affected}</h2>
                <ul className="mt-2 space-y-1.5 text-[15px]">
                  {affectedLocalities.map((l) => (
                    <li key={l.id}>{l.built && l.cityId ? <a href={localePath(locale, `/${l.cityId}/${l.id}/`)}>{l.name}</a> : l.name}</li>
                  ))}
                  {affectedProjects.map((p) => (
                    <li key={p.id}>
                      <a href={localePath(locale, `/projects/${p.id}/`)}>{p.name}</a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </aside>
        </div>
      </Section>

      {/* 5. Previous and next */}
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

      {/* 6. Lead CTA */}
      <Section>
        <LeadForm
          locale={locale}
          broker={broker}
          pageLabel={`${t.askWhatThisMeans}: ${title}`}
          city={u.cityIds[0]}
          context={`update ${u.id}`}
        />
        <SourceStamp locale={locale} sources={u.sources} updatedAt={u.updatedAt} />
      </Section>
    </PageShell>
  );
}

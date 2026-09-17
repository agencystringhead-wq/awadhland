import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/Breadcrumb";
import { SourceStamp } from "@/components/SourceStamp";
import { UpdateRow } from "@/components/UpdateRow";
import { getCities, getUpdate, getUpdates } from "@/lib/data";
import { localePath, pick, ui, type Locale } from "@/lib/i18n";
import { sameAlternate } from "@/lib/routes";
import { DataDump, PageShell } from "./PageShell";

/** Template 8 index. Scaffold: title, rows and ids as JSON. */
export function UpdatesIndexTemplate({ locale }: { locale: Locale }) {
  const updates = getUpdates();
  return (
    <PageShell locale={locale} alternate={sameAlternate(locale, "/updates/")} pageLabel={ui[locale].updates}>
      <div className="container-site pb-12">
        <Breadcrumb items={[{ label: ui[locale].home, href: localePath(locale, "/") }, { label: ui[locale].updates }]} />
        <h1>{ui[locale].updates}</h1>
        {updates.map((u) => (
          <UpdateRow key={u.id} locale={locale} update={u} cities={getCities()} />
        ))}
        <DataDump data={{ count: updates.length, lastEntry: updates[0]?.date ?? null, ids: updates.map((u) => u.id) }} />
      </div>
    </PageShell>
  );
}

/** Template 8 entry. Scaffold: title and the update record as JSON. */
export function UpdateTemplate({ locale, slug }: { locale: Locale; slug: string }) {
  const update = getUpdate(slug);
  if (!update) notFound();
  const title = pick(locale, update.title, update.titleHi);
  return (
    <PageShell locale={locale} alternate={sameAlternate(locale, `/updates/${update.id}/`)} pageLabel={title}>
      <div className="container-site pb-12">
        <Breadcrumb
          items={[
            { label: ui[locale].home, href: localePath(locale, "/") },
            { label: ui[locale].updates, href: localePath(locale, "/updates/") },
            { label: title },
          ]}
        />
        <h1>{title}</h1>
        <DataDump data={update} />
        <SourceStamp locale={locale} sources={update.sources} updatedAt={update.updatedAt} />
      </div>
    </PageShell>
  );
}

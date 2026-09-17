import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/Breadcrumb";
import { SourceStamp } from "@/components/SourceStamp";
import { StatusChip } from "@/components/StatusChip";
import { getCity, getProject, getUpdates } from "@/lib/data";
import { localePath, pick, ui, type Locale } from "@/lib/i18n";
import { sameAlternate } from "@/lib/routes";
import { DataDump, PageShell } from "./PageShell";

/** Template 4. Scaffold: title, status and the project record as JSON. */
export function ProjectTemplate({ locale, slug }: { locale: Locale; slug: string }) {
  const project = getProject(slug);
  if (!project) notFound();
  const city = getCity(project.cityId);
  const name = pick(locale, project.name, project.nameHi);
  return (
    <PageShell locale={locale} alternate={sameAlternate(locale, `/projects/${project.id}/`)} pageLabel={name}>
      <div className="container-site pb-12">
        <Breadcrumb
          items={[
            { label: ui[locale].home, href: localePath(locale, "/") },
            ...(city ? [{ label: pick(locale, city.name, city.nameHi), href: localePath(locale, `/${city.id}/`) }] : []),
            { label: name },
          ]}
        />
        <h1>{name}</h1>
        <StatusChip locale={locale} status={project.status} />
        <DataDump
          data={{
            project,
            relatedUpdates: getUpdates()
              .filter((u) => u.projectIds.includes(project.id))
              .map((u) => u.id),
          }}
        />
        <SourceStamp locale={locale} sources={project.sources} updatedAt={project.updatedAt} />
      </div>
    </PageShell>
  );
}

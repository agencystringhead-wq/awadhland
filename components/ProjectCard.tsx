import type { Locale } from "@/lib/i18n";
import { localePath, pick, ui } from "@/lib/i18n";
import type { Project } from "@/lib/schemas";
import { StatusChip } from "./StatusChip";

export type ProjectCardProps = {
  locale: Locale;
  project: Pick<Project, "id" | "name" | "nameHi" | "agency" | "agencyName" | "status" | "description" | "descriptionHi">;
  /** km, shown on locality pages */
  distanceKm?: number;
};

export function ProjectCard({ locale, project, distanceKm }: ProjectCardProps) {
  const t = ui[locale];
  return (
    <article data-component="ProjectCard" className="card flex h-full flex-col gap-3 p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-muted">{project.agency === "other" ? project.agencyName : project.agency}</p>
        <StatusChip locale={locale} status={project.status} />
      </div>
      <h3>
        <a href={localePath(locale, `/projects/${project.id}/`)} className="text-ink no-underline hover:text-accent">
          {pick(locale, project.name, project.nameHi)}
        </a>
      </h3>
      <p className="line-clamp-3 text-[15px] text-ink-soft">{pick(locale, project.description, project.descriptionHi)[0]}</p>
      {distanceKm !== undefined && (
        <p className="mt-auto text-sm text-muted">
          {distanceKm} {t.km}
        </p>
      )}
    </article>
  );
}

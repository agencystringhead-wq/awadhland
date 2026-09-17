import type { Locale } from "@/lib/i18n";
import { localePath, pick } from "@/lib/i18n";
import type { Project } from "@/lib/schemas";
import { StatusChip } from "./StatusChip";

export type ProjectCardProps = {
  locale: Locale;
  project: Pick<Project, "id" | "name" | "nameHi" | "agency" | "agencyName" | "status" | "description" | "descriptionHi">;
  /** km, shown on locality pages */
  distanceKm?: number;
};

/** Stub. */
export function ProjectCard({ locale, project, distanceKm }: ProjectCardProps) {
  return (
    <article data-component="ProjectCard">
      <h3>
        <a href={localePath(locale, `/projects/${project.id}/`)}>{pick(locale, project.name, project.nameHi)}</a>
      </h3>
      <p>{project.agency === "other" ? project.agencyName : project.agency}</p>
      <StatusChip locale={locale} status={project.status} />
      <p>{pick(locale, project.description, project.descriptionHi)[0]}</p>
      {distanceKm !== undefined && <p>{distanceKm} km</p>}
    </article>
  );
}

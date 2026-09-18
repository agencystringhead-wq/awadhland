import { ProjectCard } from "@/components/ProjectCard";
import { getProject } from "@/lib/data";
import type { Locale } from "@/lib/i18n";

export type GuideProjectCardProps = {
  /** project id from projects.json */
  id: string;
  locale: Locale;
};

/** Guide MDX component <ProjectCard id="…" />: the shared ProjectCard, looked up by id and sized for a prose column. */
export function GuideProjectCard({ id, locale }: GuideProjectCardProps) {
  const project = getProject(id);
  if (!project) throw new Error(`<ProjectCard id="${id}">: unknown project`);
  return (
    <div className="mdx-block my-8 max-w-md">
      <ProjectCard locale={locale} project={project} />
    </div>
  );
}

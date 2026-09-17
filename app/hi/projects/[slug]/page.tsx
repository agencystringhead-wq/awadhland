import { ProjectTemplate } from "@/components/templates/ProjectTemplate";
import { projectParams } from "@/lib/routes";

export const dynamicParams = false;
export const generateStaticParams = projectParams;

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <ProjectTemplate locale="hi" slug={slug} />;
}

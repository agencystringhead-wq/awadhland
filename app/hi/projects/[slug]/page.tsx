import type { Metadata } from "next";
import { ProjectTemplate } from "@/components/templates/ProjectTemplate";
import { projectParams } from "@/lib/routes";
import { metadataFor } from "@/lib/seo";

type Params = Promise<{ slug: string }>;

export const dynamicParams = false;
export const generateStaticParams = projectParams;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  return metadataFor("hi", `/projects/${slug}/`);
}

export default async function Page({ params }: { params: Params }) {
  const { slug } = await params;
  return <ProjectTemplate locale="hi" slug={slug} />;
}

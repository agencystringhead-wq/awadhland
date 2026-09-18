import type { Metadata } from "next";
import { ToolTemplate } from "@/components/templates/ToolTemplate";
import { toolParams } from "@/lib/routes";
import { metadataFor } from "@/lib/seo";

type Params = Promise<{ slug: string }>;

export const dynamicParams = false;
export const generateStaticParams = () => toolParams();

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  return metadataFor("en", `/tools/${slug}/`);
}

export default async function Page({ params }: { params: Params }) {
  const { slug } = await params;
  return <ToolTemplate locale="en" slug={slug} />;
}

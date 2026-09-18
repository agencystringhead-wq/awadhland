import type { Metadata } from "next";
import { GuideTemplate } from "@/components/templates/GuideTemplate";
import { guideParams } from "@/lib/routes";
import { metadataFor } from "@/lib/seo";

type Params = Promise<{ slug: string }>;

export const dynamicParams = false;
export const generateStaticParams = () => guideParams("en");

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  return metadataFor("en", `/guides/${slug}/`);
}

export default async function Page({ params }: { params: Params }) {
  const { slug } = await params;
  return <GuideTemplate locale="en" slug={slug} />;
}

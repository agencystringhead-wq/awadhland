import type { Metadata } from "next";
import { UpdateTemplate } from "@/components/templates/UpdatesTemplate";
import { updateParams } from "@/lib/routes";
import { metadataFor } from "@/lib/seo";

type Params = Promise<{ slug: string }>;

export const dynamicParams = false;
export const generateStaticParams = updateParams;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  return metadataFor("hi", `/updates/${slug}/`);
}

export default async function Page({ params }: { params: Params }) {
  const { slug } = await params;
  return <UpdateTemplate locale="hi" slug={slug} />;
}

import type { Metadata } from "next";
import { LocalityTemplate } from "@/components/templates/LocalityTemplate";
import { localityParams } from "@/lib/routes";
import { metadataFor } from "@/lib/seo";

type Params = Promise<{ city: string; locality: string }>;

export const dynamicParams = false;
export const generateStaticParams = () => localityParams("hi");

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { city, locality } = await params;
  return metadataFor("hi", `/${city}/${locality}/`);
}

export default async function Page({ params }: { params: Params }) {
  const { city, locality } = await params;
  return <LocalityTemplate locale="hi" cityId={city} localityId={locality} />;
}

import type { Metadata } from "next";
import { LocalityTemplate } from "@/components/templates/LocalityTemplate";
import { localityParams } from "@/lib/routes";
import { metadataFor } from "@/lib/seo";

type Params = Promise<{ city: string; locality: string }>;

export const dynamicParams = false;
export const generateStaticParams = () => localityParams("en");

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { city, locality } = await params;
  return metadataFor("en", `/${city}/${locality}/`);
}

export default async function Page({ params }: { params: Params }) {
  const { city, locality } = await params;
  return <LocalityTemplate locale="en" cityId={city} localityId={locality} />;
}

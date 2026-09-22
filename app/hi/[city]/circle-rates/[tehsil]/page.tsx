import type { Metadata } from "next";
import { RateTehsilTemplate } from "@/components/templates/RateTehsilTemplate";
import { rateTehsilParams } from "@/lib/routes";
import { metadataFor } from "@/lib/seo";

type Params = Promise<{ city: string; tehsil: string }>;

export const dynamicParams = false;
export const generateStaticParams = rateTehsilParams;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { city, tehsil } = await params;
  return metadataFor("hi", `/${city}/circle-rates/${tehsil}/`);
}

export default async function Page({ params }: { params: Params }) {
  const { city, tehsil } = await params;
  return <RateTehsilTemplate locale="hi" cityId={city} tehsilId={tehsil} />;
}

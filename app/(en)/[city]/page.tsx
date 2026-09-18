import type { Metadata } from "next";
import { CityTemplate } from "@/components/templates/CityTemplate";
import { cityParams } from "@/lib/routes";
import { metadataFor } from "@/lib/seo";

type Params = Promise<{ city: string }>;

export const dynamicParams = false;
export const generateStaticParams = cityParams;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { city } = await params;
  return metadataFor("en", `/${city}/`);
}

export default async function Page({ params }: { params: Params }) {
  const { city } = await params;
  return <CityTemplate locale="en" cityId={city} />;
}

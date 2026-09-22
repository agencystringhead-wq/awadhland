import type { Metadata } from "next";
import { RateVillageTemplate } from "@/components/templates/RateVillageTemplate";
import { rateVillageParams } from "@/lib/routes";
import { metadataFor } from "@/lib/seo";

type Params = Promise<{ city: string; tehsil: string; village: string }>;

export const dynamicParams = false;
export const generateStaticParams = rateVillageParams;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { city, tehsil, village } = await params;
  return metadataFor("hi", `/${city}/circle-rates/${tehsil}/${village}/`);
}

export default async function Page({ params }: { params: Params }) {
  const { city, tehsil, village } = await params;
  return <RateVillageTemplate locale="hi" cityId={city} tehsilId={tehsil} villageSlug={village} />;
}

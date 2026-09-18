import type { Metadata } from "next";
import { CircleRatesTemplate } from "@/components/templates/CircleRatesTemplate";
import { circleRateParams } from "@/lib/routes";
import { metadataFor } from "@/lib/seo";

type Params = Promise<{ city: string }>;

export const dynamicParams = false;
export const generateStaticParams = circleRateParams;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { city } = await params;
  return metadataFor("hi", `/${city}/circle-rates/`);
}

export default async function Page({ params }: { params: Params }) {
  const { city } = await params;
  return <CircleRatesTemplate locale="hi" cityId={city} />;
}

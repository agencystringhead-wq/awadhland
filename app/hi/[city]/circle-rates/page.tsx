import { CircleRatesTemplate } from "@/components/templates/CircleRatesTemplate";
import { circleRateParams } from "@/lib/routes";

export const dynamicParams = false;
export const generateStaticParams = circleRateParams;

export default async function Page({ params }: { params: Promise<{ city: string }> }) {
  const { city } = await params;
  return <CircleRatesTemplate locale="hi" cityId={city} />;
}

import { CityTemplate } from "@/components/templates/CityTemplate";
import { cityParams } from "@/lib/routes";

export const dynamicParams = false;
export const generateStaticParams = cityParams;

export default async function Page({ params }: { params: Promise<{ city: string }> }) {
  const { city } = await params;
  return <CityTemplate locale="hi" cityId={city} />;
}

import { LocalityTemplate } from "@/components/templates/LocalityTemplate";
import { localityParams } from "@/lib/routes";

export const dynamicParams = false;
export const generateStaticParams = () => localityParams("hi");

export default async function Page({ params }: { params: Promise<{ city: string; locality: string }> }) {
  const { city, locality } = await params;
  return <LocalityTemplate locale="hi" cityId={city} localityId={locality} />;
}

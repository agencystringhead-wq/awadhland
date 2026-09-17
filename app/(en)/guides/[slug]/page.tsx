import { GuideTemplate } from "@/components/templates/GuideTemplate";
import { guideParams } from "@/lib/routes";

export const dynamicParams = false;
export const generateStaticParams = () => guideParams("en");

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <GuideTemplate locale="en" slug={slug} />;
}

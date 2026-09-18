import { ToolTemplate } from "@/components/templates/ToolTemplate";
import { toolParams } from "@/lib/routes";

export const dynamicParams = false;
export const generateStaticParams = () => toolParams();

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <ToolTemplate locale="hi" slug={slug} />;
}

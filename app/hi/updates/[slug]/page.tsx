import { UpdateTemplate } from "@/components/templates/UpdatesTemplate";
import { updateParams } from "@/lib/routes";

export const dynamicParams = false;
export const generateStaticParams = updateParams;

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <UpdateTemplate locale="hi" slug={slug} />;
}

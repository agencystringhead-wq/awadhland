import type { Metadata } from "next";
import { UpdatesIndexTemplate } from "@/components/templates/UpdatesTemplate";
import { metadataFor } from "@/lib/seo";

export const generateMetadata = (): Metadata => metadataFor("hi", "/updates/");

export default function Page() {
  return <UpdatesIndexTemplate locale="hi" />;
}

import type { Metadata } from "next";
import { UpdatesIndexTemplate } from "@/components/templates/UpdatesTemplate";
import { metadataFor } from "@/lib/seo";

export const generateMetadata = (): Metadata => metadataFor("en", "/updates/");

export default function Page() {
  return <UpdatesIndexTemplate locale="en" />;
}

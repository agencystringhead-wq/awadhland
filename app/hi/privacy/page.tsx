import type { Metadata } from "next";
import { StandardPageTemplate } from "@/components/templates/StandardPageTemplate";
import { metadataFor } from "@/lib/seo";

export const generateMetadata = (): Metadata => metadataFor("hi", "/privacy/");

export default function Page() {
  return <StandardPageTemplate locale="hi" id="privacy" />;
}

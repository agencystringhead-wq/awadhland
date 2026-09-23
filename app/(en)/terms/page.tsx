import type { Metadata } from "next";
import { StandardPageTemplate } from "@/components/templates/StandardPageTemplate";
import { metadataFor } from "@/lib/seo";

export const generateMetadata = (): Metadata => metadataFor("en", "/terms/");

export default function Page() {
  return <StandardPageTemplate locale="en" id="terms" />;
}

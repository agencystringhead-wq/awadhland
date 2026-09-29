import type { Metadata } from "next";
import { ContactTemplate } from "@/components/templates/ContactTemplate";
import { metadataFor } from "@/lib/seo";

export const generateMetadata = (): Metadata => metadataFor("hi", "/contact/");

export default function Page() {
  return <ContactTemplate locale="hi" />;
}

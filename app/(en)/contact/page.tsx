import type { Metadata } from "next";
import { ContactTemplate } from "@/components/templates/ContactTemplate";
import { metadataFor } from "@/lib/seo";

export const generateMetadata = (): Metadata => metadataFor("en", "/contact/");

export default function Page() {
  return <ContactTemplate locale="en" />;
}

import type { Metadata } from "next";
import { AboutTemplate } from "@/components/templates/AboutTemplate";
import { metadataFor } from "@/lib/seo";

export const generateMetadata = (): Metadata => metadataFor("en", "/about/");

export default function Page() {
  return <AboutTemplate locale="en" />;
}

import type { Metadata } from "next";
import { HomeTemplate } from "@/components/templates/HomeTemplate";
import { metadataFor } from "@/lib/seo";

export const generateMetadata = (): Metadata => metadataFor("en", "/");

export default function Page() {
  return <HomeTemplate locale="en" />;
}

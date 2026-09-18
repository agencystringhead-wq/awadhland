import type { Metadata } from "next";
import { HomeTemplate } from "@/components/templates/HomeTemplate";
import { metadataFor } from "@/lib/seo";

export const generateMetadata = (): Metadata => metadataFor("hi", "/");

export default function Page() {
  return <HomeTemplate locale="hi" />;
}

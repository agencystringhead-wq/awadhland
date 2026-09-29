import type { Metadata } from "next";
import { SitemapTemplate } from "@/components/templates/SitemapTemplate";
import { metadataFor } from "@/lib/seo";

export const generateMetadata = (): Metadata => metadataFor("hi", "/sitemap/");

export default function Page() {
  return <SitemapTemplate locale="hi" />;
}

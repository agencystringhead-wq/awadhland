import { sitemapEn } from "@/lib/sitemaps";

export const dynamic = "force-static";

export function GET() {
  return new Response(sitemapEn(), { headers: { "Content-Type": "application/xml; charset=utf-8" } });
}

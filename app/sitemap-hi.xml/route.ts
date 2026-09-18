import { sitemapHi } from "@/lib/sitemaps";

export const dynamic = "force-static";

export function GET() {
  return new Response(sitemapHi(), { headers: { "Content-Type": "application/xml; charset=utf-8" } });
}

import { sitemapUpdates } from "@/lib/sitemaps";

export const dynamic = "force-static";

export function GET() {
  return new Response(sitemapUpdates(), { headers: { "Content-Type": "application/xml; charset=utf-8" } });
}

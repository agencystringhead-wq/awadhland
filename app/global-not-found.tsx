import type { Metadata } from "next";
import { Analytics } from "@/components/Analytics";
import { Section } from "@/components/Section";
import { PageShell } from "@/components/templates/PageShell";
import { getCities } from "@/lib/data";
import { localePath, SITE_URL } from "@/lib/i18n";
import { fontClassNameEn } from "./fonts";
import "./globals.css";

/**
 * The site's one 404 (spec: "Search box plus links to the three city hubs"). The two root layouts
 * leave no shared not-found, so this renders its own <html> (experimental.globalNotFound in
 * next.config) and exports as out/404.html, which Cloudflare Pages serves for any unmatched path in
 * either tree. The URL says nothing reliable about the reader's language, so the page carries both.
 * <Analytics /> sits in <head> as in the root layouts, so GA4 and Clarity count 404s too.
 */
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Page not found · Awadhland",
  description: "This page does not exist on awadhland.com. Start from a city hub or the circle rate lookup.",
  robots: { index: false, follow: true },
};

export default function GlobalNotFound() {
  const cities = getCities();
  return (
    <html lang="en-IN" className={fontClassNameEn}>
      <head>
        <Analytics />
      </head>
      <body>
        <PageShell locale="en" alternate={{ href: "/hi/", missing: false }} pageLabel="Page not found" sitePath="/404/">
          <section className="border-b border-line bg-cream-deep/60">
            <div className="container-site py-10 md:py-14">
              <h1 className="max-w-3xl">This page is not here</h1>
              <p className="mt-3 max-w-2xl text-lg text-ink-soft">
                The address may be mistyped, or the page may have moved. Start from a city, or look up a village&apos;s circle rate.
              </p>
              <p lang="hi" className="mt-4 max-w-2xl text-[18px] text-ink-soft">
                यह पेज यहाँ नहीं है। हो सकता है पता ग़लत लिखा गया हो या पेज कहीं और चला गया हो। किसी शहर से शुरू कीजिए, या किसी गाँव का सर्किल रेट खोजिए।
              </p>
            </div>
          </section>

          <Section>
            <div className="grid max-w-3xl gap-8 sm:grid-cols-2">
              <div>
                <h2 className="h-sub">Cities</h2>
                <ul className="mt-3 grid gap-2 text-[17px]">
                  {cities.map((c) => (
                    <li key={c.id}>
                      <a href={localePath("en", `/${c.id}/`)} className="underline">
                        {c.name}
                      </a>
                    </li>
                  ))}
                  <li>
                    <a href={localePath("en", "/tools/circle-rate-lookup/")} className="underline">
                      Circle rate lookup
                    </a>
                  </li>
                </ul>
              </div>
              <div lang="hi">
                <h2 className="h-sub">शहर</h2>
                <ul className="mt-3 grid gap-2 text-[18px]">
                  {cities.map((c) => (
                    <li key={c.id}>
                      <a href={localePath("hi", `/${c.id}/`)} hrefLang="hi-IN" className="underline">
                        {c.nameHi}
                      </a>
                    </li>
                  ))}
                  <li>
                    <a href={localePath("hi", "/tools/circle-rate-lookup/")} hrefLang="hi-IN" className="underline">
                      सर्किल रेट खोजें
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </Section>
        </PageShell>
      </body>
    </html>
  );
}

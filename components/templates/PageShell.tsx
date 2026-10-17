import type { ReactNode } from "react";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { InstagramScroller } from "@/components/InstagramScroller";
import { JsonLd } from "@/components/JsonLd";
import { LeadAnalytics } from "@/components/LeadAnalytics";
import { TopStrip } from "@/components/TopStrip";
import { getBroker, getBuildableLocalities, getCities, getInstagramFallback, getProject, getReviews } from "@/lib/data";
import { formatDate, ui, type Locale } from "@/lib/i18n";
import { organization, webPage } from "@/lib/jsonld";
import { getPage } from "@/lib/pages";
import { activeNavKey, getNav } from "@/lib/nav";
import type { Alternate } from "@/lib/routes";

export type PageShellProps = {
  locale: Locale;
  alternate: Alternate;
  /** Human name of the page, used in the prefilled WhatsApp message */
  pageLabel: string;
  /** Site path of this page without the locale prefix, for the active nav tile. Derived from `alternate` when omitted. */
  sitePath?: string;
  /** Show a "Page updated" line at the foot of the page, for templates that carry no SourceStamp of their own. */
  lastUpdated?: boolean;
  children: ReactNode;
};

/** Top strip, header, main, footer. Used by every page in both trees. */
export function PageShell({ locale, alternate, pageLabel, sitePath, lastUpdated, children }: PageShellProps) {
  const cities = getCities();
  const broker = getBroker();
  const path = sitePath ?? alternate.href.replace(/^\/hi(?=\/)/, "");
  // The path above comes from the alternate; where the other language is missing that is the other tree's
  // city hub, not this page, so a template in that position passes its own sitePath or gets no WebPage node.
  const page = alternate.missing && !sitePath ? undefined : getPage(locale, path);
  const active = activeNavKey(path, cities, (id) => getProject(id)?.cityId);
  // The city this page belongs to, for analytics: a city tree page or a project page. Empty elsewhere.
  const city = active && cities.some((c) => c.id === active) ? active : active === "circle-rates" ? path.split("/")[1] : "";
  return (
    <>
      {/* Site-wide schema (spec "SEO and schema"): Organization + RealEstateAgent on every page */}
      <JsonLd
        data={[
          organization(broker, cities, locale, getReviews()),
          ...(page ? [webPage({ url: page.url, name: page.title, description: page.description, dateModified: page.lastmod, locale })] : []),
        ]}
      />
      <TopStrip locale={locale} cities={cities} broker={broker} />
      <Header locale={locale} alternate={alternate} nav={getNav(locale)} active={active} broker={broker} pageLabel={pageLabel} />
      <main>
        {children}
        {lastUpdated && page && (
          <div className="container-site pb-10">
            <p data-component="LastUpdated" className="border-t border-line pt-4 text-sm text-muted">
              {ui[locale].pageUpdated} <time dateTime={page.lastmod}>{formatDate(page.lastmod, locale)}</time>
            </p>
          </div>
        )}
      </main>
      {/* Site-wide, directly above the footer: build-time posts now, live posts swapped in near the viewport */}
      <InstagramScroller locale={locale} initial={getInstagramFallback()} />
      <LeadAnalytics locale={locale} city={city} />
      <Footer locale={locale} cities={cities} localities={getBuildableLocalities(locale).buildable} broker={broker} />
    </>
  );
}

import type { ReactNode } from "react";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { JsonLd } from "@/components/JsonLd";
import { TopStrip } from "@/components/TopStrip";
import { getBroker, getBuildableLocalities, getCities, getReviews } from "@/lib/data";
import { organization, realEstateAgent } from "@/lib/jsonld";
import type { Locale } from "@/lib/i18n";
import type { Alternate } from "@/lib/routes";

export type PageShellProps = {
  locale: Locale;
  alternate: Alternate;
  /** Human name of the page, used in the prefilled WhatsApp message */
  pageLabel: string;
  children: ReactNode;
};

/** Top strip, header, main, footer. Used by every page in both trees. */
export function PageShell({ locale, alternate, pageLabel, children }: PageShellProps) {
  const cities = getCities();
  const broker = getBroker();
  return (
    <>
      {/* Site-wide schema (spec "SEO and schema"): Organization + RealEstateAgent on every page */}
      <JsonLd data={[organization(), realEstateAgent(broker, cities, getReviews())]} />
      <TopStrip locale={locale} cities={cities} broker={broker} />
      <Header locale={locale} alternate={alternate} cities={cities} broker={broker} pageLabel={pageLabel} />
      <main>{children}</main>
      <Footer locale={locale} cities={cities} localities={getBuildableLocalities(locale).buildable} broker={broker} />
    </>
  );
}

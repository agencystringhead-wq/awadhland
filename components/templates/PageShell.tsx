import type { ReactNode } from "react";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { TopStrip } from "@/components/TopStrip";
import { getBroker, getBuildableLocalities, getCities } from "@/lib/data";
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
      <TopStrip locale={locale} cities={cities} broker={broker} />
      <Header locale={locale} alternate={alternate} cities={cities} broker={broker} pageLabel={pageLabel} />
      <main>{children}</main>
      <Footer locale={locale} cities={cities} localities={getBuildableLocalities(locale).buildable} broker={broker} />
    </>
  );
}

/** Scaffold-only: prints the loaded record so each route can be checked before its template exists (steps 3+). */
export function DataDump({ data }: { data: unknown }) {
  return (
    <pre data-component="DataDump" className="card mt-6 overflow-x-auto p-4 text-xs leading-relaxed text-ink-soft">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}

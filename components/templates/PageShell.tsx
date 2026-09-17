import type { ReactNode } from "react";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { getBroker, getBuildableLocalities, getCities } from "@/lib/data";
import type { Locale } from "@/lib/i18n";
import type { Alternate } from "@/lib/routes";

export type PageShellProps = {
  locale: Locale;
  alternate: Alternate;
  children: ReactNode;
};

/** Header, main, footer. Used by every page in both trees. */
export function PageShell({ locale, alternate, children }: PageShellProps) {
  const cities = getCities();
  return (
    <>
      <Header locale={locale} alternate={alternate} cities={cities} broker={getBroker()} />
      <main>{children}</main>
      <Footer locale={locale} cities={cities} localities={getBuildableLocalities(locale).buildable} />
    </>
  );
}

/** Scaffold-only: prints the loaded record so each route can be checked before its template exists. */
export function DataDump({ data }: { data: unknown }) {
  return <pre data-component="DataDump">{JSON.stringify(data, null, 2)}</pre>;
}

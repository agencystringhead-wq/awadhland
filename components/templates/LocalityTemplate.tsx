import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/Breadcrumb";
import { SourceStamp } from "@/components/SourceStamp";
import { getCity, getLocality } from "@/lib/data";
import { missingMinimumFields } from "@/lib/guards";
import { localePath, pick, ui, type Locale } from "@/lib/i18n";
import { localityAlternate } from "@/lib/routes";
import { DataDump, PageShell } from "./PageShell";

/** Template 3. Scaffold: title and the locality record as JSON. */
export function LocalityTemplate({ locale, cityId, localityId }: { locale: Locale; cityId: string; localityId: string }) {
  const city = getCity(cityId);
  const locality = getLocality(cityId, localityId);
  // Guarded in generateStaticParams too; this keeps a thin record from rendering if params ever drift.
  if (!city || !locality || missingMinimumFields(locality, locale).length > 0) notFound();
  const name = pick(locale, locality.name, locality.nameHi);
  const cityName = pick(locale, city.name, city.nameHi);
  return (
    <PageShell locale={locale} alternate={localityAlternate(locale, city.id, locality.id)}>
      <Breadcrumb
        items={[
          { label: ui[locale].home, href: localePath(locale, "/") },
          { label: cityName, href: localePath(locale, `/${city.id}/`) },
          { label: name },
        ]}
      />
      <h1>{name}</h1>
      <DataDump data={locality} />
      <SourceStamp
        locale={locale}
        sources={locality.sources}
        updatedAt={locality.updatedAt}
        effectiveFrom={locality.circleRate?.effectiveFrom}
      />
    </PageShell>
  );
}

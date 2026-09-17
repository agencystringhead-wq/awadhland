import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/Breadcrumb";
import { CircleRateTable } from "@/components/CircleRateTable";
import { SourceStamp } from "@/components/SourceStamp";
import { getCircleRateSchedulesByCity, getCity, getLocalitiesByCity, getStampDutyRules } from "@/lib/data";
import { localePath, pick, ui, type Locale } from "@/lib/i18n";
import { builtLocalityIds, sameAlternate } from "@/lib/routes";
import { DataDump, PageShell } from "./PageShell";

/** Template 5. Scaffold: title, a plain rate table and the schedules as JSON. */
export function CircleRatesTemplate({ locale, cityId }: { locale: Locale; cityId: string }) {
  const city = getCity(cityId);
  const schedules = getCircleRateSchedulesByCity(cityId);
  if (!city || schedules.length === 0) notFound();
  const [current, ...revisions] = schedules;
  const cityName = pick(locale, city.name, city.nameHi);
  const localityNames = Object.fromEntries(getLocalitiesByCity(city.id).map((l) => [l.id, pick(locale, l.name, l.nameHi)]));
  return (
    <PageShell locale={locale} alternate={sameAlternate(locale, `/${city.id}/circle-rates/`)}>
      <Breadcrumb
        items={[
          { label: ui[locale].home, href: localePath(locale, "/") },
          { label: cityName, href: localePath(locale, `/${city.id}/`) },
          { label: ui[locale].circleRates },
        ]}
      />
      <h1>
        {cityName} {ui[locale].circleRates}
      </h1>
      <CircleRateTable
        locale={locale}
        cityId={city.id}
        rows={current.rates}
        localityNames={localityNames}
        linkableLocalityIds={[...builtLocalityIds(locale)]}
      />
      <DataDump data={{ current, revisions: revisions.map((r) => r.id), stampDutyRules: getStampDutyRules() }} />
      <SourceStamp locale={locale} sources={current.sources} updatedAt={current.updatedAt} effectiveFrom={current.effectiveFrom} />
    </PageShell>
  );
}

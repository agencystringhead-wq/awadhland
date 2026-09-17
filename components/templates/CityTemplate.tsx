import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/Breadcrumb";
import { SourceStamp } from "@/components/SourceStamp";
import { getBuildableLocalities, getCity, getCurrentCircleRateSchedule, getProjectsByCity } from "@/lib/data";
import { localePath, pick, ui, type Locale } from "@/lib/i18n";
import { sameAlternate } from "@/lib/routes";
import { DataDump, PageShell } from "./PageShell";

/** Template 2. Scaffold: title and seed data as JSON. */
export function CityTemplate({ locale, cityId }: { locale: Locale; cityId: string }) {
  const city = getCity(cityId);
  if (!city) notFound();
  const name = pick(locale, city.name, city.nameHi);
  return (
    <PageShell locale={locale} alternate={sameAlternate(locale, `/${city.id}/`)}>
      <Breadcrumb items={[{ label: ui[locale].home, href: localePath(locale, "/") }, { label: name }]} />
      <h1>{name}</h1>
      <DataDump
        data={{
          city,
          localities: getBuildableLocalities(locale)
            .buildable.filter((l) => l.cityId === city.id)
            .map((l) => l.id),
          projects: getProjectsByCity(city.id).map((p) => p.id),
          currentCircleRateSchedule: getCurrentCircleRateSchedule(city.id)?.id ?? null,
        }}
      />
      <SourceStamp locale={locale} sources={city.sources} updatedAt={city.updatedAt} />
    </PageShell>
  );
}

import { getCity, getLocalities } from "@/lib/data";
import { distanceKm } from "@/lib/geo";
import { pick, ui, type Locale } from "@/lib/i18n";

export type DistanceProps = {
  /** locality id from localities.json */
  from: string;
  /** anchor id from the locality's city in cities.json, e.g. "airport" */
  to: string;
  locale: Locale;
};

/**
 * Guide MDX component: inline distance from a locality to a city anchor, computed at build from
 * lat/lng, plus the drive time when the record has one. Reads like "6.2 km (about 18 min by road)".
 */
export function Distance({ from, to, locale }: DistanceProps) {
  const t = ui[locale];
  const l = getLocalities().find((x) => x.id === from);
  if (!l || l.lat === undefined || l.lng === undefined) throw new Error(`<Distance from="${from}">: unknown locality or no lat/lng`);
  const anchor = getCity(l.cityId)?.anchors.find((a) => a.id === to);
  if (!anchor) throw new Error(`<Distance to="${to}">: not an anchor of ${l.cityId}`);
  const km = distanceKm({ lat: l.lat, lng: l.lng }, anchor);
  const driveMin = l.driveTimes?.[to];
  const title = `${t.straightLine}: ${pick(locale, l.name, l.nameHi)} → ${pick(locale, anchor.name, anchor.nameHi)}`;
  return (
    <span data-component="Distance" title={title} className="whitespace-nowrap tabular-nums">
      {km} {t.km}
      {driveMin !== undefined && (
        <>
          {" "}
          ({t.approx} {driveMin} {t.minutes} {t.byRoad})
        </>
      )}
    </span>
  );
}

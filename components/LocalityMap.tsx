import type { Locale } from "@/lib/i18n";
import type { Locality, Project } from "@/lib/schemas";

export type LocalityMapProps = {
  locale: Locale;
  localities: Pick<Locality, "id" | "name" | "nameHi" | "lat" | "lng" | "priceBand">[];
  /** Optional GeoJSON overlay, e.g. a project footprint */
  overlay?: Project["geometry"];
};

/** Stub. Leaflet + OSM loads only on map pages from step 2; this renders the marker list as text. */
export function LocalityMap({ locale, localities, overlay }: LocalityMapProps) {
  return (
    <section data-component="LocalityMap">
      <ul>
        {localities.map((l) => (
          <li key={l.id}>
            {locale === "hi" && l.nameHi ? l.nameHi : l.name}: {l.lat}, {l.lng} ({l.priceBand})
          </li>
        ))}
      </ul>
      {overlay && <p>Overlay: {overlay.type}</p>}
    </section>
  );
}

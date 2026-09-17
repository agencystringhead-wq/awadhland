"use client";

/**
 * Leaflet + OpenStreetMap tiles, no Google Maps key (spec Template 2, section 2). This is the only
 * client component that pulls a third-party library, and it is imported only by map pages, so
 * Leaflet ships on those pages alone (CLAUDE.md third-party script rule).
 *
 * Progressive enhancement: the marker list renders as plain links first, then Leaflet replaces it.
 */
import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import type { Locale } from "@/lib/i18n";
import { formatNumber, localePath, pick, ui } from "@/lib/i18n";
import type { Locality, PriceBand, Project } from "@/lib/schemas";
import { priceBandHex, priceBandLabels } from "./PriceBandChip";

export type MapLocality = Pick<Locality, "id" | "cityId" | "name" | "nameHi" | "priceBand" | "circleRate"> & { lat: number; lng: number };

export type LocalityMapProps = {
  locale: Locale;
  localities: MapLocality[];
  /** Optional GeoJSON overlay, e.g. a project footprint */
  overlay?: Project["geometry"] | null;
  /** px, default 420 */
  height?: number;
};

const OSM_TILES = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const OSM_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

export function LocalityMap({ locale, localities, overlay = null, height = 420 }: LocalityMapProps) {
  const ref = useRef<HTMLDivElement>(null);
  const t = ui[locale];

  useEffect(() => {
    const el = ref.current;
    if (!el || localities.length === 0) return;
    let cancelled = false;
    let map: import("leaflet").Map | undefined;

    import("leaflet").then((L) => {
      if (cancelled || !el) return;
      el.replaceChildren();
      map = L.map(el, { scrollWheelZoom: false });
      L.tileLayer(OSM_TILES, { attribution: OSM_ATTRIBUTION, maxZoom: 18 }).addTo(map);

      const group = L.featureGroup();
      for (const l of localities) {
        const band: PriceBand = l.priceBand ?? "mid";
        const name = pick(locale, l.name, l.nameHi);
        const rate = l.circleRate ? `${t.residential}: ₹${formatNumber(l.circleRate.residential)}/${t.unitSqM}` : "";
        L.circleMarker([l.lat, l.lng], {
          radius: 9,
          color: "#fffdf9",
          weight: 2,
          fillColor: priceBandHex[band],
          fillOpacity: 0.95,
        })
          .bindPopup(
            `<strong>${escapeHtml(name)}</strong><br>${escapeHtml(priceBandLabels[band][locale])}${rate ? `<br>${escapeHtml(rate)}` : ""}` +
              `<br><a href="${localePath(locale, `/${l.cityId}/${l.id}/`)}">${escapeHtml(t.viewLocality)} →</a>`,
          )
          .addTo(group);
      }
      group.addTo(map);

      if (overlay) {
        L.geoJSON(overlay as GeoJSON.GeoJsonObject, { style: { color: "#1f4d3a", weight: 2, fillOpacity: 0.12 } }).addTo(map).addTo(group);
      }
      map.fitBounds(group.getBounds().pad(0.25), { maxZoom: 14 });
    });

    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [locale, localities, overlay, t]);

  return (
    <div data-component="LocalityMap" className="card overflow-hidden">
      <div ref={ref} style={{ height }} className="bg-cream-deep">
        <ul className="grid gap-2 p-4 sm:grid-cols-2 md:grid-cols-3">
          {localities.map((l) => (
            <li key={l.id}>
              <a href={localePath(locale, `/${l.cityId}/${l.id}/`)}>{pick(locale, l.name, l.nameHi)}</a>
              {l.priceBand && <span className="text-sm text-muted"> · {priceBandLabels[l.priceBand][locale]}</span>}
            </li>
          ))}
        </ul>
      </div>
      <p className="flex flex-wrap gap-x-4 gap-y-1 border-t border-line px-4 py-2 text-xs text-muted">
        {(Object.keys(priceBandHex) as PriceBand[]).map((b) => (
          <span key={b} className="flex items-center gap-1.5">
            <span aria-hidden="true" className="inline-block size-2.5 rounded-full" style={{ background: priceBandHex[b] }} />
            {priceBandLabels[b][locale]}
          </span>
        ))}
      </p>
    </div>
  );
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

import type { Project } from "./schemas";

/** Centre of a project footprint, for "projects within N km". Null when the project has no geometry. */
export function geometryCentroid(geometry: Project["geometry"]): { lat: number; lng: number } | null {
  if (!geometry) return null;
  let points: [number, number][];
  switch (geometry.type) {
    case "Point":
      points = [geometry.coordinates];
      break;
    case "LineString":
      points = geometry.coordinates;
      break;
    case "Polygon":
      points = geometry.coordinates[0].slice(0, -1);
      break;
    case "MultiPolygon":
      points = geometry.coordinates.flatMap((poly) => poly[0].slice(0, -1));
      break;
  }
  if (points.length === 0) return null;
  const sum = points.reduce((acc, [lng, lat]) => ({ lat: acc.lat + lat, lng: acc.lng + lng }), { lat: 0, lng: 0 });
  return { lat: sum.lat / points.length, lng: sum.lng / points.length };
}

/** Great-circle distance in km, rounded to one decimal. Used at build for nearby lists and map bounds. */
export function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(h)) * 10) / 10;
}

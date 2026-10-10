// Distances à vol d'oiseau. Tout se calcule dans le navigateur : la position de
// la personne n'est jamais envoyée à l'API.

const RAYON_TERRE_M = 6371000;
const enRadians = (degres) => (degres * Math.PI) / 180;

const lat = (p) => Number(p.lat ?? p.latitude);
const lon = (p) => Number(p.lon ?? p.longitude);

/** Distance en mètres entre deux points { lat, lon } ou { latitude, longitude } (haversine). */
export function distanceMetres(a, b) {
  const dLat = enRadians(lat(b) - lat(a));
  const dLon = enRadians(lon(b) - lon(a));
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(enRadians(lat(a))) * Math.cos(enRadians(lat(b))) * Math.sin(dLon / 2) ** 2;

  return 2 * RAYON_TERRE_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** « 80 m », « 350 m », « 1,2 km », « 14 km » — à la française. */
export function formaterDistance(metres) {
  if (metres < 1000) return `${Math.max(10, Math.round(metres / 10) * 10)} m`;
  const km = metres / 1000;
  return `${km < 10 ? km.toFixed(1).replace(".", ",") : Math.round(km)} km`;
}

/** Les `n` adresses les plus proches, chacune augmentée de `distance` (en mètres). */
export function plusProches(position, adresses, n = 5) {
  return adresses
    .map((cafe) => ({ ...cafe, distance: distanceMetres(position, cafe) }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, n);
}

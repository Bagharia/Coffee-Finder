import { useEffect } from "react";
import { Marker, useMap } from "react-leaflet";
import L from "leaflet";

const ZOOM_RUE = 16;

// La pastille de position se distingue des plaques d'adresses : un disque, sans
// nom, là où une adresse est toujours une plaque nominative.
const icone = L.divIcon({
  className: "",
  html: '<span class="position-utilisateur"></span>',
  iconSize: [22, 22],
  iconAnchor: [11, 11]
});

/**
 * Pastille de la personne et déplacements de la carte commandés depuis l'extérieur.
 *
 * `centrer` : faux quand la personne est loin de toute adresse du guide (hors
 * de Paris) — la carte resterait sur du vide.
 * `cible` : une adresse choisie dans la liste des plus proches, hors de la carte.
 */
export default function MapPosition({ position, centrer, cible }) {
  const map = useMap();

  useEffect(() => {
    if (position && centrer) map.flyTo([position.lat, position.lon], ZOOM_RUE);
  }, [position, centrer, map]);

  useEffect(() => {
    if (cible) map.flyTo([cible.lat, cible.lon], ZOOM_RUE);
  }, [cible, map]);

  if (!position) return null;

  return (
    <Marker
      position={[position.lat, position.lon]}
      icon={icone}
      interactive={false}
      keyboard={false}
    />
  );
}

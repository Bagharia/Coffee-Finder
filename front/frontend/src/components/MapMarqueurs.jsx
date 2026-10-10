import { useEffect, useMemo, useState } from "react";
import { Marker, useMap } from "react-leaflet";
import L from "leaflet";
import { regrouperMarqueurs } from "../utils/regrouperMarqueurs";

// Échappe le nom avant de l'injecter dans le HTML du marqueur : il vient de la
// base, et Leaflet ne fait pas de rendu React ici.
const echapper = (texte) =>
  String(texte).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );

/** Un marqueur est une plaque portant le nom, jamais une épingle générique. */
function iconePlaque(libelle, active) {
  return L.divIcon({
    className: "",
    html: `<span class="plaque plaque-carte${active ? " plaque-active" : ""}">${echapper(libelle)}</span>`,
    // Ancrée par son bord bas-gauche, comme une plaque posée sur la façade.
    iconAnchor: [0, 0]
  });
}

export default function Marqueurs({ adresses, selectionId, onSelectionner }) {
  const map = useMap();

  // Le regroupement dépend du cadre visible, que Leaflet ne notifie que par
  // événement. On incrémente un compteur à chaque déplacement et le calcul se
  // refait au rendu : l'effet ne fait qu'écouter, il ne pose aucun état.
  const [deplacements, setDeplacements] = useState(0);

  useEffect(() => {
    const signaler = () => setDeplacements((n) => n + 1);
    map.on("moveend", signaler);
    map.on("zoomend", signaler);
    return () => {
      map.off("moveend", signaler);
      map.off("zoomend", signaler);
    };
  }, [map]);

  const groupes = useMemo(
    () => regrouperMarqueurs(map, adresses),
    // `deplacements` n'entre pas dans le calcul, il en déclenche la reprise.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [map, adresses, deplacements]
  );

  return groupes.map(({ cle, position, adresses: contenu }) => {
    const groupe = contenu.length > 1;
    const libelle = groupe ? `${contenu.length} adresses` : contenu[0].nom;
    const active = !groupe && contenu[0].id === selectionId;

    return (
      <Marker
        key={cle}
        position={position}
        icon={iconePlaque(libelle, active)}
        eventHandlers={{
          click: () => {
            if (groupe) {
              map.flyTo(position, Math.min(map.getZoom() + 2, 18));
              return;
            }
            onSelectionner(contenu[0]);
          }
        }}
      />
    );
  });
}

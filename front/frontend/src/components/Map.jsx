import { useEffect, useMemo, useState } from "react";
import { MapContainer, Marker, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { cafesAPI, LIMITE_MAX } from "../services/api";
import { coordonnees, estPlacable, regrouperMarqueurs } from "../utils/regrouperMarqueurs";
import MapFiltres from "./MapFiltres";
import MapFeuille from "./MapFeuille";

const CENTRE_PARIS = [48.8566, 2.3522];

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

function Marqueurs({ adresses, selectionId, onSelectionner }) {
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

/** Recadre sur les adresses affichées, sans jamais suivre l'utilisateur. */
function Recadrage({ adresses }) {
  const map = useMap();

  useEffect(() => {
    if (adresses.length === 0) {
      map.setView(CENTRE_PARIS, 12);
      return;
    }
    map.fitBounds(L.latLngBounds(adresses.map(coordonnees)), { padding: [48, 48] });
  }, [adresses, map]);

  return null;
}

export default function Map() {
  const [adresses, setAdresses] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [filtres, setFiltres] = useState({ specialite: "", wifi: false, arrondissement: "" });
  const [selection, setSelection] = useState(null);
  const [feuilleOuverte, setFeuilleOuverte] = useState(false);

  useEffect(() => {
    cafesAPI.getAll({ limite: LIMITE_MAX })
      .then((reponse) => setAdresses(reponse.donnees))
      .catch((err) => setErreur(err.message))
      .finally(() => setChargement(false));
  }, []);

  const retenues = useMemo(() => adresses.filter((cafe) => {
    if (filtres.specialite) {
      const specialites = cafe.specialite?.split(",").map((s) => s.trim()) ?? [];
      if (!specialites.includes(filtres.specialite)) return false;
    }
    if (filtres.wifi && cafe.wifi !== 1) return false;
    if (filtres.arrondissement && cafe.arrondissement !== filtres.arrondissement) return false;
    return true;
  }), [adresses, filtres]);

  const placables = useMemo(() => retenues.filter(estPlacable), [retenues]);

  const selectionner = (cafe) => {
    setSelection(cafe);
    setFeuilleOuverte(true);
  };

  if (chargement) {
    return <div className="squelette h-full w-full" />;
  }

  if (erreur) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-papier p-8">
        <p className="mesure text-corps text-encre">
          {erreur} la carte revient en rafraîchissant la page.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col">
      <MapFiltres filtres={filtres} onChange={setFiltres} total={retenues.length} />

      <div className="relative min-h-0 flex-1 overflow-hidden">
        {placables.length === 0 ? (
          <div className="flex h-full items-center justify-center bg-papier p-8">
            <p className="mesure text-corps text-encre">
              aucune adresse à placer avec ces filtres. élargir la recherche, ou proposer la vôtre.
            </p>
          </div>
        ) : (
          <MapContainer center={CENTRE_PARIS} zoom={12} scrollWheelZoom style={{ height: "100%", width: "100%" }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Recadrage adresses={placables} />
            <Marqueurs
              adresses={placables}
              selectionId={selection?.id}
              onSelectionner={selectionner}
            />
          </MapContainer>
        )}

        <MapFeuille
          cafe={selection}
          ouverte={feuilleOuverte}
          onBasculer={() => setFeuilleOuverte((ouverte) => !ouverte)}
          onFermer={() => { setFeuilleOuverte(false); setSelection(null); }}
        />
      </div>
    </div>
  );
}

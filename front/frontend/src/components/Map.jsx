import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { cafesAPI } from "../services/api";
import { coordonnees, estPlacable } from "../utils/regrouperMarqueurs";
import Marqueurs from "./MapMarqueurs";
import MapFiltres from "./MapFiltres";
import MapFeuille from "./MapFeuille";
import MapPosition from "./MapPosition";
import MapProches from "./MapProches";
import { useGeolocalisation } from "../hooks/useGeolocalisation";
import { distanceMetres, formaterDistance, plusProches } from "../utils/distance";
import { TUILES } from "../utils/tuiles";

const CENTRE_PARIS = [48.8566, 2.3522];

// Au-delà, la personne n'est pas à Paris : recentrer sur elle montrerait du vide.
const DISTANCE_MAX_M = 20000;
const NB_PROCHES = 5;

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
  const [totalCarte, setTotalCarte] = useState(0);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [filtres, setFiltres] = useState({ specialite: "", wifi: false, arrondissement: "" });
  const [selection, setSelection] = useState(null);
  const [feuilleOuverte, setFeuilleOuverte] = useState(false);
  const [cible, setCible] = useState(null);
  const geo = useGeolocalisation();

  useEffect(() => {
    // La carte a besoin de tous les points pour regrouper ses marqueurs : elle
    // passe par un endpoint allégé, pas par la liste paginée du guide.
    cafesAPI.getCarte()
      .then((reponse) => { setAdresses(reponse.donnees); setTotalCarte(reponse.total); })
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

  // Calculées sur les adresses retenues : filtrer « matcha » puis demander
  // « près de moi » donne les matcha les plus proches, pas les cafés.
  const proches = useMemo(
    () => (geo.position ? plusProches(geo.position, placables, NB_PROCHES) : []),
    [geo.position, placables]
  );
  const loin = proches.length > 0 && proches[0].distance > DISTANCE_MAX_M;

  const choisirProche = (cafe) => {
    selectionner(cafe);
    // Un nouvel objet à chaque choix : l'effet de la carte se rejoue même si la
    // même adresse est choisie deux fois de suite.
    setCible({ lat: Number(cafe.latitude), lon: Number(cafe.longitude) });
  };

  const distanceSelection = geo.position && selection && estPlacable(selection)
    ? formaterDistance(distanceMetres(geo.position, selection))
    : null;

  const selectionner = (cafe) => {
    // La feuille s'ouvre tout de suite sur le nom ; le détail (verdict,
    // critères) n'est pas dans les points de la carte et arrive à la suite.
    setSelection(cafe);
    setFeuilleOuverte(true);
    cafesAPI.getById(cafe.id)
      .then((complet) => setSelection((courante) => (courante?.id === complet.id ? complet : courante)))
      .catch(() => {});
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
      <MapFiltres
        filtres={filtres}
        onChange={setFiltres}
        total={retenues.length}
        onLocaliser={geo.localiser}
        localisation={geo.statut}
      />

      <MapProches statut={geo.statut} message={geo.message} proches={proches} loin={loin} onChoisir={choisirProche} />

      {totalCarte > adresses.length && (
        <p className="shrink-0 border-b border-trait bg-carte px-3 py-2 text-meta text-rouge">
          la carte affiche {adresses.length} adresses sur {totalCarte}. les autres sont dans le guide.
        </p>
      )}

      <div className="relative min-h-0 flex-1 overflow-hidden">
        {placables.length === 0 ? (
          <div className="flex h-full items-center justify-center bg-papier p-8">
            <p className="mesure text-corps text-encre">
              aucune adresse à placer avec ces filtres. élargir la recherche, ou proposer la vôtre.
            </p>
          </div>
        ) : (
          <MapContainer center={CENTRE_PARIS} zoom={12} scrollWheelZoom style={{ height: "100%", width: "100%" }}>
            <TileLayer url={TUILES.url} attribution={TUILES.attribution} maxZoom={TUILES.maxZoom} />
            <Recadrage adresses={placables} />
            <MapPosition position={geo.position} centrer={!loin} cible={cible} />
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
          distance={distanceSelection}
        />
      </div>
    </div>
  );
}

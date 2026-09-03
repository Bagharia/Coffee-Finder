import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import CafeCard from "../components/CafeCard";
import Filters from "../components/Filters";
import { cafesAPI, LIMITE_MAX } from "../services/api";

const NOUVEAUTE_MS = 30 * 24 * 60 * 60 * 1000;

const FILTRES_VIDES = {
  arrondissement: "", prix: "", ambiance: "", wifi: "", prises: "", travailler: "", nouveautes: ""
};

export default function CafePage() {
  const navigate = useNavigate();
  const [cafes, setCafes] = useState([]);
  const [filtres, setFiltres] = useState(FILTRES_VIDES);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [tirageEnCours, setTirageEnCours] = useState(false);

  useEffect(() => {
    cafesAPI.getAll({ limite: LIMITE_MAX })
      .then((reponse) => setCafes(reponse.donnees))
      .catch((err) => setErreur(err.message))
      .finally(() => setChargement(false));
  }, []);

  // Le filtrage est local : les adresses sont déjà là, un aller-retour réseau
  // à chaque case cochée n'apporterait rien.
  const retenues = useMemo(() => cafes.filter((cafe) => {
    if (filtres.arrondissement && cafe.arrondissement !== filtres.arrondissement) return false;
    if (filtres.prix && cafe.prix !== filtres.prix) return false;
    if (filtres.ambiance && !cafe.ambiance?.toLowerCase().includes(filtres.ambiance.toLowerCase())) return false;
    if (filtres.wifi && cafe.wifi !== 1) return false;
    if (filtres.prises && cafe.prises !== 1) return false;
    if (filtres.travailler && cafe.travailler !== 1) return false;
    if (filtres.nouveautes) {
      if (!cafe.created_at) return false;
      if (Date.now() - new Date(cafe.created_at).getTime() >= NOUVEAUTE_MS) return false;
    }
    return true;
  }), [cafes, filtres]);

  const tirerAuSort = async () => {
    setTirageEnCours(true);
    try {
      const cafe = await cafesAPI.getRandom();
      navigate(`/cafe/${cafe.id}`);
    } catch (err) {
      setErreur(err.message);
    } finally {
      setTirageEnCours(false);
    }
  };

  return (
    <div className="bg-papier">
      <div className="border-b border-trait px-6 py-12">
        <div className="mx-auto flex max-w-6xl flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-section text-encre">le guide</h1>
            <p className="mt-1 text-meta text-gris">
              {chargement
                ? "on regarde…"
                : `${retenues.length} adresse${retenues.length > 1 ? "s" : ""}`}
            </p>
          </div>
          <button
            type="button"
            onClick={tirerAuSort}
            disabled={tirageEnCours}
            className="flex items-center border border-trait px-6 text-encre disabled:opacity-60"
          >
            {tirageEnCours ? "on cherche…" : "au hasard"}
          </button>
        </div>
      </div>

      <div className="mx-auto grid max-w-6xl gap-8 px-6 py-12 lg:grid-cols-[16rem_1fr]">
        <aside>
          <Filters onFilterChange={setFiltres} />
        </aside>

        <div>
          {chargement ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }, (_, i) => <div key={i} className="squelette h-72" />)}
            </div>
          ) : erreur ? (
            <p className="mesure text-corps text-encre">
              {erreur} le guide revient en rafraîchissant la page.
            </p>
          ) : retenues.length === 0 ? (
            <div className="mesure">
              <p className="text-corps text-encre">
                aucune adresse ne correspond à ces filtres. en retirer un, ou proposer la vôtre.
              </p>
              <button
                type="button"
                onClick={() => setFiltres(FILTRES_VIDES)}
                className="mt-6 flex items-center bg-plaque px-6 text-white"
              >
                effacer les filtres
              </button>
            </div>
          ) : (
            <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {retenues.map((cafe, index) => (
                <li key={cafe.id}>
                  <CafeCard cafe={cafe} prioritaire={index < 3} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

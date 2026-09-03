import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import CafeCard from "../components/CafeCard";
import Filters from "../components/Filters";
import { cafesAPI } from "../services/api";
import { useListePaginee } from "../hooks/useListePaginee";

const FILTRES_VIDES = {
  arrondissement: "", prix: "", ambiance: "", wifi: "", prises: "", travailler: "", nouveautes: ""
};

// Une page de guide se parcourt, elle ne se consulte pas par numéro : on
// ajoute à la suite plutôt que de remplacer, et la position de lecture ne
// bouge pas.
const PAR_PAGE = 12;

export default function CafePage() {
  const navigate = useNavigate();
  const [filtres, setFiltres] = useState(FILTRES_VIDES);
  const [tirageEnCours, setTirageEnCours] = useState(false);
  const [erreurTirage, setErreurTirage] = useState(null);

  // Les filtres vides ne partent pas dans l'URL : `?prix=` demanderait à l'API
  // de filtrer sur une chaîne vide au lieu de ne pas filtrer.
  const filtresActifs = useMemo(
    () => Object.fromEntries(Object.entries(filtres).filter(([, valeur]) => valeur !== "")),
    [filtres]
  );

  const recuperer = useCallback(
    ({ page }) => cafesAPI.search(filtresActifs, { page, limite: PAR_PAGE }),
    [filtresActifs]
  );

  const {
    adresses, total, chargement, chargementSuite, erreur, encore, chargerPlus
  } = useListePaginee(recuperer, filtresActifs);

  const tirerAuSort = async () => {
    setTirageEnCours(true);
    setErreurTirage(null);
    try {
      const cafe = await cafesAPI.getRandom();
      navigate(`/cafe/${cafe.id}`);
    } catch (err) {
      setErreurTirage(err.message);
    } finally {
      setTirageEnCours(false);
    }
  };

  const compte = chargement
    ? "on regarde…"
    : `${total} adresse${total > 1 ? "s" : ""}`;

  return (
    <div className="bg-papier">
      <div className="border-b border-trait px-6 py-12">
        <div className="mx-auto flex max-w-6xl flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-section text-encre">le guide</h1>
            <p className="mt-1 text-meta text-gris" aria-live="polite">{compte}</p>
          </div>
          <button
            type="button"
            onClick={tirerAuSort}
            disabled={tirageEnCours}
            className="flex min-h-11 items-center border border-trait-fort px-6 text-encre disabled:opacity-60"
          >
            {tirageEnCours ? "on cherche…" : "au hasard"}
          </button>
        </div>
        {erreurTirage && <p className="mx-auto mt-3 max-w-6xl text-meta text-rouge">{erreurTirage}</p>}
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
          ) : adresses.length === 0 ? (
            <div className="mesure">
              <p className="text-corps text-encre">
                aucune adresse ne correspond à ces filtres. en retirer un, ou proposer la vôtre.
              </p>
              <button
                type="button"
                onClick={() => setFiltres(FILTRES_VIDES)}
                className="mt-6 flex min-h-11 items-center bg-plaque px-6 text-white"
              >
                effacer les filtres
              </button>
            </div>
          ) : (
            <>
              <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {adresses.map((cafe, index) => (
                  <li key={cafe.id}>
                    <CafeCard cafe={cafe} prioritaire={index < 3} />
                  </li>
                ))}
              </ul>

              {encore && (
                <div className="mt-10 flex flex-col items-center gap-2">
                  <button
                    type="button"
                    onClick={chargerPlus}
                    disabled={chargementSuite}
                    className="flex min-h-11 items-center border border-trait-fort px-6 text-encre disabled:opacity-60"
                  >
                    {chargementSuite ? "on charge…" : "voir la suite"}
                  </button>
                  <p className="text-meta text-gris" aria-live="polite">
                    {adresses.length} sur {total}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

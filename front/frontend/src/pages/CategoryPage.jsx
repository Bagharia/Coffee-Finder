import { useCallback, useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import CafeCard from "../components/CafeCard";
import { cafesAPI } from "../services/api";
import { useListePaginee } from "../hooks/useListePaginee";

// L'URL peut arriver sous plusieurs formes selon d'où l'on vient.
// La spécialité stockée en base, elle, est unique.
const SPECIALITES = {
  cafe: "Café",
  "Café": "Café",
  matcha: "Matcha",
  "Matcha": "Matcha",
  "bubble-tea": "Bubble Tea",
  "Bubble Tea": "Bubble Tea",
  bbt: "Bubble Tea",
  the: "Thé",
  tea: "Thé",
  "Thé": "Thé"
};

const PAR_PAGE = 12;

export default function CategoryPage() {
  const { category } = useParams();
  const specialite = SPECIALITES[category] ?? category;

  // La spécialité fait office de filtre : changer de catégorie relance le
  // chargement à la page 1, et le hook ignore les réponses devenues obsolètes.
  const filtres = useMemo(() => ({ specialite }), [specialite]);

  const recuperer = useCallback(
    ({ page }) => cafesAPI.getBySpecialite(specialite, { page, limite: PAR_PAGE }),
    [specialite]
  );

  const {
    adresses: cafes, total, chargement, chargementSuite, erreur, encore, chargerPlus
  } = useListePaginee(recuperer, filtres);

  return (
    <div className="bg-papier">
      <div className="border-b border-trait px-6 py-12">
        <div className="mx-auto max-w-5xl">
          <h1 className="text-section text-encre">{specialite.toLowerCase()}</h1>
          <p className="mt-1 text-meta text-gris" aria-live="polite">
            {chargement
              ? "on regarde…"
              : `${total} adresse${total > 1 ? "s" : ""} à paris`}
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-6 py-12">
        {chargement ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }, (_, i) => <div key={i} className="squelette h-72" />)}
          </div>
        ) : erreur ? (
          <p className="mesure text-corps text-encre">
            {erreur} la liste revient en rafraîchissant la page.
          </p>
        ) : cafes.length === 0 ? (
          <div className="mesure">
            <p className="text-corps text-encre">
              aucune adresse en {specialite.toLowerCase()} dans le guide pour l&apos;instant.
            </p>
            <Link to="/cafes" className="mt-6 inline-flex min-h-11 items-center bg-plaque px-6 text-white">
              parcourir tout le guide
            </Link>
          </div>
        ) : (
          <>
            <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {cafes.map((cafe, index) => (
                <li key={cafe.id}>
                  <CafeCard cafe={cafe} prioritaire={index < 4} />
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
                  {cafes.length} sur {total}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

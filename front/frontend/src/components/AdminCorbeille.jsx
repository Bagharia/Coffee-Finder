import { useCallback, useState } from "react";
import { cafesAPI } from "../services/api";
import { useListePaginee } from "../hooks/useListePaginee";

const PAR_PAGE = 20;
const AUCUN_FILTRE = {};

/** La liste elle-même. Montée seulement à l'ouverture : c'est elle qui interroge l'API. */
function ListeCorbeille({ surChangement }) {
  const recuperer = useCallback(
    ({ page }) => cafesAPI.getCorbeille({ page, limite: PAR_PAGE }),
    []
  );

  const {
    adresses, total, chargement, chargementSuite, erreur, encore, chargerPlus, recharger
  } = useListePaginee(recuperer, AUCUN_FILTRE);

  const [enCours, setEnCours] = useState(null);
  const [erreurAction, setErreurAction] = useState(null);

  const retablir = async (cafe) => {
    setEnCours(cafe.id);
    setErreurAction(null);
    try {
      await cafesAPI.restaurer(cafe.id);
      recharger();
      surChangement?.();
    } catch (err) {
      setErreurAction(err.message);
    } finally {
      setEnCours(null);
    }
  };

  const detruire = async (cafe) => {
    // Deuxième confirmation volontaire : c'est la seule action de cette
    // interface qu'on ne peut pas défaire.
    if (!window.confirm(
      `détruire « ${cafe.nom} » définitivement ? les avis et les favoris de cette adresse partent avec, et rien ne pourra être rétabli.`
    )) return;

    setEnCours(cafe.id);
    setErreurAction(null);
    try {
      await cafesAPI.supprimerDefinitivement(cafe.id);
      recharger();
    } catch (err) {
      setErreurAction(err.message);
    } finally {
      setEnCours(null);
    }
  };

  const message = erreur ?? erreurAction;

  return (
    <div className="mt-4">
      {chargement && <p className="text-meta text-gris">chargement…</p>}
      {message && <p className="text-meta text-rouge">{message}</p>}

      {!chargement && !erreur && adresses.length === 0 && (
        <p className="text-meta text-gris">la corbeille est vide.</p>
      )}

      {adresses.length > 0 && (
        <ul className="border-t border-trait">
          {adresses.map((cafe) => (
            <li key={cafe.id} className="flex flex-wrap items-center gap-4 border-b border-trait py-3">
              <span className="flex-1 text-corps text-encre">
                {cafe.nom}
                <span className="ml-3 text-meta text-gris">{cafe.arrondissement}</span>
              </span>

              <button
                type="button"
                onClick={() => retablir(cafe)}
                disabled={enCours === cafe.id}
                className="flex min-h-11 items-center text-meta text-encre underline underline-offset-4 disabled:opacity-50"
              >
                rétablir
              </button>

              <button
                type="button"
                onClick={() => detruire(cafe)}
                disabled={enCours === cafe.id}
                className="flex min-h-11 items-center text-meta text-rouge underline underline-offset-4 disabled:opacity-50"
              >
                détruire
              </button>
            </li>
          ))}
        </ul>
      )}

      {encore && (
        <div className="mt-4 flex flex-col items-start gap-2">
          <button type="button" onClick={chargerPlus} disabled={chargementSuite} className="bouton-secondaire">
            {chargementSuite ? "on charge…" : "voir la suite"}
          </button>
          <p className="text-meta text-gris" aria-live="polite">{adresses.length} sur {total}</p>
        </div>
      )}
    </div>
  );
}

/**
 * Les adresses mises à la corbeille.
 *
 * Repliée par défaut : c'est un filet de rattrapage, pas un écran de travail.
 * L'ouvrir déclenche le chargement — inutile d'interroger l'API à chaque visite
 * de la page d'administration pour une liste presque toujours vide.
 */
export default function AdminCorbeille({ surChangement }) {
  const [ouverte, setOuverte] = useState(false);

  return (
    <section className="mt-12 border-t border-trait pt-6">
      <button
        type="button"
        onClick={() => setOuverte((etat) => !etat)}
        aria-expanded={ouverte}
        className="flex min-h-11 items-center text-meta text-gris underline underline-offset-4"
      >
        corbeille {ouverte ? "—" : "+"}
      </button>

      {ouverte && <ListeCorbeille surChangement={surChangement} />}
    </section>
  );
}

import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { cafesAPI } from "../services/api";
import { useFermeture } from "../hooks/useFermeture";
import Loupe from "../icons/Loupe";

// Longueur maximale acceptée par l'API pour une recherche (`RECHERCHE_MAX`).
const SAISIE_MAX = 100;
const DELAI_FRAPPE_MS = 250;
const RESULTATS_MAX = 6;

/**
 * Recherche du guide, en pilule toujours visible dans l'entête.
 *
 * Elle interroge l'API (`/api/cafes/search?q=`) après une courte pause dans la
 * frappe. Elle filtrait auparavant les cent premières adresses chargées au
 * démarrage : au-delà, les suivantes étaient introuvables sans qu'aucun message
 * ne le dise. Le serveur cherche dans tout le guide.
 */
export default function NavbarRecherche({ idChamp = "recherche-guide", autoFocus = false }) {
  const navigate = useNavigate();
  const [saisie, setSaisie] = useState("");
  // La réponse porte le terme qui l'a produite : tant qu'elle ne correspond
  // pas à la saisie courante, elle est périmée et ne s'affiche pas — sinon
  // « rien ne correspond » clignoterait entre deux frappes.
  const [reponse, setReponse] = useState({ terme: "", adresses: [], erreur: false });
  const zone = useRef(null);

  const terme = saisie.trim();

  useEffect(() => {
    if (!terme) return;

    let perime = false;
    const minuteur = setTimeout(() => {
      cafesAPI.search({ q: terme }, { limite: RESULTATS_MAX })
        .then((r) => { if (!perime) setReponse({ terme, adresses: r.donnees, erreur: false }); })
        .catch(() => { if (!perime) setReponse({ terme, adresses: [], erreur: true }); });
    }, DELAI_FRAPPE_MS);

    return () => { perime = true; clearTimeout(minuteur); };
  }, [terme]);

  const aJour = reponse.terme === terme;
  const resultats = aJour ? reponse.adresses : [];

  const fermer = useCallback(() => setSaisie(""), []);
  useFermeture(saisie.trim().length > 0, zone, fermer);

  const ouvrir = (id) => {
    fermer();
    navigate(`/cafe/${id}`);
  };

  return (
    <div className="relative" ref={zone}>
      <label className="sr-only" htmlFor={idChamp}>rechercher une adresse</label>
      <div className="flex items-center gap-3 rounded-plaque border border-trait-fort bg-carte px-5 py-3 shadow-carte">
        <Loupe />
        <input
          id={idChamp}
          autoFocus={autoFocus}
          type="search"
          value={saisie}
          onChange={(e) => setSaisie(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") fermer();
            if (e.key === "Enter" && resultats.length > 0) ouvrir(resultats[0].id);
          }}
          maxLength={SAISIE_MAX}
          placeholder="chercher une adresse, un quartier, une spécialité…"
          className="min-h-0 w-full border-0 bg-transparent p-0 text-corps text-encre placeholder:text-gris focus-visible:outline-none"
        />
      </div>

      {terme && (
        <div className="absolute left-0 top-full z-50 mt-2 w-full rounded-barre border border-trait bg-carte p-2 shadow-carte-vif">
          {!aJour ? (
            <p className="px-3 py-4 text-meta text-gris">on cherche…</p>
          ) : reponse.erreur ? (
            <p className="px-3 py-4 text-meta text-gris">
              la recherche ne répond pas pour le moment. parcourir le guide en attendant.
            </p>
          ) : resultats.length > 0 ? (
            <ul>
              {resultats.map((cafe) => (
                <li key={cafe.id}>
                  <button
                    type="button"
                    onClick={() => ouvrir(cafe.id)}
                    className="flex w-full flex-col items-start rounded-plaque px-3 text-left hover:bg-papier"
                  >
                    <span className="text-corps text-encre">{cafe.nom}</span>
                    <span className="text-meta text-gris">{cafe.arrondissement}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-3 py-4 text-meta text-gris">
              rien qui corresponde à « {saisie} ». essayer un arrondissement,
              ou parcourir le guide.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

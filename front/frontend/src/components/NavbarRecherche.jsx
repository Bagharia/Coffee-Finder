import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { cafesAPI, LIMITE_MAX } from "../services/api";
import { useFermeture } from "../hooks/useFermeture";
import Loupe from "../icons/Loupe";

/**
 * Recherche du guide, repliée derrière une loupe.
 *
 * Un champ toujours déployé occupait un quart de la barre pour une action
 * qu'on fait rarement. Replié, il rend sa place aux liens et ne s'ouvre que
 * lorsqu'on le demande.
 *
 * Le filtrage est local : les adresses sont chargées une fois, puis filtrées
 * sans aller-retour réseau à chaque frappe — à cette échelle, c'est plus
 * rapide qu'interroger l'API à chaque lettre. L'API sait faire la même chose
 * (`/api/cafes/search?q=`) et couvre les mêmes champs : c'est vers elle qu'il
 * faudra basculer quand le guide dépassera `LIMITE_MAX` adresses, puisque le
 * chargement local cessera d'être complet et que la recherche mentirait par
 * omission.
 */
export default function NavbarRecherche() {
  const navigate = useNavigate();
  const [ouverte, setOuverte] = useState(false);
  const [saisie, setSaisie] = useState("");
  const [adresses, setAdresses] = useState([]);
  const champ = useRef(null);
  const zone = useRef(null);

  useEffect(() => {
    cafesAPI.getAll({ limite: LIMITE_MAX })
      .then((reponse) => setAdresses(reponse.donnees))
      .catch(() => setAdresses([]));
  }, []);

  // Ouvrir sans donner le focus obligerait à cliquer une seconde fois.
  useEffect(() => {
    if (ouverte) champ.current?.focus();
  }, [ouverte]);

  const resultats = useMemo(() => {
    const terme = saisie.trim().toLowerCase();
    if (!terme) return [];

    return adresses.filter((cafe) =>
      cafe.nom?.toLowerCase().includes(terme) ||
      cafe.arrondissement?.toLowerCase().includes(terme) ||
      cafe.specialite?.toLowerCase().includes(terme) ||
      cafe.adresse?.toLowerCase().includes(terme) ||
      cafe.description?.toLowerCase().includes(terme) ||
      cafe.verdict?.toLowerCase().includes(terme)
    ).slice(0, 6);
  }, [saisie, adresses]);

  // Échap ne fonctionnait que depuis le champ : hors de lui, et au clic à
  // l'extérieur, le panneau restait posé au-dessus de la page.
  const fermer = useCallback(() => {
    setSaisie("");
    setOuverte(false);
  }, []);

  useFermeture(ouverte, zone, fermer);

  const ouvrir = (id) => {
    fermer();
    navigate(`/cafe/${id}`);
  };

  return (
    <div className="relative hidden md:block" ref={zone}>
      <button
        type="button"
        aria-expanded={ouverte}
        aria-label="Rechercher Une Adresse"
        onClick={() => (ouverte ? fermer() : setOuverte(true))}
        className="flex w-11 items-center justify-center rounded-carte text-white hover:bg-white/10"
      >
        <Loupe />
      </button>

      {ouverte && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-barre border border-trait bg-carte p-2">
          <label className="sr-only" htmlFor="recherche-guide">Rechercher Une Adresse</label>
          <input
            ref={champ}
            id="recherche-guide"
            type="search"
            value={saisie}
            onChange={(e) => setSaisie(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") fermer();
              if (e.key === "Enter" && resultats.length > 0) ouvrir(resultats[0].id);
            }}
            placeholder="Nom, Arrondissement, Mot Du Verdict"
            className="w-full rounded-carte border border-trait-fort bg-papier px-3 text-meta text-encre placeholder:text-gris"
          />

          {saisie.trim() && (
            <div className="mt-2">
              {resultats.length > 0 ? (
                <ul>
                  {resultats.map((cafe) => (
                    <li key={cafe.id}>
                      <button
                        type="button"
                        onClick={() => ouvrir(cafe.id)}
                        className="flex w-full flex-col items-start rounded-carte px-3 text-left hover:bg-papier"
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
      )}
    </div>
  );
}

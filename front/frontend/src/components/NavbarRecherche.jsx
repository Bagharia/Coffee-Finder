import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { cafesAPI, LIMITE_MAX } from "../services/api";

/**
 * Recherche du guide. Le filtrage est local : les adresses sont chargées une
 * fois, puis filtrées sans aller-retour réseau à chaque frappe.
 * Au-delà de la limite de l'API, il faudra passer sur /api/cafes/search.
 */
export default function NavbarRecherche() {
  const navigate = useNavigate();
  const [saisie, setSaisie] = useState("");
  const [adresses, setAdresses] = useState([]);

  useEffect(() => {
    cafesAPI.getAll({ limite: LIMITE_MAX })
      .then((reponse) => setAdresses(reponse.donnees))
      .catch(() => setAdresses([]));
  }, []);

  // Les résultats se déduisent de la saisie : les stocker en état obligerait à
  // les resynchroniser à chaque frappe, pour rien.
  const resultats = useMemo(() => {
    const terme = saisie.trim().toLowerCase();
    if (!terme) return [];

    return adresses.filter((cafe) =>
      cafe.nom?.toLowerCase().includes(terme) ||
      cafe.arrondissement?.toLowerCase().includes(terme) ||
      cafe.specialite?.toLowerCase().includes(terme) ||
      cafe.adresse?.toLowerCase().includes(terme)
    ).slice(0, 6);
  }, [saisie, adresses]);

  const vider = () => setSaisie("");

  const ouvrir = (id) => {
    // Vider la saisie referme le panneau, qui n'est affiché que tant que le
    // champ contient quelque chose.
    vider();
    navigate(`/cafe/${id}`);
  };

  return (
    <div className="relative hidden md:block">
      <label className="sr-only" htmlFor="recherche-guide">rechercher une adresse</label>
      <input
        id="recherche-guide"
        type="search"
        value={saisie}
        onChange={(e) => setSaisie(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") vider();
          if (e.key === "Enter" && resultats.length > 0) ouvrir(resultats[0].id);
        }}
        placeholder="nom, arrondissement, spécialité"
        className="w-64 border border-white/40 bg-transparent px-3 text-meta text-white placeholder:text-white/60"
      />

      {saisie.trim() && (
        <div className="absolute left-0 right-0 top-full z-50 border border-trait bg-carte">
          {resultats.length > 0 ? (
            <ul>
              {resultats.map((cafe) => (
                <li key={cafe.id}>
                  <button
                    type="button"
                    onClick={() => ouvrir(cafe.id)}
                    className="flex w-full flex-col items-start px-4 py-2 text-left hover:bg-papier"
                  >
                    <span className="text-encre">{cafe.nom}</span>
                    <span className="text-meta text-gris">{cafe.arrondissement}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-4 py-6 text-center text-meta text-gris">
              rien qui corresponde à « {saisie} ». essayer un arrondissement, ou parcourir le guide.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

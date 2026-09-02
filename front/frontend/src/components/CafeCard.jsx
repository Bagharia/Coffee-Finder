import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { favorisAPI } from "../services/api";
import { useAuth } from "../hooks/useAuth";
import Coeur from "../icons/Coeur";

/**
 * Les prix sont stockés en intervalles ('1-10', '10-20', '20+'). La DA impose
 * de les écrire plutôt que de les encoder en pastilles : trois points ne se
 * lisent qu'avec une légende, un prix se lit tout seul.
 */
const PRIX = {
  "1-10": "1–10 €",
  "10-20": "10–20 €",
  "20+": "20 € et plus"
};

const NOUVEAUTE_MS = 30 * 24 * 60 * 60 * 1000;

const estNouveau = (created_at) =>
  Boolean(created_at) && Date.now() - new Date(created_at).getTime() < NOUVEAUTE_MS;

/** Les critères s'écrivent en toutes lettres, une donnée par emplacement. */
function criteres(cafe) {
  const liste = [];
  if (cafe.wifi === 1) liste.push("wifi");
  if (cafe.prises === 1) liste.push("prises");
  if (cafe.travailler === 1) liste.push("pour travailler");
  return liste;
}

export default function CafeCard({ cafe, initialFavorite, prioritaire = false }) {
  const navigate = useNavigate();
  const { connecte } = useAuth();
  const [favori, setFavori] = useState(initialFavorite ?? false);
  const [enCours, setEnCours] = useState(false);

  useEffect(() => {
    if (initialFavorite !== undefined) return;
    if (!connecte) return;
    favorisAPI.check(cafe.id)
      .then((d) => setFavori(d.isFavorite))
      .catch(() => setFavori(false));
  }, [cafe.id, connecte, initialFavorite]);

  const basculerFavori = async () => {
    if (!connecte) { navigate("/login"); return; }
    setEnCours(true);
    try {
      if (favori) {
        await favorisAPI.remove(cafe.id);
        setFavori(false);
      } else {
        await favorisAPI.add(cafe.id);
        setFavori(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setEnCours(false);
    }
  };

  const categorie = cafe.specialite?.split(",")[0]?.trim();
  const listeCriteres = criteres(cafe);

  return (
    <article className="relative flex flex-col border border-trait bg-carte">
      {/* Rapport fixe : la place de l'image est réservée avant son arrivée,
          la carte ne saute pas quand elle se charge. */}
      <div className="aspect-[4/3] overflow-hidden">
        {cafe.image_url ? (
          <img
            src={cafe.image_url}
            alt={`${cafe.nom}, ${cafe.arrondissement}`}
            loading={prioritaire ? "eager" : "lazy"}
            decoding="async"
            className="h-full w-full object-cover"
          />
        ) : (
          <p className="image-repli">{cafe.nom}</p>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        {categorie && <span className="plaque self-start">{categorie.toLowerCase()}</span>}

        <h3 className="text-nom text-encre">
          {/* Le lien couvre toute la carte via son ::after : la carte reste un
              article, pas un div cliquable. */}
          <Link to={`/cafe/${cafe.id}`} className="after:absolute after:inset-0">
            {cafe.nom}
          </Link>
        </h3>

        <p className="text-meta text-gris">{cafe.arrondissement}</p>

        {listeCriteres.length > 0 && (
          <ul className="flex flex-wrap gap-x-4 text-meta text-gris">
            {listeCriteres.map((critere) => (
              <li key={critere}>{critere}</li>
            ))}
          </ul>
        )}

        <div className="mt-auto flex items-end justify-between gap-3 pt-2">
          <div className="text-meta text-gris">
            {cafe.prix && <p>{PRIX[cafe.prix] ?? cafe.prix}</p>}
            {estNouveau(cafe.created_at) && <p>nouveau</p>}
          </div>

          {/* Au-dessus du lien de carte, sinon il l'intercepterait. */}
          <button
            type="button"
            onClick={basculerFavori}
            disabled={enCours}
            aria-pressed={favori}
            aria-label={favori ? "retirer des favoris" : "ajouter aux favoris"}
            className="relative z-10 flex w-11 items-center justify-center text-gris disabled:opacity-50"
          >
            <Coeur rempli={favori} />
          </button>
        </div>
      </div>
    </article>
  );
}

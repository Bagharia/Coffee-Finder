import { Link } from "react-router-dom";
import { useFavori } from "../hooks/useFavori";
import Signet from "../icons/Signet";
import { estOuvert } from "../utils/horaires";
import { classeCategorie } from "../utils/categories";

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

export default function CafeCard({ cafe, initialFavorite, prioritaire = false, vedette = false }) {
  const { favori, enCours, basculer: basculerFavori } = useFavori(cafe.id, initialFavorite);

  const categorie = cafe.specialite?.split(",")[0]?.trim();
  const classe = classeCategorie(categorie);
  const listeCriteres = criteres(cafe);

  return (
    <article className="relative flex flex-col overflow-hidden rounded-carte bg-carte shadow-carte transition-shadow hover:shadow-carte-vif">
      {/* Rapport fixe : la place de l'image est réservée avant son arrivée,
          la carte ne saute pas quand elle se charge. `overflow-hidden` sur
          l'article suffit à arrondir l'image avec lui. */}
      <div className={vedette ? "aspect-[16/9] overflow-hidden" : "aspect-[4/3] overflow-hidden"}>
        {cafe.image_url ? (
          <img
            src={cafe.image_url}
            alt={`${cafe.nom}, ${cafe.arrondissement}`}
            loading={prioritaire ? "eager" : "lazy"}
            decoding="async"
            className="h-full w-full object-cover"
          />
        ) : (
          <p className={`image-repli ${classe ? `image-repli-${classe}` : ""}`}>{cafe.nom}</p>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-5">
        {categorie && (
          <span className={`etiquette self-start ${classe ? `etiquette-${classe}` : ""}`}>
            {categorie.toLowerCase()}
          </span>
        )}

        <h3 className={vedette ? "mt-1 text-section text-encre" : "mt-1 text-adresse text-encre"}>
          {/* Le lien couvre toute la carte via son ::after : la carte reste un
              article, pas un div cliquable. */}
          <Link to={`/cafe/${cafe.id}`} className="after:absolute after:inset-0">
            {cafe.nom}
          </Link>
        </h3>

        <p className="text-meta text-gris">{cafe.arrondissement}</p>

        {/* Le guide vend l'avis de Wendy, et la grille n'en montrait pas un
            mot : une carte sans verdict, c'est une entrée d'annuaire. Tronqué
            en deux lignes — trois en vedette, qui a la place. */}
        {cafe.verdict && (
          <p className={`voix-carte ${classe ? `teinte-${classe}` : ""}`}>
            {/* La coupe est sur le texte, pas sur l'encart : posée sur un bloc
                qui a du padding, elle laissait dépasser la ligne suivante. */}
            <span className={vedette ? "line-clamp-3" : "line-clamp-2"}>{cafe.verdict}</span>
          </p>
        )}

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
            {/* Seul « fermé » s'affiche : signaler « ouvert » l'allumerait sur
                presque toutes les cartes et ne signalerait plus rien. */}
            {estOuvert(cafe.horaires) === false && <p className="text-rouge">fermé</p>}
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
            <Signet rempli={favori} />
          </button>
        </div>
      </div>
    </article>
  );
}

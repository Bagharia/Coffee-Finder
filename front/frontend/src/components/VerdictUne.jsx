import { Link } from "react-router-dom";
import { useFavori } from "../hooks/useFavori";
import Coeur from "../icons/Coeur";
import Signet from "../icons/Signet";

/**
 * Le coup de cœur de Wendy, en ouverture de l'accueil — carte héro pleine
 * largeur (DA révisée du 2026-09-05, sur le modèle du mockup Claude Design).
 *
 * C'est aussi le seul endroit de l'accueil où Caveat apparaît. `.voix-une`
 * est réservée aux verdicts — c'est précisément l'usage prévu, et il fait
 * exister le contraste de registres sur lequel tout le système repose.
 */
export default function VerdictUne({ cafe, chargement }) {
  const { favori, enCours, basculer } = useFavori(cafe?.id);

  if (chargement) {
    return (
      <div className="squelette aspect-[21/9] w-full rounded-carte" />
    );
  }

  if (!cafe) return null;

  return (
    <div className="relative flex min-h-[25rem] flex-col justify-end overflow-hidden rounded-carte shadow-carte-vif">
      {/* La première image utile de l'accueil : c'est elle que CLAUDE-5.md
          veut voir arriver sous deux secondes en 4G, donc elle passe devant
          le reste. */}
      {cafe.image_url ? (
        <img
          src={cafe.image_url}
          alt={`${cafe.nom}, ${cafe.adresse ?? cafe.arrondissement}`}
          className="absolute inset-0 h-full w-full object-cover"
          decoding="async"
          loading="eager"
          fetchPriority="high"
        />
      ) : (
        <div className="image-repli image-repli-cafe absolute inset-0" />
      )}

      {/* Fondu sombre pour que le badge et la citation restent lisibles quelle
          que soit la photo. */}
      <div className="absolute inset-0 bg-gradient-to-t from-plaque/85 via-plaque/20 to-transparent" />

      <span className="plaque absolute left-5 top-5">
        <span className="text-vert-accent"><Coeur rempli taille={14} /></span>
        coup de cœur de wendy
      </span>

      <button
        type="button"
        onClick={basculer}
        disabled={enCours}
        aria-pressed={favori}
        aria-label={favori ? "retirer des favoris" : "ajouter aux favoris"}
        className="absolute right-5 top-5 flex h-11 w-11 items-center justify-center rounded-full bg-carte/90 text-encre shadow-carte disabled:opacity-50"
      >
        <Signet rempli={favori} />
      </button>

      {/* Dans le flux, pas en absolu : la carte grandit avec son texte au lieu
          de couper le titre en haut sur un écran étroit. `pt-20` laisse la
          place du badge et du bouton. */}
      <div className="relative px-6 pb-6 pt-20 sm:px-8 sm:pb-8">
        <h1 className="text-titre text-carte">{cafe.nom}</h1>
        <p className="mt-1 text-corps font-semibold text-carte">{cafe.arrondissement}</p>

        <p className="voix-une mt-3">
          <span className="line-clamp-4">{cafe.verdict}</span>
          <span className="signature">— wendy</span>
        </p>

        {/* En bloc : en ligne, il se glissait sous le bord de l'encart. */}
        <Link
          to={`/cafe/${cafe.id}`}
          className="mt-4 flex w-fit items-center text-meta font-bold text-carte underline underline-offset-4"
        >
          lire la fiche
        </Link>
      </div>
    </div>
  );
}

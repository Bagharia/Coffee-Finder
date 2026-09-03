import { Link } from "react-router-dom";

/**
 * Le verdict d'une adresse, en ouverture de l'accueil.
 *
 * Ce que vend ce site, c'est l'avis de Wendy. L'accueil l'annonçait sans jamais
 * en montrer une ligne : un titre, deux boutons, des vignettes. On donne à lire
 * dès la première seconde, avec du contenu réel plutôt que du décor.
 *
 * C'est aussi le seul endroit de l'accueil où Instrument Serif apparaît. La DA
 * réserve `.voix` aux verdicts — c'est précisément l'usage prévu, et il fait
 * enfin exister le contraste de registres sur lequel tout le système repose.
 */
export default function VerdictUne({ cafe, chargement }) {
  if (chargement) {
    return (
      <div className="grid gap-8 md:grid-cols-2 md:items-center">
        <div className="squelette aspect-[4/3] w-full rounded-carte" />
        <div className="flex flex-col gap-4">
          <div className="squelette h-8 w-40" />
          <div className="squelette h-6 w-full" />
          <div className="squelette h-6 w-11/12" />
          <div className="squelette h-6 w-4/5" />
        </div>
      </div>
    );
  }

  if (!cafe) return null;

  return (
    <div className="grid gap-8 md:grid-cols-2 md:items-center">
      <div className="aspect-[4/3] overflow-hidden rounded-carte">
        {cafe.image_url ? (
          <img
            src={cafe.image_url}
            alt={`${cafe.nom}, ${cafe.adresse ?? cafe.arrondissement}`}
            className="h-full w-full object-cover"
            decoding="async"
          />
        ) : (
          <p className="image-repli h-full w-full">{cafe.nom}</p>
        )}
      </div>

      <div>
        {/* Un seul geste fort par zone : c'est celui-ci. */}
        <p className="plaque">{cafe.nom}</p>

        <p className="voix-une mt-6">{cafe.verdict}</p>

        <Link
          to={`/cafe/${cafe.id}`}
          className="mt-6 inline-flex items-center text-meta text-encre underline underline-offset-4"
        >
          lire la fiche — {cafe.arrondissement}
        </Link>
      </div>
    </div>
  );
}

import { Link } from "react-router-dom";
import { classeCategorie } from "../utils/categories";

/**
 * Carte compacte de la colonne héro de l'accueil (DA du 2026-09-05) : image
 * carrée à gauche, verdict à droite. Une simple vitrine — le prix, les
 * critères et le cœur restent l'affaire de `CafeCard` sur le reste du site.
 */
export default function AdresseCompacte({ cafe }) {
  const categorie = cafe.specialite?.split(",")[0]?.trim();
  const classe = classeCategorie(categorie);

  return (
    <article className="relative grid grid-cols-[100px_1fr] gap-3 rounded-carte bg-carte p-2.5 shadow-carte transition-shadow hover:shadow-carte-vif">
      <div className="overflow-hidden rounded-doux">
        {cafe.image_url ? (
          <img
            src={cafe.image_url}
            alt={`${cafe.nom}, ${cafe.arrondissement}`}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className={`image-repli ${classe ? `image-repli-${classe}` : ""} h-full w-full`} />
        )}
      </div>

      <div className="flex flex-col gap-0.5">
        {categorie && (
          <span className={`etiquette hidden self-start px-3 py-0.5 sm:inline-flex ${classe ? `etiquette-${classe}` : ""}`}>
            {categorie.toLowerCase()}
          </span>
        )}

        <h3 className="text-adresse text-encre">
          <Link to={`/cafe/${cafe.id}`} className="after:absolute after:inset-0">
            {cafe.nom}
          </Link>
        </h3>

        {/* Sur téléphone, la catégorie rejoint l'arrondissement sur une ligne :
            l'étiquette prenait un rang entier dans une carte déjà serrée. */}
        <p className="text-meta text-gris">
          {categorie && <span className="sm:hidden">{categorie.toLowerCase()} · </span>}
          {cafe.arrondissement}
        </p>

        {cafe.verdict && (
          <p className={`voix-carte mt-1 ${classe ? `teinte-${classe}` : ""}`}>
            <span className="line-clamp-2">{cafe.verdict}</span>
          </p>
        )}
      </div>
    </article>
  );
}

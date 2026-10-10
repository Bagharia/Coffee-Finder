import { formaterDistance } from "../utils/distance";

/**
 * Bandeau sous les filtres : les adresses les plus proches de la personne, ou
 * ce qui a empêché de la situer. Rien ne s'affiche tant qu'elle n'a pas demandé.
 */
export default function MapProches({ statut, message, proches, loin, onChoisir }) {
  if (statut === "erreur") {
    return (
      <p role="alert" className="shrink-0 border-b border-trait bg-carte px-3 py-2 text-meta text-rouge">
        {message}
      </p>
    );
  }

  if (statut !== "trouvee" || proches.length === 0) return null;

  return (
    <div className="shrink-0 border-b border-trait bg-carte px-3 py-2">
      {loin ? (
        <p className="text-meta text-encre">
          l&apos;adresse la plus proche est à {formaterDistance(proches[0].distance)}.
          la carte reste sur paris.
        </p>
      ) : (
        <p className="text-meta text-gris">près de vous</p>
      )}

      <ul className="mt-1 flex gap-2 overflow-x-auto pb-1">
        {proches.map((cafe) => (
          <li key={cafe.id} className="shrink-0">
            <button
              type="button"
              onClick={() => onChoisir(cafe)}
              className="flex min-h-11 items-center gap-2 rounded-plaque border border-trait-fort bg-carte px-4 text-meta text-encre"
            >
              <span>{cafe.nom}</span>
              <span className="text-gris">{formaterDistance(cafe.distance)}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

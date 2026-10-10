import { Link } from "react-router-dom";

/**
 * La feuille de la carte : le seul mouvement du site (DA, interdit 8).
 * Repliée, elle ne montre que le nom ; dépliée, le détail de l'adresse.
 */
export default function MapFeuille({ cafe, ouverte, onBasculer, onFermer, distance }) {
  if (!cafe) return null;

  const criteres = [
    cafe.wifi === 1 && "wifi",
    cafe.prises === 1 && "prises",
    cafe.travailler === 1 && "pour travailler"
  ].filter(Boolean);

  return (
    <div
      className={`feuille absolute inset-x-0 bottom-0 z-[1000] border-t border-trait bg-carte ${
        ouverte ? "feuille-ouverte" : ""
      }`}
    >
      <button
        type="button"
        aria-expanded={ouverte}
        onClick={onBasculer}
        className="flex h-14 w-full items-center justify-between px-4 text-left"
      >
        <span className="truncate text-adresse text-encre">{cafe.nom}</span>
        <span className="text-meta text-gris">{ouverte ? "réduire" : "détails"}</span>
      </button>

      <div className="border-t border-trait px-4 py-4">
        {cafe.adresse && <p className="text-meta text-gris">{cafe.adresse}</p>}
        <p className="text-meta text-gris">{cafe.arrondissement}</p>
        {distance && <p className="text-meta text-encre">à {distance} de vous</p>}

        {cafe.verdict && (
          <p className="voix mt-4">
            {cafe.verdict}
          </p>
        )}

        {criteres.length > 0 && (
          <ul className="mt-4 flex flex-wrap gap-x-4 text-meta text-gris">
            {criteres.map((critere) => <li key={critere}>{critere}</li>)}
          </ul>
        )}

        <div className="mt-4 flex gap-3">
          <Link to={`/cafe/${cafe.id}`} className="bouton">
            voir la fiche
          </Link>
          <button type="button" onClick={onFermer} className="bouton-secondaire">
            fermer
          </button>
        </div>
      </div>
    </div>
  );
}

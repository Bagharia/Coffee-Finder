/** Les adresses du guide, une ligne chacune, avec leurs deux actions. */
export default function AdminListe({ cafes, onModifier, onSupprimer }) {
  return (
    <ul className="border-t border-trait">
      {cafes.map((cafe) => (
        <li key={cafe.id} className="flex flex-wrap items-center gap-4 border-b border-trait py-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-encre">{cafe.nom}</p>
            <p className="text-meta text-gris">{cafe.arrondissement}</p>
          </div>

          {cafe.coup_de_coeur === 1 && <span className="text-meta text-rouge">coup de cœur</span>}
          {!cafe.verdict && <span className="text-meta text-gris">sans verdict</span>}

          <button type="button" onClick={() => onModifier(cafe)} className="flex items-center text-meta text-encre underline underline-offset-4">
            modifier
          </button>
          <button type="button" onClick={() => onSupprimer(cafe)} className="flex items-center text-meta text-rouge underline underline-offset-4">
            mettre à la corbeille
          </button>
        </li>
      ))}
    </ul>
  );
}

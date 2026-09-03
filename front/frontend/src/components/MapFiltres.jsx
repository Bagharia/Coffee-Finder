const SPECIALITES = ["Café", "Matcha", "Bubble Tea", "Thé"];

const ARRONDISSEMENTS = Array.from({ length: 20 }, (_, i) =>
  i === 0 ? "1er" : `${i + 1}e`
);

/** Barre de filtres de la carte. Aucun pictogramme : les critères s'écrivent. */
export default function MapFiltres({ filtres, onChange, total }) {
  const basculer = (champ, valeur) =>
    onChange({ ...filtres, [champ]: filtres[champ] === valeur ? "" : valeur });

  const classe = (actif) =>
    `flex items-center px-4 text-meta ${
      actif ? "bg-plaque text-white" : "border border-trait text-encre"
    }`;

  return (
    <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-trait bg-carte p-3">
      <button type="button" onClick={() => onChange({ ...filtres, specialite: "" })} className={classe(!filtres.specialite)}>
        toutes
      </button>

      {SPECIALITES.map((specialite) => (
        <button
          key={specialite}
          type="button"
          onClick={() => basculer("specialite", specialite)}
          className={classe(filtres.specialite === specialite)}
        >
          {specialite.toLowerCase()}
        </button>
      ))}

      <label className="flex items-center gap-2 text-meta text-encre">
        <span className="sr-only">arrondissement</span>
        <select
          value={filtres.arrondissement}
          onChange={(e) => onChange({ ...filtres, arrondissement: e.target.value })}
          className="border border-trait bg-carte px-3 text-meta text-encre"
        >
          <option value="">tous les arrondissements</option>
          {ARRONDISSEMENTS.map((arr) => (
            <option key={arr} value={arr}>{arr}</option>
          ))}
        </select>
      </label>

      <button
        type="button"
        aria-pressed={filtres.wifi}
        onClick={() => onChange({ ...filtres, wifi: !filtres.wifi })}
        className={classe(filtres.wifi)}
      >
        wifi
      </button>

      <p className="ml-auto text-meta text-gris">
        {total} adresse{total > 1 ? "s" : ""}
      </p>
    </div>
  );
}

import { useState } from "react";

const FILTRES_VIDES = {
  arrondissement: "",
  prix: "",
  ambiance: "",
  wifi: "",
  prises: "",
  travailler: "",
  nouveautes: ""
};

const ARRONDISSEMENTS = Array.from({ length: 20 }, (_, i) => (i === 0 ? "1er" : `${i + 1}e`));

const PRIX = [
  ["1-10", "1–10 €"],
  ["10-20", "10–20 €"],
  ["20+", "20 € et plus"]
];

const AMBIANCES = ["sombre", "soft", "lumineux", "calme", "animée"];

// Les critères s'écrivent : un pictogramme à côté de son propre libellé
// n'ajoute rien (DA, section 7).
const EQUIPEMENTS = [
  ["nouveautes", "nouveautés"],
  ["wifi", "wifi"],
  ["prises", "prises"],
  ["travailler", "pour travailler"]
];

export default function Filters({ onFilterChange }) {
  const [filtres, setFiltres] = useState(FILTRES_VIDES);

  const changer = (champ, valeur) => {
    const suivants = { ...filtres, [champ]: valeur };
    setFiltres(suivants);
    onFilterChange(suivants);
  };

  const reinitialiser = () => {
    setFiltres(FILTRES_VIDES);
    onFilterChange(FILTRES_VIDES);
  };

  const classeSelect = "w-full border border-trait bg-carte px-3 text-meta text-encre";

  return (
    <div className="sticky top-24 border border-trait bg-carte p-5">
      <div className="mb-5 flex items-center justify-between gap-4">
        <h2 className="text-meta text-gris">filtres</h2>
        <button type="button" onClick={reinitialiser} className="flex items-center text-meta text-gris underline underline-offset-4">
          tout effacer
        </button>
      </div>

      <div className="flex flex-col gap-4">
        <label>
          <span className="mb-2 block text-meta text-gris">arrondissement</span>
          <select value={filtres.arrondissement} onChange={(e) => changer("arrondissement", e.target.value)} className={classeSelect}>
            <option value="">tous</option>
            {ARRONDISSEMENTS.map((arr) => <option key={arr} value={arr}>{arr}</option>)}
          </select>
        </label>

        <label>
          <span className="mb-2 block text-meta text-gris">prix</span>
          <select value={filtres.prix} onChange={(e) => changer("prix", e.target.value)} className={classeSelect}>
            <option value="">tous</option>
            {PRIX.map(([valeur, libelle]) => <option key={valeur} value={valeur}>{libelle}</option>)}
          </select>
        </label>

        <label>
          <span className="mb-2 block text-meta text-gris">ambiance</span>
          <select value={filtres.ambiance} onChange={(e) => changer("ambiance", e.target.value)} className={classeSelect}>
            <option value="">toutes</option>
            {AMBIANCES.map((ambiance) => <option key={ambiance} value={ambiance}>{ambiance}</option>)}
          </select>
        </label>

        <fieldset className="border-t border-trait-fort pt-4">
          <legend className="mb-2 text-meta text-gris">équipements</legend>
          <div className="flex flex-col">
            {EQUIPEMENTS.map(([champ, libelle]) => (
              <label key={champ} className="flex min-h-11 items-center gap-3 text-meta text-encre">
                <input
                  type="checkbox"
                  checked={filtres[champ] === "1"}
                  onChange={() => changer(champ, filtres[champ] ? "" : "1")}
                  className="h-4 w-4 accent-plaque"
                />
                {libelle}
              </label>
            ))}
          </div>
        </fieldset>
      </div>
    </div>
  );
}

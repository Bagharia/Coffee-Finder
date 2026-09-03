import { JOURS } from "../utils/horaires";

const champ = "border border-trait bg-carte px-2 text-corps text-encre";

/**
 * Saisie des horaires : une ligne par plage, plusieurs plages possibles par
 * jour pour un service coupé, aucune plage = fermé ce jour-là.
 *
 * Le bouton « copier sur toute la semaine » n'est pas un confort : neuf
 * adresses sur dix ouvrent aux mêmes heures tous les jours, et faire saisir
 * sept fois la même ligne est le meilleur moyen que les horaires ne soient
 * jamais remplis.
 */
export default function AdminHoraires({ plages, onChange }) {
  const modifier = (index, nom, valeur) =>
    onChange(plages.map((p, i) => (i === index ? { ...p, [nom]: valeur } : p)));

  const ajouter = (jour) =>
    onChange([...plages, { jour, ouverture: "09:00", fermeture: "18:00" }]);

  const retirer = (index) => onChange(plages.filter((_, i) => i !== index));

  const copierLundi = () => {
    const lundi = plages.filter((p) => p.jour === 1);
    if (lundi.length === 0) return;
    onChange([1, 2, 3, 4, 5, 6, 7].flatMap((jour) => lundi.map((p) => ({ ...p, jour }))));
  };

  return (
    <fieldset>
      <legend className="mb-2 text-meta text-gris">horaires</legend>

      <div className="flex flex-col gap-2">
        {JOURS.map((nom, index) => {
          const jour = index + 1;
          const duJour = plages
            .map((p, position) => ({ ...p, position }))
            .filter((p) => p.jour === jour);

          return (
            <div key={jour} className="flex flex-wrap items-center gap-3 border-b border-trait py-2">
              <span className="w-24 shrink-0 text-meta text-gris">{nom}</span>

              {duJour.length === 0 && <span className="text-meta text-gris">fermé</span>}

              {duJour.map((plage) => (
                <span key={plage.position} className="flex items-center gap-2">
                  <input
                    type="time"
                    value={plage.ouverture}
                    onChange={(e) => modifier(plage.position, "ouverture", e.target.value)}
                    aria-label={`${nom}, heure d'ouverture`}
                    className={champ}
                  />
                  <span className="text-meta text-gris">–</span>
                  <input
                    type="time"
                    value={plage.fermeture}
                    onChange={(e) => modifier(plage.position, "fermeture", e.target.value)}
                    aria-label={`${nom}, heure de fermeture`}
                    className={champ}
                  />
                  <button
                    type="button"
                    onClick={() => retirer(plage.position)}
                    aria-label={`retirer cette plage du ${nom}`}
                    className="flex h-11 w-11 items-center justify-center text-meta text-gris"
                  >
                    retirer
                  </button>
                </span>
              ))}

              <button
                type="button"
                onClick={() => ajouter(jour)}
                className="flex h-11 items-center text-meta text-encre underline"
              >
                ajouter une plage
              </button>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={copierLundi}
        className="mt-3 flex h-11 items-center border border-trait-fort px-4 text-meta text-encre"
      >
        copier le lundi sur toute la semaine
      </button>

      <p className="mt-2 text-meta text-gris">
        Une fermeture après minuit s'écrit telle quelle : 8h00 – 01h30.
      </p>
    </fieldset>
  );
}

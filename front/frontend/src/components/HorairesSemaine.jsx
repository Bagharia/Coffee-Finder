import { useEffect, useState } from "react";
import { estOuvert, instantParis, parJour, resumeJour } from "../utils/horaires";

/**
 * Horaires de la semaine et état courant.
 *
 * Le rouge ne se pose que sur « fermé » : allumé sur « ouvert », il serait
 * allumé partout tout le temps et ne signalerait plus rien. Le tableau de la
 * semaine reste neutre — sept « fermé » en rouge feraient de la couleur
 * d'exception une couleur de fond.
 */
export default function HorairesSemaine({ plages }) {
  // Sans ce battement, une page laissée ouverte affiche « ouvert » toute la
  // nuit : l'état est calculé au rendu et rien ne le rafraîchit.
  const [, battement] = useState(0);

  useEffect(() => {
    const minuterie = setInterval(() => battement((n) => n + 1), 60_000);
    return () => clearInterval(minuterie);
  }, []);

  if (!plages || plages.length === 0) return null;

  const ouvert = estOuvert(plages);
  const aujourdhui = instantParis().jour;

  return (
    <section className="mt-10 border-t border-trait pt-6">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="text-meta text-gris">Horaires</h2>
        {ouvert === true && <p className="text-meta text-encre">Ouvert</p>}
        {ouvert === false && <p className="text-meta text-rouge">Fermé</p>}
      </div>

      <dl className="mt-3">
        {parJour(plages).map(({ jour, nom, plages: duJour }) => (
          <div
            key={jour}
            className={`flex gap-6 border-b border-trait py-2 ${jour === aujourdhui ? "text-encre" : "text-gris"}`}
          >
            <dt className="w-36 shrink-0 text-meta">{nom}</dt>
            <dd className="text-meta">{resumeJour(duJour)}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

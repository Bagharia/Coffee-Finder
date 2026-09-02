import CafeCard from "./CafeCard";

/**
 * Rangée d'adresses qui défile horizontalement.
 *
 * Le défilement est celui du navigateur, pas une animation : la boucle infinie
 * précédente dupliquait chaque adresse, tournait en permanence et empêchait de
 * lire une carte au passage. Le seul mouvement du site est la feuille de la
 * carte (DA, interdit 8).
 */
export default function Carousel({ cafes }) {
  return (
    <ul className="-mx-6 flex snap-x snap-mandatory gap-5 overflow-x-auto px-6 pb-4">
      {cafes.map((cafe, index) => (
        <li key={cafe.id} className="w-64 shrink-0 snap-start">
          {/* Seule la première image est prioritaire : les suivantes sont hors
              écran au chargement. */}
          <CafeCard cafe={cafe} prioritaire={index === 0} />
        </li>
      ))}
    </ul>
  );
}

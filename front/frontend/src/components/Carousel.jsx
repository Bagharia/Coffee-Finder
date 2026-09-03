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
      {/* 320 px et non 256 : les cartes portent maintenant deux lignes de
          verdict, qui se serraient à quatre ou cinq mots par ligne. */}
      {cafes.map((cafe) => (
        <li key={cafe.id} className="w-80 shrink-0 snap-start">
          {/* Aucune n'est prioritaire : le carrousel est sous la ligne de
              flottaison, et sa première image se battrait pour la bande
              passante avec la photo d'ouverture, qui elle est visible. */}
          <CafeCard cafe={cafe} />
        </li>
      ))}
    </ul>
  );
}

/**
 * Favori de l'utilisateur — et rien d'autre.
 * Le coup de cœur de Wendy est une plaque rouge portant le mot (DA, section 5) :
 * il n'emprunte jamais ce signe.
 */
export default function Coeur({ rempli = false, taille = 20 }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={taille}
      height={taille}
      fill={rempli ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="butt"
      strokeLinejoin="miter"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M12 20.5 3.8 12.3a4.8 4.8 0 0 1 6.8-6.8l1.4 1.4 1.4-1.4a4.8 4.8 0 0 1 6.8 6.8Z" />
    </svg>
  );
}

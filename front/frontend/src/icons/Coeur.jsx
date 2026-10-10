/**
 * Le coup de cœur de Wendy, dans son badge — et rien d'autre.
 * Le favori du visiteur est un signet (`Signet.jsx`) depuis le 2026-10-10 :
 * un cœur à côté d'un badge qui s'appelle « coup de cœur » désignait deux
 * choses à la fois (DA, section 5).
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

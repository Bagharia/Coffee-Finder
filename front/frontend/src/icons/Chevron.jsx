/**
 * Chevron d'ouverture. Il pivote quand le panneau s'ouvre : la flèche dit
 * l'état, pas seulement la possibilité.
 */
export default function Chevron({ taille = 14, ouvert = false }) {
  return (
    <svg
      width={taille}
      height={taille}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={ouvert ? "rotate-180" : undefined}
    >
      <path d="M5 9l7 7 7-7" />
    </svg>
  );
}

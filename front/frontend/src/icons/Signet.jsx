/** Signet : une adresse que le visiteur garde pour plus tard. Monochrome. */
export default function Signet({ rempli = false, taille = 20 }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={taille}
      height={taille}
      fill={rempli ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M6.5 3.5h11v17l-5.5-4-5.5 4Z" />
    </svg>
  );
}

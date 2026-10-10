import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const LIENS = [
  { label: "le guide", href: "/cafes" },
  { label: "la carte", href: "/map" }
];

/** Bandeau simple (DA révisée du 2026-09-05) — remplace les trois colonnes. */
export default function Footer() {
  const { connecte } = useAuth();

  return (
    <footer className="flex flex-wrap items-center gap-6 bg-plaque/5 px-6 py-7">
      <span className="text-adresse text-encre">spottheplace</span>
      <p className="text-meta text-gris">
        cafés, salons de thé et bubble tea de paris — testés par wendy
      </p>

      <nav className="ml-auto flex flex-wrap gap-6">
        {LIENS.map(({ label, href }) => (
          <Link key={href} to={href} className="text-corps font-bold text-encre/70 hover:text-encre">
            {label}
          </Link>
        ))}
        {connecte && (
          <Link to="/profile" className="text-corps font-bold text-encre/70 hover:text-encre">
            mes favoris
          </Link>
        )}
      </nav>
    </footer>
  );
}

import { Link } from "react-router-dom";

const GUIDE = [
  { label: "Toutes Les Adresses", href: "/cafes" },
  { label: "La Carte", href: "/map" }
];

const SPECIALITES = [
  { label: "Café", href: "/category/Café" },
  { label: "Matcha", href: "/category/Matcha" },
  { label: "Bubble Tea", href: "/category/Bubble Tea" },
  { label: "Thé", href: "/category/Thé" }
];

function Colonne({ titre, liens }) {
  return (
    <nav>
      <h2 className="mb-3 text-meta text-white/50">{titre}</h2>
      <ul className="flex flex-col">
        {liens.map(({ label, href }) => (
          <li key={href}>
            <Link
              to={href}
              className="flex items-center text-corps text-white/80 hover:text-white"
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default function Footer() {
  return (
    <footer className="bg-plaque px-6 py-16 text-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-12">
        {/* Trois colonnes plutôt qu'une liste unique de sept liens : le pied de
            page servait de sommaire sans dire de quoi. */}
        <div className="grid gap-10 md:grid-cols-3">
          <div className="flex flex-col items-start gap-4">
            {/* Un seul geste fort par zone. Éclairci pour se détacher de la
                barre : une plaque vert foncé sur fond vert foncé disparaît. */}
            <span className="plaque plaque-sur-fonce">Spotheplace</span>
            <p className="mesure text-corps text-white/70">
              Les Cafés, Salons De Thé Et Bubble Tea De Paris.
              Une Adresse, Un Verdict.
            </p>
          </div>

          <Colonne titre="Le Guide" liens={GUIDE} />
          <Colonne titre="Spécialités" liens={SPECIALITES} />
        </div>

        <p className="border-t border-white/15 pt-6 text-meta text-white/50">
          © {new Date().getFullYear()} spotheplace — paris
        </p>
      </div>
    </footer>
  );
}

import { Link } from "react-router-dom";

const LIENS = [
  { label: "accueil", href: "/" },
  { label: "toutes les adresses", href: "/cafes" },
  { label: "café", href: "/category/Café" },
  { label: "matcha", href: "/category/Matcha" },
  { label: "bubble tea", href: "/category/Bubble Tea" },
  { label: "thé", href: "/category/Thé" },
  { label: "carte", href: "/map" }
];

export default function Footer() {
  return (
    <footer className="bg-plaque px-6 py-12 text-white">
      <div className="mx-auto flex max-w-5xl flex-col gap-10">
        <div className="grid gap-10 md:grid-cols-2">
          <div className="flex flex-col items-start gap-4">
            {/* Un seul geste fort par zone : le pied de page a le sien. */}
            <span className="plaque">spotheplace</span>
            <p className="mesure text-meta text-white/80">
              les cafés, salons de thé et bubble tea de paris, une adresse à la fois.
            </p>
          </div>

          <nav>
            <h2 className="mb-4 text-meta text-white/60">le guide</h2>
            <ul className="flex flex-col">
              {LIENS.map(({ label, href }) => (
                <li key={href}>
                  <Link to={href} className="flex items-center text-meta text-white/80 hover:text-white">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <p className="border-t border-white/20 pt-6 text-meta text-white/60">
          © {new Date().getFullYear()} spotheplace — paris
        </p>
      </div>
    </footer>
  );
}

import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import NavbarRecherche from "./NavbarRecherche";
import NavbarMenuMobile from "./NavbarMenuMobile";
import Reglages from "../icons/Reglages";

const CATEGORIES = [
  { label: "toutes les adresses", href: "/cafes" },
  { label: "café", href: "/category/Café" },
  { label: "matcha", href: "/category/Matcha" },
  { label: "bubble tea", href: "/category/Bubble Tea" },
  { label: "thé", href: "/category/Thé" }
];

export default function Navbar() {
  const { connecte, estAdmin } = useAuth();
  const [menuOuvert, setMenuOuvert] = useState(false);
  const [categoriesOuvertes, setCategoriesOuvertes] = useState(false);

  return (
    <>
      <nav className="fixed top-0 z-50 flex h-16 w-full items-center justify-between gap-4 bg-plaque px-6 text-white">
        {/* La plaque est le logo. C'est le seul geste fort de cette zone :
            rien d'autre dans la barre n'en porte une. */}
        <Link to="/" className="plaque shrink-0">spotheplace</Link>

        <div className="hidden items-center gap-6 md:flex">
          <Link to="/" className="text-meta text-white/80 hover:text-white">accueil</Link>

          <div className="relative">
            <button
              type="button"
              aria-expanded={categoriesOuvertes}
              onClick={() => setCategoriesOuvertes((ouvert) => !ouvert)}
              className="text-meta text-white/80 hover:text-white"
            >
              spécialités
            </button>

            {categoriesOuvertes && (
              <ul className="absolute left-0 top-full z-50 w-56 border border-trait bg-carte py-1">
                {CATEGORIES.map((categorie) => (
                  <li key={categorie.href}>
                    <Link
                      to={categorie.href}
                      onClick={() => setCategoriesOuvertes(false)}
                      className="flex items-center px-4 text-encre hover:bg-papier"
                    >
                      {categorie.label}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <Link to="/map" className="text-meta text-white/80 hover:text-white">carte</Link>

          {estAdmin && (
            <Link to="/admin" className="text-meta text-white/60 hover:text-white">administration</Link>
          )}
        </div>

        <div className="flex items-center gap-4">
          <NavbarRecherche />

          {connecte ? (
            <Link
              to="/profile"
              aria-label="réglages du compte"
              className="flex w-11 items-center justify-center text-white"
            >
              <Reglages />
            </Link>
          ) : (
            <div className="hidden items-center gap-4 md:flex">
              <Link to="/login" className="flex items-center text-meta text-white/80 hover:text-white">
                connexion
              </Link>
              <Link
                to="/register"
                className="flex items-center border border-white/40 px-4 text-meta text-white"
              >
                s'inscrire
              </Link>
            </div>
          )}

          <button
            type="button"
            aria-expanded={menuOuvert}
            aria-label={menuOuvert ? "fermer le menu" : "ouvrir le menu"}
            onClick={() => setMenuOuvert((ouvert) => !ouvert)}
            className="flex w-11 flex-col items-center justify-center gap-1.5 md:hidden"
          >
            <span className="block h-px w-5 bg-white" />
            <span className="block h-px w-5 bg-white" />
            <span className="block h-px w-5 bg-white" />
          </button>
        </div>
      </nav>

      {menuOuvert && (
        <NavbarMenuMobile
          categories={CATEGORIES}
          connecte={connecte}
          estAdmin={estAdmin}
          onFermer={() => setMenuOuvert(false)}
        />
      )}
    </>
  );
}

import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import NavbarRecherche from "./NavbarRecherche";
import NavbarMenuMobile from "./NavbarMenuMobile";
import Reglages from "../icons/Reglages";
import Chevron from "../icons/Chevron";

const CATEGORIES = [
  { label: "Toutes Les Adresses", href: "/cafes" },
  { label: "Café", href: "/category/Café" },
  { label: "Matcha", href: "/category/Matcha" },
  { label: "Bubble Tea", href: "/category/Bubble Tea" },
  { label: "Thé", href: "/category/Thé" }
];

const LIEN = "flex items-center rounded-carte px-3 text-corps text-white/80 hover:bg-white/10 hover:text-white";

export default function Navbar() {
  const { connecte, estAdmin } = useAuth();
  const [menuOuvert, setMenuOuvert] = useState(false);
  const [categoriesOuvertes, setCategoriesOuvertes] = useState(false);

  return (
    <>
      {/* Trois zones sur une grille plutôt qu'un `justify-between` : le groupe
          du milieu reste centré sur la page même quand les groupes de gauche et
          de droite n'ont pas la même largeur — ce qui est toujours le cas, la
          barre changeant selon qu'on est connecté ou administrateur. */}
      <nav className="fixed top-0 z-50 grid h-16 w-full grid-cols-[1fr_auto_1fr] items-center gap-4 border-b border-white/10 bg-plaque px-6 text-white">
        {/* La plaque est le logo. Éclaircie pour se détacher de la barre :
            vert foncé sur vert foncé, il ne resterait que son liseré. */}
        <Link to="/" className="plaque plaque-sur-fonce justify-self-start">Spotheplace</Link>

        <div className="hidden items-center justify-self-center md:flex">
          <Link to="/" className={LIEN}>Accueil</Link>

          <div className="relative">
            <button
              type="button"
              aria-expanded={categoriesOuvertes}
              onClick={() => setCategoriesOuvertes((ouvert) => !ouvert)}
              className={`${LIEN} gap-1.5`}
            >
              Spécialités
              <Chevron ouvert={categoriesOuvertes} />
            </button>

            {categoriesOuvertes && (
              <ul className="absolute left-1/2 top-full z-50 mt-2 w-56 -translate-x-1/2 rounded-barre border border-trait bg-carte p-1">
                {CATEGORIES.map((categorie) => (
                  <li key={categorie.href}>
                    <Link
                      to={categorie.href}
                      onClick={() => setCategoriesOuvertes(false)}
                      className="flex items-center rounded-carte px-3 text-corps text-encre hover:bg-papier"
                    >
                      {categorie.label}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <Link to="/map" className={LIEN}>Carte</Link>

          {estAdmin && <Link to="/admin" className={LIEN}>Administration</Link>}
        </div>

        {/* Les actions se regroupent à droite, séparées des liens : on ne
            navigue pas et on n'agit pas au même endroit. */}
        <div className="flex items-center gap-1 justify-self-end">
          <NavbarRecherche />

          {connecte ? (
            <Link
              to="/profile"
              aria-label="Réglages Du Compte"
              className="flex w-11 items-center justify-center rounded-carte text-white hover:bg-white/10"
            >
              <Reglages />
            </Link>
          ) : (
            <div className="hidden items-center gap-2 md:flex">
              <Link to="/login" className={LIEN}>Connexion</Link>
              <Link
                to="/register"
                className="flex min-h-11 items-center rounded-carte border border-white/40 px-4 text-corps text-white hover:bg-white/10"
              >
                s&apos;inscrire
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

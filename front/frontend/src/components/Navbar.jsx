import { useCallback, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useFermeture } from "../hooks/useFermeture";
import { useAuth } from "../hooks/useAuth";
import NavbarRecherche from "./NavbarRecherche";
import Loupe from "../icons/Loupe";
import NavbarMenuMobile from "./NavbarMenuMobile";
import Reglages from "../icons/Reglages";
import Chevron from "../icons/Chevron";

const CATEGORIES = [
  { label: "toutes les adresses", href: "/cafes" },
  { label: "café", href: "/category/Café" },
  { label: "matcha", href: "/category/Matcha" },
  { label: "bubble tea", href: "/category/Bubble Tea" },
  { label: "thé", href: "/category/Thé" }
];

// Le filet transparent réserve la place de celui de l'état actif : sans lui,
// chaque lien se décalerait de deux pixels en devenant courant.
const LIEN = "flex items-center rounded-plaque border-b-2 border-transparent px-3 text-corps font-bold text-encre/70 hover:bg-papier hover:text-encre";
const LIEN_ACTIF = "flex items-center rounded-plaque border-b-2 border-encre px-3 text-corps font-bold text-encre";

const etatLien = ({ isActive }) => (isActive ? LIEN_ACTIF : LIEN);

export default function Navbar() {
  const { connecte, estAdmin } = useAuth();
  const { pathname } = useLocation();
  const [menuOuvert, setMenuOuvert] = useState(false);
  const [categoriesOuvertes, setCategoriesOuvertes] = useState(false);
  const [rechercheOuverte, setRechercheOuverte] = useState(false);
  const zoneCategories = useRef(null);

  const fermerCategories = useCallback(() => setCategoriesOuvertes(false), []);
  useFermeture(categoriesOuvertes, zoneCategories, fermerCategories);

  // Changer de page ferme tout : un panneau resté ouvert par-dessus le nouvel
  // écran est un panneau qu'on n'a pas demandé. Ajusté pendant le rendu plutôt
  // que dans un effet — React réexécute alors le composant avant de peindre,
  // sans le rendu intermédiaire où le panneau serait encore ouvert.
  const [cheminPrecedent, setCheminPrecedent] = useState(pathname);

  if (pathname !== cheminPrecedent) {
    setCheminPrecedent(pathname);
    setCategoriesOuvertes(false);
    setMenuOuvert(false);
    setRechercheOuverte(false);
  }

  const surUneCategorie = pathname.startsWith("/category/");

  return (
    <>
      {/* Entête claire et translucide (DA révisée du 2026-09-05) : la barre
          sombre pleine largeur cède la place à un bandeau crème qui laisse
          voir le fond de page derrière lui. */}
      <nav className="fixed top-0 z-50 flex h-20 w-full items-center gap-6 bg-carte/90 px-6 shadow-barre backdrop-blur-md">
        <Link to="/" className="shrink-0 text-2xl font-extrabold tracking-tight text-encre">
          spottheplace
        </Link>

        <div className="hidden flex-1 md:block">
          <NavbarRecherche />
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <div className="relative" ref={zoneCategories}>
            <button
              type="button"
              aria-expanded={categoriesOuvertes}
              onClick={() => setCategoriesOuvertes((ouvert) => !ouvert)}
              className={`${surUneCategorie ? LIEN_ACTIF : LIEN} gap-1.5`}
            >
              spécialités
              <Chevron ouvert={categoriesOuvertes} />
            </button>

            {categoriesOuvertes && (
              <ul className="absolute left-1/2 top-full z-50 mt-2 flex w-56 -translate-x-1/2 flex-col gap-1 rounded-barre border border-trait bg-carte p-1 shadow-carte">
                {CATEGORIES.map((categorie) => (
                  <li key={categorie.href}>
                    <Link
                      to={categorie.href}
                      onClick={() => setCategoriesOuvertes(false)}
                      className="flex items-center rounded-plaque px-3 py-2.5 text-corps text-encre hover:bg-papier"
                    >
                      {categorie.label}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <NavLink to="/cafes" className={etatLien}>le guide</NavLink>
          <NavLink to="/map" className={etatLien}>la carte</NavLink>
          {connecte && <NavLink to="/profile" className={etatLien}>mes favoris</NavLink>}
          {estAdmin && <NavLink to="/admin" className={etatLien}>administration</NavLink>}
        </div>

        {/* `ml-auto` : sur téléphone la recherche n'occupe plus le milieu, et
            sans lui les boutons se collaient au logo. */}
        <div className="ml-auto flex items-center gap-2 md:ml-0">
          <button
            type="button"
            aria-expanded={rechercheOuverte}
            aria-label={rechercheOuverte ? "fermer la recherche" : "chercher une adresse"}
            onClick={() => { setRechercheOuverte((ouverte) => !ouverte); setMenuOuvert(false); }}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-trait-fort text-encre md:hidden"
          >
            <Loupe />
          </button>

          {connecte ? (
            <Link
              to="/profile"
              aria-label="réglages du compte"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-the-vif to-bubbletea-vif text-encre shadow-carte"
            >
              <Reglages />
            </Link>
          ) : (
            <div className="hidden items-center gap-2 md:flex">
              <NavLink to="/login" className={etatLien}>connexion</NavLink>
              <Link to="/register" className="bouton-secondaire">
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
            <span className="block h-px w-5 bg-encre" />
            <span className="block h-px w-5 bg-encre" />
            <span className="block h-px w-5 bg-encre" />
          </button>
        </div>
      </nav>

      {/* La recherche du téléphone : elle était absente sous `md`, sur un site
          fait pour être consulté dans la rue. */}
      {rechercheOuverte && (
        <div className="fixed inset-x-0 top-20 z-40 bg-carte px-4 pb-3 pt-1 shadow-barre md:hidden">
          <NavbarRecherche idChamp="recherche-guide-mobile" autoFocus />
        </div>
      )}

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

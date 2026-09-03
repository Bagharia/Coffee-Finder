import { useCallback, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useFermeture } from "../hooks/useFermeture";
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

// Le filet transparent réserve la place de celui de l'état actif : sans lui,
// chaque lien se décalerait de deux pixels en devenant courant.
const LIEN = "flex items-center rounded-carte border-b-2 border-transparent px-3 text-corps text-white/80 hover:bg-white/10 hover:text-white";

// La page courante se marque par un filet, pas par un fond translucide : aucune
// valeur de blanc transparent ne satisfait les deux contraintes à la fois — à
// 15 % le fond n'est pas visible (1,55:1, seuil 3), et à 45 % il l'est mais le
// texte blanc dessus tombe à 3,05:1, sous le seuil de 4,5 pour du texte
// courant. Un filet blanc, lui, est à 10,79:1 et ne touche pas au texte.
const LIEN_ACTIF = "flex items-center rounded-carte border-b-2 border-white px-3 text-corps text-white";

const etatLien = ({ isActive }) => (isActive ? LIEN_ACTIF : LIEN);

export default function Navbar() {
  const { connecte, estAdmin } = useAuth();
  const { pathname } = useLocation();
  const [menuOuvert, setMenuOuvert] = useState(false);
  const [categoriesOuvertes, setCategoriesOuvertes] = useState(false);
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
  }

  // « Spécialités » n'est pas un lien mais il mène quelque part : il se marque
  // actif quand on lit une catégorie.
  const surUneCategorie = pathname.startsWith("/category/");

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
          <NavLink to="/" end className={etatLien}>Accueil</NavLink>

          <div className="relative" ref={zoneCategories}>
            <button
              type="button"
              aria-expanded={categoriesOuvertes}
              onClick={() => setCategoriesOuvertes((ouvert) => !ouvert)}
              className={`${surUneCategorie ? LIEN_ACTIF : LIEN} gap-1.5`}
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

          <NavLink to="/map" className={etatLien}>Carte</NavLink>

          {estAdmin && <NavLink to="/admin" className={etatLien}>Administration</NavLink>}
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
              <NavLink to="/login" className={etatLien}>Connexion</NavLink>
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

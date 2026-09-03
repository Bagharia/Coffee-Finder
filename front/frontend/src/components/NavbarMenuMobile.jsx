import { Link } from "react-router-dom";

/** Tiroir de navigation mobile. Fermé par défaut, ouvert par la barre. */
export default function NavbarMenuMobile({ categories, connecte, estAdmin, onFermer }) {
  return (
    <div className="fixed inset-0 z-40 md:hidden">
      {/* Fond cliquable : c'est une action, donc un bouton, pas un div. */}
      <button
        type="button"
        aria-label="fermer le menu"
        onClick={onFermer}
        className="absolute inset-0 w-full bg-encre/40"
      />

      <nav className="absolute right-0 top-0 flex h-full w-72 flex-col gap-6 border-l border-trait bg-papier p-8 pt-20">
        <Link to="/" onClick={onFermer} className="text-adresse text-encre">accueil</Link>

        <div className="border-t border-trait pt-4">
          <p className="mb-3 text-meta text-gris">spécialités</p>
          <ul className="flex flex-col">
            {categories.map((categorie) => (
              <li key={categorie.href}>
                <Link
                  to={categorie.href}
                  onClick={onFermer}
                  className="flex items-center text-encre"
                >
                  {categorie.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <Link to="/map" onClick={onFermer} className="text-adresse text-encre">carte</Link>

        {estAdmin && (
          <Link to="/admin" onClick={onFermer} className="text-meta text-gris">administration</Link>
        )}

        <div className="mt-auto flex flex-col gap-3">
          {connecte ? (
            <Link
              to="/profile"
              onClick={onFermer}
              className="flex items-center justify-center border border-trait-fort px-4 text-encre"
            >
              mon profil
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                onClick={onFermer}
                className="flex items-center justify-center border border-trait-fort px-4 text-encre"
              >
                connexion
              </Link>
              <Link
                to="/register"
                onClick={onFermer}
                className="flex items-center justify-center bg-plaque px-4 text-white"
              >
                s'inscrire
              </Link>
            </>
          )}
        </div>
      </nav>
    </div>
  );
}

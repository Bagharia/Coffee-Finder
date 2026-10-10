import { useState } from "react";

/**
 * Recherche de la liste d'administration. Elle part au serveur à la validation :
 * la liste ne montre qu'une page, filtrer cette page ferait croire qu'une
 * adresse absente n'existe pas.
 */
export default function AdminRecherche({ recherche, onRechercher }) {
  const [saisie, setSaisie] = useState(recherche);

  return (
    <form
      role="search"
      onSubmit={(e) => { e.preventDefault(); onRechercher(saisie.trim()); }}
      className="mt-6 flex flex-wrap items-center gap-3"
    >
      <label className="sr-only" htmlFor="admin-recherche">chercher une adresse</label>
      <input
        id="admin-recherche"
        type="search"
        value={saisie}
        maxLength={100}
        onChange={(e) => setSaisie(e.target.value)}
        placeholder="chercher par nom, adresse, verdict…"
        className="min-w-0 flex-1 rounded-plaque border border-trait-fort bg-carte px-4 text-corps text-encre"
      />
      <button type="submit" className="bouton-secondaire">chercher</button>
      {recherche && (
        <button
          type="button"
          onClick={() => { setSaisie(""); onRechercher(""); }}
          className="flex items-center text-meta text-gris underline underline-offset-4"
        >
          effacer
        </button>
      )}
    </form>
  );
}

// Couleur par catégorie (DA révisée du 2026-09-05). Partagé entre CafeCard et
// les cartes compactes de l'accueil pour ne pas dupliquer le mappage.
const CLASSE_CATEGORIE = {
  "café": "cafe",
  "matcha": "matcha",
  "bubble tea": "bubble-tea",
  "thé": "the"
};

/** Une catégorie non reconnue retombe sur `null` (motif/étiquette neutre). */
export const classeCategorie = (categorie) => CLASSE_CATEGORIE[categorie?.toLowerCase()] ?? null;

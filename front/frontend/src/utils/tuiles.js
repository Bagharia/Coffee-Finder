// Fond de carte. Un seul endroit décide d'où viennent les tuiles et de ce
// qu'on doit en dire : l'attribution est une obligation de licence, pas un
// détail d'affichage, et elle doit suivre le fournisseur.

const OSM = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

// Clé CARTO, lue à la compilation. Elle finit dans le JavaScript servi au
// navigateur : c'est une clé publique par nature, pas un secret.
const CLE_CARTO = import.meta.env.VITE_CARTO_CLE;

// Deux styles possibles, à changer ici seulement :
//   "rastertiles/voyager" — Voyager : fond crème, parcs verts, axes jaunes.
//   "light_all"           — Positron : gris clair, presque sans couleur.
const STYLE_CARTO = "rastertiles/voyager";

/**
 * CARTO exige une clé depuis l'automne 2026 : sans elle, chaque tuile est une
 * image vide marquée « API KEY REQUIRED » — une carte blanche, sans erreur.
 * Tant que la clé n'est pas renseignée, on garde donc les tuiles
 * OpenStreetMap : moins sobres, mais une carte qui s'affiche.
 *
 * `{r}` devient `@2x` sur un écran haute densité (Leaflet s'en charge).
 */
export const TUILES = CLE_CARTO
  ? {
      url: `https://basemaps.cartocdn.com/${STYLE_CARTO}/{z}/{x}/{y}{r}.png?key=${encodeURIComponent(CLE_CARTO)}`,
      attribution: `${OSM}, &copy; <a href="https://carto.com/attributions">CARTO</a>`,
      maxZoom: 20
    }
  : {
      url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      attribution: OSM,
      maxZoom: 19
    };

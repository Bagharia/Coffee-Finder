import { useEffect } from "react";

const TITRE_DEFAUT = "SpotThePlace — cafés, salons de thé et bubble tea de Paris";
const LONGUEUR_DESCRIPTION = 155;

/** Coupe proprement à la limite des mots : les moteurs tronquent au-delà de ~160 signes. */
export function resumer(texte, max = LONGUEUR_DESCRIPTION) {
  const propre = String(texte ?? "").replace(/\s+/g, " ").trim();
  if (propre.length <= max) return propre;
  return `${propre.slice(0, max).replace(/\s+\S*$/, "")}…`;
}

/**
 * Titre de l'onglet et description de la page.
 *
 * Le site est une SPA : sans ça, toutes les pages portent le titre de
 * `index.html`, dans l'onglet, l'historique et les résultats de recherche.
 * Au démontage, les valeurs d'origine reviennent — la page suivante pose les
 * siennes, et une page sans titre propre retombe sur celui du site.
 *
 * Limite : ça ne sert qu'aux lecteurs qui exécutent le JavaScript (navigateurs,
 * Google). Les aperçus de partage (WhatsApp, Instagram) lisent le HTML brut et
 * ne verront pas ces valeurs.
 *
 * @param {string} [titre] vide = titre par défaut du site
 * @param {string} [description]
 */
export function useTitrePage(titre, description) {
  useEffect(() => {
    const meta = document.querySelector('meta[name="description"]');
    const descriptionAvant = meta?.getAttribute("content");

    document.title = titre ? `${titre} — SpotThePlace` : TITRE_DEFAUT;
    if (meta && description) meta.setAttribute("content", description);

    return () => {
      document.title = TITRE_DEFAUT;
      if (meta && descriptionAvant != null) meta.setAttribute("content", descriptionAvant);
    };
  }, [titre, description]);
}

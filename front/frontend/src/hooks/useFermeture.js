import { useEffect } from "react";

/**
 * Ferme un panneau quand on clique à côté ou qu'on appuie sur Échap.
 *
 * Un panneau qui ne se ferme que par le bouton qui l'a ouvert oblige à revenir
 * le chercher : on clique ailleurs, il reste là, posé au-dessus du contenu.
 * Les deux gestes sont attendus et ni l'un ni l'autre n'était implémenté.
 *
 * `mousedown` et non `click` : un clic sur un lien du panneau déclencherait la
 * navigation puis la fermeture, dans cet ordre — avec `click`, le panneau
 * disparaîtrait sous le curseur avant que le lien reçoive l'événement.
 *
 * @param {boolean} actif n'écoute que quand le panneau est ouvert
 * @param {React.RefObject} zone l'élément à considérer comme « à l'intérieur »
 * @param {() => void} fermer
 */
export function useFermeture(actif, zone, fermer) {
  useEffect(() => {
    if (!actif) return;

    const auClic = (e) => {
      if (!zone.current?.contains(e.target)) fermer();
    };

    const auClavier = (e) => {
      if (e.key === "Escape") fermer();
    };

    document.addEventListener("mousedown", auClic);
    document.addEventListener("keydown", auClavier);

    return () => {
      document.removeEventListener("mousedown", auClic);
      document.removeEventListener("keydown", auClavier);
    };
  }, [actif, zone, fermer]);
}

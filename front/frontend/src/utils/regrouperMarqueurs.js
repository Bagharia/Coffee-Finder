/**
 * Regroupement des marqueurs de la carte.
 *
 * Au-delà d'une quarantaine de plaques visibles, le rendu s'effondre sur mobile
 * et la carte devient illisible. On projette alors chaque adresse en pixels au
 * niveau de zoom courant, on répartit dans une grille, et toute case contenant
 * plusieurs adresses devient un groupe.
 *
 * Écrit à la main plutôt qu'avec une bibliothèque de clustering : la stack tient
 * en une page, une lib de plus est une dette de plus.
 */

const SEUIL_REGROUPEMENT = 40;
const COTE_CELLULE_PX = 90;

/** Une adresse n'est plaçable que si le géocodage a abouti. */
export const estPlacable = (cafe) =>
  cafe.latitude !== null && cafe.longitude !== null &&
  Number.isFinite(Number(cafe.latitude)) && Number.isFinite(Number(cafe.longitude));

export const coordonnees = (cafe) => [Number(cafe.latitude), Number(cafe.longitude)];

/**
 * @returns {Array<{ cle: string, position: [number, number], adresses: object[] }>}
 *   Une entrée par marqueur à afficher. `adresses` contient une seule adresse
 *   pour un marqueur simple, plusieurs pour un groupe.
 */
export function regrouperMarqueurs(map, adresses) {
  const placables = adresses.filter(estPlacable);

  const bornes = map.getBounds();
  const visibles = placables.filter((cafe) => bornes.contains(coordonnees(cafe)));

  // Sous le seuil, chaque adresse garde sa plaque et son nom : c'est tout
  // l'intérêt de la carte.
  if (visibles.length <= SEUIL_REGROUPEMENT) {
    return placables.map((cafe) => ({
      cle: `adresse-${cafe.id}`,
      position: coordonnees(cafe),
      adresses: [cafe]
    }));
  }

  const zoom = map.getZoom();
  const cases = new Map();

  for (const cafe of placables) {
    const point = map.project(coordonnees(cafe), zoom);
    const colonne = Math.floor(point.x / COTE_CELLULE_PX);
    const ligne = Math.floor(point.y / COTE_CELLULE_PX);
    const cle = `${colonne}:${ligne}`;

    const existante = cases.get(cle);
    if (existante) existante.push(cafe);
    else cases.set(cle, [cafe]);
  }

  return Array.from(cases, ([cle, groupe]) => {
    if (groupe.length === 1) {
      return {
        cle: `adresse-${groupe[0].id}`,
        position: coordonnees(groupe[0]),
        adresses: groupe
      };
    }

    // Le groupe se pose au barycentre de ses adresses, pas au centre de la
    // case : sinon il flotte à côté de ce qu'il représente.
    const somme = groupe.reduce(
      (acc, cafe) => {
        const [lat, lon] = coordonnees(cafe);
        return [acc[0] + lat, acc[1] + lon];
      },
      [0, 0]
    );

    return {
      cle: `groupe-${cle}`,
      position: [somme[0] / groupe.length, somme[1] / groupe.length],
      adresses: groupe
    };
  });
}

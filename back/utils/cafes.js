const db = require('../config/db');

// Liste de colonnes partagée par toutes les requêtes qui renvoient des
// adresses. Elle vivait en double — une copie dans cafeController, une autre
// dans favoriController — et la migration 006 n'en a corrigé qu'une : la page
// des favoris répondait 500 sur une colonne disparue. Une seule définition.
//
// Jamais de `SELECT *` ici : `cafes` et `criteres_cafe` ont toutes les deux une
// colonne `id`, et mysql2 écrase la première par la seconde.
const COLONNES_CAFE = `
    cafes.id AS id,
    cafes.nom AS nom,
    cafes.arrondissement AS arrondissement,
    cafes.adresse AS adresse,
    cafes.description AS description,
    cafes.image_url AS image_url,
    cafes.latitude AS latitude,
    cafes.longitude AS longitude,
    cafes.verdict AS verdict,
    cafes.coup_de_coeur AS coup_de_coeur,
    cafes.created_at AS created_at,
    cafes.updated_at AS updated_at,
    criteres_cafe.id AS critere_id,
    criteres_cafe.nb_personnes AS nb_personnes,
    criteres_cafe.specialite AS specialite,
    criteres_cafe.prix AS prix,
    criteres_cafe.wifi AS wifi,
    criteres_cafe.prises AS prises,
    criteres_cafe.travailler AS travailler,
    criteres_cafe.theme AS theme,
    criteres_cafe.ambiance AS ambiance
`;

const JOINTURE = 'FROM cafes JOIN criteres_cafe ON cafes.id = criteres_cafe.cafe_id';

/**
 * Rattache les horaires aux adresses déjà lues.
 *
 * Ils ne peuvent pas entrer dans la jointure principale : une adresse ouverte
 * sept jours multiplierait sa ligne par sept, et la pagination compterait des
 * plages au lieu d'adresses. Une seule requête pour toute la page.
 */
async function attacherHoraires(cafes) {
    if (cafes.length === 0) return cafes;

    const ids = cafes.map((cafe) => cafe.id);
    const [plages] = await db.query(
        'SELECT cafe_id, jour, ouverture, fermeture FROM cafe_horaires WHERE cafe_id IN (?) ORDER BY jour, ouverture',
        [ids]
    );

    const parCafe = new Map(ids.map((id) => [id, []]));
    for (const { cafe_id, jour, ouverture, fermeture } of plages) {
        parCafe.get(cafe_id)?.push({ jour, ouverture, fermeture });
    }

    for (const cafe of cafes) {
        cafe.horaires = parCafe.get(cafe.id) ?? [];
    }

    return cafes;
}

// Remplace en bloc plutôt que de différencier : une poignée de lignes par
// adresse, et un remplacement ne peut pas laisser d'état intermédiaire.
// `executeur` : la connexion d'une transaction en cours, sinon le pool.
async function remplacerHoraires(cafeId, plages, executeur = db) {
    await executeur.query('DELETE FROM cafe_horaires WHERE cafe_id = ?', [cafeId]);

    if (plages.length === 0) return;

    await executeur.query(
        'INSERT INTO cafe_horaires (cafe_id, jour, ouverture, fermeture) VALUES ?',
        [plages.map((p) => [cafeId, p.jour, p.ouverture, p.fermeture])]
    );
}

module.exports = { COLONNES_CAFE, JOINTURE, attacherHoraires, remplacerHoraires };

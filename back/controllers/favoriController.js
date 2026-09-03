const db = require('../config/db');
const { lirePagination, reponsePaginee } = require('../utils/validation');
const journal = require('../utils/journal');

const echec = (res, err, contexte) => {
    journal.erreur(`[favoris] ${contexte} :`, err);
    return res.status(500).json({ error: 'Erreur serveur' });
};

// POST /api/favoris/:cafeId
exports.addFavori = async (req, res) => {
    const userId = req.user.userId;
    const cafeId = req.params.cafeId;

    try {
        const [cafe] = await db.query('SELECT id FROM cafes WHERE id = ?', [cafeId]);
        if (cafe.length === 0) {
            return res.status(404).json({ error: 'Cette adresse n\'existe pas.' });
        }

        const [existant] = await db.query(
            'SELECT id FROM favoris WHERE user_id = ? AND cafe_id = ?',
            [userId, cafeId]
        );

        if (existant.length > 0) {
            return res.status(409).json({ error: 'Cette adresse est déjà dans vos favoris.' });
        }

        await db.query(
            'INSERT INTO favoris (user_id, cafe_id) VALUES (?, ?)',
            [userId, cafeId]
        );

        return res.status(201).json({ message: 'Adresse ajoutée aux favoris.', cafeId: Number(cafeId) });
    } catch (err) {
        return echec(res, err, 'ajout d\'un favori');
    }
};

// DELETE /api/favoris/:cafeId
exports.removeFavori = async (req, res) => {
    const userId = req.user.userId;
    const cafeId = req.params.cafeId;

    try {
        const [result] = await db.query(
            'DELETE FROM favoris WHERE user_id = ? AND cafe_id = ?',
            [userId, cafeId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Cette adresse n\'est pas dans vos favoris.' });
        }

        return res.json({ message: 'Adresse retirée des favoris.', cafeId: Number(cafeId) });
    } catch (err) {
        return echec(res, err, 'retrait d\'un favori');
    }
};

// GET /api/favoris — les favoris de l'utilisateur connecté, paginés
exports.getUserFavoris = async (req, res) => {
    const userId = req.user.userId;
    const { page, limite, offset } = lirePagination(req.query);

    try {
        const [[{ total }]] = await db.query(
            'SELECT COUNT(*) AS total FROM favoris WHERE user_id = ?',
            [userId]
        );

        // Colonnes listées et aliasées : cafes.id et criteres_cafe.id
        // s'écraseraient l'une l'autre sur un SELECT *.
        const [rows] = await db.query(
            `SELECT cafes.id AS id,
                    cafes.nom AS nom,
                    cafes.arrondissement AS arrondissement,
                    cafes.adresse AS adresse,
                    cafes.description AS description,
                    cafes.image_url AS image_url,
                    cafes.latitude AS latitude,
                    cafes.longitude AS longitude,
                    cafes.verdict AS verdict,
                    cafes.coup_de_coeur AS coup_de_coeur,
                    criteres_cafe.id AS critere_id,
                    criteres_cafe.nb_personnes AS nb_personnes,
                    criteres_cafe.horaires AS horaires,
                    criteres_cafe.specialite AS specialite,
                    criteres_cafe.prix AS prix,
                    criteres_cafe.wifi AS wifi,
                    criteres_cafe.prises AS prises,
                    criteres_cafe.travailler AS travailler,
                    criteres_cafe.theme AS theme,
                    criteres_cafe.ambiance AS ambiance,
                    favoris.created_at AS favori_date
             FROM favoris
             JOIN cafes ON favoris.cafe_id = cafes.id
             JOIN criteres_cafe ON cafes.id = criteres_cafe.cafe_id
             WHERE favoris.user_id = ?
             ORDER BY favoris.created_at DESC
             LIMIT ? OFFSET ?`,
            [userId, limite, offset]
        );

        return res.json(reponsePaginee(rows, { page, limite }, total));
    } catch (err) {
        return echec(res, err, 'lecture des favoris');
    }
};

// GET /api/favoris/:cafeId/check
exports.checkFavori = async (req, res) => {
    const userId = req.user.userId;
    const cafeId = req.params.cafeId;

    try {
        const [existant] = await db.query(
            'SELECT id FROM favoris WHERE user_id = ? AND cafe_id = ?',
            [userId, cafeId]
        );

        return res.json({ isFavorite: existant.length > 0 });
    } catch (err) {
        return echec(res, err, 'vérification d\'un favori');
    }
};

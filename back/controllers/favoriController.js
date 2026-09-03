const db = require('../config/db');
const { lirePagination, reponsePaginee } = require('../utils/validation');
const journal = require('../utils/journal');
const { COLONNES_CAFE, attacherHoraires } = require('../utils/cafes');

const echec = (res, err, contexte) => {
    journal.erreur(`[favoris] ${contexte} :`, err);
    return res.status(500).json({ error: 'Erreur serveur' });
};

// POST /api/favoris/:cafeId
exports.addFavori = async (req, res) => {
    const userId = req.user.userId;
    const cafeId = req.params.cafeId;

    try {
        // Une adresse en corbeille n'existe plus pour les visiteurs.
        const [cafe] = await db.query('SELECT id FROM cafes WHERE id = ? AND supprime_le IS NULL', [cafeId]);
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
            `SELECT COUNT(*) AS total
             FROM favoris
             JOIN cafes ON favoris.cafe_id = cafes.id
             WHERE favoris.user_id = ? AND cafes.supprime_le IS NULL`,
            [userId]
        );

        const [rows] = await db.query(
            `SELECT ${COLONNES_CAFE},
                    favoris.created_at AS favori_date
             FROM favoris
             JOIN cafes ON favoris.cafe_id = cafes.id
             JOIN criteres_cafe ON cafes.id = criteres_cafe.cafe_id
             WHERE favoris.user_id = ? AND cafes.supprime_le IS NULL
             ORDER BY favoris.created_at DESC
             LIMIT ? OFFSET ?`,
            [userId, limite, offset]
        );

        await attacherHoraires(rows);

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

const db = require('../config/db');
const { lirePagination, reponsePaginee, valider } = require('../utils/validation');

const echec = (res, err, contexte) => {
    console.error(`[avis] ${contexte} :`, err);
    return res.status(500).json({ error: 'Erreur serveur' });
};

// GET /api/avis/:cafeId — avis d'une adresse, paginés
exports.getAvisByCafe = async (req, res) => {
    const { cafeId } = req.params;
    const { page, limite, offset } = lirePagination(req.query);

    try {
        // La moyenne se calcule sur l'ensemble des avis, pas sur la page
        // affichée : la faire en JS sur `rows` la rendrait fausse dès la page 2.
        const [[agregat]] = await db.query(
            'SELECT COUNT(*) AS total, AVG(note) AS moyenne FROM avis WHERE cafe_id = ?',
            [cafeId]
        );

        const [rows] = await db.query(
            `SELECT avis.id AS id,
                    avis.note AS note,
                    avis.commentaire AS commentaire,
                    avis.created_at AS created_at,
                    avis.user_id AS user_id,
                    users.username AS username
             FROM avis
             JOIN users ON avis.user_id = users.id
             WHERE avis.cafe_id = ?
             ORDER BY avis.created_at DESC
             LIMIT ? OFFSET ?`,
            [cafeId, limite, offset]
        );

        return res.json({
            ...reponsePaginee(rows, { page, limite }, agregat.total),
            moyenne: agregat.moyenne === null ? null : Number(Number(agregat.moyenne).toFixed(1))
        });
    } catch (err) {
        return echec(res, err, 'lecture des avis');
    }
};

// POST /api/avis/:cafeId — ajouter ou modifier son avis
exports.addOrUpdateAvis = async (req, res) => {
    const erreurs = valider(req.body, {
        note: { requis: true, type: 'entier', min: 1, max: 5 },
        commentaire: { max: 2000 }
    });

    if (erreurs.length > 0) {
        return res.status(400).json({ error: erreurs.join(' ') });
    }

    const userId = req.user.userId;
    const { cafeId } = req.params;
    const { note, commentaire } = req.body;

    try {
        const [cafe] = await db.query('SELECT id FROM cafes WHERE id = ?', [cafeId]);
        if (cafe.length === 0) {
            return res.status(404).json({ error: 'Cette adresse n\'existe pas.' });
        }

        // Repose sur l'index UNIQUE(user_id, cafe_id) posé par la migration 003.
        await db.query(
            `INSERT INTO avis (user_id, cafe_id, note, commentaire)
             VALUES (?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE note = VALUES(note), commentaire = VALUES(commentaire)`,
            [userId, cafeId, Number(note), commentaire || null]
        );

        const [rows] = await db.query(
            'SELECT id, note, commentaire, created_at FROM avis WHERE user_id = ? AND cafe_id = ?',
            [userId, cafeId]
        );

        return res.status(201).json(rows[0]);
    } catch (err) {
        return echec(res, err, 'enregistrement d\'un avis');
    }
};

// DELETE /api/avis/:cafeId — supprimer son avis
exports.deleteAvis = async (req, res) => {
    const userId = req.user.userId;
    const { cafeId } = req.params;

    try {
        const [result] = await db.query(
            'DELETE FROM avis WHERE user_id = ? AND cafe_id = ?',
            [userId, cafeId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Vous n\'avez pas d\'avis sur cette adresse.' });
        }

        return res.json({ message: 'Avis supprimé.' });
    } catch (err) {
        return echec(res, err, 'suppression d\'un avis');
    }
};

// GET /api/avis/:cafeId/mine — son propre avis
exports.getMyAvis = async (req, res) => {
    const userId = req.user.userId;
    const { cafeId } = req.params;

    try {
        const [rows] = await db.query(
            'SELECT id, note, commentaire, created_at FROM avis WHERE user_id = ? AND cafe_id = ?',
            [userId, cafeId]
        );

        // Pas d'avis n'est pas une erreur : l'écran affiche le formulaire vide.
        return res.json(rows[0] || null);
    } catch (err) {
        return echec(res, err, 'lecture de son avis');
    }
};

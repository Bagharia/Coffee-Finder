const db = require('../config/db');

// GET /api/avis/:cafeId — tous les avis d'un café
exports.getAvisByCafe = async (req, res) => {
    try {
        const { cafeId } = req.params;
        const [rows] = await db.query(
            `SELECT avis.*, users.username
             FROM avis
             JOIN users ON avis.user_id = users.id
             WHERE avis.cafe_id = ?
             ORDER BY avis.created_at DESC`,
            [cafeId]
        );
        // Calcul note moyenne
        const moyenne = rows.length > 0
            ? (rows.reduce((sum, a) => sum + a.note, 0) / rows.length).toFixed(1)
            : null;
        res.json({ avis: rows, moyenne: moyenne ? parseFloat(moyenne) : null, total: rows.length });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

// POST /api/avis/:cafeId — ajouter ou modifier son avis
exports.addOrUpdateAvis = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { cafeId } = req.params;
        const { note, commentaire } = req.body;

        if (!note || note < 1 || note > 5) {
            return res.status(400).json({ error: 'Note invalide (1-5)' });
        }

        // Vérifier si le café existe
        const [cafe] = await db.query('SELECT id FROM cafes WHERE id = ?', [cafeId]);
        if (cafe.length === 0) return res.status(404).json({ error: 'Café introuvable' });

        // Upsert — insert ou update si déjà noté
        await db.query(
            `INSERT INTO avis (user_id, cafe_id, note, commentaire)
             VALUES (?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE note = VALUES(note), commentaire = VALUES(commentaire)`,
            [userId, cafeId, note, commentaire || null]
        );

        res.status(201).json({ message: 'Avis enregistré' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

// DELETE /api/avis/:cafeId — supprimer son avis
exports.deleteAvis = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { cafeId } = req.params;

        const [result] = await db.query(
            'DELETE FROM avis WHERE user_id = ? AND cafe_id = ?',
            [userId, cafeId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Avis introuvable' });
        }

        res.json({ message: 'Avis supprimé' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

// GET /api/avis/:cafeId/mine — récupérer son propre avis
exports.getMyAvis = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { cafeId } = req.params;

        const [rows] = await db.query(
            'SELECT * FROM avis WHERE user_id = ? AND cafe_id = ?',
            [userId, cafeId]
        );

        res.json(rows[0] || null);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

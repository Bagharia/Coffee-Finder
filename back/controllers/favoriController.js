const db = require('../config/db');

// Ajouter un café aux favoris
exports.addFavori = async (req, res) => {
    try {
        const userId = req.user.userId;
        const cafeId = req.params.cafeId;

        // Vérifier si le café existe
        const [cafeExists] = await db.query(
            'SELECT id FROM cafes WHERE id = ?',
            [cafeId]
        );

        if (cafeExists.length === 0) {
            return res.status(404).json({ error: 'Café introuvable' });
        }

        // Vérifier si déjà en favori
        const [existing] = await db.query(
            'SELECT * FROM favoris WHERE user_id = ? AND cafe_id = ?',
            [userId, cafeId]
        );

        if (existing.length > 0) {
            return res.status(400).json({ error: 'Café déjà dans les favoris' });
        }

        // Ajouter aux favoris
        await db.query(
            'INSERT INTO favoris (user_id, cafe_id) VALUES (?, ?)',
            [userId, cafeId]
        );

        res.status(201).json({ message: 'Café ajouté aux favoris', cafeId });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

// Retirer un café des favoris
exports.removeFavori = async (req, res) => {
    try {
        const userId = req.user.userId;
        const cafeId = req.params.cafeId;

        const [result] = await db.query(
            'DELETE FROM favoris WHERE user_id = ? AND cafe_id = ?',
            [userId, cafeId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Favori introuvable' });
        }

        res.json({ message: 'Café retiré des favoris', cafeId });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

// Récupérer tous les favoris d'un utilisateur
exports.getUserFavoris = async (req, res) => {
    try {
        const userId = req.user.userId;

        const [favoris] = await db.query(
            `SELECT cafes.*, criteres_cafe.*, favoris.created_at as favori_date
             FROM favoris
             JOIN cafes ON favoris.cafe_id = cafes.id
             JOIN criteres_cafe ON cafes.id = criteres_cafe.cafe_id
             WHERE favoris.user_id = ?
             ORDER BY favoris.created_at DESC`,
            [userId]
        );

        res.json(favoris);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

// Vérifier si un café est en favori
exports.checkFavori = async (req, res) => {
    try {
        const userId = req.user.userId;
        const cafeId = req.params.cafeId;

        const [existing] = await db.query(
            'SELECT * FROM favoris WHERE user_id = ? AND cafe_id = ?',
            [userId, cafeId]
        );

        res.json({ isFavorite: existing.length > 0 });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

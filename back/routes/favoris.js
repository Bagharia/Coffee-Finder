const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
    addFavori,
    removeFavori,
    getUserFavoris,
    checkFavori
} = require('../controllers/favoriController');

// Toutes les routes sont protégées par authenticateToken
router.use(authenticateToken);

// GET /api/favoris - Récupérer tous les favoris de l'utilisateur
router.get('/', getUserFavoris);

// GET /api/favoris/:cafeId/check - Vérifier si un café est en favori
router.get('/:cafeId/check', checkFavori);

// POST /api/favoris/:cafeId - Ajouter un café aux favoris
router.post('/:cafeId', addFavori);

// DELETE /api/favoris/:cafeId - Retirer un café des favoris
router.delete('/:cafeId', removeFavori);

module.exports = router;

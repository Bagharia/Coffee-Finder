const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { getAvisByCafe, addOrUpdateAvis, deleteAvis, getMyAvis } = require('../controllers/avisController');

// Public — voir les avis d'un café
router.get('/:cafeId', getAvisByCafe);

// Protégé — son propre avis
router.get('/:cafeId/mine', authenticateToken, getMyAvis);
router.post('/:cafeId', authenticateToken, addOrUpdateAvis);
router.delete('/:cafeId', authenticateToken, deleteAvis);

module.exports = router;

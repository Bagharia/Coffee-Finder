const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { getAvisByCafe, addOrUpdateAvis, deleteAvis, getMyAvis } = require('../controllers/avisController');
const { rateLimit } = require('../middleware/rateLimit');

// L'index UNIQUE(user_id, cafe_id) borne le nombre d'avis, pas le nombre
// d'écritures : un même avis peut être réécrit sans fin. Seul point de l'API
// où un compte ordinaire écrit en base, donc le seul à pouvoir la marteler.
const limiteEcriture = rateLimit({
  fenetreMs: 15 * 60 * 1000,
  max: 30,
  portee: 'avis:ecriture',
  message: 'Trop d\'avis publiés d\'affilée. Réessayer dans quelques minutes.'
});

// Public — voir les avis d'un café
router.get('/:cafeId', getAvisByCafe);

// Protégé — son propre avis
router.get('/:cafeId/mine', authenticateToken, getMyAvis);
router.post('/:cafeId', authenticateToken, limiteEcriture, addOrUpdateAvis);
router.delete('/:cafeId', authenticateToken, limiteEcriture, deleteAvis);

module.exports = router;

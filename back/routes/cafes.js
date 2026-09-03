const express = require('express');
const router = express.Router();
const { authenticateToken, isAdmin } = require('../middleware/auth');

const {
    getAllCafes, getNouveautes, getRandomCafe, getCafeById, getCafeByArrondissement, getCafeBySpecialite, getCafeWithWifi, getCafeWithPrice, getCafeWithAmbiance, searchCafes, createCafe, updateCafe, deleteCafe,
    getCorbeille, restaurerCafe, televerserImage, supprimerImage
} = require('../controllers/cafeController');

// Avant /:id, sinon Express lirait « corbeille » comme un identifiant.
router.get('/corbeille', authenticateToken, isAdmin, getCorbeille);

router.get('/nouveautes', getNouveautes);
router.get('/random', getRandomCafe);
router.get('/search', searchCafes);
router.get('/arrondissement/:arr', getCafeByArrondissement);
router.get('/specialite/:spec', getCafeBySpecialite);
router.get('/wifi/:wifi', getCafeWithWifi);
router.get('/ambiance/:amb', getCafeWithAmbiance);
router.get('/prix/:prix', getCafeWithPrice);
router.get('/:id', getCafeById);
router.get('/', getAllCafes);
router.post('/', authenticateToken, isAdmin, createCafe);
router.put('/:id', authenticateToken, isAdmin, updateCafe);
router.delete('/:id', authenticateToken, isAdmin, deleteCafe);
router.post('/:id/restaurer', authenticateToken, isAdmin, restaurerCafe);
router.post('/:id/image', authenticateToken, isAdmin, televerserImage);
router.delete('/:id/image', authenticateToken, isAdmin, supprimerImage);





module.exports = router;
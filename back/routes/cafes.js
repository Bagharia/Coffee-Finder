const express = require('express');
const router = express.Router();

const { 
    getAllCafes, getCafeById, getCafeByArrondissement, getCafeBySpecialite, getCafeWithWifi, getCafeWithPrice, getCafeWithAmbiance, searchCafes, createCafe, deleteCafe
} = require('../controllers/cafeController');

router.get('/search', searchCafes);
router.get('/arrondissement/:arr', getCafeByArrondissement);
router.get('/specialite/:spec', getCafeBySpecialite);
router.get('/wifi/:wifi', getCafeWithWifi);
router.get('/ambiance/:amb', getCafeWithAmbiance);
router.get('/prix/:prix', getCafeWithPrice);
router.get('/:id', getCafeById);
router.get('/', getAllCafes);
router.post('/', createCafe);
router.delete('/:id', deleteCafe);





module.exports = router;
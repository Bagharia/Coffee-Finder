const express = require('express');
const router = express.Router();

const { getAllCafes, getCafeById, getCafeByArrondissement } = require('../controllers/cafeController');

router.get('/arrondissement/:arr', getCafeByArrondissement);
router.get('/:id', getCafeById);
router.get('/', getAllCafes);


module.exports = router;
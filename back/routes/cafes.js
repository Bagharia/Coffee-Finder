const express = require('express');
const router = express.Router();

const { getAllCafes } = require('../controllers/cafeController');
const { getCafeById } = require('../controllers/cafeController');

router.get('/', getAllCafes);
router.get('/:id', getCafeById);

module.exports = router;
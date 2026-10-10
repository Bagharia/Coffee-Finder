const express = require('express');
const router = express.Router();
const { getSitemap, getRobots } = require('../controllers/seoController');

// Montées à la racine et non sous /api : les moteurs cherchent ces fichiers à
// la racine du domaine.
router.get('/sitemap.xml', getSitemap);
router.get('/robots.txt', getRobots);

module.exports = router;

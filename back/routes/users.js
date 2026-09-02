const express = require('express');
const router = express.Router();
const { register, login, getProfile, changePassword } = require('../controllers/userController');
const { authenticateToken } = require('../middleware/auth');
const { rateLimit } = require('../middleware/rateLimit');

// Sans limite, essayer dix mille mots de passe coûte le prix de dix mille
// requêtes, c'est-à-dire rien.
const limiteConnexion = rateLimit({
  fenetreMs: 15 * 60 * 1000,
  max: 10,
  message: 'Trop de tentatives de connexion. Réessayer dans quelques minutes.'
});

const limiteInscription = rateLimit({
  fenetreMs: 60 * 60 * 1000,
  max: 5,
  message: 'Trop de comptes créés depuis cette adresse. Réessayer plus tard.'
});

router.post('/register', limiteInscription, register);
router.post('/login', limiteConnexion, login);
router.get('/profile', authenticateToken, getProfile);
router.put('/change-password', authenticateToken, changePassword);

module.exports = router;

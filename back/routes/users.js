const express = require('express');
const router = express.Router();
const { register, login, logout, getProfile, changePassword } = require('../controllers/userController');
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

// Le changement de mot de passe vérifie l'ancien : sans limite, une session
// volée permet de le forcer à l'aveugle et de verrouiller le compte. Chaque
// essai coûte en plus un bcrypt complet, donc du processeur serveur.
const limiteMotDePasse = rateLimit({
  fenetreMs: 15 * 60 * 1000,
  max: 10,
  message: 'Trop de tentatives de changement de mot de passe. Réessayer dans quelques minutes.'
});

router.post('/register', limiteInscription, register);
router.post('/login', limiteConnexion, login);
router.post('/logout', logout);
router.get('/profile', authenticateToken, getProfile);
router.put('/change-password', authenticateToken, limiteMotDePasse, changePassword);

module.exports = router;

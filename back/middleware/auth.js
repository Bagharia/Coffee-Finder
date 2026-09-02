const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/env');
const { lireJeton } = require('../utils/cookie');

exports.authenticateToken = (req, res, next) => {
  const token = lireJeton(req);

  if (!token) {
    return res.status(401).json({ error: 'Token manquant' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token invalide' });
    }
    req.user = user;
    next();
  });
};

exports.isAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Non authentifié' });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Accès refusé. Droits administrateur requis.' });
  }

  next();
};

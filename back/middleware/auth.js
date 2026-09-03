const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/env');
const { lireJeton } = require('../utils/cookie');
const User = require('../models/User');

exports.authenticateToken = async (req, res, next) => {
  const token = lireJeton(req);

  if (!token) {
    return res.status(401).json({ error: 'Token manquant' });
  }

  let charge;
  try {
    charge = jwt.verify(token, JWT_SECRET);
  } catch {
    return res.status(403).json({ error: 'Token invalide' });
  }

  // Un JWT valide ne prouve que son intégrité, pas que la session vaut encore.
  // Ce contrôle coûte une lecture sur clé primaire par requête authentifiée, et
  // il achète trois choses qu'aucune signature ne donne : un changement de mot
  // de passe déconnecte les autres sessions, un compte supprimé cesse
  // immédiatement d'être utilisable, et un jeton volé peut être révoqué sans
  // attendre son expiration.
  const user = await User.findById(charge.userId);

  if (!user) {
    return res.status(403).json({ error: 'Compte introuvable ou supprimé.' });
  }

  if (user.jeton_version !== charge.jetonVersion) {
    return res.status(401).json({ error: 'Session expirée. Se reconnecter.' });
  }

  // Le rôle vient de la base, pas du jeton : une rétrogradation prend effet
  // tout de suite au lieu d'attendre vingt-quatre heures.
  req.user = { userId: user.id, email: user.email, role: user.role };
  next();
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

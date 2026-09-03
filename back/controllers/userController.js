const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const db = require('../config/db');
const { JWT_SECRET } = require('../config/env');
const { valider, MOT_DE_PASSE_MIN } = require('../utils/validation');
const { poserJeton, retirerJeton } = require('../utils/cookie');
const journal = require('../utils/journal');

const DUREE_TOKEN = '24h';

const echec = (res, err, contexte, message = 'Erreur serveur') => {
  journal.erreur(`[users] ${contexte} :`, err);
  return res.status(500).json({ error: message });
};

exports.register = async (req, res) => {
  const erreurs = valider(req.body, {
    email: { requis: true, type: 'email', max: 255 },
    password: { requis: true, min: MOT_DE_PASSE_MIN, max: 128 },
    username: { requis: true, min: 2, max: 100 }
  });

  if (erreurs.length > 0) {
    return res.status(400).json({ error: erreurs.join(' ') });
  }

  const { email, password, username } = req.body;

  try {
    const existant = await User.findByEmail(email);
    if (existant) {
      return res.status(409).json({ error: 'Cet email est déjà utilisé.' });
    }

    // Le rôle n'est jamais lu dans le corps de la requête : un POST avec
    // "role":"admin" créerait un administrateur. La promotion se fait en base.
    const role = 'user';
    const userId = await User.create(email, password, username, role);

    // Le jeton part en cookie httpOnly et nulle part ailleurs : le renvoyer
    // aussi dans le corps inviterait le front à le stocker, ce qu'on cherche
    // précisément à arrêter.
    poserJeton(res, jwt.sign({ userId, email, role }, JWT_SECRET, { expiresIn: DUREE_TOKEN }));

    return res.status(201).json({
      message: 'Compte créé.',
      user: { id: userId, email, username, role }
    });
  } catch (err) {
    return echec(res, err, 'inscription', 'Erreur lors de la création du compte');
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email et mot de passe requis.' });
  }

  try {
    const user = await User.findByEmail(email);

    // Même message dans les deux cas : distinguer les deux dirait à un
    // attaquant quels emails existent.
    if (!user) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect.' });
    }

    const motDePasseValide = await User.comparePassword(password, user.password);
    if (!motDePasseValide) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect.' });
    }

    poserJeton(res, jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: DUREE_TOKEN }
    ));

    return res.json({
      message: 'Connexion réussie.',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role
      }
    });
  } catch (err) {
    return echec(res, err, 'connexion', 'Erreur lors de la connexion');
  }
};

exports.logout = (req, res) => {
  // Aucune authentification exigée : un jeton expiré doit pouvoir être jeté.
  retirerJeton(res);
  return res.json({ message: 'Déconnexion effectuée.' });
};

exports.changePassword = async (req, res) => {
  const erreurs = valider(req.body, {
    currentPassword: { requis: true, max: 128 },
    newPassword: { requis: true, min: MOT_DE_PASSE_MIN, max: 128 }
  });

  if (erreurs.length > 0) {
    return res.status(400).json({ error: erreurs.join(' ') });
  }

  const { currentPassword, newPassword } = req.body;

  try {
    const user = await User.findByEmail(req.user.email);
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur introuvable.' });
    }

    const valide = await User.comparePassword(currentPassword, user.password);
    if (!valide) {
      return res.status(401).json({ error: 'Mot de passe actuel incorrect.' });
    }

    const hash = await bcrypt.hash(newPassword, 10);
    await db.query('UPDATE users SET password = ? WHERE id = ?', [hash, user.id]);

    return res.json({ message: 'Mot de passe modifié.' });
  } catch (err) {
    return echec(res, err, 'changement de mot de passe');
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur introuvable.' });
    }
    return res.json(user);
  } catch (err) {
    return echec(res, err, 'lecture du profil');
  }
};

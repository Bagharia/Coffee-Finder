const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { JWT_SECRET } = require('../config/env');
const { valider, MOT_DE_PASSE_MIN } = require('../utils/validation');
const { poserJeton, retirerJeton } = require('../utils/cookie');
const journal = require('../utils/journal');

const DUREE_TOKEN = '24h';

// Hachage d'un mot de passe qui n'existe pas, comparé quand l'email est inconnu.
// Sans lui, l'absence de compte se voyait au chronomètre : aucun bcrypt ne
// tournait et la réponse partait en 1,4 ms, contre 70 ms pour un compte
// existant. Le message identique dans les deux cas ne protégeait donc rien.
// Calculé une fois au démarrage : le refaire à chaque requête coûterait le
// travail qu'on cherche justement à imiter.
const HACHAGE_LEURRE = bcrypt.hashSync('mot-de-passe-inexistant', User.COUT);

const emettreJeton = (res, user) => {
  poserJeton(res, jwt.sign(
    { userId: user.id, email: user.email, role: user.role, jetonVersion: user.jeton_version },
    JWT_SECRET,
    { expiresIn: DUREE_TOKEN }
  ));
};

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

    // `username` est UNIQUE au schéma mais n'était pas vérifié : un pseudo déjà
    // pris faisait lever MySQL, tombait dans le catch et répondait 500 « Erreur
    // serveur ». La personne n'avait aucun moyen de deviner quoi corriger, sur
    // le seul écran par lequel un visiteur entre.
    if (await User.findByUsername(username)) {
      return res.status(409).json({ error: 'Ce pseudo est déjà pris.' });
    }

    // Le rôle n'est jamais lu dans le corps de la requête : un POST avec
    // "role":"admin" créerait un administrateur. La promotion se fait en base.
    const role = 'user';
    const userId = await User.create(email, password, username, role);

    // Le jeton part en cookie httpOnly et nulle part ailleurs : le renvoyer
    // aussi dans le corps inviterait le front à le stocker, ce qu'on cherche
    // précisément à arrêter.
    emettreJeton(res, { id: userId, email, role, jeton_version: 0 });

    return res.status(201).json({
      message: 'Compte créé.',
      user: { id: userId, email, username, role }
    });
  } catch (err) {
    // Deux inscriptions simultanées peuvent passer les vérifications ci-dessus
    // et se heurter à l'index UNIQUE : c'est l'index qui tranche, pas nous.
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Cet email ou ce pseudo est déjà utilisé.' });
    }
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

    // Même message dans les deux cas, et surtout même temps de réponse : on
    // compare toujours contre un hachage, celui du compte ou le leurre. Sinon
    // le chronomètre répond à la place du message.
    const motDePasseValide = await User.comparePassword(
      password,
      user ? user.password : HACHAGE_LEURRE
    );

    if (!user || !motDePasseValide) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect.' });
    }

    // Seule une connexion réussie donne accès au mot de passe en clair : c'est
    // l'unique moment où un hachage à coût dépassé peut être refait.
    await User.rehacherSiObsolete(user.id, user.password, password);

    emettreJeton(res, user);

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

    // Le changement invalide toutes les sessions ouvertes, y compris celle qui
    // vient de le demander : on lui rend immédiatement un jeton à jour, sinon
    // la personne se déconnecterait elle-même en changeant son mot de passe.
    const version = await User.changerMotDePasse(user.id, newPassword);
    emettreJeton(res, { ...user, jeton_version: version });

    return res.json({ message: 'Mot de passe modifié. Les autres sessions ont été déconnectées.' });
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

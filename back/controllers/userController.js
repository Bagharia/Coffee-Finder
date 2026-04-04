const User = require('../models/User');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'votre_secret_jwt_super_securise';

exports.register = async (req, res) => {
  try {
    const { email, password, username, role } = req.body;

    if (!email || !password || !username) {
      return res.status(400).json({ error: 'Email, mot de passe et username requis' });
    }

    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'Cet email est deja utilise' });
    }

    const userRole = role || 'user';
    const userId = await User.create(email, password, username, userRole);

    const token = jwt.sign(
      { userId, email, role: userRole },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'Utilisateur cree avec succes',
      token,
      user: {
        id: userId,
        email,
        username,
        role: userRole
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur lors de la creation du compte' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email et mot de passe requis' });
    }

    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    const isPasswordValid = await User.comparePassword(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Connexion reussie',
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur lors de la connexion' });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Les deux mots de passe sont requis' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Le nouveau mot de passe doit faire au moins 6 caractères' });
    }

    const user = await User.findByEmail(req.user.email);
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });

    const valid = await User.comparePassword(currentPassword, user.password);
    if (!valid) return res.status(401).json({ error: 'Mot de passe actuel incorrect' });

    const bcrypt = require('bcryptjs');
    const hashed = await bcrypt.hash(newPassword, 10);
    await require('../config/db').query('UPDATE users SET password = ? WHERE id = ?', [hashed, user.id]);

    res.json({ message: 'Mot de passe modifié avec succès' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur introuvable' });
    }
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

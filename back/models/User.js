const db = require('../config/db');
const bcrypt = require('bcryptjs');

// Coût bcrypt. 10 était la valeur d'origine ; 12 est le plancher recommandé
// aujourd'hui, chaque unité doublant le travail d'un attaquant. Le sel, lui,
// n'a rien à faire ici : bcrypt en tire un au hasard à chaque hachage et le
// range dans l'empreinte ($2b$<coût>$<sel 22 car.><empreinte>). Un sel écrit à
// la main serait au mieux redondant, au pire partagé — donc inutile.
const COUT = 12;

// Colonnes listées : un `SELECT *` rapporterait le hachage du mot de passe dans
// tout objet `user`, et il suffirait d'un `res.json(user)` pour le publier.
// Ici il est demandé explicitement, donc jamais par accident.
const COLONNES_AVEC_SECRET = 'id, username, email, password, role, jeton_version';
const COLONNES_PUBLIQUES = 'id, username, email, role, jeton_version';

class User {
  static async create(email, password, username, role = 'user') {
    const hachage = await bcrypt.hash(password, COUT);
    const [result] = await db.query(
      'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
      [username, email, hachage, role]
    );
    return result.insertId;
  }

  static async findByEmail(email) {
    const [rows] = await db.query(
      `SELECT ${COLONNES_AVEC_SECRET} FROM users WHERE email = ?`,
      [email]
    );
    return rows[0];
  }

  static async findByUsername(username) {
    const [rows] = await db.query(
      'SELECT id FROM users WHERE username = ?',
      [username]
    );
    return rows[0];
  }

  static async findById(id) {
    const [rows] = await db.query(
      `SELECT ${COLONNES_PUBLIQUES} FROM users WHERE id = ?`,
      [id]
    );
    return rows[0];
  }

  static async comparePassword(motDePasse, hachage) {
    return bcrypt.compare(motDePasse, hachage);
  }

  /**
   * Change le mot de passe et invalide d'un coup toutes les sessions ouvertes.
   * Les deux vont ensemble : changer le mot de passe sans révoquer laisserait
   * la personne dont on cherche à se débarrasser connectée jusqu'à l'expiration.
   * @returns {number} la nouvelle version de jeton, à mettre dans le cookie
   */
  static async changerMotDePasse(id, nouveauMotDePasse) {
    const hachage = await bcrypt.hash(nouveauMotDePasse, COUT);

    await db.query(
      'UPDATE users SET password = ?, jeton_version = jeton_version + 1 WHERE id = ?',
      [hachage, id]
    );

    const [[{ jeton_version }]] = await db.query('SELECT jeton_version FROM users WHERE id = ?', [id]);
    return jeton_version;
  }

  /**
   * Réhache silencieusement un mot de passe encore stocké à un coût dépassé.
   * Sans ça, un compte créé avant le relèvement garderait son ancien coût pour
   * toujours : seule une connexion réussie donne accès au mot de passe en clair,
   * c'est donc le seul moment où l'on peut le refaire.
   */
  static async rehacherSiObsolete(id, hachage, motDePasse) {
    const cout = Number(hachage.split('$')[2]);
    if (Number.isNaN(cout) || cout >= COUT) return;

    await db.query(
      'UPDATE users SET password = ? WHERE id = ?',
      [await bcrypt.hash(motDePasse, COUT), id]
    );
  }

  static get COUT() {
    return COUT;
  }
}

module.exports = User;

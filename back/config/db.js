const mysql = require('mysql2');
const { DB } = require('./env');

const pool = mysql.createPool({
  ...DB,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const db = pool.promise();

/**
 * Exécute `travail(connexion)` dans une transaction : tout est validé ensemble
 * ou rien ne l'est. Une adresse s'écrit dans plusieurs tables, et une écriture
 * interrompue au milieu laissait une fiche sans critères, invisible partout
 * (jointure interne) mais qui occupait quand même son adresse.
 *
 * La connexion est toujours rendue au pool, succès ou échec.
 */
db.transaction = async (travail) => {
  const connexion = await db.getConnection();

  try {
    await connexion.beginTransaction();
    const resultat = await travail(connexion);
    await connexion.commit();
    return resultat;
  } catch (err) {
    await connexion.rollback().catch(() => {});
    throw err;
  } finally {
    connexion.release();
  }
};

module.exports = db;

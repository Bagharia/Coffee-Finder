// Applique les migrations SQL de ce dossier, une fois chacune, dans l'ordre.
//
// Pourquoi un runner : jusqu'ici les migrations se lançaient à la main, une par
// une, et rien ne notait ce qui avait déjà été appliqué. 002 et 004 sont des
// ALTER TABLE non rejouables — les relancer échoue. Sur une base en ligne, la
// seule façon de savoir où on en était était de regarder le schéma et deviner.
//
//   npm run db:migrate              applique ce qui manque
//   npm run db:migrate -- --etat    liste sans rien appliquer
//   npm run db:migrate -- --baseline  marque tout comme appliqué sans exécuter
//
// --baseline sert aux bases déjà montées à la main avant l'arrivée de ce
// fichier : elles ont le bon schéma mais pas la table de suivi.

const fs = require('node:fs');
const path = require('node:path');
const mysql = require('mysql2/promise');
const { DB } = require('../config/env');
const journal = require('../utils/journal');

const DOSSIER = __dirname;
const TABLE_SUIVI = 'schema_migrations';

// seed.sql n'est pas une migration : c'est un jeu de données de démonstration,
// à ne jamais appliquer automatiquement, encore moins en production.
const estMigration = (nom) => /^\d{3}_.+\.sql$/.test(nom);

const listerFichiers = () =>
  fs.readdirSync(DOSSIER).filter(estMigration).sort();

async function connecter() {
  // multipleStatements : un fichier de migration contient plusieurs requêtes.
  // Activé ici seulement, jamais dans le pool de l'API : combiné à une entrée
  // utilisateur, c'est la porte ouverte aux injections empilées.
  const options = { ...DB, multipleStatements: true };

  try {
    return await mysql.createConnection(options);
  } catch (err) {
    if (err.code !== 'ER_BAD_DB_ERROR') throw err;

    // La base n'existe pas encore. En local c'est le premier lancement ; chez
    // un hébergeur, la base est fournie et ce chemin ne sert jamais.
    journal.info(`Base « ${DB.database} » absente — création.`);
    const { database, ...sansBase } = options;
    const amorce = await mysql.createConnection(sansBase);
    await amorce.query(
      `CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
    await amorce.end();
    return mysql.createConnection(options);
  }
}

async function main() {
  const baseline = process.argv.includes('--baseline');
  const etatSeul = process.argv.includes('--etat');

  const cx = await connecter();

  await cx.query(`
    CREATE TABLE IF NOT EXISTS \`${TABLE_SUIVI}\` (
      nom VARCHAR(255) PRIMARY KEY,
      applique_le TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const [lignes] = await cx.query(`SELECT nom FROM \`${TABLE_SUIVI}\``);
  const deja = new Set(lignes.map((l) => l.nom));

  const fichiers = listerFichiers();
  const restantes = fichiers.filter((f) => !deja.has(f));

  if (etatSeul) {
    journal.info(`Base : ${DB.database}`);
    for (const f of fichiers) {
      journal.info(`  ${deja.has(f) ? 'appliquée' : 'EN ATTENTE'}  ${f}`);
    }
    await cx.end();
    return;
  }

  if (restantes.length === 0) {
    journal.info('Aucune migration en attente.');
    await cx.end();
    return;
  }

  if (baseline) {
    for (const f of restantes) {
      await cx.execute(`INSERT INTO \`${TABLE_SUIVI}\` (nom) VALUES (?)`, [f]);
      journal.info(`marquée sans exécution : ${f}`);
    }
    journal.info(`${restantes.length} migration(s) marquée(s) comme appliquée(s).`);
    await cx.end();
    return;
  }

  for (const f of restantes) {
    const sql = fs.readFileSync(path.join(DOSSIER, f), 'utf8');
    journal.info(`application de ${f}…`);

    try {
      await cx.query(sql);
      await cx.execute(`INSERT INTO \`${TABLE_SUIVI}\` (nom) VALUES (?)`, [f]);
      journal.info(`  ${f} appliquée.`);
    } catch (err) {
      // MySQL ne sait pas annuler du DDL : on s'arrête à la première erreur
      // plutôt que d'empiler les suivantes sur un schéma à moitié migré.
      journal.erreur(`  ${f} a échoué : ${err.message}`);
      journal.erreur('Arrêt. Les migrations suivantes ne sont pas appliquées.');
      await cx.end();
      process.exit(1);
    }
  }

  journal.info('Migrations terminées.');
  await cx.end();
}

main().catch((err) => {
  journal.erreur('Migration impossible :', err.message);
  process.exit(1);
});

// Réinitialise le mot de passe d'un compte depuis la ligne de commande.
//
//   npm run user:motdepasse -- admin@spotheplace.fr
//
// Il n'y a pas de « mot de passe oublié » en libre-service : il faudrait
// envoyer un e-mail, donc une dépendance et un service d'envoi. En attendant,
// la reprise en main passe par ici plutôt que par un UPDATE écrit à la main —
// qui obligeait à hacher le mot de passe soi-même, et où une erreur de coût ou
// de sel passe inaperçue jusqu'au jour où la connexion échoue.
//
// Le compteur de jetons est incrémenté : toutes les sessions ouvertes sur ce
// compte tombent, ce qui est le but si on réinitialise après une compromission.

const crypto = require('node:crypto');
const readline = require('node:readline/promises');
const db = require('../config/db');
const User = require('../models/User');
const journal = require('../utils/journal');
const { MOT_DE_PASSE_MIN } = require('../utils/validation');

const MOTS = ['comptoir', 'matcha', 'ristretto', 'chapon', 'norvins', 'filtre', 'presse', 'bocal', 'carafe', 'tamis'];

// Trois mots et un nombre : assez long pour résister, assez lisible pour être
// dicté au téléphone puis changé par la personne elle-même.
const proposer = () =>
  Array.from({ length: 3 }, () => MOTS[crypto.randomInt(MOTS.length)]).join('-')
  + '-' + crypto.randomInt(1000, 10000);

async function main() {
  const email = process.argv[2];

  if (!email) {
    console.error('Usage : npm run user:motdepasse -- <email> [nouveau mot de passe]');
    process.exit(1);
  }

  const user = await User.findByEmail(email);
  if (!user) {
    console.error(`Aucun compte pour « ${email} ».`);
    process.exit(1);
  }

  const motDePasse = process.argv[3] || proposer();

  if (motDePasse.length < MOT_DE_PASSE_MIN) {
    console.error(`Le mot de passe doit faire au moins ${MOT_DE_PASSE_MIN} caractères.`);
    process.exit(1);
  }

  const lecture = readline.createInterface({ input: process.stdin, output: process.stdout });
  const reponse = await lecture.question(
    `Réinitialiser le mot de passe de ${user.username} <${user.email}> et déconnecter ses sessions ? [o/N] `
  );
  lecture.close();

  if (reponse.trim().toLowerCase() !== 'o') {
    console.log('Annulé, rien n\'a été modifié.');
    return;
  }

  await User.changerMotDePasse(user.id, motDePasse);

  journal.info(`Mot de passe réinitialisé pour ${user.email}, sessions révoquées.`);
  console.log(`\n  Nouveau mot de passe : ${motDePasse}\n`);
  console.log('  À transmettre par un canal sûr, et à changer depuis /profile après la première connexion.');
}

main()
  .catch((err) => {
    journal.erreur('Réinitialisation impossible :', err.message);
    process.exitCode = 1;
  })
  .finally(() => db.end());

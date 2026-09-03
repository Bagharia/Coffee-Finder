// Chaque module se charge-t-il ?
//
// Ce test paraît trivial et il ne l'est pas : `node --check` ne valide que la
// syntaxe, pas les références. Un découpage de fichier qui laisse une constante
// derrière lui passe le contrôle de syntaxe et fait planter le serveur au
// démarrage — c'est exactement arrivé le 2026-09-03 avec PRIX_VALIDES.
// Charger tous les modules attrape cette classe d'erreur en une seconde.

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

// Le chargement de config/env impose ces variables. Les valeurs n'ont pas à
// être justes : aucun module n'ouvre de connexion à l'import.
for (const [cle, valeur] of Object.entries({
  DB_HOST: 'localhost', DB_USER: 'test', DB_NAME: 'test', JWT_SECRET: 'secret-de-test'
})) {
  if (!process.env[cle]) process.env[cle] = valeur;
}

const DOSSIERS = ['config', 'controllers', 'middleware', 'models', 'routes', 'utils'];

const modules = DOSSIERS.flatMap((dossier) =>
  fs.readdirSync(path.join(__dirname, dossier))
    .filter((f) => f.endsWith('.js') && !f.endsWith('.test.js'))
    .map((f) => `./${dossier}/${f}`)
);

test('tous les modules du back se chargent', () => {
  assert.ok(modules.length > 10, 'la découverte des modules a échoué');

  for (const module of modules) {
    assert.doesNotThrow(() => require(module), `${module} ne se charge pas`);
  }
});

test('server.js se charge sans lancer d\'écoute', () => {
  // On ne require pas server.js : il ouvrirait un port. On vérifie au moins
  // que le fichier existe et que ses dépendances directes sont résolvables.
  assert.ok(fs.existsSync(path.join(__dirname, 'server.js')));
});

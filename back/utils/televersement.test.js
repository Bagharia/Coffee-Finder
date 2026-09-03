const test = require('node:test');
const assert = require('node:assert');
const path = require('node:path');
const { PREFIXE_URL, TYPES_ACCEPTES, supprimerImageLocale, DOSSIER } = require('./televersement');

test('le SVG n\'est pas un format accepté', () => {
  // Un SVG est un document qui peut porter du script, et il serait servi
  // depuis notre propre origine. L'exclusion est délibérée.
  assert.ok(!TYPES_ACCEPTES.includes('image/svg+xml'));
  assert.ok(TYPES_ACCEPTES.includes('image/jpeg'));
  assert.ok(TYPES_ACCEPTES.includes('image/png'));
});

test('les images sont servies sous /api pour passer le proxy Vite', () => {
  assert.ok(PREFIXE_URL.startsWith('/api/'));
});

test('supprimerImageLocale ignore ce qui ne nous appartient pas', async () => {
  // Une image_url qui pointe ailleurs ne doit rien déclencher : ces fichiers
  // ne sont pas à nous. Aucun de ces appels ne doit lever.
  for (const url of [
    null,
    '',
    'https://commons.wikimedia.org/wiki/Special:FilePath/Photo.jpg',
    '/autre/chemin/image.jpg'
  ]) {
    await assert.doesNotReject(() => supprimerImageLocale(url));
  }
});

test('supprimerImageLocale ne sort pas de son dossier', async () => {
  // Le nom est réduit à son basename : une tentative de remontée devient un
  // nom de fichier inoffensif dans le dossier des images.
  const piege = `${PREFIXE_URL}/../../../etc/passwd`;
  await assert.doesNotReject(() => supprimerImageLocale(piege));

  const resolu = path.join(DOSSIER, path.basename(piege));
  assert.strictEqual(path.dirname(resolu), DOSSIER);
});

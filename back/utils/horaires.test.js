const test = require('node:test');
const assert = require('node:assert');
const { validerHoraires, PLAGES_MAX } = require('./horaires');

test('undefined signifie « ne touche pas aux horaires »', () => {
  assert.deepStrictEqual(validerHoraires(undefined), { plages: undefined });
});

test('un tableau vide signifie « efface les horaires »', () => {
  assert.deepStrictEqual(validerHoraires([]), { plages: [] });
});

test('les secondes sont complétées', () => {
  const { plages } = validerHoraires([{ jour: 1, ouverture: '08:00', fermeture: '17:00' }]);
  assert.deepStrictEqual(plages, [{ jour: 1, ouverture: '08:00:00', fermeture: '17:00:00' }]);
});

test('une fermeture après minuit est acceptée telle quelle', () => {
  // fermeture < ouverture n'est pas une erreur : c'est une fermeture qui
  // déborde sur le lendemain, et le front sait la lire.
  const { erreur, plages } = validerHoraires([{ jour: 1, ouverture: '08:00', fermeture: '01:30' }]);
  assert.strictEqual(erreur, undefined);
  assert.strictEqual(plages[0].fermeture, '01:30:00');
});

test('plusieurs plages le même jour pour un service coupé', () => {
  const { erreur, plages } = validerHoraires([
    { jour: 3, ouverture: '09:00', fermeture: '15:00' },
    { jour: 3, ouverture: '18:00', fermeture: '23:00' }
  ]);
  assert.strictEqual(erreur, undefined);
  assert.strictEqual(plages.length, 2);
});

test('refuse autre chose qu\'un tableau', () => {
  assert.match(validerHoraires('8h-17h').erreur, /tableau/);
});

test('refuse un jour hors de 1 à 7', () => {
  for (const jour of [0, 8, -1, 1.5, 'lundi', null]) {
    assert.match(validerHoraires([{ jour, ouverture: '08:00', fermeture: '17:00' }]).erreur, /jour/);
  }
});

test('refuse une heure mal formée', () => {
  for (const heure of ['25:00', '8h00', '08:60', '', '8:00:00:00']) {
    assert.match(validerHoraires([{ jour: 1, ouverture: heure, fermeture: '17:00' }]).erreur, /HH:MM/);
  }
});

test('refuse une plage nulle', () => {
  const { erreur } = validerHoraires([{ jour: 1, ouverture: '08:00', fermeture: '08:00' }]);
  assert.match(erreur, /même heure/);
});

test('refuse deux plages qui commencent en même temps le même jour', () => {
  // L'index UNIQUE(cafe_id, jour, ouverture) les rejetterait avec une erreur
  // SQL illisible : on veut le message clair, pas le 500.
  const { erreur } = validerHoraires([
    { jour: 1, ouverture: '08:00', fermeture: '12:00' },
    { jour: 1, ouverture: '08:00', fermeture: '17:00' }
  ]);
  assert.match(erreur, /deux plages/);
});

test('refuse au-delà du plafond de plages', () => {
  const trop = Array.from({ length: PLAGES_MAX + 1 }, (_, i) => ({
    jour: (i % 7) + 1, ouverture: '08:00', fermeture: '17:00'
  }));
  assert.match(validerHoraires(trop).erreur, /maximum/);
});

const test = require('node:test');
const assert = require('node:assert');
const { normaliserAdresse, echapperLike } = require('./adresse');

test('deux écritures de la même adresse se rejoignent', () => {
  const reference = normaliserAdresse('12 Rue de Bretagne, 75003 Paris');

  for (const variante of [
    '12 rue de bretagne 75003 paris',
    '12  RUE DE BRETAGNE — 75003  PARIS',
    '  12, Rue de Bretagne. 75003 Paris  ',
    '12 Rue de Bretagne / 75003 / Paris'
  ]) {
    assert.strictEqual(normaliserAdresse(variante), reference, variante);
  }
});

test('les accents disparaissent', () => {
  assert.strictEqual(normaliserAdresse('Café Éphémère, Île-de-France'), 'cafe ephemere ile de france');
});

test('deux adresses différentes le restent', () => {
  // Le piège serait de trop normaliser : 12 et 14 sont deux immeubles.
  assert.notStrictEqual(
    normaliserAdresse('12 Rue de Bretagne, 75003 Paris'),
    normaliserAdresse('14 Rue de Bretagne, 75003 Paris')
  );
});

test('une adresse vide ou absente donne une chaîne vide', () => {
  for (const vide of [null, undefined, '', '   ', ',,,']) {
    assert.strictEqual(normaliserAdresse(vide), '');
  }
});

test('les jokers SQL sont échappés', () => {
  // Sans échappement, une recherche contenant % remonterait toute la table
  // et _ remplacerait n'importe quel caractère.
  assert.strictEqual(echapperLike('100%'), '100\\%');
  assert.strictEqual(echapperLike('pur_jus'), 'pur\\_jus');
  assert.strictEqual(echapperLike('a\\b'), 'a\\\\b');
  assert.strictEqual(echapperLike('tamis'), 'tamis');
});

import test from "node:test";
import assert from "node:assert";
import { distanceMetres, formaterDistance, plusProches } from "./distance.js";

const NOTRE_DAME = { lat: 48.8530, lon: 2.3499 };
const TOUR_EIFFEL = { lat: 48.8584, lon: 2.2945 };

test("une distance connue : Notre-Dame – tour Eiffel ≈ 4,1 km", () => {
  const d = distanceMetres(NOTRE_DAME, TOUR_EIFFEL);
  assert.ok(d > 4000 && d < 4300, `obtenu ${d}`);
});

test("un point à distance nulle de lui-même", () => {
  assert.strictEqual(distanceMetres(NOTRE_DAME, NOTRE_DAME), 0);
});

test("accepte les coordonnées de l'API (chaînes DECIMAL) comme celles du navigateur", () => {
  const api = { latitude: "48.85300000", longitude: "2.34990000" };
  assert.ok(distanceMetres(NOTRE_DAME, api) < 1);
});

test("formaterDistance", () => {
  assert.strictEqual(formaterDistance(3), "10 m");
  assert.strictEqual(formaterDistance(347), "350 m");
  assert.strictEqual(formaterDistance(1234), "1,2 km");
  assert.strictEqual(formaterDistance(14400), "14 km");
});

test("plusProches trie du plus près au plus loin et borne le nombre", () => {
  const adresses = [
    { id: 1, ...TOUR_EIFFEL },
    { id: 2, lat: 48.8531, lon: 2.3500 },
    { id: 3, lat: 48.8600, lon: 2.3400 }
  ];
  const proches = plusProches(NOTRE_DAME, adresses, 2);

  assert.deepStrictEqual(proches.map((c) => c.id), [2, 3]);
  assert.ok(proches[0].distance < proches[1].distance);
});

test("plusProches ne modifie pas la liste d'origine", () => {
  const adresses = [{ id: 1, ...TOUR_EIFFEL }];
  plusProches(NOTRE_DAME, adresses);
  assert.strictEqual(adresses[0].distance, undefined);
});

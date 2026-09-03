import test from "node:test";
import assert from "node:assert";
import { estOuvert, instantParis, parJour, resumeJour } from "./horaires.js";

// Ouvert tous les jours de 8h à 1h30 du matin : la fermeture est antérieure à
// l'ouverture, donc elle déborde sur le lendemain.
const NUIT = [1, 2, 3, 4, 5, 6, 7].map((jour) => ({ jour, ouverture: "08:00:00", fermeture: "01:30:00" }));

// Mercredi à dimanche, service coupé. Lundi et mardi fermés, dimanche sans soir.
const COUPE = [
  ...[3, 4, 5, 6].flatMap((jour) => [
    { jour, ouverture: "09:00:00", fermeture: "15:00:00" },
    { jour, ouverture: "18:00:00", fermeture: "23:00:00" }
  ]),
  { jour: 7, ouverture: "09:00:00", fermeture: "15:00:00" }
];

// Septembre 2026 : le 7 est un lundi, le 13 un dimanche. +02:00 = heure d'été.
const a = (iso) => new Date(iso);

test("fermeture après minuit : la plage de la veille décide", () => {
  assert.strictEqual(estOuvert(NUIT, a("2026-09-08T00:30:00+02:00")), true);
  assert.strictEqual(estOuvert(NUIT, a("2026-09-07T00:30:00+02:00")), true);
});

test("fermeture après minuit : les bornes", () => {
  assert.strictEqual(estOuvert(NUIT, a("2026-09-08T01:29:00+02:00")), true);
  assert.strictEqual(estOuvert(NUIT, a("2026-09-08T01:30:00+02:00")), false);
  assert.strictEqual(estOuvert(NUIT, a("2026-09-08T07:59:00+02:00")), false);
  assert.strictEqual(estOuvert(NUIT, a("2026-09-08T08:00:00+02:00")), true);
});

test("un jour sans plage est fermé", () => {
  assert.strictEqual(estOuvert(COUPE, a("2026-09-07T12:00:00+02:00")), false);
});

test("service coupé : fermé entre les deux services", () => {
  assert.strictEqual(estOuvert(COUPE, a("2026-09-09T12:00:00+02:00")), true);
  assert.strictEqual(estOuvert(COUPE, a("2026-09-09T16:00:00+02:00")), false);
  assert.strictEqual(estOuvert(COUPE, a("2026-09-09T19:00:00+02:00")), true);
});

test("un jour peut n'avoir qu'un seul service", () => {
  assert.strictEqual(estOuvert(COUPE, a("2026-09-13T12:00:00+02:00")), true);
  assert.strictEqual(estOuvert(COUPE, a("2026-09-13T19:00:00+02:00")), false);
});

test("le fuseau est celui de Paris, pas celui du lecteur", () => {
  // 01h00 UTC = 03h00 à Paris → fermé. 23h00 UTC = 01h00 à Paris → ouvert.
  assert.strictEqual(estOuvert(NUIT, a("2026-09-08T01:00:00Z")), false);
  assert.strictEqual(estOuvert(NUIT, a("2026-09-07T23:00:00Z")), true);
});

test("sans horaires, on ne sait pas — ce n'est pas « fermé »", () => {
  // La distinction compte : la DA réserve le rouge à l'état fermé avéré.
  assert.strictEqual(estOuvert([], a("2026-09-08T12:00:00+02:00")), null);
  assert.strictEqual(estOuvert(undefined, a("2026-09-08T12:00:00+02:00")), null);
});

test("instantParis rend un jour de 1 à 7", () => {
  const { jour, minutes } = instantParis(a("2026-09-07T10:15:00+02:00"));
  assert.strictEqual(jour, 1);
  assert.strictEqual(minutes, 10 * 60 + 15);
});

test("parJour rend les sept jours dans l'ordre", () => {
  const semaine = parJour(COUPE);
  assert.strictEqual(semaine.length, 7);
  assert.deepStrictEqual(semaine.map((j) => j.jour), [1, 2, 3, 4, 5, 6, 7]);
  assert.strictEqual(semaine[0].nom, "lundi");
});

test("resumeJour écrit les plages ou « fermé »", () => {
  const semaine = parJour(COUPE);
  assert.strictEqual(resumeJour(semaine[0].plages), "fermé");
  assert.strictEqual(resumeJour(semaine[2].plages), "9h – 15h, 18h – 23h");
  assert.strictEqual(resumeJour(parJour(NUIT)[0].plages), "8h – 1h30");
});

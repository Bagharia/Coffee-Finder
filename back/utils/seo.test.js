const test = require('node:test');
const assert = require('node:assert');
const { construireSitemap, construireRobots, URLS_MAX } = require('./seo');

test('le sitemap liste les pages fixes, les catégories et chaque fiche', () => {
  const { xml, tronque } = construireSitemap('https://exemple.fr', [
    { id: 7, updated_at: new Date('2026-10-09T12:00:00Z') }
  ]);

  assert.ok(xml.startsWith('<?xml'));
  assert.ok(xml.includes('<loc>https://exemple.fr/</loc>'));
  assert.ok(xml.includes('<loc>https://exemple.fr/category/bubble-tea</loc>'));
  assert.ok(xml.includes('<loc>https://exemple.fr/cafe/7</loc><lastmod>2026-10-09</lastmod>'));
  assert.strictEqual(tronque, false);
});

test('une date illisible n\'écrit pas de lastmod au lieu d\'en inventer une', () => {
  const { xml } = construireSitemap('https://exemple.fr', [{ id: 1, updated_at: 'n\'importe quoi' }]);
  assert.ok(xml.includes('<loc>https://exemple.fr/cafe/1</loc></url>'));
});

test('l\'identifiant est forcé en nombre : rien d\'autre ne passe dans l\'URL', () => {
  const { xml } = construireSitemap('https://exemple.fr', [{ id: '3</loc><x>', updated_at: null }]);
  assert.ok(!xml.includes('<x>'));
});

test('au-delà de 50 000 URL le sitemap se tronque et le dit', () => {
  const adresses = Array.from({ length: URLS_MAX }, (_, i) => ({ id: i + 1, updated_at: null }));
  const { xml, tronque } = construireSitemap('https://exemple.fr', adresses);

  assert.strictEqual(tronque, true);
  assert.strictEqual((xml.match(/<url>/g) || []).length, URLS_MAX);
});

test('robots.txt ferme l\'admin et pointe le sitemap, mais laisse /api/ ouvert', () => {
  const robots = construireRobots('https://exemple.fr');

  assert.ok(robots.includes('Disallow: /admin'));
  assert.ok(robots.includes('Sitemap: https://exemple.fr/sitemap.xml'));
  assert.ok(!robots.includes('/api'));
});

// Fabrication du sitemap et du robots.txt. Du calcul pur, sans base ni serveur :
// testable seul.

// Limite du protocole sitemap. Au-delà, il faut un index de plusieurs fichiers.
const URLS_MAX = 50000;

// Les catégories de `CategoryPage` : la forme d'URL que le front sait lire.
const CATEGORIES = ['cafe', 'matcha', 'bubble-tea', 'the'];

const echapperXml = (texte) =>
    String(texte).replace(/[&<>"']/g, (c) =>
        ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c])
    );

/** Date au format W3C (AAAA-MM-JJ), ou null si elle est illisible. */
const jourIso = (date) => {
    const d = new Date(date);
    return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
};

/**
 * @param {string} siteUrl racine du site, sans barre finale
 * @param {Array<{ id: number, updated_at: Date|string }>} adresses
 * @returns {{ xml: string, tronque: boolean }}
 */
function construireSitemap(siteUrl, adresses) {
    const pages = [
        { chemin: '/' },
        { chemin: '/cafes' },
        { chemin: '/map' },
        ...CATEGORIES.map((c) => ({ chemin: `/category/${c}` }))
    ];

    const place = URLS_MAX - pages.length;
    const retenues = adresses.slice(0, place);

    for (const { id, updated_at } of retenues) {
        pages.push({ chemin: `/cafe/${Number(id)}`, modifie: jourIso(updated_at) });
    }

    const lignes = pages.map(({ chemin, modifie }) =>
        `  <url><loc>${echapperXml(siteUrl + chemin)}</loc>${modifie ? `<lastmod>${modifie}</lastmod>` : ''}</url>`
    );

    return {
        xml: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${lignes.join('\n')}\n</urlset>\n`,
        tronque: adresses.length > retenues.length
    };
}

/**
 * `/api/` n'est PAS interdit, et c'est voulu : le front est une SPA, Google
 * l'affiche en appelant `/api/cafes/:id` et charge les photos sous
 * `/api/uploads/`. Les lui fermer lui montrerait des pages vides.
 * Ce fichier n'est d'ailleurs pas une protection : `/admin` reste gardé par
 * l'API, pas par ces lignes.
 */
function construireRobots(siteUrl) {
    return [
        'User-agent: *',
        'Disallow: /admin',
        'Disallow: /profile',
        'Disallow: /login',
        'Disallow: /register',
        '',
        `Sitemap: ${siteUrl}/sitemap.xml`,
        ''
    ].join('\n');
}

module.exports = { construireSitemap, construireRobots, URLS_MAX, CATEGORIES };

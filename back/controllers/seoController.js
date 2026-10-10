const db = require('../config/db');
const { SITE_URL } = require('../config/env');
const { JOINTURE } = require('../utils/cafes');
const { construireSitemap, construireRobots, URLS_MAX } = require('../utils/seo');
const journal = require('../utils/journal');

// Un moteur relit ces fichiers de temps en temps, pas à chaque visite : une
// heure de cache épargne la base sans retarder une nouvelle fiche de façon
// sensible.
const CACHE = 'public, max-age=3600';

// GET /sitemap.xml — les adresses visibles, comme le guide les montre.
exports.getSitemap = async (req, res) => {
    try {
        // Même jointure et même filtre que les listes : une fiche à la corbeille
        // ou sans critères n'est pas dans le guide, elle n'a rien à faire ici.
        const [adresses] = await db.query(
            `SELECT cafes.id AS id, cafes.updated_at AS updated_at ${JOINTURE}
             WHERE cafes.supprime_le IS NULL ORDER BY cafes.id ASC`
        );

        const { xml, tronque } = construireSitemap(SITE_URL, adresses);

        if (tronque) {
            journal.alerte(`[seo] sitemap tronqué à ${URLS_MAX} URL : il faut le scinder en plusieurs fichiers.`);
        }

        res.type('application/xml').set('Cache-Control', CACHE).send(xml);
    } catch (err) {
        journal.erreur('[seo] sitemap :', err);
        res.status(500).type('text/plain').send('Erreur serveur');
    }
};

// GET /robots.txt
exports.getRobots = (req, res) => {
    res.type('text/plain').set('Cache-Control', CACHE).send(construireRobots(SITE_URL));
};

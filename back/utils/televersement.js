const crypto = require('node:crypto');
const fs = require('node:fs/promises');
const path = require('node:path');
const multer = require('multer');
const journal = require('./journal');

const DOSSIER = path.join(__dirname, '..', 'uploads');

// Servi sous /api et non à la racine : en développement le proxy Vite ne relaie
// que /api, et en production le front et l'API partagent déjà ce préfixe. Une
// image rangée ailleurs serait introuvable dans l'un des deux cas.
const PREFIXE_URL = '/api/uploads';

const TAILLE_MAX = 5 * 1024 * 1024;

// Liste blanche, jamais liste noire. Le SVG en est volontairement absent : un
// SVG est un document qui peut porter du script, et il serait servi depuis
// notre propre origine.
const TYPES = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
    'image/avif': '.avif'
};

exports.DOSSIER = DOSSIER;
exports.PREFIXE_URL = PREFIXE_URL;
exports.TAILLE_MAX = TAILLE_MAX;
exports.TYPES_ACCEPTES = Object.keys(TYPES);

/**
 * Multer en mémoire : le fichier n'est écrit sur le disque qu'une fois la
 * fiche vérifiée et le type confirmé. Écrire d'abord et valider ensuite
 * laisserait des fichiers orphelins à chaque requête refusée.
 */
exports.recevoirImage = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: TAILLE_MAX, files: 1 },
    fileFilter: (req, fichier, suite) => {
        if (!TYPES[fichier.mimetype]) {
            return suite(new Error('TYPE_REFUSE'));
        }
        suite(null, true);
    }
}).single('image');

/**
 * Écrit le fichier reçu et renvoie l'URL publique à ranger dans `image_url`.
 * Le nom est tiré au hasard : reprendre celui fourni par le client laisserait
 * choisir un chemin, et deux envois du même nom s'écraseraient.
 */
exports.enregistrerImage = async (cafeId, fichier) => {
    await fs.mkdir(DOSSIER, { recursive: true });

    const nom = `cafe-${cafeId}-${crypto.randomBytes(8).toString('hex')}${TYPES[fichier.mimetype]}`;
    await fs.writeFile(path.join(DOSSIER, nom), fichier.buffer);

    return `${PREFIXE_URL}/${nom}`;
};

/**
 * Supprime un fichier que nous avons nous-mêmes écrit.
 *
 * Ne touche à rien d'autre : une `image_url` qui pointe vers Wikimedia ou tout
 * autre site n'est pas à nous, et un chemin qui tenterait de sortir du dossier
 * est ignoré plutôt que suivi.
 */
exports.supprimerImageLocale = async (imageUrl) => {
    if (!imageUrl || !imageUrl.startsWith(`${PREFIXE_URL}/`)) return;

    const nom = path.basename(imageUrl);
    const chemin = path.join(DOSSIER, nom);

    if (path.dirname(chemin) !== DOSSIER) return;

    try {
        await fs.unlink(chemin);
    } catch (err) {
        // Le fichier a déjà disparu : ce n'est pas une erreur, le but est
        // atteint. Toute autre cause mérite une trace.
        if (err.code !== 'ENOENT') {
            journal.alerte(`[cafes] image non supprimée (${nom}) : ${err.message}`);
        }
    }
};

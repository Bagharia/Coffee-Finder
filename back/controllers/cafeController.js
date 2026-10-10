const db = require('../config/db');
const journal = require('../utils/journal');
const { COLONNES_CAFE, JOINTURE, attacherHoraires, remplacerHoraires } = require('../utils/cafes');
const { validerHoraires, conditionOuvert } = require('../utils/horaires');
const { geocodeAdresse } = require('../utils/geocodage');
const { normaliserAdresse, echapperLike } = require('../utils/adresse');
const {
    recevoirImage, enregistrerImage, supprimerImageLocale, TAILLE_MAX, TYPES_ACCEPTES
} = require('../utils/televersement');

const PRIX_VALIDES = ['1-10', '10-20', '20+'];

// Les adresses en corbeille sont invisibles partout, sauf là où on les demande
// explicitement. Le filtre est posé dans `listerCafes` et non recopié dans
// chaque route : une route ajoutée demain hérite du bon comportement sans que
// personne n'ait à y penser — l'oubli inverse exposerait des fiches supprimées.
const VIVANTES = 'cafes.supprime_le IS NULL';
const EN_CORBEILLE = 'cafes.supprime_le IS NOT NULL';

// Longueur maximale d'une recherche libre. Au-delà, ce n'est plus une
// recherche : c'est une tentative de faire travailler la base pour rien.
const RECHERCHE_MAX = 100;

// Le client n'a pas à connaître la structure de la base : le détail va dans le
// journal serveur, le client reçoit une phrase.
const echec = (res, err, contexte, message = 'Erreur serveur') => {
    journal.erreur(`[cafes] ${contexte} :`, err);
    return res.status(500).json({ error: message });
};
const { lirePagination, reponsePaginee, valider, versBooleen } = require('../utils/validation');



/**
 * Exécute une requête de liste paginée sur la jointure cafes + critères.
 * Toute route qui renvoie plusieurs adresses passe par ici.
 */
async function listerCafes(req, res, { where = '', valeurs = [], ordre = 'cafes.nom ASC', contexte, portee = VIVANTES }) {
    const { page, limite, offset } = lirePagination(req.query);
    // `cafes.id` départage les ex æquo : sans lui, deux adresses de même nom
    // peuvent changer de place d'une requête à l'autre et une page en répéterait
    // une ou en sauterait une.
    const conditions = [portee, where].filter(Boolean);
    const clause = `WHERE ${conditions.join(' AND ')}`;

    try {
        const [[{ total }]] = await db.query(
            `SELECT COUNT(*) AS total ${JOINTURE} ${clause}`,
            valeurs
        );

        const [rows] = await db.query(
            `SELECT ${COLONNES_CAFE} ${JOINTURE} ${clause} ORDER BY ${ordre}, cafes.id ASC LIMIT ? OFFSET ?`,
            [...valeurs, limite, offset]
        );

        await attacherHoraires(rows);

        return res.json(reponsePaginee(rows, { page, limite }, total));
    } catch (err) {
        return echec(res, err, contexte);
    }
}

// Nombre maximal de points renvoyés pour la carte. Au-delà, la réponse le dit
// (`total` > `donnees.length`) : une limite qui se tait ment.
const CARTE_MAX = 2000;

/**
 * GET /api/cafes/carte — toutes les adresses placées, en version allégée.
 *
 * La carte a besoin de l'ensemble pour regrouper ses marqueurs : la paginer
 * afficherait un morceau de Paris. On allège donc la réponse (pas de verdict,
 * pas d'horaires) et la fiche complète se charge à la sélection.
 */
exports.getCarte = async (req, res) => {
    const placees = `${VIVANTES} AND cafes.latitude IS NOT NULL AND cafes.longitude IS NOT NULL`;

    try {
        const [[{ total }]] = await db.query(`SELECT COUNT(*) AS total ${JOINTURE} WHERE ${placees}`);

        const [rows] = await db.query(
            `SELECT cafes.id AS id, cafes.nom AS nom, cafes.arrondissement AS arrondissement,
                    cafes.latitude AS latitude, cafes.longitude AS longitude,
                    criteres_cafe.specialite AS specialite, criteres_cafe.wifi AS wifi
             ${JOINTURE} WHERE ${placees} ORDER BY cafes.id ASC LIMIT ?`,
            [CARTE_MAX]
        );

        return res.json({ donnees: rows, total });
    } catch (err) {
        return echec(res, err, 'points de la carte');
    }
};

exports.getRandomCafe = async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT ${COLONNES_CAFE} ${JOINTURE} WHERE ${VIVANTES} ORDER BY RAND() LIMIT 1`
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Aucune adresse dans le guide pour l\'instant.' });
        }

        await attacherHoraires(rows);

        return res.json(rows[0]);
    } catch (err) {
        return echec(res, err, 'tirage aléatoire');
    }
};

exports.getNouveautes = (req, res) => listerCafes(req, res, {
    where: 'cafes.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)',
    ordre: 'cafes.created_at DESC',
    contexte: 'nouveautés'
});

exports.getAllCafes = (req, res) => listerCafes(req, res, {
    contexte: 'liste complète'
});

exports.getCafeByArrondissement = (req, res) => listerCafes(req, res, {
    where: 'cafes.arrondissement = ?',
    valeurs: [req.params.arr],
    contexte: 'filtre arrondissement'
});

// Les spécialités sont une liste séparée par des virgules, avec ou sans espace
// derrière (« Matcha,Thé » ou « Matcha, Thé »). Une seule définition pour la
// route dédiée et pour la recherche : deux versions divergeraient, et
// « bubble tea » donnerait des résultats différents selon l'écran.
const CONDITION_SPECIALITE = `(FIND_IN_SET(LOWER(?), LOWER(REPLACE(criteres_cafe.specialite, ' ', '')))
                 OR FIND_IN_SET(LOWER(?), LOWER(criteres_cafe.specialite)))`;
const valeursSpecialite = (specialite) => [specialite.replace(/\s/g, ''), specialite];

exports.getCafeBySpecialite = (req, res) => listerCafes(req, res, {
    where: CONDITION_SPECIALITE,
    valeurs: valeursSpecialite(req.params.spec),
    contexte: 'filtre spécialité'
});

exports.getCafeWithWifi = (req, res) => {
    const wifi = Number(req.params.wifi);

    if (wifi !== 0 && wifi !== 1) {
        return res.status(400).json({ error: 'Le filtre wifi vaut 0 ou 1.' });
    }

    return listerCafes(req, res, {
        where: 'criteres_cafe.wifi = ?',
        valeurs: [wifi],
        contexte: 'filtre wifi'
    });
};

exports.getCafeWithPrice = (req, res) => {
    const prix = req.params.prix;

    if (!PRIX_VALIDES.includes(prix)) {
        return res.status(400).json({ error: `Prix invalide. Valeurs acceptées : ${PRIX_VALIDES.join(', ')}.` });
    }

    return listerCafes(req, res, {
        where: 'criteres_cafe.prix = ?',
        valeurs: [prix],
        contexte: 'filtre prix'
    });
};

exports.getCafeWithAmbiance = (req, res) => listerCafes(req, res, {
    where: 'criteres_cafe.ambiance = ?',
    valeurs: [req.params.amb],
    contexte: 'filtre ambiance'
});

exports.searchCafes = (req, res) => {
    const { q, arrondissement, specialite, wifi, prix, ambiance, prises, travailler, theme, nb_personnes, nouveautes, coup_de_coeur, avec_verdict, ouvert, tri } = req.query;

    const conditions = [];
    const valeurs = [];

    // Recherche libre. Un LIKE suffit à l'échelle d'un guide de quartier ; le
    // jour où la table compte des milliers de lignes, il faudra un index
    // FULLTEXT et MATCH … AGAINST, qui classe par pertinence au lieu de
    // renvoyer tout ce qui contient la chaîne.
    if (q !== undefined) {
        const terme = String(q).trim();

        if (terme.length === 0) {
            return res.status(400).json({ error: 'La recherche ne peut pas être vide.' });
        }

        if (terme.length > RECHERCHE_MAX) {
            return res.status(400).json({ error: `La recherche ne peut pas dépasser ${RECHERCHE_MAX} caractères.` });
        }

        const motif = `%${echapperLike(terme)}%`;
        conditions.push('(cafes.nom LIKE ? OR cafes.adresse LIKE ? OR cafes.description LIKE ? OR cafes.verdict LIKE ?)');
        valeurs.push(motif, motif, motif, motif);
    }

    if (arrondissement) {
        conditions.push('cafes.arrondissement = ?');
        valeurs.push(arrondissement);
    }

    // Spécialité et thème sont des listes séparées par des virgules → FIND_IN_SET.
    if (specialite) {
        conditions.push(CONDITION_SPECIALITE);
        valeurs.push(...valeursSpecialite(specialite));
    }

    if (wifi === '0' || wifi === '1') {
        conditions.push('criteres_cafe.wifi = ?');
        valeurs.push(Number(wifi));
    }

    if (prix) {
        if (!PRIX_VALIDES.includes(prix)) {
            return res.status(400).json({ error: `Prix invalide. Valeurs acceptées : ${PRIX_VALIDES.join(', ')}.` });
        }
        conditions.push('criteres_cafe.prix = ?');
        valeurs.push(prix);
    }

    if (ambiance) {
        conditions.push('criteres_cafe.ambiance = ?');
        valeurs.push(ambiance);
    }

    if (prises === '0' || prises === '1') {
        conditions.push('criteres_cafe.prises = ?');
        valeurs.push(Number(prises));
    }

    if (travailler === '0' || travailler === '1') {
        conditions.push('criteres_cafe.travailler = ?');
        valeurs.push(Number(travailler));
    }

    // Même fenêtre que /api/cafes/nouveautes : les deux doivent s'accorder,
    // sinon « arrivées récentes » et le filtre « nouveautés » ne montreraient
    // pas les mêmes adresses.
    if (nouveautes === '1') {
        conditions.push('cafes.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)');
    }

    if (theme) {
        conditions.push('FIND_IN_SET(LOWER(?), LOWER(criteres_cafe.theme))');
        valeurs.push(theme.toLowerCase());
    }

    if (nb_personnes) {
        conditions.push('criteres_cafe.nb_personnes = ?');
        valeurs.push(nb_personnes);
    }

    if (coup_de_coeur === '1') {
        conditions.push('cafes.coup_de_coeur = 1');
    }

    if (avec_verdict === '1') {
        conditions.push("(cafes.verdict IS NOT NULL AND cafes.verdict <> '')");
    }

    if (ouvert === '1') {
        const filtreOuvert = conditionOuvert();
        conditions.push(filtreOuvert.sql);
        valeurs.push(...filtreOuvert.valeurs);
    }

    // Liste blanche : l'ordre part dans le SQL tel quel, il ne vient jamais du client.
    const ordre = tri === 'recent' ? 'cafes.created_at DESC' : undefined;

    return listerCafes(req, res, {
        where: conditions.join(' AND '),
        valeurs,
        ordre,
        contexte: 'recherche'
    });
};

exports.getCafeById = async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT ${COLONNES_CAFE} ${JOINTURE} WHERE cafes.id = ? AND ${VIVANTES}`,
            [req.params.id]
        );

        // Le 404 se décide ici, sur un résultat vide. Dans un catch, il ne se
        // déclencherait jamais : une requête qui ne trouve rien ne lève pas.
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Cette adresse n\'existe pas.' });
        }

        await attacherHoraires(rows);

        return res.json(rows[0]);
    } catch (err) {
        return echec(res, err, 'lecture par id');
    }
};

/**
 * Cherche une adresse déjà enregistrée au même endroit.
 *
 * La comparaison se fait sur la forme normalisée : « 12 Rue de Bretagne,
 * 75003 Paris » et « 12 rue de bretagne 75003 paris » désignent le même lieu,
 * et une contrainte UNIQUE en base ne les distinguerait pas.
 *
 * Parcourt les adresses en mémoire plutôt que de les comparer en SQL : à
 * l'échelle d'un guide de quartier c'est négligeable, et surtout ça évite de
 * stocker une deuxième version de l'adresse qui divergerait de la première.
 * Si la table devient grande, c'est cette fonction qu'il faudra revoir.
 *
 * @returns {object|null} la fiche en conflit, ou null
 */
async function adresseDejaPrise(adresse, exclureId = null) {
    const cible = normaliserAdresse(adresse);
    if (!cible) return null;

    const [rows] = await db.query(
        `SELECT id, nom, adresse FROM cafes WHERE adresse IS NOT NULL AND ${VIVANTES}`
    );

    return rows.find((cafe) =>
        cafe.id !== Number(exclureId) && normaliserAdresse(cafe.adresse) === cible
    ) ?? null;
}

const SCHEMA_CAFE = {
    nom: { requis: true, min: 1, max: 255 },
    arrondissement: { requis: true, max: 50 },
    adresse: { max: 255 },
    image_url: { max: 500 },
    description: { max: 5000 },
    verdict: { max: 5000 },
    nb_personnes: { max: 50 },
    specialite: { max: 255 },
    prix: { valeurs: PRIX_VALIDES },
    theme: { max: 255 },
    ambiance: { max: 100 },
    wifi: { type: 'booleen' },
    prises: { type: 'booleen' },
    travailler: { type: 'booleen' },
    coup_de_coeur: { type: 'booleen' }
};

exports.createCafe = async (req, res) => {
    const erreurs = valider(req.body, SCHEMA_CAFE);
    if (erreurs.length > 0) {
        return res.status(400).json({ error: erreurs.join(' ') });
    }

    // Les horaires sont un tableau, pas un champ scalaire : ils se valident à
    // part, et avant la moindre écriture — sinon l'adresse serait créée puis
    // rejetée sur ses horaires.
    const { erreur: erreurHoraires, plages } = validerHoraires(req.body.horaires);
    if (erreurHoraires) {
        return res.status(400).json({ error: erreurHoraires });
    }

    const {
        nom, arrondissement, adresse, image_url, description, verdict, coup_de_coeur,
        nb_personnes, specialite, prix, wifi, prises, travailler, theme, ambiance
    } = req.body;

    try {
        const conflit = await adresseDejaPrise(adresse);
        if (conflit) {
            return res.status(409).json({
                error: `« ${conflit.nom} » occupe déjà cette adresse.`,
                cafeId: conflit.id
            });
        }

        const coords = await geocodeAdresse(adresse);

        // Les trois écritures forment une seule adresse : validées ensemble ou
        // pas du tout. Le géocodage, lent et réseau, reste hors transaction.
        const cafeId = await db.transaction(async (cx) => {
            const [cafeResult] = await cx.query(
                `INSERT INTO cafes
                 (nom, arrondissement, adresse, description, image_url, latitude, longitude, verdict, coup_de_coeur)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    nom, arrondissement, adresse || null, description || null, image_url || null,
                    coords ? coords.lat : null, coords ? coords.lon : null,
                    verdict || null, versBooleen(coup_de_coeur)
                ]
            );

            const id = cafeResult.insertId;

            await cx.query(
                `INSERT INTO criteres_cafe
                 (cafe_id, nb_personnes, specialite, prix, wifi, prises, travailler, theme, ambiance)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    id,
                    nb_personnes || null,
                    specialite || null,
                    prix || null,
                    versBooleen(wifi),
                    versBooleen(prises),
                    versBooleen(travailler),
                    theme || null,
                    ambiance || null
                ]
            );

            if (plages) {
                await remplacerHoraires(id, plages, cx);
            }

            return id;
        });

        const [rows] = await db.query(
            `SELECT ${COLONNES_CAFE} ${JOINTURE} WHERE cafes.id = ?`,
            [cafeId]
        );

        await attacherHoraires(rows);

        return res.status(201).json(rows[0]);
    } catch (err) {
        return echec(res, err, 'création', 'Erreur lors de la création de l\'adresse');
    }
};

// Construit la paire (fragments SET, valeurs) à partir des champs réellement
// envoyés : un PUT partiel ne doit pas écraser ce qu'il ne mentionne pas.
function construireMaj(corps, champs) {
    const fragments = [];
    const valeurs = [];

    for (const champ of champs) {
        if (corps[champ] === undefined) continue;
        fragments.push(`${champ} = ?`);
        valeurs.push(corps[champ] === '' ? null : corps[champ]);
    }

    return { fragments, valeurs };
}

const CHAMPS_CAFE = ['nom', 'arrondissement', 'adresse', 'description', 'image_url', 'verdict'];
const CHAMPS_CRITERES = ['nb_personnes', 'specialite', 'prix', 'theme', 'ambiance'];
const CHAMPS_BOOLEENS = ['wifi', 'prises', 'travailler'];

exports.updateCafe = async (req, res) => {
    const erreurs = valider(req.body, { ...SCHEMA_CAFE, nom: { max: 255 }, arrondissement: { max: 50 } });
    if (erreurs.length > 0) {
        return res.status(400).json({ error: erreurs.join(' ') });
    }

    // Validés avant toute écriture : un PUT ne doit pas modifier la moitié
    // d'une adresse puis refuser l'autre moitié.
    const { erreur: erreurHoraires, plages } = validerHoraires(req.body.horaires);
    if (erreurHoraires) {
        return res.status(400).json({ error: erreurHoraires });
    }

    const cafeId = req.params.id;

    try {
        const [existe] = await db.query('SELECT id FROM cafes WHERE id = ?', [cafeId]);
        if (existe.length === 0) {
            return res.status(404).json({ error: 'Cette adresse n\'existe pas.' });
        }

        const majCafe = construireMaj(req.body, CHAMPS_CAFE);

        if (req.body.coup_de_coeur !== undefined) {
            majCafe.fragments.push('coup_de_coeur = ?');
            majCafe.valeurs.push(versBooleen(req.body.coup_de_coeur));
        }

        if (req.body.adresse) {
            const conflit = await adresseDejaPrise(req.body.adresse, cafeId);
            if (conflit) {
                return res.status(409).json({
                    error: `« ${conflit.nom} » occupe déjà cette adresse.`,
                    cafeId: conflit.id
                });
            }
        }

        // Une adresse qui change déplace le marqueur : on regéocode.
        if (req.body.adresse) {
            const coords = await geocodeAdresse(req.body.adresse);
            if (coords) {
                majCafe.fragments.push('latitude = ?', 'longitude = ?');
                majCafe.valeurs.push(coords.lat, coords.lon);
            }
        }

        const majCriteres = construireMaj(req.body, CHAMPS_CRITERES);

        for (const champ of CHAMPS_BOOLEENS) {
            if (req.body[champ] === undefined) continue;
            majCriteres.fragments.push(`${champ} = ?`);
            majCriteres.valeurs.push(versBooleen(req.body[champ]));
        }

        // Une modification touche jusqu'à trois tables : sans transaction, une
        // panne au milieu laissait une adresse à moitié modifiée.
        await db.transaction(async (cx) => {
            if (majCafe.fragments.length > 0) {
                await cx.query(
                    `UPDATE cafes SET ${majCafe.fragments.join(', ')} WHERE id = ?`,
                    [...majCafe.valeurs, cafeId]
                );
            }

            if (majCriteres.fragments.length > 0) {
                await cx.query(
                    `UPDATE criteres_cafe SET ${majCriteres.fragments.join(', ')} WHERE cafe_id = ?`,
                    [...majCriteres.valeurs, cafeId]
                );
            }

            // `undefined` laisse les horaires en place, un tableau vide les efface :
            // « ne touche pas » et « cette adresse n'a plus d'horaires » sont deux
            // intentions différentes et un PUT partiel doit pouvoir exprimer les deux.
            if (plages !== undefined) {
                await remplacerHoraires(cafeId, plages, cx);
            }
        });

        const [rows] = await db.query(
            `SELECT ${COLONNES_CAFE} ${JOINTURE} WHERE cafes.id = ?`,
            [cafeId]
        );

        await attacherHoraires(rows);

        return res.json(rows[0]);
    } catch (err) {
        return echec(res, err, 'modification', 'Erreur lors de la modification de l\'adresse');
    }
};

// GET /api/cafes/corbeille — les adresses supprimées, pour les rétablir.
exports.getCorbeille = (req, res) => listerCafes(req, res, {
    portee: EN_CORBEILLE,
    ordre: 'cafes.supprime_le DESC',
    contexte: 'lecture de la corbeille'
});

/**
 * DELETE /api/cafes/:id — met l'adresse à la corbeille.
 *
 * `?definitif=1` supprime pour de bon, en emportant les critères, les avis et
 * les favoris en cascade. Ce n'est pas le défaut : une suppression ordinaire
 * ne doit pas pouvoir détruire les avis que des visiteurs ont écrits.
 */
exports.deleteCafe = async (req, res) => {
    const cafeId = req.params.id;
    const definitif = req.query.definitif === '1';

    try {
        const [existe] = await db.query('SELECT id, nom, image_url, supprime_le FROM cafes WHERE id = ?', [cafeId]);
        if (existe.length === 0) {
            return res.status(404).json({ error: 'Cette adresse n\'existe pas.' });
        }

        const cafe = existe[0];

        if (definitif) {
            // Le fichier part avec la fiche : sans ça, l'image resterait sur le
            // disque sans que plus rien ne la référence.
            await supprimerImageLocale(cafe.image_url);

            await db.query('DELETE FROM cafes WHERE id = ?', [cafeId]);
            journal.info(`[cafes] suppression définitive de « ${cafe.nom} » (id ${cafeId})`);

            return res.json({ message: 'Adresse supprimée définitivement.', id: Number(cafeId) });
        }

        if (cafe.supprime_le) {
            return res.status(409).json({ error: 'Cette adresse est déjà à la corbeille.' });
        }

        await db.query('UPDATE cafes SET supprime_le = NOW() WHERE id = ?', [cafeId]);

        return res.json({
            message: 'Adresse mise à la corbeille. Elle peut être rétablie.',
            id: Number(cafeId)
        });
    } catch (err) {
        return echec(res, err, 'suppression', 'Erreur lors de la suppression de l\'adresse');
    }
};

// POST /api/cafes/:id/restaurer — ressort une adresse de la corbeille.
exports.restaurerCafe = async (req, res) => {
    const cafeId = req.params.id;

    try {
        const [rows] = await db.query('SELECT id, nom, adresse, supprime_le FROM cafes WHERE id = ?', [cafeId]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Cette adresse n\'existe pas.' });
        }

        if (!rows[0].supprime_le) {
            return res.status(409).json({ error: 'Cette adresse n\'est pas à la corbeille.' });
        }

        // Une autre fiche a pu prendre l'adresse pendant que celle-ci dormait :
        // la rétablir en silence créerait le doublon qu'on cherche à éviter.
        const conflit = await adresseDejaPrise(rows[0].adresse, cafeId);
        if (conflit) {
            return res.status(409).json({
                error: `Impossible de rétablir : « ${conflit.nom} » occupe désormais cette adresse.`,
                cafeId: conflit.id
            });
        }

        await db.query('UPDATE cafes SET supprime_le = NULL WHERE id = ?', [cafeId]);

        const [fiche] = await db.query(
            `SELECT ${COLONNES_CAFE} ${JOINTURE} WHERE cafes.id = ?`,
            [cafeId]
        );

        await attacherHoraires(fiche);

        return res.json(fiche[0]);
    } catch (err) {
        return echec(res, err, 'restauration', 'Erreur lors du rétablissement de l\'adresse');
    }
};

/**
 * POST /api/cafes/:id/image — remplace la photo d'une adresse.
 *
 * Multer est appelé à la main plutôt que posé en middleware sur la route :
 * ses erreurs (fichier trop gros, type refusé) arriveraient sinon au
 * gestionnaire global, qui répondrait « Erreur serveur » pour une saisie que
 * l'utilisateur peut corriger lui-même.
 */
exports.televerserImage = (req, res) => {
    recevoirImage(req, res, async (err) => {
        if (err) {
            if (err.message === 'TYPE_REFUSE') {
                return res.status(415).json({
                    error: `Format non accepté. Formats possibles : ${TYPES_ACCEPTES.join(', ')}.`
                });
            }
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(413).json({
                    error: `Image trop lourde. ${Math.round(TAILLE_MAX / 1024 / 1024)} Mo au maximum.`
                });
            }
            return echec(res, err, 'téléversement', 'Erreur lors de l\'envoi de l\'image');
        }

        if (!req.file) {
            return res.status(400).json({ error: 'Aucune image reçue. Le champ attendu s\'appelle « image ».' });
        }

        const cafeId = req.params.id;

        try {
            const [rows] = await db.query(
                `SELECT id, image_url FROM cafes WHERE id = ? AND ${VIVANTES}`,
                [cafeId]
            );

            if (rows.length === 0) {
                return res.status(404).json({ error: 'Cette adresse n\'existe pas.' });
            }

            const ancienne = rows[0].image_url;
            const url = await enregistrerImage(cafeId, req.file);

            await db.query('UPDATE cafes SET image_url = ? WHERE id = ?', [url, cafeId]);

            // L'ancienne image ne part qu'une fois la nouvelle en base : dans
            // l'ordre inverse, un échec du UPDATE laisserait la fiche pointer
            // vers un fichier qu'on vient d'effacer.
            await supprimerImageLocale(ancienne);

            return res.json({ message: 'Image enregistrée.', image_url: url });
        } catch (erreur) {
            return echec(res, erreur, 'téléversement', 'Erreur lors de l\'envoi de l\'image');
        }
    });
};

// DELETE /api/cafes/:id/image — retire la photo, la fiche retombe sur .image-repli.
exports.supprimerImage = async (req, res) => {
    const cafeId = req.params.id;

    try {
        const [rows] = await db.query(
            `SELECT id, image_url FROM cafes WHERE id = ? AND ${VIVANTES}`,
            [cafeId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Cette adresse n\'existe pas.' });
        }

        await db.query('UPDATE cafes SET image_url = NULL WHERE id = ?', [cafeId]);
        await supprimerImageLocale(rows[0].image_url);

        return res.json({ message: 'Image retirée.', id: Number(cafeId) });
    } catch (err) {
        return echec(res, err, 'suppression d\'image', 'Erreur lors du retrait de l\'image');
    }
};

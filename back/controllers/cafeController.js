const db = require('../config/db');
const { lirePagination, reponsePaginee, valider, versBooleen } = require('../utils/validation');

// `cafes` et `criteres_cafe` ont toutes les deux une colonne `id` : sur un
// SELECT *, mysql2 écrase la première par la seconde et l'id renvoyé au front
// est celui des critères. D'où cette liste explicite, aliasée, jamais un *.
const COLONNES_CAFE = `
    cafes.id AS id,
    cafes.nom AS nom,
    cafes.arrondissement AS arrondissement,
    cafes.adresse AS adresse,
    cafes.description AS description,
    cafes.image_url AS image_url,
    cafes.latitude AS latitude,
    cafes.longitude AS longitude,
    cafes.verdict AS verdict,
    cafes.coup_de_coeur AS coup_de_coeur,
    cafes.created_at AS created_at,
    cafes.updated_at AS updated_at,
    criteres_cafe.id AS critere_id,
    criteres_cafe.nb_personnes AS nb_personnes,
    criteres_cafe.horaires AS horaires,
    criteres_cafe.specialite AS specialite,
    criteres_cafe.prix AS prix,
    criteres_cafe.wifi AS wifi,
    criteres_cafe.prises AS prises,
    criteres_cafe.travailler AS travailler,
    criteres_cafe.theme AS theme,
    criteres_cafe.ambiance AS ambiance
`;

const JOINTURE = 'FROM cafes JOIN criteres_cafe ON cafes.id = criteres_cafe.cafe_id';

const PRIX_VALIDES = ['1-10', '10-20', '20+'];

// Le client n'a pas à connaître la structure de la base : le détail va dans le
// journal serveur, le client reçoit une phrase.
const echec = (res, err, contexte, message = 'Erreur serveur') => {
    console.error(`[cafes] ${contexte} :`, err);
    return res.status(500).json({ error: message });
};

// Géocode une adresse via Nominatim (OpenStreetMap) — retourne { lat, lon } ou null.
// Best-effort : une adresse non géocodée entre quand même, elle n'apparaît
// simplement pas sur la carte.
async function geocodeAdresse(adresse) {
    if (!adresse) return null;
    try {
        const query = encodeURIComponent(`${adresse}, Paris, France`);
        const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`;
        const res = await fetch(url, {
            headers: { 'User-Agent': 'SpotThePlace/1.0' }
        });
        const data = await res.json();
        if (data && data.length > 0) {
            return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
        }
        return null;
    } catch (err) {
        console.error('[cafes] géocodage impossible :', err);
        return null;
    }
}

/**
 * Exécute une requête de liste paginée sur la jointure cafes + critères.
 * Toute route qui renvoie plusieurs adresses passe par ici.
 */
async function listerCafes(req, res, { where = '', valeurs = [], ordre = 'cafes.nom ASC', contexte }) {
    const { page, limite, offset } = lirePagination(req.query);
    const clause = where ? `WHERE ${where}` : '';

    try {
        const [[{ total }]] = await db.query(
            `SELECT COUNT(*) AS total ${JOINTURE} ${clause}`,
            valeurs
        );

        const [rows] = await db.query(
            `SELECT ${COLONNES_CAFE} ${JOINTURE} ${clause} ORDER BY ${ordre} LIMIT ? OFFSET ?`,
            [...valeurs, limite, offset]
        );

        return res.json(reponsePaginee(rows, { page, limite }, total));
    } catch (err) {
        return echec(res, err, contexte);
    }
}

exports.getRandomCafe = async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT ${COLONNES_CAFE} ${JOINTURE} ORDER BY RAND() LIMIT 1`
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Aucune adresse dans le guide pour l\'instant.' });
        }

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

exports.getCafeBySpecialite = (req, res) => {
    const specialite = req.params.spec;
    return listerCafes(req, res, {
        where: `(FIND_IN_SET(LOWER(?), LOWER(REPLACE(criteres_cafe.specialite, ' ', '')))
                 OR FIND_IN_SET(LOWER(?), LOWER(criteres_cafe.specialite)))`,
        valeurs: [specialite.replace(/\s/g, ''), specialite],
        contexte: 'filtre spécialité'
    });
};

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
    const { arrondissement, specialite, wifi, prix, ambiance, prises, theme, nb_personnes, horaires, coup_de_coeur } = req.query;

    const conditions = [];
    const valeurs = [];

    if (arrondissement) {
        conditions.push('cafes.arrondissement = ?');
        valeurs.push(arrondissement);
    }

    // Spécialité et thème sont des listes séparées par des virgules → FIND_IN_SET.
    if (specialite) {
        conditions.push('FIND_IN_SET(LOWER(?), LOWER(criteres_cafe.specialite))');
        valeurs.push(specialite.toLowerCase());
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

    if (theme) {
        conditions.push('FIND_IN_SET(LOWER(?), LOWER(criteres_cafe.theme))');
        valeurs.push(theme.toLowerCase());
    }

    if (nb_personnes) {
        conditions.push('criteres_cafe.nb_personnes = ?');
        valeurs.push(nb_personnes);
    }

    if (horaires) {
        conditions.push('criteres_cafe.horaires = ?');
        valeurs.push(horaires);
    }

    if (coup_de_coeur === '1') {
        conditions.push('cafes.coup_de_coeur = 1');
    }

    return listerCafes(req, res, {
        where: conditions.join(' AND '),
        valeurs,
        contexte: 'recherche'
    });
};

exports.getCafeById = async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT ${COLONNES_CAFE} ${JOINTURE} WHERE cafes.id = ?`,
            [req.params.id]
        );

        // Le 404 se décide ici, sur un résultat vide. Dans un catch, il ne se
        // déclencherait jamais : une requête qui ne trouve rien ne lève pas.
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Cette adresse n\'existe pas.' });
        }

        return res.json(rows[0]);
    } catch (err) {
        return echec(res, err, 'lecture par id');
    }
};

const SCHEMA_CAFE = {
    nom: { requis: true, min: 1, max: 255 },
    arrondissement: { requis: true, max: 50 },
    adresse: { max: 255 },
    image_url: { max: 500 },
    description: { max: 5000 },
    verdict: { max: 5000 },
    nb_personnes: { max: 50 },
    horaires: { max: 100 },
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

    const {
        nom, arrondissement, adresse, image_url, description, verdict, coup_de_coeur,
        nb_personnes, horaires, specialite, prix, wifi, prises, travailler, theme, ambiance
    } = req.body;

    try {
        const coords = await geocodeAdresse(adresse);

        const [cafeResult] = await db.query(
            `INSERT INTO cafes
             (nom, arrondissement, adresse, description, image_url, latitude, longitude, verdict, coup_de_coeur)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                nom, arrondissement, adresse || null, description || null, image_url || null,
                coords ? coords.lat : null, coords ? coords.lon : null,
                verdict || null, versBooleen(coup_de_coeur)
            ]
        );

        const cafeId = cafeResult.insertId;

        await db.query(
            `INSERT INTO criteres_cafe
             (cafe_id, nb_personnes, horaires, specialite, prix, wifi, prises, travailler, theme, ambiance)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                cafeId,
                nb_personnes || null,
                horaires || null,
                specialite || null,
                prix || null,
                versBooleen(wifi),
                versBooleen(prises),
                versBooleen(travailler),
                theme || null,
                ambiance || null
            ]
        );

        const [rows] = await db.query(
            `SELECT ${COLONNES_CAFE} ${JOINTURE} WHERE cafes.id = ?`,
            [cafeId]
        );

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
const CHAMPS_CRITERES = ['nb_personnes', 'horaires', 'specialite', 'prix', 'theme', 'ambiance'];
const CHAMPS_BOOLEENS = ['wifi', 'prises', 'travailler'];

exports.updateCafe = async (req, res) => {
    const erreurs = valider(req.body, { ...SCHEMA_CAFE, nom: { max: 255 }, arrondissement: { max: 50 } });
    if (erreurs.length > 0) {
        return res.status(400).json({ error: erreurs.join(' ') });
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

        // Une adresse qui change déplace le marqueur : on regéocode.
        if (req.body.adresse) {
            const coords = await geocodeAdresse(req.body.adresse);
            if (coords) {
                majCafe.fragments.push('latitude = ?', 'longitude = ?');
                majCafe.valeurs.push(coords.lat, coords.lon);
            }
        }

        if (majCafe.fragments.length > 0) {
            await db.query(
                `UPDATE cafes SET ${majCafe.fragments.join(', ')} WHERE id = ?`,
                [...majCafe.valeurs, cafeId]
            );
        }

        const majCriteres = construireMaj(req.body, CHAMPS_CRITERES);

        for (const champ of CHAMPS_BOOLEENS) {
            if (req.body[champ] === undefined) continue;
            majCriteres.fragments.push(`${champ} = ?`);
            majCriteres.valeurs.push(versBooleen(req.body[champ]));
        }

        if (majCriteres.fragments.length > 0) {
            await db.query(
                `UPDATE criteres_cafe SET ${majCriteres.fragments.join(', ')} WHERE cafe_id = ?`,
                [...majCriteres.valeurs, cafeId]
            );
        }

        const [rows] = await db.query(
            `SELECT ${COLONNES_CAFE} ${JOINTURE} WHERE cafes.id = ?`,
            [cafeId]
        );

        return res.json(rows[0]);
    } catch (err) {
        return echec(res, err, 'modification', 'Erreur lors de la modification de l\'adresse');
    }
};

exports.deleteCafe = async (req, res) => {
    const cafeId = req.params.id;

    try {
        const [existe] = await db.query('SELECT id FROM cafes WHERE id = ?', [cafeId]);
        if (existe.length === 0) {
            return res.status(404).json({ error: 'Cette adresse n\'existe pas.' });
        }

        // criteres_cafe, avis et favoris partent en cascade (contraintes FK).
        await db.query('DELETE FROM cafes WHERE id = ?', [cafeId]);

        return res.json({ message: 'Adresse supprimée.', id: Number(cafeId) });
    } catch (err) {
        return echec(res, err, 'suppression', 'Erreur lors de la suppression de l\'adresse');
    }
};

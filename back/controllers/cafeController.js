const db = require('../config/db');
const { FRONTEND_URL } = require('../config/env');
const journal = require('../utils/journal');
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
    criteres_cafe.specialite AS specialite,
    criteres_cafe.prix AS prix,
    criteres_cafe.wifi AS wifi,
    criteres_cafe.prises AS prises,
    criteres_cafe.travailler AS travailler,
    criteres_cafe.theme AS theme,
    criteres_cafe.ambiance AS ambiance
`;

const JOINTURE = 'FROM cafes JOIN criteres_cafe ON cafes.id = criteres_cafe.cafe_id';

// Jour 1 = lundi … 7 = dimanche. Absence de ligne pour un jour = fermé ce
// jour-là. Plusieurs lignes pour un même jour = service coupé.
const HEURE = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;
const PLAGES_MAX = 28;

/**
 * Les horaires ne peuvent pas entrer dans la jointure principale : une adresse
 * ouverte sept jours multiplierait sa ligne par sept, et la pagination
 * compterait des plages au lieu d'adresses. On les lit en une seule requête
 * pour toute la page, puis on les rattache.
 */
async function attacherHoraires(cafes) {
    if (cafes.length === 0) return cafes;

    const ids = cafes.map((cafe) => cafe.id);
    const [plages] = await db.query(
        'SELECT cafe_id, jour, ouverture, fermeture FROM cafe_horaires WHERE cafe_id IN (?) ORDER BY jour, ouverture',
        [ids]
    );

    const parCafe = new Map(ids.map((id) => [id, []]));
    for (const { cafe_id, jour, ouverture, fermeture } of plages) {
        parCafe.get(cafe_id)?.push({ jour, ouverture, fermeture });
    }

    for (const cafe of cafes) {
        cafe.horaires = parCafe.get(cafe.id) ?? [];
    }

    return cafes;
}

/**
 * Valide le tableau d'horaires reçu. Renvoie { erreur } ou { plages }.
 * `undefined` signifie « ne touche pas aux horaires » ; un tableau vide
 * signifie « cette adresse n'a plus d'horaires », ce qui est différent.
 */
function validerHoraires(horaires) {
    if (horaires === undefined) return { plages: undefined };
    if (!Array.isArray(horaires)) return { erreur: 'horaires doit être un tableau de plages.' };
    if (horaires.length > PLAGES_MAX) {
        return { erreur: `horaires : ${PLAGES_MAX} plages au maximum, ${horaires.length} reçues.` };
    }

    const plages = [];
    const vues = new Set();

    for (const plage of horaires) {
        const jour = Number(plage?.jour);
        if (!Number.isInteger(jour) || jour < 1 || jour > 7) {
            return { erreur: 'horaires : jour doit être un entier de 1 (lundi) à 7 (dimanche).' };
        }

        const ouverture = String(plage?.ouverture ?? '');
        const fermeture = String(plage?.fermeture ?? '');

        if (!HEURE.test(ouverture) || !HEURE.test(fermeture)) {
            return { erreur: 'horaires : ouverture et fermeture doivent être au format HH:MM.' };
        }

        const debut = ouverture.length === 5 ? `${ouverture}:00` : ouverture;
        const fin = fermeture.length === 5 ? `${fermeture}:00` : fermeture;

        // Une plage qui commence et finit à la même heure ne veut rien dire, et
        // se lirait comme « ouvert vingt-quatre heures » côté front.
        if (debut === fin) {
            return { erreur: 'horaires : une plage ne peut pas ouvrir et fermer à la même heure.' };
        }

        // L'index UNIQUE(cafe_id, jour, ouverture) rejetterait le doublon avec
        // une erreur SQL illisible : autant le dire clairement ici.
        const cle = `${jour}-${debut}`;
        if (vues.has(cle)) {
            return { erreur: `horaires : deux plages commencent à ${ouverture} le même jour.` };
        }
        vues.add(cle);

        plages.push({ jour, ouverture: debut, fermeture: fin });
    }

    return { plages };
}

// Remplace en bloc plutôt que de différencier : une poignée de lignes par
// adresse, et un remplacement ne peut pas laisser d'état intermédiaire.
async function remplacerHoraires(cafeId, plages) {
    await db.query('DELETE FROM cafe_horaires WHERE cafe_id = ?', [cafeId]);

    if (plages.length === 0) return;

    await db.query(
        'INSERT INTO cafe_horaires (cafe_id, jour, ouverture, fermeture) VALUES ?',
        [plages.map((p) => [cafeId, p.jour, p.ouverture, p.fermeture])]
    );
}

const PRIX_VALIDES = ['1-10', '10-20', '20+'];

// Le client n'a pas à connaître la structure de la base : le détail va dans le
// journal serveur, le client reçoit une phrase.
const echec = (res, err, contexte, message = 'Erreur serveur') => {
    journal.erreur(`[cafes] ${contexte} :`, err);
    return res.status(500).json({ error: message });
};

// Géocode une adresse via Nominatim (OpenStreetMap) — retourne { lat, lon } ou null.
// Best-effort : une adresse non géocodée entre quand même, elle n'apparaît
// simplement pas sur la carte.
//
// Deux précautions que le développement local ne réclame pas mais qu'un
// hébergement impose : un délai maximal, sans quoi un Nominatim lent laisse la
// requête de Wendy suspendue indéfiniment (Express n'a pas de délai par
// défaut) ; et un User-Agent identifiable, exigé par leur politique d'usage —
// une IP de datacenter avec un agent anonyme se fait refuser en 403.
const GEOCODAGE_DELAI_MS = 5000;

const agentNominatim = () => {
    const contact = process.env.NOMINATIM_CONTACT || FRONTEND_URL;
    return `SpotThePlace/1.0 (${contact})`;
};

async function geocodeAdresse(adresse) {
    if (!adresse) return null;
    try {
        const query = encodeURIComponent(`${adresse}, Paris, France`);
        const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`;
        const res = await fetch(url, {
            headers: { 'User-Agent': agentNominatim() },
            signal: AbortSignal.timeout(GEOCODAGE_DELAI_MS)
        });

        // Un 403 ou un 429 renvoie une page HTML : la parser en JSON lèverait
        // une erreur trompeuse, très loin de la vraie cause.
        if (!res.ok) {
            journal.alerte(`[cafes] Nominatim a répondu ${res.status} — adresse non géocodée : ${adresse}`);
            return null;
        }

        const data = await res.json();
        if (data && data.length > 0) {
            return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
        }

        // Sans cette trace, une adresse mal orthographiée disparaît de la carte
        // sans que personne ne sache pourquoi.
        journal.alerte(`[cafes] Nominatim ne connaît pas cette adresse : ${adresse}`);
        return null;
    } catch (err) {
        const cause = err.name === 'TimeoutError'
            ? `pas de réponse en ${GEOCODAGE_DELAI_MS} ms`
            : err.message;
        journal.alerte(`[cafes] géocodage impossible (${cause}) — adresse : ${adresse}`);
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

        await attacherHoraires(rows);

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
    const { arrondissement, specialite, wifi, prix, ambiance, prises, theme, nb_personnes, coup_de_coeur } = req.query;

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

        await attacherHoraires(rows);

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
             (cafe_id, nb_personnes, specialite, prix, wifi, prises, travailler, theme, ambiance)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                cafeId,
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
            await remplacerHoraires(cafeId, plages);
        }

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

        // `undefined` laisse les horaires en place, un tableau vide les efface :
        // « ne touche pas » et « cette adresse n'a plus d'horaires » sont deux
        // intentions différentes et un PUT partiel doit pouvoir exprimer les deux.
        if (plages !== undefined) {
            await remplacerHoraires(cafeId, plages);
        }

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

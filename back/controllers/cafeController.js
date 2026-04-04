const db = require('../config/db');

// Géocode une adresse via Nominatim (OpenStreetMap) — retourne { lat, lon } ou null
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
        console.error('Geocoding error:', err.message);
        return null;
    }
}

exports.getRandomCafe = async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT cafes.*, criteres_cafe.*
             FROM cafes JOIN criteres_cafe ON cafes.id = criteres_cafe.cafe_id
             ORDER BY RAND() LIMIT 1`
        );
        if (rows.length === 0) return res.status(404).json({ error: 'Aucun café' });
        res.json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
};

exports.getNouveautes = async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT cafes.*, criteres_cafe.*
             FROM cafes JOIN criteres_cafe ON cafes.id = criteres_cafe.cafe_id
             WHERE cafes.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
             ORDER BY cafes.created_at DESC`
        );
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify(rows, null, 2));
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
};

exports.getAllCafes = async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT * FROM cafes JOIN criteres_cafe ON cafes.id = criteres_cafe.cafe_id;'
        );
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify(rows, null, 2));
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
};

exports.getCafeById = async (req, res) => {
    try {
        const cafeId = req.params.id;
        const [rows] = await db.query(
            'SELECT * FROM cafes JOIN criteres_cafe ON cafes.id = criteres_cafe.cafe_id WHERE cafes.id = ?',
            [cafeId]
        );
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify(rows, null, 2));
        } catch (err) {
            console.error(err);
            res.status(404).json({ error: 'Le cafe n existe pas' });
        }
};

exports.getCafeByArrondissement = async (req, res) => {
    try {
        const arrondissement = req.params.arr; 
        const [rows] = await db.query(
            'SELECT * FROM cafes JOIN criteres_cafe ON cafes.id = criteres_cafe.cafe_id WHERE cafes.arrondissement = ?',
            [arrondissement]
        );
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify(rows, null, 2));
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Database error' });
        }
};

exports.getCafeBySpecialite = async (req, res) => {
    try {
        const specialite = req.params.spec;
        const [rows] = await db.query(
            `SELECT cafes.*, criteres_cafe.*
            FROM cafes JOIN criteres_cafe ON cafes.id = criteres_cafe.cafe_id
            WHERE FIND_IN_SET(LOWER(?), LOWER(REPLACE(criteres_cafe.specialite, ' ', '')))
            OR FIND_IN_SET(LOWER(?), LOWER(criteres_cafe.specialite));`,
            [specialite.replace(/\s/g, ''), specialite]
        );
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify(rows, null, 2));
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Database error' });
        }
};

exports.getCafeWithWifi = async (req, res) => {
    try {
        const wifiParam = req.params.wifi;
        const wifi = Number(wifiParam); 
        const [rows] = await db.query(
            `SELECT cafes.*, criteres_cafe.specialite
             FROM cafes
             JOIN criteres_cafe ON cafes.id = criteres_cafe.cafe_id
             WHERE criteres_cafe.wifi = ?`,
            [wifi]
        );

        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify(rows, null, 2));

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
};

exports.getCafeWithPrice = async (req, res) => {
    try {
        const prix = req.params.prix; 

        const validPrix = ['1-10', '10-20', '20+'];
        if (!validPrix.includes(prix)) {
            return res.status(400).json({ error: 'Prix invalide' });
        }

        const [rows] = await db.query(
            `SELECT cafes.*, criteres_cafe.specialite
             FROM cafes
             JOIN criteres_cafe ON cafes.id = criteres_cafe.cafe_id
             WHERE criteres_cafe.prix = ?`,
            [prix]
        );

        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify(rows, null, 2));

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
};

exports.getCafeWithAmbiance = async (req, res) => {
    try {
        const ambiance = req.params.amb; 

        const [rows] = await db.query(
            `SELECT cafes.*, criteres_cafe.specialite
             FROM cafes
             JOIN criteres_cafe ON cafes.id = criteres_cafe.cafe_id
             WHERE criteres_cafe.ambiance = ?`,
            [ambiance]
        );

        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify(rows, null, 2));

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
};

exports.searchCafes = async (req, res) => {
    try {
        const { arrondissement, specialite, wifi, prix, ambiance, prises, theme, nb_personnes, horaires} = req.query;

        let sql = `
            SELECT cafes.*, criteres_cafe.*
            FROM cafes
            JOIN criteres_cafe ON cafes.id = criteres_cafe.cafe_id
            WHERE 1=1
        `;
                let values = [];

        // Arrondissement
        if (arrondissement) {
            sql += " AND cafes.arrondissement = ?";
            values.push(arrondissement);
        }

        // Spécialité (SET → FIND_IN_SET)
        if (specialite) {
            sql += " AND FIND_IN_SET(LOWER(?), LOWER(criteres_cafe.specialite))";
            values.push(specialite.toLowerCase());
        }

        // Wifi
        if (wifi === "0" || wifi === "1") {
            sql += " AND criteres_cafe.wifi = ?";
            values.push(Number(wifi));
        }

        // Prix
        if (prix) {
            sql += " AND criteres_cafe.prix = ?";
            values.push(prix);
        }

        // Ambiance
        if (ambiance) {
            sql += " AND criteres_cafe.ambiance = ?";
            values.push(ambiance);
        }

        // Prises
        if (prises === "0" || prises === "1") {
            sql += " AND criteres_cafe.prises = ?";
            values.push(Number(prises));
        }

        // Thème (SET)
        if (theme) {
            sql += " AND FIND_IN_SET(LOWER(?), LOWER(criteres_cafe.theme))";
            values.push(theme.toLowerCase());
        }

        // nb_personnes
        if (nb_personnes) {
            sql += " AND criteres_cafe.nb_personnes = ?";
            values.push(nb_personnes);
        }

        // Horaires
        if (horaires) {
            sql += " AND criteres_cafe.horaires = ?";
            values.push(horaires);
        }

        const [rows] = await db.query(sql, values);

        res.setHeader("Content-Type", "application/json");
        res.send(JSON.stringify(rows, null, 2));



    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
};

exports.createCafe = async (req, res) => {
    try {
        const { nom, arrondissement, adresse, image_url, description, nb_personnes, horaires, specialite, prix, wifi, prises ,travailler, theme, ambiance
        } = req.body;

        if (!nom || !arrondissement) {
            return res.status(400).json({ error: "Nom et arrondissement sont obligatoires." });
        }
        const coords = await geocodeAdresse(adresse);

        const [cafeResult] = await db.query(
            `INSERT INTO cafes (nom, arrondissement, adresse, image_url, description, latitude, longitude)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [nom, arrondissement, adresse || null, image_url || null, description || null,
             coords ? coords.lat : null, coords ? coords.lon : null]
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
                wifi ?? 0,
                prises ?? 0,
                travailler ?? 0,
                theme || null,
                ambiance || null
            ]
        );

        const [createdCafe] = await db.query(
            `SELECT cafes.*, criteres_cafe.*
             FROM cafes 
             JOIN criteres_cafe ON cafes.id = criteres_cafe.cafe_id
             WHERE cafes.id = ?`,
            [cafeId]
        );

        res.status(201).json(createdCafe[0]);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erreur lors de la création du café" });
    }
};

exports.updateCafe = async (req, res) => {
    try {
        const cafeId = req.params.id;
        const {
            nom, arrondissement, adresse, image_url, description,
            nb_personnes, horaires, specialite, prix, wifi, prises, travailler, theme, ambiance
        } = req.body;

        // Vérifier si le café existe
        const [exists] = await db.query(
            "SELECT id FROM cafes WHERE id = ?",
            [cafeId]
        );

        if (exists.length === 0) {
            return res.status(404).json({ error: "Café introuvable" });
        }

        // Mettre à jour la table cafes
        if (nom || arrondissement || adresse || image_url || description !== undefined) {
            const updates = [];
            const values = [];

            if (nom) {
                updates.push("nom = ?");
                values.push(nom);
            }
            if (arrondissement) {
                updates.push("arrondissement = ?");
                values.push(arrondissement);
            }
            if (adresse) {
                updates.push("adresse = ?");
                values.push(adresse);
                // Géocoder la nouvelle adresse
                const coords = await geocodeAdresse(adresse);
                if (coords) {
                    updates.push("latitude = ?");
                    values.push(coords.lat);
                    updates.push("longitude = ?");
                    values.push(coords.lon);
                }
            }
            if (image_url) {
                updates.push("image_url = ?");
                values.push(image_url);
            }
            if (description !== undefined) {
                updates.push("description = ?");
                values.push(description || null);
            }

            if (updates.length > 0) {
                values.push(cafeId);
                await db.query(
                    `UPDATE cafes SET ${updates.join(", ")} WHERE id = ?`,
                    values
                );
            }
        }

        // Mettre à jour la table criteres_cafe
        if (nb_personnes || horaires || specialite || prix || wifi !== undefined || prises !== undefined || travailler !== undefined || theme || ambiance) {
            const updates = [];
            const values = [];

            if (nb_personnes) {
                updates.push("nb_personnes = ?");
                values.push(nb_personnes);
            }
            if (horaires) {
                updates.push("horaires = ?");
                values.push(horaires);
            }
            if (specialite) {
                updates.push("specialite = ?");
                values.push(specialite);
            }
            if (prix) {
                updates.push("prix = ?");
                values.push(prix);
            }
            if (wifi !== undefined) {
                updates.push("wifi = ?");
                values.push(wifi);
            }
            if (prises !== undefined) {
                updates.push("prises = ?");
                values.push(prises);
            }
            if (travailler !== undefined) {
                updates.push("travailler = ?");
                values.push(travailler);
            }
            if (theme) {
                updates.push("theme = ?");
                values.push(theme);
            }
            if (ambiance) {
                updates.push("ambiance = ?");
                values.push(ambiance);
            }

            if (updates.length > 0) {
                values.push(cafeId);
                await db.query(
                    `UPDATE criteres_cafe SET ${updates.join(", ")} WHERE cafe_id = ?`,
                    values
                );
            }
        }

        // Récupérer le café mis à jour
        const [updatedCafe] = await db.query(
            `SELECT cafes.*, criteres_cafe.*
             FROM cafes
             JOIN criteres_cafe ON cafes.id = criteres_cafe.cafe_id
             WHERE cafes.id = ?`,
            [cafeId]
        );

        res.json(updatedCafe[0]);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erreur lors de la modification du café" });
    }
};

exports.deleteCafe = async (req, res) => {
    try {
        const cafeId = req.params.id;

        const [exists] = await db.query(
            "SELECT id FROM cafes WHERE id = ?",
            [cafeId]
        );

        if (exists.length === 0) {
            return res.status(404).json({ error: "Café introuvable" });
        }

        await db.query("DELETE FROM criteres_cafe WHERE cafe_id = ?", [cafeId]);

        await db.query("DELETE FROM cafes WHERE id = ?", [cafeId]);

        res.json({ message: `Café ${cafeId} supprimé avec succès` });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erreur serveur" });
    }
};

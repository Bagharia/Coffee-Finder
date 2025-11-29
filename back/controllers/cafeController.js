const express = require('express');
const app = express();
const cors = require('cors');
const db = require('../config/db');

app.use(cors());

app.set('json spaces', 2);

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
            `SELECT cafes.*, criteres_cafe.specialite  
            FROM cafes JOIN criteres_cafe ON cafes.id = criteres_cafe.cafe_id 
            WHERE FIND_IN_SET(?, criteres_cafe.specialite);`,
            [specialite]
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
        const { nom, arrondissement, adresse, image_url, nb_personnes, horaires, specialite, prix, wifi, prises ,travailler, theme, ambiance
        } = req.body;

        if (!nom || !arrondissement) {
            return res.status(400).json({ error: "Nom et arrondissement sont obligatoires." });
        }
        const [cafeResult] = await db.query(
            `INSERT INTO cafes (nom, arrondissement, adresse, image_url)
             VALUES (?, ?, ?, ?)`,
            [nom, arrondissement, adresse || null, image_url || null]
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

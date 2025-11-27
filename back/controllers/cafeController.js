const express = require('express');
const app = express();
const cors = require('cors');
const db = require('../config/db');

app.use(cors());

exports.getAllCafes = async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT * FROM cafes JOIN criteres_cafe ON cafes.id = criteres_cafe.cafe_id;'
        );
        res.json(rows);
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
        res.json(rows)
        } catch (err) {
            console.error(err);
            res.status(404).json({ error: 'Le cafe n existe pas' });
        }
};
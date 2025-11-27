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
            `SELECT cafes.*, criteres_cafe.specialite FROM cafes JOIN criteres_cafe ON cafes.id = criteres_cafe.cafe_id WHERE FIND_IN_SET(?, criteres_cafe.specialite);`,
            [specialite]
        );
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify(rows, null, 2));
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Database error' });
        }
};

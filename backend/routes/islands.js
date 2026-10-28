const express = require('express');
const Island = require('../models/Island');

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        res.json(await Island.find().lean());
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

module.exports = router;
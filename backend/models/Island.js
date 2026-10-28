const express = require('express');
const Island = require('../models/Island');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        res.json(await Island.find().lean());
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

router.put('/:id', auth, async (req, res) => {
    try {
        const { name, title, lines, links, x, z } = req.body;
        const update = {};
        if (typeof name === 'string') update.name = name;
        if (typeof title === 'string') update.title = title;
        if (Array.isArray(lines)) update.lines = lines.map(String);
        if (Array.isArray(links))
            update.links = links
                .filter((l) => l && /^(https?:|mailto:)/i.test(l.url))
                .map((l) => ({ label: String(l.label), url: String(l.url) }));
        if (Number.isFinite(x)) update.x = x;
        if (Number.isFinite(z)) update.z = z;

        const island = await Island.findByIdAndUpdate(req.params.id, update, { new: true });
        if (!island) return res.status(404).json({ error: 'Island not found' });
        res.json(island);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

module.exports = router;
const express = require('express');
const Message = require('../models/Message');
const auth = require('../middleware/auth');

const router = express.Router();

router.post('/', async (req, res) => {
    try {
        const { name, email, message } = req.body;
        if (!name || !email || !message)
            return res.status(400).json({ error: 'All fields are required' });
        await Message.create({ name, email, message });
        res.json({ ok: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

router.get('/', auth, async (req, res) => {
    try {
        res.json(await Message.find().sort({ createdAt: -1 }).limit(100).lean());
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

module.exports = router;
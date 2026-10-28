const express = require('express');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const router = express.Router();
const hash = (s) => crypto.createHash('sha256').update(String(s)).digest();

router.post('/login', (req, res) => {
    const { username, password } = req.body || {};
    const okUser = crypto.timingSafeEqual(hash(username), hash(process.env.ADMIN_USER));
    const okPass = crypto.timingSafeEqual(hash(password), hash(process.env.ADMIN_PASS));
    if (!(okUser && okPass))
        return res.status(401).json({ error: 'Wrong username or password' });
    const token = jwt.sign({ admin: true }, process.env.JWT_SECRET, { expiresIn: '12h' });
    res.json({ token });
});

module.exports = router;
const express = require('express');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const router = express.Router();
const hash = (s) => crypto.createHash('sha256').update(String(s || '')).digest();

router.post('/login', (req, res) => {
    const { username, password } = req.body || {};
    const u = String(username || '').trim().toLowerCase();
    const envUser = String(process.env.ADMIN_USER || '').trim().toLowerCase();
    
    // Accept either configured username or username with '1' (common GitHub handle format)
    const validUsers = [envUser, envUser + '1'].filter(Boolean);
    const okUser = validUsers.includes(u);
    
    const p = String(password || '').trim();
    const envPass = String(process.env.ADMIN_PASS || '').trim();
    const okPass = crypto.timingSafeEqual(hash(p), hash(envPass));

    if (!(okUser && okPass))
        return res.status(401).json({ error: 'Wrong username or password' });

    const token = jwt.sign({ admin: true }, process.env.JWT_SECRET, { expiresIn: '12h' });
    res.json({ token });
});

module.exports = router;
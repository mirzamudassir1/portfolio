const express = require('express');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Island = require('../models/Island');
const auth = require('../middleware/auth');

const router = express.Router();
const DATA_FILE = path.join(__dirname, '..', 'data', 'islands.json');

const DEFAULT_ISLANDS = [
    {
        _id: 'island_about',
        name: 'About Me', type: 'about', x: 0, z: 90, radius: 12, color: '#f4d03f',
        title: 'ABOUT ME',
        lines: [
            "Hi, I'm Mudassir",
            'B.Tech graduate in AI & Data Science',
            'Aspiring AI / ML / Software Engineer',
            'I build full-stack apps blended with AI/ML',
            'Former Department President & event host',
        ],
        links: [],
    },
    {
        _id: 'island_projects',
        name: 'Projects', type: 'projects', x: 64, z: 64, radius: 13, color: '#58d68d',
        title: 'MY PROJECTS',
        lines: [
            'QuizPro - MERN exam management app',
            'Ecommerce website (full-stack)',
            '3D Sailing Portfolio (this site!)',
            'AI/ML Disease Prediction System',
            'Real-Time Chat & Collab App',
        ],
        links: [
            { label: 'This portfolio on GitHub', url: 'https://github.com/mirzamudassir1/portfolio' },
            { label: 'All my GitHub projects', url: 'https://github.com/mirzamudassir1' },
        ],
        projects: [
            {
                title: 'QuizPro - Exam Management System',
                description: 'Full-stack MERN online examination platform featuring auto-grading, real-time exam timers, and comprehensive teacher analytics dashboard.',
                tech: ['React', 'Node.js', 'Express', 'MongoDB', 'TailwindCSS'],
                demo: '',
                github: 'https://github.com/mirzamudassir1/QuizPro',
            },
            {
                title: 'Full-Stack E-Commerce Store',
                description: 'Modern shopping web app with user authentication, interactive product catalog, shopping cart, and secure Stripe checkout integration.',
                tech: ['React', 'Node.js', 'Express', 'MongoDB', 'Redux'],
                demo: '',
                github: 'https://github.com/mirzamudassir1/ecommerce',
            },
            {
                title: 'One Piece 3D Sailing Portfolio',
                description: 'Interactive 3D web portfolio built with Three.js featuring dynamic rolling ocean waves, a controllable galleon, exploreable islands, and admin CMS.',
                tech: ['Three.js', 'WebGL', 'JavaScript', 'Node.js', 'Express'],
                demo: 'http://localhost:5000',
                github: 'https://github.com/mirzamudassir1/portfolio',
            },
            {
                title: 'AI/ML Health Prediction System',
                description: 'Predictive machine learning classifier trained on clinical datasets to predict patient health diagnosis with high test accuracy.',
                tech: ['Python', 'Scikit-Learn', 'Pandas', 'Flask'],
                demo: '',
                github: 'https://github.com/mirzamudassir1',
            },
            {
                title: 'Real-Time Chat & Collaboration',
                description: 'WebSocket-powered multi-user chat application with instant messaging, live typing indicators, and room channels.',
                tech: ['React', 'Socket.io', 'Node.js', 'Express'],
                demo: '',
                github: 'https://github.com/mirzamudassir1',
            },
        ],
    },
    {
        _id: 'island_skills',
        name: 'Tech Stack', type: 'skills', x: -64, z: 64, radius: 12, color: '#f5b041',
        title: 'TECH STACK',
        lines: [
            'Languages: Python, JavaScript',
            'Frontend: React, HTML, CSS, Three.js',
            'Backend: Node.js, Express, REST APIs',
            'Database: MongoDB',
            'AI/ML: Machine Learning, Data Science',
            'Workflow: Agile, Git & GitHub',
        ],
        links: [],
    },
    {
        _id: 'island_experience',
        name: 'Experience', type: 'experience', x: 90, z: 0, radius: 12, color: '#af7ac5',
        title: 'EXPERIENCE',
        lines: [
            'Software Development Intern',
            'DigiVal IT Solutions Pvt Ltd, Chennai',
            'Full-stack development & REST API development',
            'Frontend-backend integration in agile teams',
        ],
        links: [],
    },
    {
        _id: 'island_education',
        name: 'Education', type: 'education', x: -90, z: 0, radius: 11, color: '#5dade2',
        title: 'EDUCATION',
        lines: [
            'B.Tech in Artificial Intelligence & Data Science',
            'Aalim Muhammed Salegh College of Engineering',
            'Anna University',
            'CGPA: 8.2 / 10',
        ],
        links: [],
    },
    {
        _id: 'island_socials',
        name: 'Socials', type: 'socials', x: 64, z: -64, radius: 11, color: '#48c9b0',
        title: 'MY SOCIALS',
        lines: ['Find me online:'],
        links: [
            { label: 'GitHub', url: 'https://github.com/mirzamudassir1' },
            { label: 'LinkedIn', url: 'https://linkedin.com/in/yourname' },
        ],
    },
    {
        _id: 'island_resume',
        name: 'Resume', type: 'resume', x: -64, z: -64, radius: 10, color: '#f0b27a',
        title: 'RESUME',
        lines: ['Want the full picture? Grab my resume below.'],
        links: [{ label: 'Download Resume', url: 'https://drive.google.com/your-resume-link' }],
    },
    {
        _id: 'island_contact',
        name: 'Connect', type: 'contact', x: 0, z: -90, radius: 11, color: '#ec7063',
        title: "LET'S CONNECT",
        lines: ['Send me a message. It goes straight to my database!'],
        links: [{ label: 'Email', url: 'mailto:your@email.com' }],
    },
];

function getLocalIslands() {
    try {
        if (fs.existsSync(DATA_FILE)) {
            const raw = fs.readFileSync(DATA_FILE, 'utf-8');
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
    } catch (e) {
        console.warn('Error reading local islands file:', e.message);
    }
    return DEFAULT_ISLANDS;
}

function saveLocalIslands(islands) {
    try {
        const dir = path.dirname(DATA_FILE);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(DATA_FILE, JSON.stringify(islands, null, 2), 'utf-8');
    } catch (e) {
        console.warn('Error saving local islands file:', e.message);
    }
}

router.get('/', async (req, res) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            return res.json(getLocalIslands());
        }
        let list = await Island.find().lean();
        if (!list || list.length === 0) {
            try {
                await Island.insertMany(DEFAULT_ISLANDS);
                list = await Island.find().lean();
            } catch (seedErr) {
                return res.json(getLocalIslands());
            }
        }
        res.json(list);
    } catch (e) {
        console.error('Island.find error, using fallback:', e.message);
        res.json(getLocalIslands());
    }
});

router.put('/:id', auth, async (req, res) => {
    try {
        const { name, title, lines, links, projects, x, z } = req.body;
        const update = {};
        if (typeof name === 'string') update.name = name;
        if (typeof title === 'string') update.title = title;
        if (Array.isArray(lines)) update.lines = lines.map(String);
        if (Array.isArray(links))
            update.links = links
                .filter((l) => l && /^(https?:|mailto:)/i.test(l.url))
                .map((l) => ({ label: String(l.label), url: String(l.url) }));
        if (Array.isArray(projects)) {
            update.projects = projects
                .filter((p) => p && p.title)
                .map((p) => ({
                    title: String(p.title).trim(),
                    description: String(p.description || '').trim(),
                    tech: Array.isArray(p.tech)
                        ? p.tech.map(String)
                        : (p.tech ? String(p.tech).split(',').map((s) => s.trim()).filter(Boolean) : []),
                    demo: String(p.demo || '').trim(),
                    github: String(p.github || '').trim(),
                }));
        }
        if (Number.isFinite(x)) update.x = x;
        if (Number.isFinite(z)) update.z = z;

        if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(req.params.id)) {
            const island = await Island.findByIdAndUpdate(req.params.id, update, { new: true });
            if (island) {
                // Keep local mirror updated
                const all = getLocalIslands().map((i) => (String(i._id) === String(req.params.id) ? { ...i, ...update } : i));
                saveLocalIslands(all);
                return res.json(island);
            }
        }

        // Local fallback update
        const localList = getLocalIslands();
        const idx = localList.findIndex((i) => String(i._id) === String(req.params.id) || i.name.toLowerCase() === (name || '').toLowerCase());
        if (idx !== -1) {
            localList[idx] = { ...localList[idx], ...update };
            saveLocalIslands(localList);
            return res.json(localList[idx]);
        }

        // If not found by id, update by matching index if passed or first
        return res.status(404).json({ error: 'Island not found' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

module.exports = router;

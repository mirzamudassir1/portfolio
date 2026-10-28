require('dns').setServers(['8.8.8.8', '1.1.1.1']);
require('dotenv').config();
const mongoose = require('mongoose');
const Island = require('./models/Island');

const islands = [
    {
        name: 'About Me', type: 'about', x: 40, z: 70, radius: 12, color: '#f4d03f',
        title: 'MUDASSIR',
        lines: [
            'B.Tech in AI & Data Science (CGPA 8.2/10)',
            'Software Development Intern at DigiVal IT Solutions',
            'Aspiring AI / ML / Software Engineer',
            'Former Department President & event host',
        ],
        links: [],
    },
    {
        name: 'Projects', type: 'projects', x: -60, z: 90, radius: 13, color: '#58d68d',
        title: 'PROJECTS',
        lines: [
            'QuizPro - MERN exam management app',
            'Ecommerce website (full-stack)',
            'AI/ML + Web side projects',
        ],
        links: [{ label: 'GitHub', url: 'https://github.com/yourname' }],
    },
    {
        name: 'Skills', type: 'skills', x: 80, z: -30, radius: 12, color: '#f5b041',
        title: 'SKILLS',
        lines: [
            'Python, JavaScript, React, Node.js',
            'REST APIs, MongoDB, Express',
            'Machine Learning, Data Science',
            'Agile workflows',
        ],
        links: [],
    },
    {
        name: 'Contact', type: 'contact', x: -70, z: -50, radius: 11, color: '#ec7063',
        title: 'CONTACT',
        lines: ['Send me a message - it goes straight to my database!'],
        links: [
            { label: 'LinkedIn', url: 'https://linkedin.com/in/yourname' },
            { label: 'Email', url: 'mailto:your@email.com' },
        ],
    },
];

(async () => {
    await mongoose.connect(process.env.MONGO_URI);
    await Island.deleteMany({});
    await Island.insertMany(islands);
    console.log('Islands seeded');
    await mongoose.disconnect();
})();
require('dns').setServers(['8.8.8.8', '1.1.1.1']);
require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const mongoose = require('mongoose');
const Island = require('./models/Island');

const islands = [
    {
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
        name: 'Projects', type: 'projects', x: 64, z: 64, radius: 13, color: '#58d68d',
        title: 'MY PROJECTS',
        lines: [
            'QuizPro - MERN exam management app',
            'Ecommerce website (full-stack)',
            '3D Sailing Portfolio (this site!)',
            'AI/ML + Web side projects',
        ],
        links: [
            { label: 'This portfolio on GitHub', url: 'https://github.com/mirzamudassir1/portfolio' },
            { label: 'All my GitHub projects', url: 'https://github.com/mirzamudassir1' },
        ],
    },
    {
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
        name: 'Socials', type: 'socials', x: 64, z: -64, radius: 11, color: '#48c9b0',
        title: 'MY SOCIALS',
        lines: ['Find me online:'],
        links: [
            { label: 'GitHub', url: 'https://github.com/mirzamudassir1' },
            { label: 'LinkedIn', url: 'https://linkedin.com/in/yourname' },
        ],
    },
    {
        name: 'Resume', type: 'resume', x: -64, z: -64, radius: 10, color: '#f0b27a',
        title: 'RESUME',
        lines: ['Want the full picture? Grab my resume below.'],
        links: [{ label: 'Download Resume', url: 'https://drive.google.com/your-resume-link' }],
    },
    {
        name: 'Connect', type: 'contact', x: 0, z: -90, radius: 11, color: '#ec7063',
        title: "LET'S CONNECT",
        lines: ['Send me a message. It goes straight to my database!'],
        links: [{ label: 'Email', url: 'mailto:your@email.com' }],
    },
];

(async () => {
    await mongoose.connect(process.env.MONGO_URI);
    await Island.deleteMany({});
    await Island.insertMany(islands);
    console.log('Islands seeded: ' + islands.length);
    await mongoose.disconnect();
})();
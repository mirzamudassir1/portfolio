import * as THREE from 'three';
import { PLAT, SAND, mat, add, box, cyl } from './helpers.js';

export default {
    customBase: true,
    grass: 0x2b2730,
    labelY: 23,
    build(g, r = 13, d = {}) {
        const S = [];

        // ==========================================
        // 1. UNIQUE VOLCANIC ISLAND LANDMASS & SHAPE
        // ==========================================
        // Deep obsidian base (underwater shelf)
        cyl(g, r * 1.05, r * 1.15, 3.2, 0x141217, 0, 0.4, 0, { seg: 24, mat: { flatShading: false } });

        // Asymmetrical volcanic coastline & jagged basalt headlands
        const coastAngles = [0, 0.5, 1.1, 1.8, 2.4, 3.0, 3.7, 4.3, 5.0, 5.6];
        coastAngles.forEach((a, idx) => {
            const rad = r * (0.88 + Math.sin(idx * 1.7) * 0.16);
            const cx = Math.cos(a) * rad;
            const cz = Math.sin(a) * rad;
            const h = 2.6 + Math.cos(idx * 2.1) * 0.8;
            cyl(g, 2.2 + (idx % 3) * 0.4, 2.8, h, 0x1f1c24, cx, h / 2, cz, { seg: 8 });
        });

        // Black volcanic sand beach ring
        cyl(g, r * 0.82, r * 0.96, 1.8, 0x232028, 0, 1.6, 0, { seg: 26, mat: { flatShading: false } });

        // Main walking volcanic plateau at PLAT (height 2.95)
        cyl(g, r * 0.65, r * 0.78, 1.6, 0x2e2a34, 0, 2.2, 0, { seg: 24, mat: { flatShading: false } });

        // Scorched stone tiles and basalt flagstones on the plateau
        for (let i = 0; i < 16; i++) {
            const pa = (i / 16) * Math.PI * 2;
            const pDist = 3.2 + (i % 4) * 1.2;
            const px = Math.cos(pa) * pDist;
            const pz = Math.sin(pa) * pDist + 0.8;
            box(g, 1.8, 0.08, 1.8, (i % 2 === 0 ? 0x26232c : 0x35313d), px, PLAT + 0.04, pz, {
                ry: pa + 0.2,
            });
        }

        // Stepped hexagonal basalt columns along the island perimeter
        for (let j = 0; j < 12; j++) {
            const ba = (j / 12) * Math.PI * 2 + 0.2;
            const bx = Math.cos(ba) * (r * 0.76);
            const bz = Math.sin(ba) * (r * 0.76);
            const bh = 1.2 + (j % 5) * 0.45;
            cyl(g, 0.75, 0.85, bh, 0x1b1921, bx, PLAT + bh / 2 - 0.4, bz, { seg: 6 });
        }

        // ==========================================
        // 2. THE SMOKING VOLCANO & MAGMA CRATER
        // ==========================================
        // Main volcanic caldera positioned toward the back (z = -3.8)
        const vx = 0, vz = -3.8;

        // Broad volcanic mountain base
        cyl(g, 3.8, 7.2, 3.8, 0x322d38, vx, PLAT + 1.9, vz, { seg: 12 });
        // Rugged mid-caldera cone
        cyl(g, 2.0, 4.4, 4.2, 0x26222c, vx, PLAT + 4.0, vz, { seg: 10 });
        // Caldera rim summit
        cyl(g, 1.5, 2.4, 2.5, 0x1c1921, vx, PLAT + 6.8, vz, { seg: 10 });

        // Glowing molten magma pool in the caldera crater
        cyl(g, 1.55, 1.55, 0.25, 0xff4500, vx, PLAT + 7.85, vz, {
            seg: 12,
            mat: { emissive: 0xff3700, emissiveIntensity: 1.2 },
        });

        // Glowing magma channels / lava falls flowing from the volcano down into the plateau
        const lavaStream = new THREE.Mesh(
            new THREE.BoxGeometry(0.85, 0.12, 5.2),
            new THREE.MeshPhongMaterial({
                color: 0xff4500,
                emissive: 0xff3700,
                emissiveIntensity: 1.1,
                flatShading: true,
            })
        );
        lavaStream.position.set(vx + 0.2, PLAT + 0.06, vz + 3.2);
        lavaStream.rotation.y = 0.12;
        g.add(lavaStream);

        // Branching magma veins in the stone floor
        [-2.4, 2.2].forEach((offset, idx) => {
            const vein = new THREE.Mesh(
                new THREE.BoxGeometry(0.35, 0.08, 4.2),
                new THREE.MeshPhongMaterial({
                    color: 0xff5500,
                    emissive: 0xff3b00,
                    emissiveIntensity: 0.95,
                })
            );
            vein.position.set(offset, PLAT + 0.05, 1.8 + idx * 0.8);
            vein.rotation.y = (idx === 0 ? 0.35 : -0.32);
            g.add(vein);
        });

        // Arched basalt bridge over the main lava river
        const bridge = box(g, 2.4, 0.28, 1.4, 0x3d3744, vx + 0.2, PLAT + 0.25, vz + 3.2);
        box(bridge, 2.6, 0.3, 0.15, 0x221f28, 0, 0.25, 0.65);
        box(bridge, 2.6, 0.3, 0.15, 0x221f28, 0, 0.25, -0.65);

        // Volcanic rock spire crags & solid collision boundaries
        S.push(
            { x: vx, z: vz, r: 4.8 },       // Volcano caldera mountain body
            { x: vx - 2.8, z: vz - 1.8, r: 1.8 }, // West volcanic crag
            { x: vx + 2.8, z: vz - 1.8, r: 1.8 }  // East volcanic crag
        );

        // Volcanic stone signposts for the 3 Study Districts
        const signLang = box(g, 1.2, 0.1, 0.5, 0x1e1c24, -4.8, PLAT + 0.9, 0.2);
        box(signLang, 0.15, 0.9, 0.15, 0x3a3542, 0, -0.45, 0);
        const signLib = box(g, 1.2, 0.1, 0.5, 0x1e1c24, 0, PLAT + 0.9, 0.8);
        box(signLib, 0.15, 0.9, 0.15, 0x3a3542, 0, -0.45, 0);
        const signTech = box(g, 1.2, 0.1, 0.5, 0x1e1c24, 4.8, PLAT + 0.9, 0.2);
        box(signTech, 0.15, 0.9, 0.15, 0x3a3542, 0, -0.45, 0);

        // ==========================================
        // 3. ANIMATED VOLCANIC PARTICLES & SMOKE
        // ==========================================
        const smokeClouds = [];
        for (let i = 0; i < 9; i++) {
            const sm = new THREE.Mesh(
                new THREE.SphereGeometry(0.8 + (i % 3) * 0.3, 9, 8),
                new THREE.MeshPhongMaterial({
                    color: i % 2 === 0 ? 0x4a4650 : 0x6e6878,
                    transparent: true,
                    opacity: 0.5,
                    flatShading: true,
                })
            );
            sm.position.set(vx, PLAT + 7.8, vz);
            g.add(sm);
            smokeClouds.push(sm);
        }

        // Floating glowing magma ember motes
        const embers = [];
        for (let e = 0; e < 6; e++) {
            const em = new THREE.Mesh(
                new THREE.OctahedronGeometry(0.22, 0),
                new THREE.MeshBasicMaterial({ color: 0xff7b00 })
            );
            g.add(em);
            embers.push({
                mesh: em,
                angle: (e / 6) * Math.PI * 2,
                dist: 1.2 + (e % 3) * 0.8,
                speed: 1.2 + e * 0.2,
                baseY: PLAT + 7.2,
            });
        }

        // ==========================================
        // 4. THE 12 PUSHABLE TECH STUDY BLOCKS
        // ==========================================
        const pushableTechProps = [
            // --- A. PROGRAMMING LANGUAGES (Left Caldera Terrace) ---
            {
                type: 'box',
                id: 'tech_python',
                label: 'PYTHON',
                icon: '🐍',
                category: 'Languages',
                color: 0x3776ab,
                w: 1.0, h: 1.0, d: 1.0,
                mass: 1.0,
                x: -5.2, y: PLAT + 0.52, z: 1.8,
                studyData: {
                    title: 'Python',
                    icon: '🐍',
                    category: 'Programming Language',
                    level: 'Advanced / Core Stack',
                    desc: 'Primary language for AI/ML modeling, data pipelines, mathematical analysis, and high-performance asynchronous backends.',
                    skills: ['NumPy', 'Pandas', 'Scikit-Learn', 'FastAPI', 'Flask', 'OOP'],
                    mudassirExp: 'Architected supervised ML classification pipelines for disease diagnosis and automated analytical scripts with clean modular code.',
                    projects: ['AI/ML Health Prediction System', 'Data Science Analytics Toolkit'],
                },
            },
            {
                type: 'box',
                id: 'tech_javascript',
                label: 'JAVASCRIPT',
                icon: '⚡',
                category: 'Languages',
                color: 0xf7df1e,
                w: 1.0, h: 1.0, d: 1.0,
                mass: 1.0,
                x: -3.6, y: PLAT + 0.52, z: 2.8,
                studyData: {
                    title: 'JavaScript (ES6+)',
                    icon: '⚡',
                    category: 'Programming Language',
                    level: 'Advanced / Daily Driver',
                    desc: 'Deep mastery of asynchronous event-driven JavaScript, DOM manipulation, promises, closures, and full-stack architecture.',
                    skills: ['ES6+ Syntax', 'Async/Await', 'Event Loop', 'DOM Engine', 'WebSockets', 'WebGL / Canvas'],
                    mudassirExp: 'Engineered this entire 3D pirate sailing world in Three.js, built real-time WebSocket messaging, and developed interactive exam portals.',
                    projects: ['One Piece 3D Sailing Portfolio', 'QuizPro Exam System', 'Full-Stack E-Commerce'],
                },
            },
            {
                type: 'box',
                id: 'tech_typescript',
                label: 'TYPESCRIPT',
                icon: '🔷',
                category: 'Languages',
                color: 0x3178c6,
                w: 0.95, h: 0.95, d: 0.95,
                mass: 1.0,
                x: -4.8, y: PLAT + 0.5, z: 4.0,
                studyData: {
                    title: 'TypeScript',
                    icon: '🔷',
                    category: 'Programming Language',
                    level: 'Intermediate / Advanced',
                    desc: 'Static typing powerhouse enabling scalable architecture, strict contracts, interfaces, generics, and compile-time error prevention.',
                    skills: ['Type Interfaces', 'Generics', 'Strict Null Safety', 'Enums & Unions', 'Type Narrowing'],
                    mudassirExp: 'Utilized TypeScript to build predictable, bug-free components and strictly-typed API client layers in enterprise-grade applications.',
                    projects: ['Scalable Web Services', 'Typed Component Libraries'],
                },
            },
            {
                type: 'box',
                id: 'tech_cpp',
                label: 'C / C++',
                icon: '⚙️',
                category: 'Languages',
                color: 0x00599c,
                w: 0.95, h: 0.95, d: 0.95,
                mass: 1.1,
                x: -3.2, y: PLAT + 0.5, z: 4.9,
                studyData: {
                    title: 'C / C++',
                    icon: '⚙️',
                    category: 'Programming Language',
                    level: 'Intermediate (Data Structures & Algorithms)',
                    desc: 'Low-level systems language grounding in manual memory management, pointer arithmetic, and algorithmic problem solving.',
                    skills: ['Pointers & References', 'Memory Allocation', 'Time & Space Complexity', 'STL Algorithms', 'OOP'],
                    mudassirExp: 'Solved 150+ Data Structures & Algorithms problems (Arrays, Linked Lists, Trees, Dynamic Programming, Graphs) with peak efficiency.',
                    projects: ['Algorithm Visualizer', 'Competitive Programming LeetCode Portfolio'],
                },
            },

            // --- B. FRAMEWORKS & LIBRARIES (Center Magma Basin Plaza) ---
            {
                type: 'box',
                id: 'tech_react',
                label: 'REACT',
                icon: '⚛️',
                category: 'Libraries',
                color: 0x61dafb,
                w: 1.0, h: 1.0, d: 1.0,
                mass: 1.0,
                x: -1.2, y: PLAT + 0.52, z: 2.5,
                studyData: {
                    title: 'React.js',
                    icon: '⚛️',
                    category: 'Frontend Library',
                    level: 'Advanced / Core Stack',
                    desc: 'Component-driven reactive UI framework utilizing state machines, hooks, reconciliation, virtual DOM diffing, and single-page routing.',
                    skills: ['Custom Hooks', 'Context API', 'State Architecture', 'Virtual DOM', 'React Router', 'Component Lifecycle'],
                    mudassirExp: 'Developed responsive client dashboards for QuizPro, interactive product feeds with live carts, and dynamic CMS panels.',
                    projects: ['QuizPro Exam Manager', 'E-Commerce Storefront', 'Interactive Admin CMS'],
                },
            },
            {
                type: 'box',
                id: 'tech_nodejs',
                label: 'NODE.JS',
                icon: '🟢',
                category: 'Libraries',
                color: 0x68a063,
                w: 1.0, h: 1.0, d: 1.0,
                mass: 1.0,
                x: 0.8, y: PLAT + 0.52, z: 3.2,
                studyData: {
                    title: 'Node.js',
                    icon: '🟢',
                    category: 'Backend Runtime',
                    level: 'Advanced / Core Stack',
                    desc: 'V8-powered asynchronous non-blocking event-driven runtime powering scalable microservices, background jobs, and RESTful servers.',
                    skills: ['Event Loop', 'Stream Pipelines', 'File System API', 'Cluster Management', 'NPM Tooling', 'Process Architecture'],
                    mudassirExp: 'Engineered the backend serving this 3D portfolio with multi-layered asset streaming, fallback data safety, and fast startup.',
                    projects: ['Portfolio Backend Daemon', 'QuizPro Backend API', 'Authentication Microservice'],
                },
            },
            {
                type: 'box',
                id: 'tech_express',
                label: 'EXPRESS',
                icon: '🚂',
                category: 'Libraries',
                color: 0xffffff,
                w: 0.95, h: 0.95, d: 0.95,
                mass: 1.0,
                x: -0.7, y: PLAT + 0.5, z: 4.8,
                studyData: {
                    title: 'Express.js',
                    icon: '🚂',
                    category: 'Backend Framework',
                    level: 'Advanced / Core Stack',
                    desc: 'Minimalist web framework providing powerful routing pipelines, custom middleware stacks, rate limiting, and REST API controllers.',
                    skills: ['REST Controllers', 'Custom Middleware', 'JWT Auth Verification', 'Error Middleware', 'CORS Security'],
                    mudassirExp: 'Built secured RESTful CRUD endpoints for portfolio islands, messages database, user token sessions, and product catalogs.',
                    projects: ['Portfolio REST API', 'QuizPro Examination Engine', 'E-Commerce Checkout API'],
                },
            },
            {
                type: 'box',
                id: 'tech_threejs',
                label: 'THREE.JS',
                icon: '🌐',
                category: 'Libraries',
                color: 0x00f0ff,
                w: 1.0, h: 1.0, d: 1.0,
                mass: 1.0,
                x: 1.1, y: PLAT + 0.52, z: 2.1,
                studyData: {
                    title: 'Three.js / WebGL',
                    icon: '🌐',
                    category: '3D Graphics Library',
                    level: 'Advanced / Specialist',
                    desc: 'WebGL 3D graphics library for procedural geometry synthesis, realistic lighting, material shading, particle systems, and 3D camera controls.',
                    skills: ['Procedural Wave Shaders', 'Custom Mesh Geometries', 'Impulse Collision Physics', 'Canvas Textures', 'Scene Graph Optimization'],
                    mudassirExp: 'Designed this entire One Piece 3D world from scratch, including dynamic ocean swells with foam crests, ship buoyancy, and physics crates.',
                    projects: ['3D Sailing Pirate Portfolio', 'Procedural Ocean Simulation', 'Physics Prop Sandbox'],
                },
            },

            // --- C. DATABASES, TOOLS & AI (Right Basalt Terraces) ---
            {
                type: 'box',
                id: 'tech_mongodb',
                label: 'MONGODB',
                icon: '🍃',
                category: 'Tech & Tools',
                color: 0x47a248,
                w: 1.0, h: 1.0, d: 1.0,
                mass: 1.0,
                x: 3.4, y: PLAT + 0.52, z: 1.7,
                studyData: {
                    title: 'MongoDB & Mongoose',
                    icon: '🍃',
                    category: 'NoSQL Database',
                    level: 'Advanced / Core Stack',
                    desc: 'Document-oriented flexible NoSQL database with schema modeling, complex aggregation pipelines, indexing, and cloud Atlas scaling.',
                    skills: ['Mongoose ODM', 'Aggregation Pipelines', 'Schema Validation', 'Compound Indexing', 'MongoDB Atlas Cloud'],
                    mudassirExp: 'Structured flexible data schemas for dynamic island portfolios, quiz records, test submissions, and real-time contact messages.',
                    projects: ['QuizPro Examination DB', 'Portfolio Island CMS Store', 'User Profiles & Orders'],
                },
            },
            {
                type: 'box',
                id: 'tech_aiml',
                label: 'AI / ML',
                icon: '🤖',
                category: 'Tech & Tools',
                color: 0x8a2be2,
                w: 1.0, h: 1.0, d: 1.0,
                mass: 1.1,
                x: 4.8, y: PLAT + 0.52, z: 2.8,
                studyData: {
                    title: 'AI & Machine Learning',
                    icon: '🤖',
                    category: 'Artificial Intelligence',
                    level: 'Specialization (B.Tech in AI & Data Science)',
                    desc: 'Supervised & unsupervised machine learning, predictive analytics, feature engineering, model tuning, and data science workflows.',
                    skills: ['Scikit-Learn', 'Classification & Regression', 'Feature Scaling', 'Model Evaluation (F1/ROC)', 'Pandas EDA'],
                    mudassirExp: 'Trained and cross-validated multi-class health diagnostic prediction models, attaining strong predictive accuracy across test sets.',
                    projects: ['Multi-Disease Health Predictor', 'Predictive Analytics Suite', 'AI Exploratory Notebooks'],
                },
            },
            {
                type: 'box',
                id: 'tech_git',
                label: 'GIT',
                icon: '🐙',
                category: 'Tech & Tools',
                color: 0xf05032,
                w: 0.95, h: 0.95, d: 0.95,
                mass: 1.0,
                x: 3.2, y: PLAT + 0.5, z: 4.2,
                studyData: {
                    title: 'Git & GitHub',
                    icon: '🐙',
                    category: 'DevOps & Collaboration',
                    level: 'Advanced / Daily Driver',
                    desc: 'Distributed version control system, branch workflows, pull request reviews, rebasing, CI/CD automated deployments, and repository safety.',
                    skills: ['Branching Models (Gitflow)', 'Merge Conflicts', 'Interactive Rebase', 'GitHub Actions', 'Semantic Versioning'],
                    mudassirExp: 'Maintained production git repositories with structured commit histories, release tagging, and automated deployments.',
                    projects: ['All GitHub Open Source Repositories', 'Agile Collaborative Sprints'],
                },
            },
            {
                type: 'box',
                id: 'tech_api',
                label: 'REST APIs',
                icon: '🔌',
                category: 'Tech & Tools',
                color: 0xff6b35,
                w: 0.95, h: 0.95, d: 0.95,
                mass: 1.0,
                x: 4.7, y: PLAT + 0.5, z: 4.8,
                studyData: {
                    title: 'RESTful APIs & WebSockets',
                    icon: '🔌',
                    category: 'Network Architecture',
                    level: 'Advanced / Core Stack',
                    desc: 'Designing intuitive, stateless REST APIs with standardized HTTP status codes, structured JSON payloads, and bi-directional WebSockets.',
                    skills: ['REST Principles', 'Socket.io / WS Protocol', 'Token Bearer Auth', 'Status Codes & Errors', 'Postman Testing'],
                    mudassirExp: 'Architected full REST specifications and real-time bi-directional streaming protocols connecting client web apps to server clusters.',
                    projects: ['REST API Gateway', 'Real-Time Multi-Room Chat', 'Admin CMS Endpoints'],
                },
            },
        ];

        return {
            solids: S,
            props: pushableTechProps,
            update: (t) => {
                // Animate billowing volcanic smoke clouds
                smokeClouds.forEach((sm, idx) => {
                    const cycle = (t * 0.22 + idx / smokeClouds.length) % 1;
                    const driftAngle = idx * 1.7 + t * 0.15;
                    const driftR = cycle * 2.2;
                    sm.position.set(
                        vx + Math.cos(driftAngle) * driftR,
                        PLAT + 7.8 + cycle * 7.5,
                        vz + Math.sin(driftAngle) * driftR - cycle * 1.8
                    );
                    sm.scale.setScalar(0.7 + cycle * 2.4);
                    sm.material.opacity = Math.max(0, 0.55 * (1 - cycle));
                });

                // Animate floating glowing magma embers
                embers.forEach((em) => {
                    const curAngle = em.angle + t * em.speed * 0.6;
                    em.mesh.position.set(
                        vx + Math.cos(curAngle) * em.dist,
                        em.baseY + Math.sin(t * em.speed + em.angle) * 0.6,
                        vz + Math.sin(curAngle) * em.dist
                    );
                    em.mesh.rotation.y = t * 2.5;
                    em.mesh.rotation.x = t * 1.8;
                });
            },
        };
    },
};

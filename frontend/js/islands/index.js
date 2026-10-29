import * as THREE from 'three';
import { cyl } from './helpers.js';
import fallback from './default.js';
import about from './about.js';
import projects from './projects.js';
import skills from './skills.js';
import experience from './experience.js';
import education from './education.js';
import socials from './socials.js';
import resume from './resume.js';
import contact from './contact.js';

// key = the island's "type" in MongoDB
const REGISTRY = { about, projects, skills, experience, education, socials, resume, contact };

export function buildThemedIsland(d, makeLabel) {
    const g = new THREE.Group();
    g.position.set(d.x, 0, d.z);
    const r = d.radius;
    const theme = REGISTRY[d.type] || fallback;

    // base island (sand ring + grass plateau)
    cyl(g, r * 0.9, r, 3, d.color, 0, 0.5, 0, { seg: 28, mat: { flatShading: false } });
    cyl(g, r * 0.62, r * 0.75, 1.5, theme.grass, 0, 2.2, 0, { seg: 28, mat: { flatShading: false } });

    // one broken island file can never crash the others
    let out = {};
    try {
        out = theme.build(g, r) || {};
    } catch (err) {
        console.error('Island build failed:', d.name, err);
    }

    const label = makeLabel(d.name);
    label.position.y = theme.labelY || 15;
    g.add(label);
    return { group: g, solids: out.solids || [], update: out.update };
}
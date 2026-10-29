import * as THREE from 'three';
import { buildThemedIsland } from './islands/index.js';

function toast(text) {
    const d = document.createElement('div');
    d.textContent = text;
    d.style.cssText =
        'position:fixed;left:12px;bottom:12px;z-index:30;background:#c0392b;color:#fff;' +
        'padding:8px 14px;border-radius:8px;font:14px Segoe UI,sans-serif;';
    document.body.appendChild(d);
    setTimeout(() => d.remove(), 8000);
}
const wrapPI = (a) => Math.atan2(Math.sin(a), Math.cos(a));
const easeOutBack = (x) => {
    const c1 = 1.70158, c3 = c1 + 1;
    return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
};

// ---------- Scene ----------
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);
scene.fog = new THREE.Fog(0x87ceeb, 150, 600);

const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 1500);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.domElement.style.touchAction = 'none';
document.body.appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xffffff, 0x6fa8dc, 0.95));
scene.add(new THREE.AmbientLight(0xffffff, 0.35));
const sun = new THREE.DirectionalLight(0xfff2d6, 0.9);
sun.position.set(-80, 160, -60);
scene.add(sun);

// ---------- Water ----------
const wGeo = new THREE.PlaneGeometry(1400, 1400, 110, 110);
wGeo.rotateX(-Math.PI / 2);
const water = new THREE.Mesh(
    wGeo,
    new THREE.MeshPhongMaterial({ color: 0x1e90ff, flatShading: true, shininess: 80 })
);
scene.add(water);
const wPos = wGeo.attributes.position;

// ---------- Ship (pirate galleon) ----------
const SHIP_SCALE = 0.5; // make the ship bigger or smaller here

const boat = new THREE.Group();          // moves, turns and bobs
boat.rotation.order = 'YXZ';
scene.add(boat);

const ship = new THREE.Group();          // the model itself
ship.scale.setScalar(SHIP_SCALE);
boat.add(ship);

const C = {
    wood: 0x7a4a28, deck: 0xdcae72, hullTop: 0xf0c999, hullLow: 0xb06b3a,
    sail: 0xfff1d0, cabin: 0xf1d7a8, roof: 0xd0743f, dark: 0x2b1e18,
};
const mat = (color, extra = {}) =>
    new THREE.MeshPhongMaterial({ color, flatShading: true, ...extra });

const HULL_L = 11, HULL_W = 2.1;
const hullHalfWidth = (t) =>
    HULL_W * Math.pow(Math.max(0, Math.sin(Math.PI * Math.pow(t, 0.8))), 0.5);
const hullTop = (t) => 1.3 + 1.2 * Math.pow(1 - t, 3) + 1.0 * Math.pow(t, 4);
const hullKeel = (t) => -0.6 + 1.6 * Math.pow(t, 3.5) + 0.7 * Math.pow(1 - t, 3);
const zAt = (t) => -HULL_L / 2 + t * HULL_L;
const deckYAt = (z) => hullTop((z + HULL_L / 2) / HULL_L);

// --- hull (lofted from cross-sections, bow points to +Z) ---
const N = 36, M = 16;
(function buildHull() {
    const P = (i, j) => {
        const t = i / N, th = (Math.PI * j) / M;
        const w = hullHalfWidth(t), top = hullTop(t), depth = top - hullKeel(t);
        return [w * Math.cos(th), top - depth * Math.sin(th), zAt(t)];
    };
    const pos = [], col = [];
    const tri = (a, b, c, color) => {
        pos.push(...a, ...b, ...c);
        for (let k = 0; k < 3; k++) col.push(color.r, color.g, color.b);
    };
    const tan = new THREE.Color(C.hullTop);
    const low = new THREE.Color(C.hullLow);
    const deck = new THREE.Color(C.deck);

    for (let i = 0; i < N; i++) {
        for (let j = 0; j < M; j++) {
            const a = P(i, j), b = P(i, j + 1), c = P(i + 1, j + 1), d = P(i + 1, j);
            const color = j < 3 || j >= M - 3 ? tan : low;
            tri(a, d, b, color);
            tri(d, c, b, color);
        }
        const R0 = P(i, 0), L0 = P(i, M), R1 = P(i + 1, 0), L1 = P(i + 1, M);
        tri(R0, L0, L1, deck);
        tri(R0, L1, R1, deck);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    g.computeVertexNormals();
    ship.add(new THREE.Mesh(g, new THREE.MeshPhongMaterial({ vertexColors: true, flatShading: true })));
})();

// --- dark rails along the top edge ---
[-1, 1].forEach((side) => {
    const pts = [];
    for (let i = 0; i <= N; i++) {
        const t = i / N;
        pts.push(new THREE.Vector3(side * hullHalfWidth(t), hullTop(t) + 0.04, zAt(t)));
    }
    const curve = new THREE.CatmullRomCurve3(pts);
    ship.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 90, 0.14, 8, false), mat(C.wood)));
});

// --- cannon portholes ---
const Y_AXIS = new THREE.Vector3(0, 1, 0);
[-1, 1].forEach((side) => {
    [0.34, 0.44, 0.54, 0.64].forEach((t) => {
        const th = (Math.PI * 15) / 180;
        const w = hullHalfWidth(t), top = hullTop(t), depth = top - hullKeel(t);
        const pos = new THREE.Vector3(side * w * Math.cos(th), top - depth * Math.sin(th), zAt(t));
        const n = new THREE.Vector3(side * depth * Math.cos(th), -w * Math.sin(th), 0).normalize();
        const q = new THREE.Quaternion().setFromUnitVectors(Y_AXIS, n);

        const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.12, 18), mat(C.wood));
        ring.position.copy(pos).addScaledVector(n, 0.03);
        ring.quaternion.copy(q);
        const hole = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.14, 18), mat(C.dark));
        hole.position.copy(pos).addScaledVector(n, 0.05);
        hole.quaternion.copy(q);
        ship.add(ring, hole);
    });
});

// --- helpers ---
function beam(a, b, r, color) {
    const va = new THREE.Vector3(...a), vb = new THREE.Vector3(...b);
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, va.distanceTo(vb), 8), mat(color));
    m.position.copy(va).add(vb).multiplyScalar(0.5);
    m.quaternion.setFromUnitVectors(Y_AXIS, vb.clone().sub(va).normalize());
    ship.add(m);
    return m;
}

function makeSail(w, h, bulge) {
    const g = new THREE.PlaneGeometry(w, h, 12, 10);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
        const x = p.getX(i), y = p.getY(i);
        const u = x / w + 0.5, v = y / h + 0.5;
        p.setX(i, x * (0.82 + 0.18 * (1 - v)));
        p.setZ(i, bulge * Math.sin(Math.PI * u) * Math.sin(Math.PI * (0.15 + 0.7 * v)));
    }
    g.computeVertexNormals();
    return new THREE.Mesh(
        g,
        new THREE.MeshPhongMaterial({
            color: C.sail, emissive: 0x4a4030, side: THREE.DoubleSide, shininess: 5,
        })
    );
}

function skullFlagTexture() {
    const c = document.createElement('canvas');
    c.width = 256; c.height = 170;
    const g = c.getContext('2d');
    g.fillStyle = '#111';
    g.fillRect(0, 0, 256, 170);
    g.strokeStyle = '#fff';
    g.lineWidth = 12;
    g.lineCap = 'round';
    g.beginPath();
    g.moveTo(70, 30); g.lineTo(186, 140);
    g.moveTo(186, 30); g.lineTo(70, 140);
    g.stroke();
    g.fillStyle = '#fff';
    g.beginPath(); g.arc(128, 72, 38, 0, Math.PI * 2); g.fill();
    g.fillRect(104, 90, 48, 36);
    g.fillStyle = '#111';
    g.beginPath(); g.arc(112, 72, 10, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.arc(144, 72, 10, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.moveTo(128, 84); g.lineTo(121, 98); g.lineTo(135, 98); g.closePath(); g.fill();
    g.strokeStyle = '#111';
    g.lineWidth = 3;
    [120, 128, 136].forEach((x) => { g.beginPath(); g.moveTo(x, 112); g.lineTo(x, 126); g.stroke(); });
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
}

// --- masts, yards and sails ---
const rig = [
    { z: 3.2, h: 6.0, yardY: 5.4, sailW: 3.2, sailH: 3.0, bulge: 0.7 },   // fore
    { z: 0.6, h: 10.2, yardY: 7.6, sailW: 5.2, sailH: 4.8, bulge: 1.0 },  // main
    { z: -1.8, h: 7.2, yardY: 6.0, sailW: 3.6, sailH: 3.4, bulge: 0.8 },  // mizzen
];
rig.forEach((r) => {
    const y0 = deckYAt(r.z) - 0.3;
    beam([0, y0, r.z], [0, y0 + r.h, r.z], 0.17, C.wood);
    beam([-r.sailW / 2 - 0.35, y0 + r.yardY, r.z + 0.05], [r.sailW / 2 + 0.35, y0 + r.yardY, r.z + 0.05], 0.1, C.wood);
    beam([-r.sailW / 2 - 0.1, y0 + r.yardY - r.sailH, r.z + 0.05], [r.sailW / 2 + 0.1, y0 + r.yardY - r.sailH, r.z + 0.05], 0.07, C.wood);
    const s = makeSail(r.sailW, r.sailH, r.bulge);
    s.position.set(0, y0 + r.yardY - r.sailH / 2, r.z + 0.1);
    ship.add(s);
});

// --- crow's nest + skull flag on the main mast ---
const mainY0 = deckYAt(0.6) - 0.3;
const nest = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.6, 0.5, 16), mat(C.wood));
nest.position.set(0, mainY0 + 8.2, 0.6);
ship.add(nest);

const flagPivot = new THREE.Group();
flagPivot.position.set(0, mainY0 + 9.6, 0.6);
const flag = new THREE.Mesh(
    new THREE.PlaneGeometry(1.8, 1.2),
    new THREE.MeshBasicMaterial({ map: skullFlagTexture(), side: THREE.DoubleSide })
);
flag.rotation.y = Math.PI / 2;
flag.position.z = -0.9;
flagPivot.add(flag);
ship.add(flagPivot);

// --- rigging lines ---
const mastTop = (z, h) => [0, deckYAt(z) - 0.3 + h, z];
beam(mastTop(3.2, 6.0), [0, 3.85, 9.5], 0.035, C.dark);
beam(mastTop(0.6, 10.2), mastTop(3.2, 6.0), 0.035, C.dark);
beam(mastTop(0.6, 10.2), mastTop(-1.8, 7.2), 0.035, C.dark);
beam(mastTop(-1.8, 7.2), [0, 3.4, -5.2], 0.035, C.dark);

// --- bowsprit ---
beam([0, 1.9, 4.2], [0, 3.9, 9.6], 0.14, C.wood);

// --- stern cabin ---
const cabinZ = -3.4, cabinW = 2.4, cabinL = 2.0, cabinH = 1.5, cabinY = 1.7;
const cabin = new THREE.Mesh(new THREE.BoxGeometry(cabinW, cabinH, cabinL), mat(C.cabin));
cabin.position.set(0, cabinY + cabinH / 2, cabinZ);
ship.add(cabin);

(function roof() {
    const w = cabinW + 0.5, len = cabinL + 0.5, h = 0.9;
    const s = new THREE.Shape();
    s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); s.lineTo(0, h); s.closePath();
    const g = new THREE.ExtrudeGeometry(s, { depth: len, bevelEnabled: false });
    g.translate(0, 0, -len / 2);
    const m = new THREE.Mesh(g, mat(C.roof));
    m.position.set(0, cabinY + cabinH, cabinZ);
    ship.add(m);
})();

[-1, 1].forEach((side) => {
    [-3.9, -2.9].forEach((z) => {
        const win = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.55, 0.55), mat(C.dark));
        win.position.set(side * (cabinW / 2 + 0.01), cabinY + 0.85, z);
        ship.add(win);
    });
});
[-0.5, 0.5].forEach((x) => {
    const win = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.55, 0.06), mat(C.dark));
    win.position.set(x, cabinY + 0.85, cabinZ - cabinL / 2 - 0.01);
    ship.add(win);
});

// ---------- Harbor: shore, pier, steps, bollards, gangplank ----------
const HARBOR = { x: 0, z: -28, r: 14 };                         // shore (circle)
const PIER = { x0: -1.6, x1: 1.6, z0: -13, z1: 2, top: 1.5 };   // wooden pier
const BERTH = { x: 3.4, z: -5, heading: 0 };                    // where the ship is tied up

const harbor = new THREE.Group();
scene.add(harbor);
const hm = (color) => new THREE.MeshPhongMaterial({ color, flatShading: true });
function hbox(w, h, d, color, x, y, z) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), hm(color));
    m.position.set(x, y, z);
    harbor.add(m);
    return m;
}
function hcyl(rt, rb, h, color, x, y, z, seg = 12) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), hm(color));
    m.position.set(x, y, z);
    harbor.add(m);
    return m;
}

function plankTexture() {
    const c = document.createElement('canvas');
    c.width = 128; c.height = 256;
    const g = c.getContext('2d');
    g.fillStyle = '#c28a52';
    g.fillRect(0, 0, 128, 256);
    g.fillStyle = 'rgba(0,0,0,0.07)';
    g.fillRect(0, 64, 128, 64);
    g.fillRect(0, 192, 128, 64);
    g.fillStyle = '#8a5a30';
    for (let y = 0; y < 256; y += 64) g.fillRect(0, y, 128, 4);
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(1, 5);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
}

function signTexture() {
    const c = document.createElement('canvas');
    c.width = 512; c.height = 140;
    const g = c.getContext('2d');
    g.fillStyle = '#7a4a28';
    g.fillRect(0, 0, 512, 140);
    g.strokeStyle = '#4a2c14';
    g.lineWidth = 10;
    g.strokeRect(5, 5, 502, 130);
    g.fillStyle = '#ffe9b0';
    g.font = 'bold 42px Segoe UI, sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText("MUDASSIR'S HARBOR", 256, 72);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
}

// shore
hcyl(HARBOR.r, HARBOR.r + 1, 3.2, 0xf4d9a0, HARBOR.x, 0.4, HARBOR.z, 40);
hcyl(11, 11.5, 0.4, 0x58c26a, HARBOR.x, 2.2, HARBOR.z, 40);
[[-6, -33], [5, -35], [-2, -38]].forEach(([x, z]) => {
    hcyl(0.25, 0.35, 5, 0x8b5a2b, x, 4.9, z, 8);
    const leaves = new THREE.Mesh(new THREE.ConeGeometry(2.2, 1.8, 8), hm(0x27ae60));
    leaves.position.set(x, 8.0, z);
    harbor.add(leaves);
});
hbox(4, 2.2, 3, 0xf1d7a8, -6, 3.5, -24);                  // little harbor house
const houseRoof = new THREE.Mesh(new THREE.ConeGeometry(3.2, 1.6, 4), hm(0xd0743f));
houseRoof.position.set(-6, 5.4, -24);
houseRoof.rotation.y = Math.PI / 4;
harbor.add(houseRoof);

// pier deck + planks
const pierLen = PIER.z1 - PIER.z0, pierW = PIER.x1 - PIER.x0;
hbox(pierW, 0.3, pierLen, 0x8a5a30, 0, PIER.top - 0.15, (PIER.z0 + PIER.z1) / 2);
const planks = new THREE.Mesh(
    new THREE.PlaneGeometry(pierW - 0.2, pierLen),
    new THREE.MeshPhongMaterial({ map: plankTexture() })
);
planks.rotation.x = -Math.PI / 2;
planks.position.set(0, PIER.top + 0.005, (PIER.z0 + PIER.z1) / 2);
harbor.add(planks);

// pilings
[-12, -8, -4, 0, 2].forEach((z) => {
    [-1.55, 1.55].forEach((x) => hcyl(0.17, 0.21, 3.3, 0x5a3a20, x, 0.15, z, 10));
});

// steps up to the shore
[
    { top: 1.67, z: -13.5 },
    { top: 1.84, z: -14.5 },
].forEach((s) => hbox(3.0, 0.9, 1.0, 0xb07a45, 0, s.top - 0.45, s.z));

// bollards (mooring posts) on the ship side of the pier
const bollards = [BERTH.z + 2.6, BERTH.z - 2.6].map((z) => {
    hcyl(0.2, 0.22, 0.5, 0x2b1e18, 1.45, 1.75, z, 10);
    return new THREE.Vector3(1.45, 1.95, z);
});

// ---------- Dynamic Interactive Props (Crates & Barrel) ----------
const dynamicProps = [];

// Lightweight particle system for impact dust & water splashes
const particles = [];
const particleGeo = new THREE.SphereGeometry(0.06, 6, 6);
const splashMat = new THREE.MeshBasicMaterial({ color: 0xe0f7fa });
const dustMat = new THREE.MeshBasicMaterial({ color: 0xc8a46a });

function spawnParticles(x, y, z, count = 6, isSplash = false) {
    for (let i = 0; i < count; i++) {
        const p = new THREE.Mesh(particleGeo, isSplash ? splashMat : dustMat);
        p.position.set(x, y, z);
        scene.add(p);
        const ang = Math.random() * Math.PI * 2;
        const spd = 0.8 + Math.random() * 1.8;
        particles.push({
            mesh: p,
            vx: Math.cos(ang) * spd,
            vy: 1.2 + Math.random() * 2.0,
            vz: Math.sin(ang) * spd,
            life: 0.5,
            maxLife: 0.5,
        });
    }
}

function updateParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life -= dt;
        if (p.life <= 0) {
            scene.remove(p.mesh);
            p.mesh.geometry.dispose();
            particles.splice(i, 1);
            continue;
        }
        p.vy -= 9.8 * dt;
        p.mesh.position.x += p.vx * dt;
        p.mesh.position.y += p.vy * dt;
        p.mesh.position.z += p.vz * dt;
        p.mesh.scale.setScalar(Math.max(0.01, p.life / p.maxLife));
    }
}

function createBoxProp({ id, w, h, d, color, x, y, z, mass = 1.0 }) {
    const geo = new THREE.BoxGeometry(w, h, d);
    const m = new THREE.Mesh(geo, hm(color));
    m.position.set(x, y, z);
    scene.add(m);
    const prop = {
        id,
        type: 'box',
        mesh: m,
        w, h, d,
        radius: Math.hypot(w, d) * 0.42,
        mass,
        x, y, z,
        origX: x, origY: y, origZ: z,
        vx: 0, vy: 0, vz: 0,
        rotX: 0, rotY: 0, rotZ: 0,
        vRotX: 0, vRotY: 0, vRotZ: 0,
        grounded: true,
        floating: false,
        restingOn: null,
    };
    dynamicProps.push(prop);
    return prop;
}

function createCylinderProp({ id, rt, rb, h, color, x, y, z, mass = 1.2 }) {
    const geo = new THREE.CylinderGeometry(rt, rb, h, 14);
    const m = new THREE.Mesh(geo, hm(color));
    m.position.set(x, y, z);
    scene.add(m);
    const prop = {
        id,
        type: 'barrel',
        mesh: m,
        w: rt * 2, h, d: rt * 2,
        radius: rt,
        mass,
        x, y, z,
        origX: x, origY: y, origZ: z,
        vx: 0, vy: 0, vz: 0,
        rotX: 0, rotY: 0, rotZ: 0,
        vRotX: 0, vRotY: 0, vRotZ: 0,
        grounded: true,
        floating: false,
        restingOn: null,
    };
    dynamicProps.push(prop);
    return prop;
}

// Bottom crate of stack
const crateStackBottom = createBoxProp({
    id: 'crate_bottom',
    w: 0.8, h: 0.8, d: 0.8,
    color: 0xa8723c,
    x: -0.9, y: 1.9, z: -11.6,
    mass: 1.2,
});

// Top crate stacked on bottom crate
const crateStackTop = createBoxProp({
    id: 'crate_top',
    w: 0.6, h: 0.6, d: 0.6,
    color: 0xb8823c,
    x: -0.9, y: 2.6, z: -11.6,
    mass: 0.6,
});
crateStackTop.restingOn = crateStackBottom;

// Single crate
const crateSingle = createBoxProp({
    id: 'crate_single',
    w: 0.7, h: 0.7, d: 0.7,
    color: 0xa8723c,
    x: 0.2, y: 1.85, z: -12.2,
    mass: 1.0,
});

// Wooden barrel
const barrelProp = createCylinderProp({
    id: 'barrel',
    rt: 0.4, rb: 0.4, h: 0.9,
    color: 0x7a4a28,
    x: 1.0, y: 1.95, z: -11.8,
    mass: 1.3,
});

function getPropSurface(x, z, time) {
    if (x >= PIER.x0 - 0.05 && x <= PIER.x1 + 0.05 && z >= PIER.z0 && z <= PIER.z1) {
        return { height: PIER.top, isWater: false };
    }
    if (z < PIER.z0) {
        if (x > -3.5 && x < 3.5) {
            if (z >= PIER.z0 - 1.0) return { height: 1.67, isWater: false };
            if (z >= PIER.z0 - 2.0) return { height: 1.84, isWater: false };
        }
        const hd = Math.hypot(x - HARBOR.x, z - HARBOR.z);
        if (hd < 14.2) {
            const h = hd < 11 ? 2.4 : hd < 11.5 ? 2.4 - ((hd - 11) / 0.5) * 0.4 : 2.0;
            return { height: h, isWater: false };
        }
    }
    const waveY = Math.sin(x * 0.06 + time) * 0.5 + Math.cos(z * 0.05 + time * 0.8) * 0.5;
    return { height: waveY, isWater: true };
}

function resetProps() {
    for (const prop of dynamicProps) {
        prop.x = prop.origX;
        prop.y = prop.origY;
        prop.z = prop.origZ;
        prop.vx = 0; prop.vy = 0; prop.vz = 0;
        prop.rotX = 0; prop.rotY = 0; prop.rotZ = 0;
        prop.vRotX = 0; prop.vRotY = 0; prop.vRotZ = 0;
        prop.floating = false;
        prop.grounded = true;
        prop.mesh.position.set(prop.x, prop.y, prop.z);
        prop.mesh.rotation.set(0, 0, 0);
    }
    crateStackTop.restingOn = crateStackBottom;
    if (typeof topHarborProps !== 'undefined') {
        for (const top of topHarborProps) {
            top.restingOn = top._origRestingOn;
        }
    }
}
hcyl(0.07, 0.07, 2.2, 0x2b1e18, -1.4, 2.6, 1.6, 8);
const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 12), new THREE.MeshBasicMaterial({ color: 0xffe08a }));
lamp.position.set(-1.4, 3.8, 1.6);
harbor.add(lamp);

// ---------- 3D Scramble Blocks for "MUDASSIR'S HARBOUR" ----------
function makeLetterTexture(char, isTop) {
    const c = document.createElement('canvas');
    c.width = 256;
    c.height = 256;
    const g = c.getContext('2d');

    // Base colors: Top row is warm golden cedar; bottom row is rich pirate mahogany
    const baseColor = isTop ? '#c9823b' : '#944b26';
    const darkWood = isTop ? '#5a2d0c' : '#451a05';
    const textColor = isTop ? '#fffdf0' : '#ffe9b0';
    const highlight = 'rgba(255,255,255,0.22)';

    g.fillStyle = baseColor;
    g.fillRect(0, 0, 256, 256);

    // Wood plank lines
    g.fillStyle = 'rgba(0,0,0,0.09)';
    g.fillRect(0, 60, 256, 6);
    g.fillRect(0, 130, 256, 6);
    g.fillRect(0, 196, 256, 6);

    // Dark outer border / frame
    g.strokeStyle = darkWood;
    g.lineWidth = 18;
    g.strokeRect(9, 9, 238, 238);

    // Inner highlight rim
    g.strokeStyle = highlight;
    g.lineWidth = 6;
    g.strokeRect(20, 20, 216, 216);

    // Corner brass nails / rivets
    g.fillStyle = '#f0c14b';
    [
        [28, 28], [228, 28], [28, 228], [228, 228]
    ].forEach(([cx, cy]) => {
        g.beginPath();
        g.arc(cx, cy, 6, 0, Math.PI * 2);
        g.fill();
        g.strokeStyle = 'rgba(0,0,0,0.4)';
        g.lineWidth = 2;
        g.stroke();
    });

    if (char === 'CRATE') {
        // Cargo crate cross braces (X)
        g.strokeStyle = darkWood;
        g.lineWidth = 14;
        g.beginPath();
        g.moveTo(28, 28); g.lineTo(228, 228);
        g.moveTo(228, 28); g.lineTo(28, 228);
        g.stroke();
        // Center metal badge
        g.fillStyle = '#f0c14b';
        g.fillRect(108, 108, 40, 40);
        g.strokeStyle = darkWood;
        g.lineWidth = 4;
        g.strokeRect(108, 108, 40, 40);
    } else {
        // Draw the letter!
        g.font = '900 144px "Impact", "Segoe UI Black", sans-serif';
        g.textAlign = 'center';
        g.textBaseline = 'middle';

        // 3D Drop shadow
        g.fillStyle = 'rgba(0,0,0,0.55)';
        g.fillText(char, 132, 136);

        // Letter face
        g.fillStyle = textColor;
        g.fillText(char, 128, 128);

        // Dark outline
        g.strokeStyle = darkWood;
        g.lineWidth = 6;
        g.strokeText(char, 128, 128);
    }

    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
}

const B_SIZE = 0.48;
const B_GAP = 0.04;
const bStep = B_SIZE + B_GAP;
const bGeo = new THREE.BoxGeometry(B_SIZE, B_SIZE, B_SIZE);

function createLetterBlock({ char, x, y, z, isTop, id }) {
    const tex = makeLetterTexture(char, isTop);
    const m = new THREE.Mesh(bGeo, new THREE.MeshPhongMaterial({ map: tex, flatShading: true }));
    m.position.set(x, y, z);
    scene.add(m);
    const prop = {
        id,
        isHarborBlock: true,
        type: 'block',
        char,
        mesh: m,
        w: B_SIZE, h: B_SIZE, d: B_SIZE,
        radius: B_SIZE * 0.58,
        mass: 0.75,
        x, y, z,
        origX: x, origY: y, origZ: z,
        vx: 0, vy: 0, vz: 0,
        rotX: 0, rotY: 0, rotZ: 0,
        vRotX: 0, vRotY: 0, vRotZ: 0,
        grounded: true,
        floating: false,
        restingOn: null,
    };
    dynamicProps.push(prop);
    return prop;
}

const harborCenter = { x: 2.6, z: -16.2 };
const topChars = ['M', 'U', 'D', 'A', 'S', 'S', 'I', 'R', "'", 'S'];
const botChars = ['CRATE', 'H', 'A', 'R', 'B', 'O', 'U', 'R', 'CRATE'];

const botWidth = botChars.length * B_SIZE + (botChars.length - 1) * B_GAP;
const topWidth = topChars.length * B_SIZE + (topChars.length - 1) * B_GAP;

const bottomHarborProps = [];
const startX_bot = harborCenter.x - (botWidth / 2) + B_SIZE / 2;
botChars.forEach((ch, i) => {
    const bx = startX_bot + i * bStep;
    const bz = harborCenter.z;
    const groundY = getPropSurface(bx, bz, 0).height;
    const by = groundY + B_SIZE / 2;
    const p = createLetterBlock({ char: ch, x: bx, y: by, z: bz, isTop: false, id: `harbor_bot_${i}_${ch}` });
    bottomHarborProps.push(p);
});

const topHarborProps = [];
const startX_top = harborCenter.x - (topWidth / 2) + B_SIZE / 2;
topChars.forEach((ch, j) => {
    const tx = startX_top + j * bStep;
    const tz = harborCenter.z;
    const groundY = getPropSurface(tx, tz, 0).height;
    const ty = groundY + B_SIZE + B_SIZE / 2;
    const p = createLetterBlock({ char: ch, x: tx, y: ty, z: tz, isTop: true, id: `harbor_top_${j}_${ch}` });
    let closest = null, minD = 999;
    for (const b of bottomHarborProps) {
        const d = Math.abs(b.x - tx);
        if (d < minD) { minD = d; closest = b; }
    }
    p.restingOn = closest;
    p._origRestingOn = closest;
    topHarborProps.push(p);
});

// gangplank (pier -> ship deck), lifts away when the ship leaves
const plankMat = new THREE.MeshPhongMaterial({ color: 0xc28a52, transparent: true });
const plankPivot = new THREE.Group();
plankPivot.position.set(PIER.x1 - 0.05, PIER.top + 0.02, BERTH.z);
const plankMesh = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.08, 0.8), plankMat);
plankMesh.position.x = 0.55;
plankPivot.add(plankMesh);
scene.add(plankPivot);
const PLANK_ANGLE = 0.36;

// mooring ropes (ship cleat -> pier bollard)
const ropeGeo = new THREE.CylinderGeometry(0.035, 0.035, 1, 6);
const ropes = [
    { cleat: new THREE.Vector3(-0.7, 0.9, 1.8), post: bollards[0] },   // bow line
    { cleat: new THREE.Vector3(-0.85, 1.0, -1.8), post: bollards[1] }, // stern line
].map((r) => {
    r.mesh = new THREE.Mesh(ropeGeo, new THREE.MeshBasicMaterial({ color: 0xc8a46a, transparent: true }));
    scene.add(r.mesh);
    return r;
});
const _a = new THREE.Vector3(), _d = new THREE.Vector3(), _deck = new THREE.Vector3();
function stretchRope(mesh, a, b) {
    mesh.position.copy(a).add(b).multiplyScalar(0.5);
    mesh.scale.set(1, a.distanceTo(b), 1);
    mesh.quaternion.setFromUnitVectors(Y_AXIS, _d.copy(b).sub(a).normalize());
}

// ---------- The tiny explorer ----------
const MAN_SCALE = 0.6; // make him bigger or smaller here
const manGroup = new THREE.Group();
manGroup.visible = false;
scene.add(manGroup);

function mpart(geo, color, x, y, z, parent = manGroup) {
    const m = new THREE.Mesh(geo, new THREE.MeshPhongMaterial({ color, flatShading: true }));
    m.position.set(x, y, z);
    parent.add(m);
    return m;
}
const SKIN = 0xf1c27d;
function makeLimb(x, y, build) {
    const pv = new THREE.Group();
    pv.position.set(x, y, 0);
    build(pv);
    manGroup.add(pv);
    return pv;
}
const legL = makeLimb(-0.09, 0.46, (p) => {
    mpart(new THREE.BoxGeometry(0.16, 0.2, 0.16), 0x1f5fbf, 0, -0.1, 0, p);   // shorts
    mpart(new THREE.BoxGeometry(0.11, 0.2, 0.11), SKIN, 0, -0.3, 0, p);       // shin
    mpart(new THREE.BoxGeometry(0.13, 0.06, 0.2), 0x5a3a20, 0, -0.43, 0.03, p); // sandal
});
const legR = makeLimb(0.09, 0.46, (p) => {
    mpart(new THREE.BoxGeometry(0.16, 0.2, 0.16), 0x1f5fbf, 0, -0.1, 0, p);
    mpart(new THREE.BoxGeometry(0.11, 0.2, 0.11), SKIN, 0, -0.3, 0, p);
    mpart(new THREE.BoxGeometry(0.13, 0.06, 0.2), 0x5a3a20, 0, -0.43, 0.03, p);
});
const armL = makeLimb(-0.22, 0.82, (p) => mpart(new THREE.BoxGeometry(0.09, 0.34, 0.09), SKIN, 0, -0.16, 0, p));
const armR = makeLimb(0.22, 0.82, (p) => mpart(new THREE.BoxGeometry(0.09, 0.34, 0.09), SKIN, 0, -0.16, 0, p));
mpart(new THREE.BoxGeometry(0.34, 0.38, 0.2), 0xd62828, 0, 0.65, 0);       // red vest
mpart(new THREE.BoxGeometry(0.35, 0.06, 0.21), 0xf2c14e, 0, 0.49, 0);      // belt
mpart(new THREE.SphereGeometry(0.17, 16, 12), SKIN, 0, 1.0, 0);            // head
mpart(new THREE.SphereGeometry(0.025, 8, 8), 0x111111, -0.065, 1.02, 0.155); // eyes
mpart(new THREE.SphereGeometry(0.025, 8, 8), 0x111111, 0.065, 1.02, 0.155);
mpart(new THREE.CylinderGeometry(0.31, 0.31, 0.03, 20), 0xf2d36b, 0, 1.1, 0); // straw hat brim
mpart(new THREE.SphereGeometry(0.17, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), 0xf2d36b, 0, 1.105, 0);
mpart(new THREE.CylinderGeometry(0.176, 0.176, 0.05, 16), 0xd62828, 0, 1.13, 0); // hat band

let walkPhase = 0, manMoving = false, airArms = false;
function animateLimbs(dt) {
    if (airArms) {
        armL.rotation.x = armR.rotation.x = -2.6;
        legL.rotation.x = 0.4;
        legR.rotation.x = -0.4;
        return;
    }
    if (manMoving) walkPhase += dt * 11;
    const sw = manMoving ? Math.sin(walkPhase) * 0.8 : 0;
    const k = Math.min(1, 14 * dt);
    legL.rotation.x += (sw - legL.rotation.x) * k;
    legR.rotation.x += (-sw - legR.rotation.x) * k;
    armL.rotation.x += (-sw - armL.rotation.x) * k;
    armR.rotation.x += (sw - armR.rotation.x) * k;
}

// ---------- Islands (loaded from MongoDB via API) ----------
function makeLabel(text) {
    const c = document.createElement('canvas');
    c.width = 512; c.height = 128;
    const g = c.getContext('2d');
    g.fillStyle = 'rgba(0,0,0,0.55)';
    g.fillRect(0, 0, 512, 128);
    g.fillStyle = '#fff';
    g.font = 'bold 56px Segoe UI, sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(text, 256, 64);
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c) }));
    s.scale.set(16, 4, 1);
    return s;
}

// each island's scenery lives in its own file (frontend/js/islands/*.js)
const islandAnimators = [];
function buildIsland(d) {
    const t = buildThemedIsland(d, makeLabel);
    scene.add(t.group);
    d._solids = t.solids;
    if (t.update) islandAnimators.push(t.update);
}

// treasure chests (open when the explorer walks up to them)
const chests = [];
function buildChest(d, i) {
    // pick a free spot on the plateau (not inside a building, tree or platform)
    let th = i * 2.1 + 0.6, cx = d.x, cz = d.z;
    for (let k = 0; k < 24; k++) {
        const f = 0.5 + (k % 3) * 0.04;
        cx = d.x + Math.cos(th) * d.radius * f;
        cz = d.z + Math.sin(th) * d.radius * f;
        const blocked = (d._solids || []).some(
            (s) => Math.hypot(cx - d.x - s.x, cz - d.z - s.z) < s.r + 1.0
        );
        if (!blocked) break;
        th += 0.5;
    }
    d._chest = { x: cx, z: cz };

    const g = new THREE.Group();
    g.position.set(cx, 2.95, cz);
    g.rotation.y = Math.atan2(Math.cos(th), Math.sin(th));
    const cm = (w, h, dd, color, x, y, z, parent = g) => {
        const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, dd), hm(color));
        m.position.set(x, y, z);
        parent.add(m);
        return m;
    };
    cm(0.9, 0.5, 0.6, 0x8a5a30, 0, 0.25, 0);
    cm(0.94, 0.08, 0.64, 0xf2c14e, 0, 0.3, 0);
    const pivot = new THREE.Group();
    pivot.position.set(0, 0.5, -0.3);
    cm(0.9, 0.2, 0.6, 0xa06a38, 0, 0.1, 0.3, pivot);
    cm(0.12, 0.12, 0.05, 0xf2c14e, 0, -0.02, 0.62, pivot);
    g.add(pivot);
    const glow = new THREE.Mesh(
        new THREE.SphereGeometry(0.2, 12, 12),
        new THREE.MeshBasicMaterial({ color: 0xffd166 })
    );
    glow.position.set(0, 0.6, 0);
    glow.visible = false;
    g.add(glow);
    scene.add(g);
    chests.push({ pivot, glow, x: cx, z: cz, open: 0 });
}

let islands = [];
fetch('/api/islands')
    .then((r) => r.json())
    .then((data) => {
        if (!Array.isArray(data)) {
            toast('Islands error: ' + (data && data.error ? data.error : 'bad response'));
            return;
        }
        islands = data;
        islands.forEach((d, i) => { buildIsland(d); buildChest(d, i); });
    })
    .catch((err) => {
        console.error(err);
        toast('Could not load islands. Is the server running?');
    });

// ---------- Walkable ground (for the explorer) ----------
const SOLIDS = [
    { x: -6, z: -33, r: 0.6 }, { x: 5, z: -35, r: 0.6 }, { x: -2, z: -38, r: 0.6 }, // palms
    { x: -1.4, z: 1.6, r: 0.2 },                                                     // lantern
    { x: 1.45, z: BERTH.z + 2.6, r: 0.3 }, { x: 1.45, z: BERTH.z - 2.6, r: 0.3 },   // bollards
];

function islandSurface(d, r) {
    if (d < 0.62 * r) return 2.95;
    if (d < 0.702 * r) return 2.95 - ((d - 0.62 * r) / (0.082 * r)) * 0.95;
    if (d < 0.9 * r) return 2.0;
    return 2.0 - ((d - 0.9 * r) / (0.04 * r)) * 0.5;
}

// returns the ground height at (x, z), or null if it is water / blocked
function groundHeight(x, z) {
    let best = null;
    const take = (h) => { if (best === null || h > best) best = h; };

    for (const d of islands) {
        const dist = Math.hypot(x - d.x, z - d.z);
        if (dist < d.radius * 0.94) {
            if (d._chest && Math.hypot(x - d._chest.x, z - d._chest.z) < 0.75) return null;
            let lift = 0;
            for (const s of d._solids || []) {
                if (Math.hypot(x - d.x - s.x, z - d.z - s.z) < s.r) {
                    if (s.h) lift = Math.max(lift, s.h); // walkable platform (academy steps)
                    else return null;                      // solid object (trees, houses...)
                }
            }
            take(islandSurface(dist, d.radius) + lift);
        }
    }
    const hd = Math.hypot(x - HARBOR.x, z - HARBOR.z);
    if (hd < 14.2) take(hd < 11 ? 2.4 : hd < 11.5 ? 2.4 - ((hd - 11) / 0.5) * 0.4 : 2.0);

    if (x > PIER.x0 && x < PIER.x1) {
        if (z >= PIER.z0 && z <= PIER.z1) take(PIER.top);
        else if (z >= PIER.z0 - 1 && z < PIER.z0) take(1.67);
        else if (z >= PIER.z0 - 2 && z < PIER.z0 - 1) take(1.84);
    }
    // Stand on top of crates if high enough
    for (const prop of dynamicProps) {
        if (Math.hypot(x - prop.x, z - prop.z) < prop.radius) {
            const topY = prop.y + prop.h / 2;
            if (manY >= topY - 0.25) take(topY);
        }
    }

    if (best === null) return null;
    for (const s of SOLIDS) if (Math.hypot(x - s.x, z - s.z) < s.r) return null;
    if (x > -8.2 && x < -3.8 && z > -25.7 && z < -22.3) return null; // harbor house
    return best;
}

// ---------- Info panel ----------
const panel = document.getElementById('panel');
let currentId = null;

function showPanel(d) {
    if (currentId === d._id) return;
    currentId = d._id;
    panel.innerHTML = '';
    panel.style.display = 'block';

    const h = document.createElement('h2');
    h.textContent = d.title;
    panel.appendChild(h);

    (d.lines || []).forEach((t) => {
        const p = document.createElement('p');
        p.textContent = t;
        panel.appendChild(p);
    });

    (d.links || []).forEach((l) => {
        const a = document.createElement('a');
        a.href = l.url; a.target = '_blank'; a.textContent = l.label;
        panel.appendChild(a);
    });

    if (d.type === 'contact') {
        const form = document.createElement('div');
        form.innerHTML = `
      <input id="cName" placeholder="Your name">
      <input id="cEmail" placeholder="Your email">
      <textarea id="cMsg" rows="3" placeholder="Message"></textarea>
      <button id="cSend">Send</button>
      <div id="status"></div>`;
        panel.appendChild(form);
        form.querySelector('#cSend').onclick = async () => {
            const status = form.querySelector('#status');
            const body = {
                name: form.querySelector('#cName').value.trim(),
                email: form.querySelector('#cEmail').value.trim(),
                message: form.querySelector('#cMsg').value.trim(),
            };
            try {
                const res = await fetch('/api/contact', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body),
                });
                const out = await res.json();
                status.textContent = res.ok ? 'Message sent!' : out.error;
            } catch {
                status.textContent = 'Network error';
            }
        };
    }
}

function hidePanel() {
    currentId = null;
    panel.style.display = 'none';
}

// ---------- Game state ----------
let state = 'docked';        // ship: docked | sailing | docking
let mode = 'ship';           // who you control: ship | popping | onfoot | boarding
let speed = 0;
let heading = BERTH.heading;
let departTimer = 0;
let moor = 1, moorTarget = 1;
let camGoal = null;

let manT = 0, manY = 0, manVy = 0, manGrounded = true;
let landing = null;
const jumpFrom = new THREE.Vector3();

const DEFAULT_ORBIT = { yaw: 0, pitch: 0.38, dist: 14 };
const DOCK_VIEW = { yaw: -2.2, pitch: 0.32, dist: 16 };
const orbit = { ...DOCK_VIEW };

boat.position.set(BERTH.x, 0.4, BERTH.z);

const canDock = () =>
    boat.position.x > 2 && Math.hypot(boat.position.x - BERTH.x, boat.position.z - BERTH.z) < 9;

const canDisembark = () =>
    mode === 'ship' &&
    (state === 'docked' || (state === 'sailing' && departTimer <= 0 && Math.abs(speed) < 4));

// nearest place the explorer can jump to from the ship
function findLanding() {
    const bx = boat.position.x, bz = boat.position.z;
    let best = null, bestD = 9;
    const consider = (x, z) => {
        const h = groundHeight(x, z);
        if (h === null) return;
        const d = Math.hypot(x - bx, z - bz);
        if (d < bestD) { bestD = d; best = { x, z, h }; }
    };
    for (const d of islands) {
        const dx = bx - d.x, dz = bz - d.z, dist = Math.hypot(dx, dz) || 1;
        consider(d.x + (dx / dist) * d.radius * 0.85, d.z + (dz / dist) * d.radius * 0.85);
    }
    const hx = bx - HARBOR.x, hz = bz - HARBOR.z, hdist = Math.hypot(hx, hz) || 1;
    consider(HARBOR.x + (hx / hdist) * 13.2, HARBOR.z + (hz / hdist) * 13.2);
    consider(0.9, THREE.MathUtils.clamp(bz, PIER.z0 + 1, PIER.z1 - 0.6));
    return best;
}

const nearBoat = () =>
    Math.hypot(manGroup.position.x - boat.position.x, manGroup.position.z - boat.position.z) < 8;

function startPop() {
    const l = findLanding();
    if (!canDisembark() || !l) return;
    landing = l;
    mode = 'popping';
    manT = 0;
    speed = 0;
    manGroup.visible = true;
    manGroup.scale.setScalar(0.001);
    orbit.yaw = orbit.yaw + heading; // keep the same view angle, now absolute
    camGoal = { yaw: orbit.yaw, pitch: 0.42, dist: 6 };
}

function startBoard() {
    if (mode !== 'onfoot' || !nearBoat()) return;
    mode = 'boarding';
    manT = 0;
    jumpFrom.copy(manGroup.position);
}

function jump() {
    if (manGrounded) { manVy = 5; manGrounded = false; }
}

function handleSpace() {
    if (mode === 'onfoot') { jump(); return; }
    if (mode !== 'ship') return;
    if (state === 'docked') {
        state = 'sailing';
        moorTarget = 0;
        departTimer = 2.0;
        speed = 2;
        camGoal = { ...DEFAULT_ORBIT };
    } else if (state === 'sailing' && departTimer <= 0 && canDock()) {
        state = 'docking';
        moorTarget = 0;
        speed = 0;
        camGoal = { ...DOCK_VIEW };
    }
}

function handleE() {
    if (mode === 'ship') startPop();
    else if (mode === 'onfoot') startBoard();
}

// on-screen prompts (also clickable for touch screens)
const promptBox = document.createElement('div');
promptBox.style.cssText =
    'position:fixed;left:50%;bottom:28px;transform:translateX(-50%);z-index:8;display:flex;gap:10px;';
document.body.appendChild(promptBox);
function makeChip(onClick) {
    const c = document.createElement('div');
    c.style.cssText =
        'display:none;background:#0b1d33dd;color:#fff;padding:10px 20px;border-radius:999px;' +
        'cursor:pointer;font:600 16px Segoe UI,sans-serif;border:2px solid #ffd166;user-select:none;';
    c.onclick = onClick;
    promptBox.appendChild(c);
    return c;
}
const spaceChip = makeChip(() => handleSpace());
const eChip = makeChip(() => handleE());
function setChip(chip, msg) {
    if (chip._m === msg) return;
    chip._m = msg;
    chip.textContent = msg;
    chip.style.display = msg ? 'block' : 'none';
}

// ---------- Nitro & Boost System ----------
let lastForwardTap = 0;
let nitroActive = false;
let nitroFuel = 1.0;          // 0.0 to 1.0 (100% capacity)
const NITRO_DURATION = 4.2;   // seconds of continuous boost
const NITRO_RECHARGE = 3.2;   // seconds to fully recharge
let nitroBurstTimer = 0;
let currentPitch = 0, currentBank = 0;

// Nitro exhaust flames & water wake particles
const nitroParticles = [];
const wakeGeo = new THREE.SphereGeometry(0.18, 8, 8);
const flameGeo = new THREE.SphereGeometry(0.14, 6, 6);
const wakeMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85 });
const flameMat = new THREE.MeshBasicMaterial({ color: 0xff8c00, transparent: true, opacity: 0.95 });
const cyanMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.95 });

function updateNitroEffects(dt, boosting) {
    if (boosting && mode === 'ship') {
        const count = 3;
        for (let i = 0; i < count; i++) {
            const lx = (Math.random() - 0.5) * 1.6;
            const ly = 0.2 + Math.random() * 0.35;
            const lz = -5.0 - Math.random() * 0.8;
            const worldPos = boat.localToWorld(new THREE.Vector3(lx, ly, lz));

            const isFlame = Math.random() < 0.65;
            const isCyan = Math.random() < 0.35;
            const pMesh = new THREE.Mesh(
                isFlame ? flameGeo : wakeGeo,
                isFlame ? (isCyan ? cyanMat.clone() : flameMat.clone()) : wakeMat.clone()
            );
            pMesh.position.copy(worldPos);
            scene.add(pMesh);

            const kickSpeed = -speed * 0.5 - Math.random() * 5;
            const vx = Math.sin(heading) * kickSpeed + (Math.random() - 0.5) * 2;
            const vz = Math.cos(heading) * kickSpeed + (Math.random() - 0.5) * 2;
            const vy = 0.4 + Math.random() * 1.5;

            nitroParticles.push({
                mesh: pMesh,
                vx, vy, vz,
                life: 0.5 + Math.random() * 0.3,
                maxLife: 0.5 + Math.random() * 0.3,
                scaleGrow: !isFlame,
            });
        }
    }

    for (let i = nitroParticles.length - 1; i >= 0; i--) {
        const p = nitroParticles[i];
        p.life -= dt;
        if (p.life <= 0) {
            scene.remove(p.mesh);
            p.mesh.material.dispose();
            nitroParticles.splice(i, 1);
            continue;
        }
        p.vy -= 4.0 * dt;
        p.mesh.position.x += p.vx * dt;
        p.mesh.position.y += p.vy * dt;
        p.mesh.position.z += p.vz * dt;

        const prog = p.life / p.maxLife;
        p.mesh.material.opacity = prog * 0.9;
        if (p.scaleGrow) {
            p.mesh.scale.setScalar((2.0 - prog) * 1.2);
        } else {
            p.mesh.scale.setScalar(prog * 1.4);
        }
    }
}

// Nitro On-Screen HUD Gauge
const nitroHUD = document.createElement('div');
nitroHUD.id = 'nitroHUD';
nitroHUD.style.cssText =
    'position:fixed;right:22px;bottom:26px;z-index:9;display:none;flex-direction:column;align-items:flex-end;gap:5px;' +
    'background:#0b1d33e0;padding:10px 16px;border-radius:14px;border:2px solid #ffd166;box-shadow:0 4px 20px rgba(0,0,0,0.5);' +
    'font-family:Segoe UI,sans-serif;color:#fff;user-select:none;pointer-events:none;transition:transform 0.15s ease,border-color 0.2s,box-shadow 0.2s;';

const nitroLabel = document.createElement('div');
nitroLabel.style.cssText = 'font:bold 13px Segoe UI,sans-serif;display:flex;align-items:center;gap:6px;letter-spacing:0.5px;';
nitroLabel.innerHTML = '⚡ <span>NITRO</span> <span style="color:#ffd166;font-size:11px;">[Double-tap ↑/W]</span>';

const nitroTrack = document.createElement('div');
nitroTrack.style.cssText = 'width:150px;height:9px;background:#142940;border-radius:999px;overflow:hidden;border:1px solid #4a6a8a;';

const nitroBar = document.createElement('div');
nitroBar.style.cssText =
    'width:100%;height:100%;background:linear-gradient(90deg,#ff6b35,#f7c844,#00f0ff);border-radius:999px;' +
    'box-shadow:0 0 10px #ff6b35;transition:width 0.05s linear;';

nitroTrack.appendChild(nitroBar);
nitroHUD.appendChild(nitroLabel);
nitroHUD.appendChild(nitroTrack);
document.body.appendChild(nitroHUD);

// ---------- Keyboard controls ----------
const keys = {};
const GAME_CODES = ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];

addEventListener('keydown', (e) => {
    const tag = e.target && e.target.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    if (e.code === 'Space') {
        e.preventDefault();
        if (!e.repeat) handleSpace();
        return;
    }
    if (e.code === 'KeyE') {
        if (!e.repeat) handleE();
        return;
    }
    if (e.code === 'KeyR' && mode === 'onfoot') {
        resetProps();
        toast('Harbor blocks & crates reset!');
        return;
    }
    if (GAME_CODES.includes(e.code)) {
        e.preventDefault();
        keys[e.code] = true;
    }
    // Double-tap forward (ArrowUp or KeyW) for NITRO BOOST!
    if ((e.code === 'ArrowUp' || e.code === 'KeyW') && !e.repeat) {
        const now = performance.now();
        if (mode === 'ship' && state === 'sailing') {
            if (now - lastForwardTap < 330 && nitroFuel > 0.12) {
                nitroActive = true;
                nitroBurstTimer = 1.4;
                speed = Math.max(speed, 18) + 6;
            }
        }
        lastForwardTap = now;
    }
});
addEventListener('keyup', (e) => {
    const tag = e.target && e.target.tagName;
    if (e.code === 'Space' && tag !== 'INPUT' && tag !== 'TEXTAREA') e.preventDefault();
    keys[e.code] = false;
    if (e.code === 'ArrowUp' || e.code === 'KeyW') {
        if (nitroBurstTimer <= 0) {
            nitroActive = false;
        }
    }
});
addEventListener('blur', () => {
    for (const k in keys) keys[k] = false;
    nitroActive = false;
    nitroBurstTimer = 0;
});

const forward = () => keys.KeyW || keys.ArrowUp;
const backward = () => keys.KeyS || keys.ArrowDown;
const left = () => keys.KeyA || keys.ArrowLeft;
const right = () => keys.KeyD || keys.ArrowRight;

// ---------- Orbit camera (drag = spin 360, wheel/pinch = zoom, double-click = reset) ----------
const canvas = renderer.domElement;
const pointers = new Map();
let pinchDist = 0;
const minDist = () => (mode === 'ship' ? 6 : 2.5);

canvas.addEventListener('pointerdown', (e) => {
    window.focus();
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    camGoal = null;
    canvas.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        pinchDist = Math.hypot(a.x - b.x, a.y - b.y);
    }
});

canvas.addEventListener('pointermove', (e) => {
    const p = pointers.get(e.pointerId);
    if (!p) return;
    const dx = e.clientX - p.x;
    const dy = e.clientY - p.y;
    p.x = e.clientX;
    p.y = e.clientY;

    if (pointers.size === 1) {
        orbit.yaw -= dx * 0.008;
        orbit.pitch = THREE.MathUtils.clamp(orbit.pitch + dy * 0.006, 0.05, 1.45);
    } else if (pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        orbit.dist = THREE.MathUtils.clamp(orbit.dist - (d - pinchDist) * 0.04, minDist(), 45);
        pinchDist = d;
    }
});

const endPointer = (e) => pointers.delete(e.pointerId);
canvas.addEventListener('pointerup', endPointer);
canvas.addEventListener('pointercancel', endPointer);

canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    camGoal = null;
    orbit.dist = THREE.MathUtils.clamp(orbit.dist + e.deltaY * 0.02, minDist(), 45);
}, { passive: false });

canvas.addEventListener('dblclick', () => {
    camGoal = null;
    if (mode === 'ship') Object.assign(orbit, state === 'sailing' ? DEFAULT_ORBIT : DOCK_VIEW);
    else Object.assign(orbit, { yaw: manGroup.rotation.y, pitch: 0.42, dist: 6 });
});

// ---------- Ship collisions ----------
const BOAT_RADIUS = 2.4;
function resolveCollisions() {
    const p = boat.position;
    const pushOut = (cx, cz, r) => {
        const dx = p.x - cx, dz = p.z - cz;
        const dist = Math.hypot(dx, dz) || 0.001;
        if (dist < r) {
            p.x = cx + (dx / dist) * r;
            p.z = cz + (dz / dist) * r;
            speed *= 0.3;
        }
    };
    for (const d of islands) pushOut(d.x, d.z, d.radius + BOAT_RADIUS);
    pushOut(HARBOR.x, HARBOR.z, HARBOR.r + BOAT_RADIUS);

    const m = 1.3; // pier
    if (p.x > PIER.x0 - m && p.x < PIER.x1 + m && p.z < PIER.z1 + m && p.z > PIER.z0 - m) {
        const dl = p.x - (PIER.x0 - m), dr = PIER.x1 + m - p.x, df = PIER.z1 + m - p.z;
        const mn = Math.min(dl, dr, df);
        if (mn === dl) p.x = PIER.x0 - m;
        else if (mn === dr) p.x = PIER.x1 + m;
        else p.z = PIER.z1 + m;
        speed *= 0.3;
    }

    for (const prop of dynamicProps) {
        if (prop.floating) {
            const dx = prop.x - p.x, dz = prop.z - p.z;
            const dist = Math.hypot(dx, dz) || 0.001;
            const r = BOAT_RADIUS + prop.radius;
            if (dist < r) {
                const push = r - dist;
                prop.x += (dx / dist) * push;
                prop.z += (dz / dist) * push;
                const sp = Math.max(2.5, Math.abs(speed) + 2);
                prop.vx += (dx / dist) * sp;
                prop.vz += (dz / dist) * sp;
            }
        }
    }
}

// ---------- Explorer updates ----------
const deckPoint = () => boat.localToWorld(_deck.set(0, 0.8, -0.2));

function updatePop(dt) {
    manT += dt;
    const deck = deckPoint();
    if (manT < 0.4) {
        manGroup.position.copy(deck);
        manGroup.scale.setScalar(Math.max(0.001, MAN_SCALE * easeOutBack(manT / 0.4)));
        jumpFrom.copy(deck);
        airArms = false;
    } else {
        const s = Math.min((manT - 0.4) / 0.85, 1);
        manGroup.scale.setScalar(MAN_SCALE);
        manGroup.position.set(
            jumpFrom.x + (landing.x - jumpFrom.x) * s,
            jumpFrom.y + (landing.h - jumpFrom.y) * s + Math.sin(Math.PI * s) * 1.6,
            jumpFrom.z + (landing.z - jumpFrom.z) * s
        );
        airArms = true;
        if (s >= 1) {
            mode = 'onfoot';
            manY = landing.h;
            manVy = 0;
            manGrounded = true;
            manGroup.position.y = manY;
            airArms = false;
        }
    }
    manGroup.rotation.y = Math.atan2(landing.x - manGroup.position.x, landing.z - manGroup.position.z);
    manMoving = false;
}

function updateBoard(dt) {
    manT += dt;
    const deck = deckPoint();
    if (manT < 0.85) {
        const s = manT / 0.85;
        manGroup.position.set(
            jumpFrom.x + (deck.x - jumpFrom.x) * s,
            jumpFrom.y + (deck.y - jumpFrom.y) * s + Math.sin(Math.PI * s) * 1.6,
            jumpFrom.z + (deck.z - jumpFrom.z) * s
        );
        airArms = true;
        manGroup.rotation.y = Math.atan2(deck.x - manGroup.position.x, deck.z - manGroup.position.z);
    } else {
        const k = Math.min((manT - 0.85) / 0.35, 1);
        manGroup.position.copy(deck);
        manGroup.scale.setScalar(Math.max(0.001, MAN_SCALE * (1 - k * k)));
        airArms = false;
        if (k >= 1) {
            mode = 'ship';
            manGroup.visible = false;
            orbit.yaw = wrapPI(orbit.yaw - heading);
            camGoal = state === 'docked' ? { ...DOCK_VIEW } : { ...DEFAULT_ORBIT };
        }
    }
    manMoving = false;
}

function handlePlayerPropCollision(dt, mx, mz, isMoving) {
    const p = manGroup.position;
    const PLAYER_R = 0.28;

    for (const prop of dynamicProps) {
        const topY = prop.y + prop.h / 2;
        const botY = prop.y - prop.h / 2;

        // If standing on top of crate, don't push side
        if (manY >= topY - 0.2) continue;
        // If completely above or below crate vertically
        if (manY + 0.85 < botY || manY > topY + 0.2) continue;

        const dx = prop.x - p.x;
        const dz = prop.z - p.z;
        const dist = Math.hypot(dx, dz);
        const minDist = PLAYER_R + prop.radius;

        if (dist < minDist && dist > 0.0001) {
            const pen = minDist - dist;
            const nx = dx / dist;
            const nz = dz / dist;

            // If top box hit directly
            if (prop.restingOn) {
                prop.restingOn = null;
                prop.vx += (nx * 3.8 + (Math.random() - 0.5) * 1.5) / prop.mass;
                prop.vz += (nz * 3.8 + (Math.random() - 0.5) * 1.5) / prop.mass;
                prop.vy = 2.2;
                prop.vRotX = (Math.random() - 0.5) * 6;
                prop.vRotZ = (Math.random() - 0.5) * 6;
                prop.vRotY = (Math.random() - 0.5) * 5;
                spawnParticles(prop.x, prop.y, prop.z, 6, false);
            }

            // If bottom box hit, knock off the top box!
            for (const other of dynamicProps) {
                if (other.restingOn === prop) {
                    other.restingOn = null;
                    other.vx = prop.vx * 0.7 + (nx + (Math.random() - 0.5) * 0.8) * 2.5;
                    other.vz = prop.vz * 0.7 + (nz + (Math.random() - 0.5) * 0.8) * 2.5;
                    other.vy = 2.4;
                    other.vRotX = (Math.random() - 0.5) * 7;
                    other.vRotZ = (Math.random() - 0.5) * 7;
                    other.vRotY = (Math.random() - 0.5) * 5;
                    spawnParticles(other.x, other.y, other.z, 6, false);
                }
            }

            // Scramble chain-reaction when crashing into the 3D harbor letter blocks!
            if (prop.isHarborBlock) {
                prop.restingOn = null;
                const hitPower = isMoving ? 6.2 : 3.5;
                prop.vx += (nx * hitPower + (Math.random() - 0.5) * 2.5) / prop.mass;
                prop.vz += (nz * hitPower + (Math.random() - 0.5) * 2.5) / prop.mass;
                prop.vy = 2.4 + Math.random() * 1.6;
                prop.vRotX = (Math.random() - 0.5) * 8;
                prop.vRotZ = (Math.random() - 0.5) * 8;
                prop.vRotY = (Math.random() - 0.5) * 6;
                spawnParticles(prop.x, prop.y, prop.z, 8, false);

                // Shockwave blast that scatters neighboring blocks in the sign
                for (const other of dynamicProps) {
                    if (other.isHarborBlock && other !== prop) {
                        const distToHit = Math.hypot(other.x - prop.x, other.z - prop.z);
                        if (distToHit < 2.4) {
                            other.restingOn = null;
                            const spreadX = (other.x - prop.x) || (Math.random() - 0.5);
                            const spreadZ = (other.z - prop.z) || (Math.random() - 0.5);
                            const slen = Math.hypot(spreadX, spreadZ) || 1;
                            const blast = Math.max(0, 2.4 - distToHit) * 2.5 + 1.2;
                            other.vx += (spreadX / slen) * blast + nx * 2.2;
                            other.vz += (spreadZ / slen) * blast + nz * 2.2;
                            other.vy += 1.5 + blast * 0.5 + Math.random() * 1.0;
                            other.vRotX = (Math.random() - 0.5) * 7;
                            other.vRotZ = (Math.random() - 0.5) * 7;
                            other.vRotY = (Math.random() - 0.5) * 5;
                            spawnParticles(other.x, other.y, other.z, 3, false);
                        }
                    }
                }
            }

            // Separate player and prop
            const pushRatio = 0.82;
            prop.x += nx * pen * pushRatio;
            prop.z += nz * pen * pushRatio;
            p.x -= nx * pen * (1 - pushRatio);
            p.z -= nz * pen * (1 - pushRatio);

            // Crash impulse
            const hitSpeed = isMoving ? 4.5 : 2.0;
            const impulse = hitSpeed / prop.mass;
            prop.vx += nx * impulse;
            prop.vz += nz * impulse;

            const spd = Math.hypot(prop.vx, prop.vz);
            if (spd > 5.5) {
                prop.vx = (prop.vx / spd) * 5.5;
                prop.vz = (prop.vz / spd) * 5.5;
            }

            // Angular wobble
            prop.vRotY += (Math.random() - 0.5) * 3.0;
            prop.vRotX += nz * 2.2;
            prop.vRotZ += -nx * 2.2;

            if (isMoving && spd > 1.2 && Math.random() < 0.4) {
                spawnParticles(prop.x, prop.y - prop.h * 0.35, prop.z, 3, false);
            }
        }
    }
}

function updateDynamicProps(dt, t) {
    // 1. Follow parent if restingOn
    for (const prop of dynamicProps) {
        if (prop.restingOn) {
            const base = prop.restingOn;
            const distFromBase = Math.hypot(prop.x - base.x, prop.z - base.z);
            const baseSpd = Math.hypot(base.vx, base.vz);
            if (distFromBase > 0.3 || baseSpd > 1.2) {
                prop.restingOn = null;
                prop.vx = base.vx + (Math.random() - 0.5) * 1.0;
                prop.vz = base.vz + (Math.random() - 0.5) * 1.0;
                prop.vy = 1.5;
                prop.vRotX = (Math.random() - 0.5) * 5;
                prop.vRotZ = (Math.random() - 0.5) * 5;
            } else {
                prop.x = base.x;
                prop.z = base.z;
                prop.y = base.y + base.h / 2 + prop.h / 2;
                prop.rotY = base.rotY;
                prop.rotX = base.rotX;
                prop.rotZ = base.rotZ;
                prop.mesh.position.set(prop.x, prop.y, prop.z);
                prop.mesh.rotation.set(prop.rotX, prop.rotY, prop.rotZ);
            }
        }
    }

    // 2. Velocity integration & Surface physics
    for (const prop of dynamicProps) {
        if (prop.restingOn) continue;

        prop.x += prop.vx * dt;
        prop.z += prop.vz * dt;

        const surf = getPropSurface(prop.x, prop.z, t);

        if (surf.isWater) {
            const targetY = surf.height + prop.h * 0.25;
            if (prop.y > targetY + 0.1) {
                // Falling into water
                prop.vy -= 18 * dt;
                prop.y += prop.vy * dt;
                prop.rotX += prop.vRotX * dt;
                prop.rotZ += prop.vRotZ * dt;
                prop.rotY += prop.vRotY * dt;
                if (prop.y <= targetY) {
                    if (!prop.floating) {
                        prop.floating = true;
                        spawnParticles(prop.x, surf.height, prop.z, 10, true);
                    }
                }
            } else {
                // Floating in water
                if (!prop.floating) {
                    prop.floating = true;
                    spawnParticles(prop.x, surf.height, prop.z, 8, true);
                }
                const diff = targetY - prop.y;
                prop.vy += diff * 22 * dt;
                prop.vy *= Math.exp(-3.5 * dt);
                prop.y += prop.vy * dt;

                prop.vx *= Math.exp(-2.5 * dt);
                prop.vz *= Math.exp(-2.5 * dt);
                prop.vRotY *= Math.exp(-2 * dt);
                prop.rotY += prop.vRotY * dt;

                prop.rotX += (Math.sin(t * 2.5 + prop.x * 2) * 0.15 - prop.rotX) * Math.min(1, 5 * dt);
                prop.rotZ += (Math.cos(t * 2.2 + prop.z * 2) * 0.15 - prop.rotZ) * Math.min(1, 5 * dt);
            }
        } else {
            // On solid ground (pier deck or shore)
            prop.floating = false;
            const targetGroundY = surf.height + prop.h / 2;

            if (prop.y > targetGroundY + 0.02) {
                // Falling in air
                prop.vy -= 18 * dt;
                prop.y += prop.vy * dt;
                prop.grounded = false;

                prop.rotX += prop.vRotX * dt;
                prop.rotY += prop.vRotY * dt;
                prop.rotZ += prop.vRotZ * dt;

                if (prop.y <= targetGroundY) {
                    prop.y = targetGroundY;
                    if (prop.vy < -2.0) {
                        prop.vy = -prop.vy * 0.25;
                        spawnParticles(prop.x, targetGroundY - prop.h * 0.4, prop.z, 4, false);
                    } else {
                        prop.vy = 0;
                        prop.grounded = true;
                    }
                }
            } else {
                // Resting on ground
                prop.y = targetGroundY;
                prop.vy = 0;
                prop.grounded = true;

                prop.vx *= Math.exp(-4.8 * dt);
                prop.vz *= Math.exp(-4.8 * dt);
                if (Math.hypot(prop.vx, prop.vz) < 0.02) {
                    prop.vx = 0;
                    prop.vz = 0;
                }

                prop.vRotY *= Math.exp(-5 * dt);
                prop.rotY += prop.vRotY * dt;
                prop.vRotX *= Math.exp(-8 * dt);
                prop.vRotZ *= Math.exp(-8 * dt);
                prop.rotX += (0 - prop.rotX) * Math.min(1, 10 * dt);
                prop.rotZ += (0 - prop.rotZ) * Math.min(1, 10 * dt);
            }
        }

        if (prop.y < -8 || Math.hypot(prop.x, prop.z) > 120) {
            resetProps();
        }
    }

    // 3. Prop vs Prop collision
    for (let i = 0; i < dynamicProps.length; i++) {
        for (let j = i + 1; j < dynamicProps.length; j++) {
            const a = dynamicProps[i], b = dynamicProps[j];
            if (a.restingOn === b || b.restingOn === a) continue;

            const aBot = a.y - a.h / 2, aTop = a.y + a.h / 2;
            const bBot = b.y - b.h / 2, bTop = b.y + b.h / 2;
            if (aBot > bTop || aTop < bBot) continue;

            const dx = b.x - a.x, dz = b.z - a.z;
            const dist = Math.hypot(dx, dz);
            const minDist = a.radius + b.radius;
            if (dist < minDist && dist > 0.0001) {
                const pen = minDist - dist;
                const nx = dx / dist, nz = dz / dist;
                const totalMass = a.mass + b.mass;
                const aShare = b.mass / totalMass;
                const bShare = a.mass / totalMass;

                a.x -= nx * pen * aShare;
                a.z -= nz * pen * aShare;
                b.x += nx * pen * bShare;
                b.z += nz * pen * bShare;

                const relV = (a.vx - b.vx) * nx + (a.vz - b.vz) * nz;
                if (relV > 0) {
                    const imp = relV * 0.7;
                    a.vx -= imp * nx * aShare;
                    a.vz -= imp * nz * aShare;
                    b.vx += imp * nx * bShare;
                    b.vz += imp * nz * bShare;
                    a.vRotY += (Math.random() - 0.5) * 1.5;
                    b.vRotY += (Math.random() - 0.5) * 1.5;
                }
            }
        }
    }

    // 4. Prop vs Static Obstacles
    for (const prop of dynamicProps) {
        if (prop.restingOn) continue;
        for (const s of SOLIDS) {
            const dx = prop.x - s.x, dz = prop.z - s.z;
            const dist = Math.hypot(dx, dz);
            const minDist = prop.radius + s.r;
            if (dist < minDist && dist > 0.0001) {
                const pen = minDist - dist;
                const nx = dx / dist, nz = dz / dist;
                prop.x += nx * pen;
                prop.z += nz * pen;
                const dot = prop.vx * nx + prop.vz * nz;
                if (dot < 0) {
                    prop.vx -= 1.3 * dot * nx;
                    prop.vz -= 1.3 * dot * nz;
                }
            }
        }
        if (prop.x > -8.2 - prop.radius && prop.x < -3.8 + prop.radius &&
            prop.z > -25.7 - prop.radius && prop.z < -22.3 + prop.radius) {
            prop.z = -22.3 + prop.radius;
            prop.vz = Math.max(0, prop.vz);
        }
    }

    // 5. Update Meshes
    for (const prop of dynamicProps) {
        prop.mesh.position.set(prop.x, prop.y, prop.z);
        prop.mesh.rotation.set(prop.rotX, prop.rotY, prop.rotZ);
    }
}

function tryMove(dx, dz) {
    const p = manGroup.position;
    const nx = p.x + dx, nz = p.z + dz;
    const h = groundHeight(nx, nz);
    if (h === null || h > manY + 0.9) return;
    p.x = nx;
    p.z = nz;
}

function updateMan(dt) {
    const a = orbit.yaw; // camera direction (absolute while on foot)
    const f = (forward() ? 1 : 0) - (backward() ? 1 : 0);
    const s = (right() ? 1 : 0) - (left() ? 1 : 0);
    let mx = Math.sin(a) * f - Math.cos(a) * s;
    let mz = Math.cos(a) * f + Math.sin(a) * s;
    const len = Math.hypot(mx, mz);
    manMoving = len > 0.01;
    if (manMoving) {
        mx /= len; mz /= len;
        const sp = 4.2 * dt;
        tryMove(mx * sp, 0);
        tryMove(0, mz * sp);
        const face = Math.atan2(mx, mz);
        manGroup.rotation.y += wrapPI(face - manGroup.rotation.y) * Math.min(1, 12 * dt);
    }
    handlePlayerPropCollision(dt, mx, mz, manMoving);

    const p = manGroup.position;
    const gh = groundHeight(p.x, p.z);
    const groundY = gh === null ? manY : gh;
    if (manVy > 0 || manY > groundY + 0.02) {
        manVy -= 16 * dt;
        manY += manVy * dt;
        manGrounded = false;
        if (manY <= groundY) { manY = groundY; manVy = 0; manGrounded = true; }
    } else {
        manVy = 0;
        manGrounded = true;
        if (manY < groundY) manY = Math.min(groundY, manY + 7 * dt);
    }
    p.y = manY;
    airArms = !manGrounded;
}

// ---------- Game loop ----------
let camReady = false, errorShown = false;
const clock = new THREE.Clock();
const camTarget = new THREE.Vector3();

function animate() {
    requestAnimationFrame(animate);
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;

    try {
        // waves
        for (let i = 0; i < wPos.count; i++) {
            const x = wPos.getX(i), z = wPos.getZ(i);
            wPos.setY(i, Math.sin(x * 0.06 + t) * 0.5 + Math.cos(z * 0.05 + t * 0.8) * 0.5);
        }
        wPos.needsUpdate = true;
        wGeo.computeVertexNormals();

        // ---- boat movement by state ----
        if (state === 'docked') {
            speed = 0;
            boat.position.x = BERTH.x + Math.sin(t * 0.9) * 0.03;
            boat.position.z = BERTH.z + Math.sin(t * 0.7) * 0.05;
            heading = BERTH.heading + Math.sin(t * 0.6) * 0.01;
        } else if (state === 'docking') {
            const k = 1 - Math.exp(-2.2 * dt);
            boat.position.x += (BERTH.x - boat.position.x) * k;
            boat.position.z += (BERTH.z - boat.position.z) * k;
            heading += wrapPI(BERTH.heading - heading) * k;
            speed = 0;
            if (
                Math.hypot(boat.position.x - BERTH.x, boat.position.z - BERTH.z) < 0.06 &&
                Math.abs(wrapPI(BERTH.heading - heading)) < 0.02
            ) {
                boat.position.x = BERTH.x;
                boat.position.z = BERTH.z;
                heading = BERTH.heading;
                state = 'docked';
                moorTarget = 1;
                camGoal = { ...DOCK_VIEW };
            }
        } else if (mode !== 'ship') {
            speed = 0; // ship waits while the explorer is ashore
        } else {
            // Nitro drain & recharge
            const isFwd = forward();
            if (nitroBurstTimer > 0) {
                nitroBurstTimer -= dt;
                if (nitroBurstTimer <= 0 && !isFwd) nitroActive = false;
            }

            const isBoosting = nitroActive && (isFwd || nitroBurstTimer > 0) && nitroFuel > 0.01;
            if (isBoosting) {
                nitroFuel = Math.max(0, nitroFuel - dt / NITRO_DURATION);
                if (nitroFuel <= 0) {
                    nitroActive = false;
                    nitroBurstTimer = 0;
                }
            } else {
                nitroFuel = Math.min(1.0, nitroFuel + dt / NITRO_RECHARGE);
            }

            const maxSpeed = isBoosting ? 38 : 16;
            const accel = isBoosting ? 26 : 8;

            if (departTimer > 0) {
                departTimer -= dt;
                speed = Math.min(speed + 6 * dt, 7);
            } else if (isFwd || (isBoosting && speed > 5)) {
                speed = Math.min(speed + accel * dt, maxSpeed);
            } else if (backward()) {
                speed = Math.max(speed - 8 * dt, -5);
            } else {
                speed *= 1 - (isBoosting ? 0.3 : 0.6) * dt;
            }

            const turn = departTimer > 0 ? 0 : (left() ? 1 : 0) - (right() ? 1 : 0);
            heading += turn * (isBoosting ? 1.4 : 1.2) * dt * Math.min(1, Math.abs(speed) / 4);

            boat.position.x += Math.sin(heading) * speed * dt;
            boat.position.z += Math.cos(heading) * speed * dt;
            boat.position.x = THREE.MathUtils.clamp(boat.position.x, -480, 480);
            boat.position.z = THREE.MathUtils.clamp(boat.position.z, -480, 480);
            resolveCollisions();
        }

        const isBoosting = nitroActive && (forward() || nitroBurstTimer > 0) && nitroFuel > 0.01 && mode === 'ship' && state === 'sailing';
        updateNitroEffects(dt, isBoosting);

        // Dynamic pitch (bow lift out of sea) & bank (lean into turns at speed)
        const targetPitch = isBoosting ? -0.11 : 0;
        currentPitch += (targetPitch - currentPitch) * Math.min(1, 7 * dt);
        const turnInput = (left() ? 1 : 0) - (right() ? 1 : 0);
        const targetBank = (isBoosting ? 0.16 : 0.05) * turnInput;
        currentBank += (targetBank - currentBank) * Math.min(1, 6 * dt);

        boat.position.y = 0.4 + Math.sin(t * 2) * 0.12;
        boat.rotation.set(Math.sin(t * 1.2) * 0.02 + currentPitch, heading, Math.sin(t * 1.5) * 0.04 + currentBank);
        boat.updateMatrixWorld(true);
        flagPivot.rotation.y = Math.sin(t * 3) * 0.3;

        // ---- animated island scenery (lighthouse beam, crane, volcano, clock...) ----
        islandAnimators.forEach((fn) => fn(t));

        // ---- ropes + gangplank (fade in/out) ----
        const step = Math.min(Math.abs(moorTarget - moor), dt / 0.8);
        moor += Math.sign(moorTarget - moor) * step;
        ropes.forEach((r) => {
            r.mesh.visible = moor > 0.01;
            if (!r.mesh.visible) return;
            stretchRope(r.mesh, boat.localToWorld(_a.copy(r.cleat)), r.post);
            r.mesh.material.opacity = moor;
        });
        plankPivot.visible = moor > 0.01;
        plankPivot.rotation.z = -PLANK_ANGLE + (1 - moor) * 0.9;
        plankMat.opacity = moor;

        // ---- explorer ----
        if (mode === 'popping') updatePop(dt);
        else if (mode === 'onfoot') updateMan(dt);
        else if (mode === 'boarding') updateBoard(dt);
        if (mode !== 'ship') animateLimbs(dt);
        updateDynamicProps(dt, t);
        updateParticles(dt);

        // ---- treasure chests ----
        chests.forEach((c) => {
            const near = mode === 'onfoot' && Math.hypot(manGroup.position.x - c.x, manGroup.position.z - c.z) < 2.4;
            c.open += ((near ? 1 : 0) - c.open) * Math.min(1, 5 * dt);
            c.pivot.rotation.x = -1.25 * c.open;
            c.glow.visible = c.open > 0.3;
            c.glow.scale.setScalar(1 + Math.sin(t * 6) * 0.15);
        });

        // ---- island info panel ----
        const onFoot = mode !== 'ship';
        const fp = onFoot ? manGroup.position : boat.position;
        let nearIsland = null;
        for (const d of islands) {
            if (Math.hypot(fp.x - d.x, fp.z - d.z) < d.radius + (onFoot ? 3 : 20)) nearIsland = d;
        }
        nearIsland ? showPanel(nearIsland) : hidePanel();

        // ---- on-screen prompts ----
        let spaceMsg = '', eMsg = '';
        if (mode === 'ship') {
            if (state === 'docked') spaceMsg = 'SPACE · Set sail ⛵';
            else if (state === 'sailing' && departTimer <= 0 && canDock()) spaceMsg = 'SPACE · Dock ⚓';
            if (canDisembark() && findLanding()) eMsg = 'E · Go ashore 🧍';
        } else if (mode === 'onfoot') {
            spaceMsg = 'SPACE · Jump';
            if (nearBoat()) eMsg = 'E · Board ship ⚓';
        }
        setChip(spaceChip, spaceMsg);
        setChip(eChip, eMsg);

        // ---- Nitro HUD & Camera FOV kick ----
        const isBoostingNow = nitroActive && (forward() || nitroBurstTimer > 0) && nitroFuel > 0.01 && mode === 'ship' && state === 'sailing';
        if (mode === 'ship' && state === 'sailing') {
            nitroHUD.style.display = 'flex';
            if (isBoostingNow) {
                nitroLabel.innerHTML = '🔥 <span style="color:#ff6b35;font-weight:900;">NITRO BOOST!</span> <span style="color:#00f0ff;font-size:12px;">' + Math.round(speed) + ' KTS</span>';
                nitroHUD.style.transform = 'scale(1.05)';
                nitroHUD.style.borderColor = '#ff6b35';
                nitroHUD.style.boxShadow = '0 0 25px rgba(255,107,53,0.7)';
            } else {
                nitroLabel.innerHTML = '⚡ <span>NITRO</span> <span style="color:#ffd166;font-size:11px;">' + (nitroFuel > 0.15 ? '[Double-tap ↑/W]' : 'CHARGING...') + '</span>';
                nitroHUD.style.transform = 'scale(1)';
                nitroHUD.style.borderColor = '#ffd166';
                nitroHUD.style.boxShadow = '0 4px 20px rgba(0,0,0,0.5)';
            }
            nitroBar.style.width = Math.round(nitroFuel * 100) + '%';
        } else {
            nitroHUD.style.display = 'none';
        }

        // Camera FOV expansion during nitro for extreme sense of speed
        const targetFov = isBoostingNow ? 74 : 60;
        if (Math.abs(camera.fov - targetFov) > 0.1) {
            camera.fov += (targetFov - camera.fov) * Math.min(1, 5 * dt);
            camera.updateProjectionMatrix();
        }

        // ---- camera ----
        if (camGoal) {
            const k = 1 - Math.exp(-2.5 * dt);
            orbit.yaw += wrapPI(camGoal.yaw - orbit.yaw) * k;
            orbit.pitch += (camGoal.pitch - orbit.pitch) * k;
            orbit.dist += (camGoal.dist - orbit.dist) * k;
        }
        const manFocus = mode !== 'ship';
        const a = (manFocus ? 0 : heading) + orbit.yaw;
        const flat = Math.cos(orbit.pitch) * orbit.dist;
        const fx = manFocus ? manGroup.position.x : boat.position.x;
        const fz = manFocus ? manGroup.position.z : boat.position.z;
        const fy = manFocus ? manGroup.position.y + 0.5 : boat.position.y + 1.5;
        camTarget.set(
            fx - Math.sin(a) * flat,
            fy + Math.sin(orbit.pitch) * orbit.dist,
            fz - Math.cos(a) * flat
        );
        if (!camReady) { camera.position.copy(camTarget); camReady = true; }
        else camera.position.lerp(camTarget, 1 - Math.exp(-8 * dt));
        camera.lookAt(fx, manFocus ? fy : boat.position.y + 1.8, fz);
    } catch (err) {
        if (!errorShown) { console.error(err); toast('Error: ' + err.message); errorShown = true; }
    }

    renderer.render(scene, camera);
}
animate();

addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
});
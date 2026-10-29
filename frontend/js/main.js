import * as THREE from 'three';

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

// crates, barrel, lantern
hbox(0.8, 0.8, 0.8, 0xa8723c, -0.9, 1.9, -11.6);
hbox(0.6, 0.6, 0.6, 0xb8823c, -0.9, 2.6, -11.6);
hbox(0.7, 0.7, 0.7, 0xa8723c, 0.2, 1.85, -12.2);
hcyl(0.4, 0.4, 0.9, 0x7a4a28, 1.0, 1.95, -11.8, 12);
hcyl(0.07, 0.07, 2.2, 0x2b1e18, -1.4, 2.6, 1.6, 8);
const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 12), new THREE.MeshBasicMaterial({ color: 0xffe08a }));
lamp.position.set(-1.4, 3.8, 1.6);
harbor.add(lamp);

// harbor sign
hcyl(0.1, 0.1, 2.4, 0x5a3a20, 3.2, 3.2, -16, 8);
hbox(3.4, 1.1, 0.12, 0x4a2c14, 3.2, 4.0, -16.02);
const sign = new THREE.Mesh(
    new THREE.PlaneGeometry(3.2, 0.9),
    new THREE.MeshBasicMaterial({ map: signTexture() })
);
sign.position.set(3.2, 4.0, -15.95);
harbor.add(sign);

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
const _a = new THREE.Vector3(), _d = new THREE.Vector3();
function stretchRope(mesh, a, b) {
    mesh.position.copy(a).add(b).multiplyScalar(0.5);
    mesh.scale.set(1, a.distanceTo(b), 1);
    mesh.quaternion.setFromUnitVectors(Y_AXIS, _d.copy(b).sub(a).normalize());
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

function buildIsland(d) {
    const g = new THREE.Group();
    g.position.set(d.x, 0, d.z);
    const r = d.radius;
    const mesh = (geo, color, y) => {
        const m = new THREE.Mesh(geo, new THREE.MeshPhongMaterial({ color }));
        m.position.y = y;
        g.add(m);
    };
    mesh(new THREE.CylinderGeometry(r * 0.9, r, 3, 28), d.color, 0.5);
    mesh(new THREE.CylinderGeometry(r * 0.62, r * 0.75, 1.5, 28), 0x2ecc71, 2.2);
    mesh(new THREE.CylinderGeometry(0.3, 0.45, 6, 8), 0x8b5a2b, 5.5); // trunk
    mesh(new THREE.ConeGeometry(3, 2.5, 8), 0x27ae60, 9.2);          // leaves
    const label = makeLabel(d.name);
    label.position.y = 15;
    g.add(label);
    scene.add(g);
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
        islands.forEach(buildIsland);
    })
    .catch((err) => {
        console.error(err);
        toast('Could not load islands. Is the server running?');
    });

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
let state = 'docked';        // docked | sailing | docking
let speed = 0;
let heading = BERTH.heading;
let departTimer = 0;         // auto-throttle right after casting off
let moor = 1, moorTarget = 1; // 1 = tied up, 0 = released
let camGoal = null;

const DEFAULT_ORBIT = { yaw: 0, pitch: 0.38, dist: 14 };
const DOCK_VIEW = { yaw: -2.2, pitch: 0.32, dist: 16 };
const orbit = { ...DOCK_VIEW };

boat.position.set(BERTH.x, 0.4, BERTH.z);

const canDock = () =>
    boat.position.x > 2 && Math.hypot(boat.position.x - BERTH.x, boat.position.z - BERTH.z) < 9;

function handleSpace() {
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

// on-screen prompt (also clickable for touch screens)
const promptEl = document.createElement('div');
promptEl.style.cssText =
    'position:fixed;left:50%;bottom:28px;transform:translateX(-50%);z-index:8;display:none;' +
    'background:#0b1d33dd;color:#fff;padding:10px 22px;border-radius:999px;cursor:pointer;' +
    'font:600 16px Segoe UI,sans-serif;border:2px solid #ffd166;user-select:none;';
promptEl.onclick = handleSpace;
document.body.appendChild(promptEl);
let lastMsg = '';

// ---------- Keyboard controls (WASD + Arrows + SPACE) ----------
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
    if (GAME_CODES.includes(e.code)) {
        e.preventDefault();
        keys[e.code] = true;
    }
});
addEventListener('keyup', (e) => {
    const tag = e.target && e.target.tagName;
    if (e.code === 'Space' && tag !== 'INPUT' && tag !== 'TEXTAREA') e.preventDefault();
    keys[e.code] = false;
});
addEventListener('blur', () => { for (const k in keys) keys[k] = false; });

const forward = () => keys.KeyW || keys.ArrowUp;
const backward = () => keys.KeyS || keys.ArrowDown;
const left = () => keys.KeyA || keys.ArrowLeft;
const right = () => keys.KeyD || keys.ArrowRight;

// ---------- Orbit camera (drag = spin 360, wheel/pinch = zoom, double-click = reset) ----------
const canvas = renderer.domElement;
const pointers = new Map();
let pinchDist = 0;

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
        orbit.dist = THREE.MathUtils.clamp(orbit.dist - (d - pinchDist) * 0.04, 6, 45);
        pinchDist = d;
    }
});

const endPointer = (e) => pointers.delete(e.pointerId);
canvas.addEventListener('pointerup', endPointer);
canvas.addEventListener('pointercancel', endPointer);

canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    camGoal = null;
    orbit.dist = THREE.MathUtils.clamp(orbit.dist + e.deltaY * 0.02, 6, 45);
}, { passive: false });

canvas.addEventListener('dblclick', () => {
    camGoal = null;
    Object.assign(orbit, state === 'sailing' ? DEFAULT_ORBIT : DOCK_VIEW);
});

// ---------- Collisions ----------
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
        } else {
            if (departTimer > 0) {
                departTimer -= dt;
                speed = Math.min(speed + 6 * dt, 7);
            } else if (forward()) speed = Math.min(speed + 8 * dt, 16);
            else if (backward()) speed = Math.max(speed - 8 * dt, -5);
            else speed *= 1 - 0.6 * dt;

            const turn = departTimer > 0 ? 0 : (left() ? 1 : 0) - (right() ? 1 : 0);
            heading += turn * 1.2 * dt * Math.min(1, Math.abs(speed) / 4);

            boat.position.x += Math.sin(heading) * speed * dt;
            boat.position.z += Math.cos(heading) * speed * dt;
            boat.position.x = THREE.MathUtils.clamp(boat.position.x, -480, 480);
            boat.position.z = THREE.MathUtils.clamp(boat.position.z, -480, 480);
            resolveCollisions();
        }

        boat.position.y = 0.4 + Math.sin(t * 2) * 0.12;
        boat.rotation.set(Math.sin(t * 1.2) * 0.02, heading, Math.sin(t * 1.5) * 0.04);
        boat.updateMatrixWorld(true);
        flagPivot.rotation.y = Math.sin(t * 3) * 0.3;

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

        // ---- island info panel ----
        let near = null;
        for (const d of islands) {
            if (Math.hypot(boat.position.x - d.x, boat.position.z - d.z) < d.radius + 20) near = d;
        }
        near ? showPanel(near) : hidePanel();

        // ---- on-screen prompt ----
        let msg = '';
        if (state === 'docked') msg = 'Press SPACE to set sail ⛵';
        else if (state === 'sailing' && departTimer <= 0 && canDock()) msg = 'Press SPACE to dock ⚓';
        if (msg !== lastMsg) {
            promptEl.textContent = msg;
            promptEl.style.display = msg ? 'block' : 'none';
            lastMsg = msg;
        }

        // ---- camera ----
        if (camGoal) {
            const k = 1 - Math.exp(-2.5 * dt);
            orbit.yaw += wrapPI(camGoal.yaw - orbit.yaw) * k;
            orbit.pitch += (camGoal.pitch - orbit.pitch) * k;
            orbit.dist += (camGoal.dist - orbit.dist) * k;
        }
        const a = heading + orbit.yaw;
        const flat = Math.cos(orbit.pitch) * orbit.dist;
        camTarget.set(
            boat.position.x - Math.sin(a) * flat,
            boat.position.y + 1.5 + Math.sin(orbit.pitch) * orbit.dist,
            boat.position.z - Math.cos(a) * flat
        );
        if (!camReady) { camera.position.copy(camTarget); camReady = true; }
        else camera.position.lerp(camTarget, 1 - Math.exp(-8 * dt));
        camera.lookAt(boat.position.x, boat.position.y + 1.8, boat.position.z);
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
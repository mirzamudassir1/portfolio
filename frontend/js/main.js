import * as THREE from 'three';

document.getElementById('hint').innerHTML =
    'W / ↑ = sail &nbsp; S / ↓ = reverse &nbsp; A / ← and D / → = steer &nbsp; Drag = look around';

// ---------- Scene ----------
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);
scene.fog = new THREE.Fog(0x87ceeb, 120, 520);

const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 1500);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.domElement.style.touchAction = 'none';
document.body.appendChild(renderer.domElement);

scene.add(new THREE.AmbientLight(0xffffff, 0.65));
const sun = new THREE.DirectionalLight(0xffffff, 1);
sun.position.set(100, 200, 50);
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

// ---------- Ship ----------
const ship = new THREE.Group();
function part(w, h, d, color, x, y, z) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshPhongMaterial({ color }));
    m.position.set(x, y, z);
    ship.add(m);
}
part(2, 0.8, 5, 0x8b4513, 0, 0.4, 0);        // hull
part(1.4, 0.8, 1.5, 0x5a2d0c, 0, 0.4, 3);    // bow
part(1.8, 0.2, 4.6, 0xe67e22, 0, 0.9, 0);    // deck
part(0.15, 5, 0.15, 0x222222, 0, 3, 0);      // mast
part(0.05, 3.2, 2.6, 0xffffff, 0, 3.4, 0.2); // sail
part(0.05, 0.6, 1, 0xe74c3c, 0, 5.8, 0.4);   // flag
scene.add(ship);

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
    .then((data) => { islands = data; islands.forEach(buildIsland); })
    .catch(() => {
        document.getElementById('hint').textContent = 'Could not load islands. Is the server running?';
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

    d.lines.forEach((t) => {
        const p = document.createElement('p');
        p.textContent = t;
        panel.appendChild(p);
    });

    d.links.forEach((l) => {
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

// ---------- Keyboard controls (WASD + Arrow keys) ----------
const keys = {};
const GAME_KEYS = ['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'];

addEventListener('keydown', (e) => {
    if (e.target.matches('input, textarea')) return;
    const k = e.key.toLowerCase();
    if (GAME_KEYS.includes(k)) {
        e.preventDefault();
        keys[k] = true;
    }
});
addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
});

const forward = () => keys['w'] || keys['arrowup'];
const backward = () => keys['s'] || keys['arrowdown'];
const left = () => keys['a'] || keys['arrowleft'];
const right = () => keys['d'] || keys['arrowright'];

// ---------- Orbit camera (drag = spin 360, wheel/pinch = zoom, double-click = reset) ----------
const DEFAULT_ORBIT = { yaw: 0, pitch: 0.42, dist: 18 };
const orbit = { ...DEFAULT_ORBIT };
const canvas = renderer.domElement;
const pointers = new Map();
let pinchDist = 0;

canvas.addEventListener('pointerdown', (e) => {
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
        orbit.dist = THREE.MathUtils.clamp(orbit.dist - (d - pinchDist) * 0.05, 8, 45);
        pinchDist = d;
    }
});

const endPointer = (e) => pointers.delete(e.pointerId);
canvas.addEventListener('pointerup', endPointer);
canvas.addEventListener('pointercancel', endPointer);

canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    orbit.dist = THREE.MathUtils.clamp(orbit.dist + e.deltaY * 0.02, 8, 45);
}, { passive: false });

canvas.addEventListener('dblclick', () => Object.assign(orbit, DEFAULT_ORBIT));

// ---------- Game loop ----------
let speed = 0, heading = 0;
const clock = new THREE.Clock();
const camTarget = new THREE.Vector3();

function animate() {
    requestAnimationFrame(animate);
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;

    // waves
    for (let i = 0; i < wPos.count; i++) {
        const x = wPos.getX(i), z = wPos.getZ(i);
        wPos.setY(i, Math.sin(x * 0.06 + t) * 0.5 + Math.cos(z * 0.05 + t * 0.8) * 0.5);
    }
    wPos.needsUpdate = true;
    wGeo.computeVertexNormals();

    // ship movement
    if (forward()) speed = Math.min(speed + 10 * dt, 22);
    else if (backward()) speed = Math.max(speed - 10 * dt, -6);
    else speed *= 1 - 0.6 * dt;

    const turn = (left() ? 1 : 0) - (right() ? 1 : 0);
    heading += turn * 1.1 * dt * Math.min(1, Math.abs(speed) / 5);

    ship.position.x += Math.sin(heading) * speed * dt;
    ship.position.z += Math.cos(heading) * speed * dt;
    ship.position.x = THREE.MathUtils.clamp(ship.position.x, -480, 480);
    ship.position.z = THREE.MathUtils.clamp(ship.position.z, -480, 480);
    ship.position.y = 0.2 + Math.sin(t * 2) * 0.15;
    ship.rotation.set(0, heading, Math.sin(t * 1.5) * 0.04);

    // islands: collision + info
    let near = null;
    for (const d of islands) {
        const dx = ship.position.x - d.x, dz = ship.position.z - d.z;
        const dist = Math.hypot(dx, dz);
        if (dist < d.radius + 2) {
            ship.position.x = d.x + (dx / dist) * (d.radius + 2);
            ship.position.z = d.z + (dz / dist) * (d.radius + 2);
            speed *= 0.3;
        }
        if (dist < d.radius + 20) near = d;
    }
    near ? showPanel(near) : hidePanel();

    // orbit camera around the ship
    const a = heading + orbit.yaw;
    const flat = Math.cos(orbit.pitch) * orbit.dist;
    camTarget.set(
        ship.position.x - Math.sin(a) * flat,
        ship.position.y + 2 + Math.sin(orbit.pitch) * orbit.dist,
        ship.position.z - Math.cos(a) * flat
    );
    camera.position.lerp(camTarget, 1 - Math.exp(-8 * dt));
    camera.lookAt(ship.position.x, ship.position.y + 2, ship.position.z);

    renderer.render(scene, camera);
}
animate();

addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
});
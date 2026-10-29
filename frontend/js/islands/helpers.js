import * as THREE from 'three';

export const PLAT = 2.95; // top of the grassy plateau (matches the walking logic in main.js)
export const SAND = 2.0;  // top of the outer sand ring

export const mat = (color, extra = {}) =>
    new THREE.MeshPhongMaterial({ color, flatShading: true, ...extra });

export function add(g, geo, color, x, y, z, o = {}) {
    const m = new THREE.Mesh(geo, o.material || mat(color, o.mat));
    m.position.set(x, y, z);
    if (o.rx) m.rotation.x = o.rx;
    if (o.ry) m.rotation.y = o.ry;
    if (o.rz) m.rotation.z = o.rz;
    g.add(m);
    return m;
}
export const box = (g, w, h, d, c, x, y, z, o) => add(g, new THREE.BoxGeometry(w, h, d), c, x, y, z, o);
export const cyl = (g, rt, rb, h, c, x, y, z, o = {}) =>
    add(g, new THREE.CylinderGeometry(rt, rb, h, o.seg || 16), c, x, y, z, o);
export const cone = (g, r, h, c, x, y, z, o = {}) =>
    add(g, new THREE.ConeGeometry(r, h, o.seg || 8), c, x, y, z, o);
export const sph = (g, r, c, x, y, z, o) => add(g, new THREE.SphereGeometry(r, 14, 10), c, x, y, z, o);
export const pol = (r, f, a) => [Math.cos(a) * r * f, Math.sin(a) * r * f];

export function gable(g, w, h, len, color, x, y, z, ry = 0) {
    const s = new THREE.Shape();
    s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); s.lineTo(0, h); s.closePath();
    const geo = new THREE.ExtrudeGeometry(s, { depth: len, bevelEnabled: false });
    geo.translate(0, 0, -len / 2);
    return add(g, geo, color, x, y, z, { ry });
}

export function signPlane(text, w, h, bg = '#7a4a28', fg = '#ffe9b0') {
    const c = document.createElement('canvas');
    c.width = 512;
    c.height = Math.round((512 * h) / w);
    const x = c.getContext('2d');
    x.fillStyle = bg;
    x.fillRect(0, 0, c.width, c.height);
    x.strokeStyle = 'rgba(0,0,0,0.35)';
    x.lineWidth = 10;
    x.strokeRect(5, 5, c.width - 10, c.height - 10);
    x.fillStyle = fg;
    const fs = Math.min(c.height * 0.55, c.width / (text.length * 0.62));
    x.font = `bold ${Math.round(fs)}px Segoe UI, sans-serif`;
    x.textAlign = 'center';
    x.textBaseline = 'middle';
    x.fillText(text, c.width / 2, c.height / 2 + 2);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return new THREE.Mesh(
        new THREE.PlaneGeometry(w, h),
        new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide })
    );
}

export function palm(g, x, y0, z, h = 4.5, lean = 0.1) {
    const t = new THREE.Group();
    t.position.set(x, y0, z);
    t.rotation.z = lean;
    cyl(t, 0.18, 0.3, h, 0x8b5a2b, 0, h / 2, 0, { seg: 8 });
    for (let i = 0; i < 6; i++) {
        const pv = new THREE.Group();
        pv.position.y = h;
        pv.rotation.y = (i / 6) * Math.PI * 2;
        box(pv, 1.9, 0.07, 0.5, 0x2e9e55, 0.95, 0, 0, { rz: -0.4 });
        t.add(pv);
    }
    sph(t, 0.18, 0x6b4a2a, 0.12, h - 0.1, 0.1);
    g.add(t);
}

export function lampPost(g, x, z) {
    cyl(g, 0.05, 0.07, 2.2, 0x2b1e18, x, PLAT + 1.1, z, { seg: 8 });
    sph(g, 0.2, 0xffe08a, x, PLAT + 2.3, z, { mat: { emissive: 0xffc94d, emissiveIntensity: 0.9 } });
}
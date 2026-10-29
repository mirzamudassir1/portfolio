import * as THREE from 'three';
import { PLAT, SAND, mat, add, box, cyl, sph, pol, signPlane, palm } from './helpers.js';

export default {
    grass: 0x5fcf6f,
    labelY: 15,
    build(g, r) {
        const S = [];
        // resume scroll on a stone pedestal
        cyl(g, 1.0, 1.25, 0.9, 0x9a9a9f, 0, PLAT + 0.45, 0, { seg: 10 });
        cyl(g, 0.34, 0.34, 2.3, 0xf3e2b3, 0, PLAT + 1.25, 0, { rz: Math.PI / 2, seg: 14 });
        [-1.15, 1.15].forEach((x) => cyl(g, 0.4, 0.4, 0.12, 0x8a5a30, x, PLAT + 1.25, 0, { rz: Math.PI / 2 }));
        sph(g, 0.2, 0xc0392b, 0, PLAT + 1.55, 0);
        S.push({ x: 0, z: 0, r: 1.4 });

        cyl(g, 0.07, 0.07, 1.8, 0x5a3a20, 2.0, PLAT + 0.9, 2.8, { seg: 8 });
        const sign = signPlane('RESUME', 1.6, 0.45, '#f3e2b3', '#7a4a28');
        sign.position.set(2.0, PLAT + 1.9, 2.8);
        g.add(sign);

        // gold
        const goldMat = mat(0xffd23f, { emissive: 0xaa7a00, emissiveIntensity: 0.6 });
        for (let i = 0; i < 16; i++) {
            const a = i * 2.4, rr = 0.15 + (i % 5) * 0.16;
            cyl(g, 0.18, 0.18, 0.06, 0xffd23f, 2.6 + Math.cos(a) * rr, PLAT + 0.05 + (i % 4) * 0.07,
                1.4 + Math.sin(a) * rr, { seg: 10, material: goldMat });
        }
        [[2.2, 1.0], [3.0, 1.9], [2.9, 0.8]].forEach(([x, z], i) =>
            box(g, 0.5, 0.18, 0.25, 0xffd23f, x, PLAT + 0.1, z, { ry: i, material: goldMat })
        );
        S.push({ x: 2.6, z: 1.4, r: 1.1 });

        // X marks the spot
        add(g, new THREE.BoxGeometry(3.0, 0.05, 0.4), 0xc0392b, -2.3, PLAT + 0.03, -1.8, { ry: Math.PI / 4 });
        add(g, new THREE.BoxGeometry(3.0, 0.05, 0.4), 0xc0392b, -2.3, PLAT + 0.03, -1.8, { ry: -Math.PI / 4 });

        // wreck mast on the sand + palm
        const [mx, mz] = pol(r, 0.8, 4.9);
        cyl(g, 0.12, 0.15, 4, 0x7a4a28, mx, SAND + 1.6, mz, { rz: 0.35, seg: 8 });
        add(g, new THREE.PlaneGeometry(1.6, 2.0), 0xf1e6c8, mx + 0.7, SAND + 2.0, mz, {
            rz: 0.35, mat: { side: THREE.DoubleSide },
        });
        S.push({ x: mx, z: mz, r: 0.4 });
        const [px, pz] = pol(r, 0.8, 1.0);
        palm(g, px, SAND, pz, 4.0, 0.15);
        S.push({ x: px, z: pz, r: 0.4 });

        return { solids: S, update: (t) => { goldMat.emissiveIntensity = 0.5 + Math.sin(t * 4) * 0.25; } };
    },
};
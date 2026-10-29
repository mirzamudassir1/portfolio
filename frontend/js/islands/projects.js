import * as THREE from 'three';
import { PLAT, mat, box, cyl, gable, signPlane } from './helpers.js';

export default {
    grass: 0x6fcf7a,
    labelY: 15,
    build(g) {
        const S = [];
        box(g, 4.2, 2.4, 3.0, 0xb0824f, -2.3, PLAT + 1.2, -1.6);
        gable(g, 4.8, 1.3, 3.6, 0x6b4a2a, -2.3, PLAT + 2.4, -1.6);
        const sign = signPlane('BUILD YARD', 2.8, 0.6);
        sign.position.set(-2.3, PLAT + 2.0, -0.07);
        g.add(sign);
        box(g, 1.0, 1.5, 0.06, 0x3a2a1a, -3.2, PLAT + 0.75, -0.08);
        S.push({ x: -2.3, z: -1.6, r: 2.5 });

        // crane
        box(g, 0.3, 5, 0.3, 0xf2c14e, -0.8, PLAT + 2.5, 2.4);
        const arm = new THREE.Group();
        arm.position.set(-0.8, PLAT + 5, 2.4);
        box(arm, 3.6, 0.25, 0.25, 0xf2c14e, 1.2, 0, 0);
        box(arm, 0.5, 0.5, 0.5, 0x444444, -0.5, 0, 0);
        cyl(arm, 0.025, 0.025, 1.8, 0x222222, 2.6, -0.9, 0, { seg: 6 });
        box(arm, 0.2, 0.2, 0.2, 0xbbbbbb, 2.6, -1.9, 0);
        g.add(arm);
        S.push({ x: -0.8, z: 2.4, r: 0.4 });

        // half-built ship frame
        const frame = new THREE.Group();
        frame.position.set(2.6, PLAT + 1.05, -0.6);
        box(frame, 0.16, 0.16, 4.2, 0x8a5a30, 0, -0.85, 0);
        const N = 7;
        for (let i = 0; i < N; i++) {
            const z = -1.8 + (i * 3.6) / (N - 1);
            const f = Math.pow(Math.sin((Math.PI * (i + 0.6)) / (N + 0.2)), 0.6);
            const rib = new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.06, 6, 14, Math.PI), mat(0xb0824f));
            rib.rotation.z = Math.PI;
            rib.position.set(0, 0, z);
            rib.scale.set(f, f, 1);
            frame.add(rib);
        }
        g.add(frame);
        [-1.8, 0.6].forEach((z) => box(g, 1.6, 0.2, 0.25, 0x5a3a20, 2.6, PLAT + 0.1, z));
        S.push({ x: 2.6, z: -1.4, r: 1.1 }, { x: 2.6, z: 0.2, r: 1.1 });

        // crates + barrel
        box(g, 0.8, 0.8, 0.8, 0xa8723c, -3.6, PLAT + 0.4, 1.4);
        box(g, 0.6, 0.6, 0.6, 0xb8823c, -2.6, PLAT + 0.3, 2.0);
        cyl(g, 0.35, 0.35, 0.8, 0x7a4a28, -4.3, PLAT + 0.4, 0.6, { seg: 12 });
        S.push({ x: -3.6, z: 1.4, r: 0.6 }, { x: -2.6, z: 2.0, r: 0.5 });

        return { solids: S, update: (t) => { arm.rotation.y = Math.sin(t * 0.4) * 0.7; } };
    },
};
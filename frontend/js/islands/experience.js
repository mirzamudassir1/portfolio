import * as THREE from 'three';
import { PLAT, add, box, cyl, cone, sph, gable, signPlane, lampPost } from './helpers.js';

export default {
    grass: 0x6fcf7a,
    labelY: 16,
    build(g) {
        const hands = [];
        box(g, 2.0, 6.0, 2.0, 0xd9c7a3, 0, PLAT + 3, 0);
        cone(g, 1.7, 1.8, 0x3a5a8a, 0, PLAT + 6.9, 0, { seg: 4, ry: Math.PI / 4 });
        sph(g, 0.12, 0xf2c14e, 0, PLAT + 8.0, 0);
        for (let i = 0; i < 4; i++) {
            const face = new THREE.Group();
            face.rotation.y = (i * Math.PI) / 2;
            add(face, new THREE.CircleGeometry(0.8, 24), 0xfffaf0, 0, PLAT + 4.8, 1.02, { mat: { flatShading: false } });
            add(face, new THREE.TorusGeometry(0.8, 0.06, 6, 24), 0x2b1e18, 0, PLAT + 4.8, 1.03);
            const hh = new THREE.Group();
            hh.position.set(0, PLAT + 4.8, 1.06);
            box(hh, 0.07, 0.4, 0.03, 0x111111, 0, 0.2, 0);
            const mh = new THREE.Group();
            mh.position.set(0, PLAT + 4.8, 1.08);
            box(mh, 0.05, 0.62, 0.03, 0x111111, 0, 0.31, 0);
            face.add(hh, mh);
            g.add(face);
            hands.push([hh, mh]);
        }
        const sign = signPlane('EXPERIENCE', 2.4, 0.5, '#3a5a8a', '#ffffff');
        sign.position.set(0, PLAT + 1.4, 1.04);
        g.add(sign);

        box(g, 2.2, 1.6, 2.0, 0xe8c9a0, -3.3, PLAT + 0.8, 1.6);
        gable(g, 2.7, 1.0, 2.4, 0xc9553a, -3.3, PLAT + 1.6, 1.6);
        box(g, 0.4, 0.4, 0.05, 0x2b1e18, -3.3, PLAT + 0.9, 2.62);
        box(g, 2.0, 1.4, 2.2, 0xd8e3ee, 3.2, PLAT + 0.7, -1.8);
        gable(g, 2.5, 0.9, 2.6, 0x3a7ac9, 3.2, PLAT + 1.4, -1.8);

        // market stall
        [[-0.7, -0.7], [0.7, -0.7], [-0.7, 0.7], [0.7, 0.7]].forEach(([dx, dz]) =>
            cyl(g, 0.05, 0.05, 1.8, 0x5a3a20, -2.6 + dx, PLAT + 0.9, -3.0 + dz, { seg: 6 })
        );
        box(g, 1.6, 0.6, 0.8, 0x8a5a30, -2.6, PLAT + 0.3, -3.0);
        for (let i = 0; i < 6; i++) {
            box(g, 0.28, 0.05, 1.8, i % 2 ? 0xffffff : 0xe74c3c, -3.35 + i * 0.3, PLAT + 1.95, -3.0, { rx: 0.2 });
        }
        lampPost(g, 1.9, 2.4);
        lampPost(g, -1.5, -2.2);

        return {
            solids: [
                { x: 0, z: 0, r: 1.5 }, { x: -3.3, z: 1.6, r: 1.6 },
                { x: 3.2, z: -1.8, r: 1.6 }, { x: -2.6, z: -3.0, r: 1.2 },
            ],
            update: () => {
                const now = new Date();
                const m = now.getMinutes() + now.getSeconds() / 60;
                const h = (now.getHours() % 12) + m / 60;
                hands.forEach(([hh, mh]) => {
                    hh.rotation.z = -(h / 12) * Math.PI * 2;
                    mh.rotation.z = -(m / 60) * Math.PI * 2;
                });
            },
        };
    },
};
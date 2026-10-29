import * as THREE from 'three';
import { PLAT, add, box, cyl } from './helpers.js';

export default {
    grass: 0x5a5560,
    labelY: 19,
    build(g) {
        cyl(g, 1.2, 4.2, 6, 0x4a4650, 0, PLAT + 3, 0, { seg: 10 });
        cyl(g, 1.25, 1.25, 0.2, 0xff6a1a, 0, PLAT + 6.05, 0, {
            seg: 10, mat: { emissive: 0xff4400, emissiveIntensity: 1 },
        });
        [0.4, 2.3, 4.4].forEach((a) => {
            const pv = new THREE.Group();
            pv.rotation.y = a;
            box(pv, 0.1, 6.5, 0.35, 0xff6a1a, 2.78, PLAT + 3.0, 0, {
                rz: 0.4636, mat: { emissive: 0xff4400, emissiveIntensity: 0.9 },
            });
            g.add(pv);
        });

        const puffs = [];
        for (let i = 0; i < 5; i++) {
            const m = new THREE.Mesh(
                new THREE.SphereGeometry(0.7, 10, 8),
                new THREE.MeshPhongMaterial({ color: 0x777777, transparent: true, opacity: 0.5 })
            );
            g.add(m);
            puffs.push(m);
        }

        const crystals = [0x58c8ff, 0xff7ad9, 0x7dff9a, 0xffd166, 0xb48cff].map((c, i) => {
            const m = add(g, new THREE.OctahedronGeometry(0.5), c, 0, 0, 0, {
                mat: { emissive: c, emissiveIntensity: 0.55 },
            });
            m.userData.a = (i / 5) * Math.PI * 2;
            return m;
        });

        return {
            solids: [{ x: 0, z: 0, r: 4.4 }],
            update: (t) => {
                puffs.forEach((m, i) => {
                    const f = (t * 0.25 + i / 5) % 1;
                    m.position.set(Math.sin(i * 2.4) * 1.2 * f, PLAT + 6.4 + f * 6, Math.cos(i * 2.4) * 1.2 * f);
                    m.scale.setScalar(0.6 + f * 1.8);
                    m.material.opacity = 0.55 * (1 - f);
                });
                crystals.forEach((m, i) => {
                    const a = m.userData.a + t * 0.3;
                    m.position.set(Math.cos(a) * 5.2, PLAT + 1.6 + Math.sin(t * 1.5 + i) * 0.3, Math.sin(a) * 5.2);
                    m.rotation.set(t * 0.6, t, 0);
                });
            },
        };
    },
};
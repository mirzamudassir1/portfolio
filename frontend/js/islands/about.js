import * as THREE from 'three';
import { PLAT, add, box, cyl, cone, sph, gable } from './helpers.js';

export default {
    grass: 0x58c26a,
    labelY: 20,
    build(g) {
        let y = PLAT, rad = 1.7;
        [0xf6f6f6, 0xd63a3a, 0xf6f6f6, 0xd63a3a].forEach((c) => {
            const h = 2.4, top = rad - 0.2;
            cyl(g, top, rad, h, c, 0, y + h / 2, 0);
            y += h;
            rad = top;
        });
        cyl(g, 1.4, 1.3, 0.25, 0x2b1e18, 0, y + 0.12, 0);
        add(g, new THREE.TorusGeometry(1.3, 0.05, 6, 24), 0x2b1e18, 0, y + 0.75, 0, { rx: Math.PI / 2 });
        const lamp = cyl(g, 0.75, 0.75, 1.2, 0xffe9a0, 0, y + 0.85, 0, {
            mat: { emissive: 0xffc94d, emissiveIntensity: 0.9 },
        });
        cone(g, 1.05, 1.0, 0xd63a3a, 0, y + 1.95, 0, { seg: 16 });
        sph(g, 0.14, 0x2b1e18, 0, y + 2.5, 0);

        const beam = new THREE.Group();
        beam.position.set(0, y + 0.85, 0);
        [0, Math.PI].forEach((a) => {
            const b = new THREE.Mesh(
                new THREE.ConeGeometry(1.0, 9, 14, 1, true),
                new THREE.MeshBasicMaterial({
                    color: 0xfff2a8, transparent: true, opacity: 0.22, side: THREE.DoubleSide, depthWrite: false,
                })
            );
            b.rotation.z = Math.PI / 2;
            b.position.x = 4.5;
            const pv = new THREE.Group();
            pv.rotation.y = a;
            pv.add(b);
            beam.add(pv);
        });
        g.add(beam);

        // keeper's cottage
        box(g, 2.4, 1.5, 2.0, 0xf1d7a8, 3.0, PLAT + 0.75, 1.6);
        gable(g, 2.4, 1.0, 2.8, 0xd0743f, 3.0, PLAT + 1.5, 1.6, Math.PI / 2);
        box(g, 0.5, 0.9, 0.06, 0x5a3a20, 3.0, PLAT + 0.45, 2.62);
        box(g, 0.45, 0.4, 0.06, 0x2b1e18, 3.8, PLAT + 0.95, 2.62);
        add(g, new THREE.DodecahedronGeometry(0.8), 0x8c8c94, -3.6, PLAT + 0.3, -2.2);

        return {
            solids: [{ x: 0, z: 0, r: 1.9 }, { x: 3.0, z: 1.6, r: 1.7 }, { x: -3.6, z: -2.2, r: 0.8 }],
            update: (t) => {
                beam.rotation.y = t * 0.9;
                lamp.material.emissiveIntensity = 0.8 + Math.sin(t * 5) * 0.15;
            },
        };
    },
};
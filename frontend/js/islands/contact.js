import * as THREE from 'three';
import { PLAT, add, box, cyl, gable, signPlane } from './helpers.js';

export default {
    grass: 0x66cc77,
    labelY: 14,
    build(g) {
        const S = [];
        box(g, 4.0, 2.2, 3.0, 0xf4f0e6, -1.2, PLAT + 1.1, -0.8);
        gable(g, 4.6, 1.3, 3.6, 0xc0392b, -1.2, PLAT + 2.2, -0.8);
        box(g, 0.9, 1.5, 0.06, 0x5a3a20, -1.2, PLAT + 0.75, 0.73);
        box(g, 0.8, 0.7, 0.06, 0x2b1e18, -2.5, PLAT + 1.2, 0.73);
        box(g, 0.8, 0.7, 0.06, 0x2b1e18, 0.1, PLAT + 1.2, 0.73);
        const sign = signPlane('POST OFFICE', 2.6, 0.55, '#1f4f8f', '#ffffff');
        sign.position.set(-1.2, PLAT + 1.9, 0.74);
        g.add(sign);
        S.push({ x: -1.2, z: -0.8, r: 2.5 });

        // mailboxes
        [[2.4, 1.6, 0.4], [3.2, 0.8, 0.9]].forEach(([x, z, ry]) => {
            const mb = new THREE.Group();
            mb.position.set(x, PLAT, z);
            mb.rotation.y = ry;
            cyl(mb, 0.06, 0.06, 0.9, 0x5a3a20, 0, 0.45, 0, { seg: 6 });
            box(mb, 0.55, 0.45, 0.85, 0x2a62c9, 0, 1.1, 0);
            cyl(mb, 0.275, 0.275, 0.85, 0x2a62c9, 0, 1.325, 0, { rx: Math.PI / 2, seg: 12 });
            box(mb, 0.05, 0.3, 0.14, 0xe74c3c, 0.32, 1.3, 0.1);
            g.add(mb);
            S.push({ x, z, r: 0.5 });
        });

        // signpost
        cyl(g, 0.08, 0.1, 3.4, 0x5a3a20, 1.0, PLAT + 1.7, 3.0, { seg: 8 });
        [['GITHUB', 2.9, 0.4], ['LINKEDIN', 2.4, -0.3], ['EMAIL', 1.9, 0.9]].forEach(([txt, y, ry]) => {
            const b = new THREE.Group();
            b.position.set(1.0, PLAT + y, 3.0);
            b.rotation.y = ry;
            box(b, 1.5, 0.4, 0.06, 0x7a4a28, 0.8, 0, 0);
            const s = signPlane(txt, 1.4, 0.34, '#7a4a28', '#ffe9b0');
            s.position.set(0.8, 0, 0.04);
            b.add(s);
            g.add(b);
        });
        S.push({ x: 1.0, z: 3.0, r: 0.3 });

        // flagpole
        cyl(g, 0.04, 0.04, 4, 0xdddddd, 1.9, PLAT + 2, -2.6, { seg: 6 });
        add(g, new THREE.PlaneGeometry(1.1, 0.7), 0x2a62c9, 2.45, PLAT + 3.6, -2.6, { mat: { side: THREE.DoubleSide } });
        S.push({ x: 1.9, z: -2.6, r: 0.2 });

        // message in a bottle
        const bottle = new THREE.Group();
        bottle.position.set(-3.2, PLAT + 0.2, 2.6);
        bottle.rotation.z = Math.PI / 2;
        cyl(bottle, 0.18, 0.18, 0.6, 0x7fe0b0, 0, 0.3, 0, { seg: 10, mat: { transparent: true, opacity: 0.75 } });
        cyl(bottle, 0.07, 0.1, 0.3, 0x7fe0b0, 0, 0.75, 0, { seg: 8, mat: { transparent: true, opacity: 0.75 } });
        cyl(bottle, 0.08, 0.08, 0.1, 0x8a5a30, 0, 0.95, 0, { seg: 8 });
        cyl(bottle, 0.06, 0.06, 0.4, 0xf3e2b3, 0, 0.3, 0, { seg: 8 });
        g.add(bottle);

        return { solids: S };
    },
};
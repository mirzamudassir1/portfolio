import * as THREE from 'three';
import { PLAT, add, box, cyl, sph, signPlane } from './helpers.js';

export default {
    grass: 0x7bd88f,
    labelY: 15,
    build(g) {
        // h = walkable platform height (the explorer can step up onto it)
        const S = [{ x: 0, z: 0, r: 4.4, h: 0.3 }, { x: 0, z: 0, r: 3.9, h: 0.6 }];
        cyl(g, 4.4, 4.5, 0.3, 0xe8e2d4, 0, PLAT + 0.15, 0, { seg: 32 });
        cyl(g, 3.9, 4.0, 0.3, 0xf2eee2, 0, PLAT + 0.45, 0, { seg: 32 });
        const base = PLAT + 0.6;
        for (let i = 0; i < 8; i++) {
            const a = (i / 8) * Math.PI * 2, x = Math.cos(a) * 3.1, z = Math.sin(a) * 3.1;
            cyl(g, 0.26, 0.3, 3.2, 0xf6f1e6, x, base + 1.6, z, { seg: 12 });
            box(g, 0.75, 0.18, 0.75, 0xe8e2d4, x, base + 3.3, z);
            box(g, 0.7, 0.14, 0.7, 0xe8e2d4, x, base + 0.07, z);
            S.push({ x, z, r: 0.38 });
        }
        cyl(g, 3.6, 3.6, 0.3, 0xe8e2d4, 0, base + 3.55, 0, { seg: 32 });
        const dome = add(g, new THREE.SphereGeometry(3.3, 24, 10, 0, Math.PI * 2, 0, Math.PI / 2), 0x4a78b5,
            0, base + 3.7, 0, { mat: { flatShading: false } });
        dome.scale.y = 0.55;
        cyl(g, 0.05, 0.05, 0.8, 0xf2c14e, 0, base + 5.9, 0, { seg: 6 });
        sph(g, 0.14, 0xf2c14e, 0, base + 6.35, 0);

        // pedestal with books and a graduation cap
        cyl(g, 0.6, 0.75, 0.9, 0xcfc8b8, 0, base + 0.45, 0);
        box(g, 0.8, 0.1, 0.6, 0x2f5d8a, 0, base + 0.95, 0);
        box(g, 0.7, 0.1, 0.55, 0xb5362e, 0, base + 1.05, 0);
        cyl(g, 0.32, 0.38, 0.28, 0x1b1b1b, 0, base + 1.3, 0, { seg: 12 });
        box(g, 0.95, 0.08, 0.95, 0x1b1b1b, 0, base + 1.48, 0, { ry: Math.PI / 4 });
        box(g, 0.03, 0.3, 0.03, 0xf2c14e, 0.4, base + 1.3, 0);
        S.push({ x: 0, z: 0, r: 0.8 });

        cyl(g, 0.07, 0.07, 1.8, 0x5a3a20, 0, PLAT + 0.9, 4.9, { seg: 8 });
        const sign = signPlane('ACADEMY', 2.0, 0.5, '#4a78b5', '#ffffff');
        sign.position.set(0, PLAT + 1.9, 4.9);
        g.add(sign);
        return { solids: S };
    },
};
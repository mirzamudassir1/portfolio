import { PLAT, SAND, box, cyl, cone, sph, pol, gable, signPlane, palm } from './helpers.js';

export default {
    grass: 0xf6e7b4,
    labelY: 15,
    build(g, r) {
        const S = [];
        box(g, 3.0, 1.9, 2.4, 0xc99a5b, 0, PLAT + 0.95, 0);
        gable(g, 2.9, 1.2, 3.4, 0xd8b25a, 0, PLAT + 1.9, 0, Math.PI / 2);
        const hutSign = signPlane('SOCIALS', 2.0, 0.5);
        hutSign.position.set(0, PLAT + 1.5, 1.23);
        g.add(hutSign);
        S.push({ x: 0, z: 0, r: 2.0 });

        [[-3.2, 2.4, 0xe74c3c], [3.4, 2.2, 0x3498db]].forEach(([x, z, c]) => {
            cyl(g, 0.05, 0.05, 2.4, 0xeeeeee, x, PLAT + 1.2, z, { seg: 6 });
            cone(g, 1.5, 0.8, c, x, PLAT + 2.5, z, { seg: 10 });
            box(g, 1.5, 0.05, 0.8, c, x, PLAT + 0.03, z + 1.1);
            S.push({ x, z, r: 0.3 });
        });

        [[-1.8, -2.8, 0xff7043], [-2.6, -2.5, 0x29b6f6]].forEach(([x, z, c]) => {
            const sb = sph(g, 0.5, c, x, PLAT + 1.1, z, { rz: 0.15 });
            sb.scale.set(0.28, 1.5, 0.08);
        });
        sph(g, 0.35, 0xff5252, 1.8, PLAT + 0.35, 3.0);

        [0.4, 2.3, 4.2].forEach((a) => {
            const [x, z] = pol(r, 0.8, a);
            palm(g, x, SAND, z, 4.2, 0.12);
            S.push({ x, z, r: 0.4 });
        });
        return { solids: S };
    },
};
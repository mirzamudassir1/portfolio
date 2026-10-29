import { PLAT, palm } from './helpers.js';

// used for any island type that has no file of its own
export default {
    grass: 0x58c26a,
    labelY: 15,
    build(g) {
        palm(g, 0, PLAT, 0, 5.5, 0);
        return { solids: [{ x: 0, z: 0, r: 0.8 }] };
    },
};
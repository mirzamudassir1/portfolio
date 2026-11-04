import * as THREE from 'three';
import { PLAT, mat, box, cyl, gable, signPlane } from './helpers.js';

export default {
    grass: 0x6fcf7a,
    labelY: 15,
    build(g, r, d = {}) {
        const S = [];

        // 1. Workshop Building (Build Yard)
        box(g, 4.2, 2.4, 3.0, 0xb0824f, -2.3, PLAT + 1.2, -1.6);
        gable(g, 4.8, 1.3, 3.6, 0x6b4a2a, -2.3, PLAT + 2.4, -1.6);
        const sign = signPlane('BUILD YARD', 2.8, 0.6);
        sign.position.set(-2.3, PLAT + 2.0, -0.07);
        g.add(sign);
        box(g, 1.0, 1.5, 0.06, 0x3a2a1a, -3.2, PLAT + 0.75, -0.08);
        S.push({ x: -2.3, z: -1.6, r: 2.5 });

        // 2. Yellow Construction Crane
        box(g, 0.3, 5, 0.3, 0xf2c14e, -0.8, PLAT + 2.5, 2.4);
        const arm = new THREE.Group();
        arm.position.set(-0.8, PLAT + 5, 2.4);
        box(arm, 3.6, 0.25, 0.25, 0xf2c14e, 1.2, 0, 0);
        box(arm, 0.5, 0.5, 0.5, 0x444444, -0.5, 0, 0);
        cyl(arm, 0.025, 0.025, 1.8, 0x222222, 2.6, -0.9, 0, { seg: 6 });
        box(arm, 0.2, 0.2, 0.2, 0xbbbbbb, 2.6, -1.9, 0);
        g.add(arm);
        S.push({ x: -0.8, z: 2.4, r: 0.4 });

        // 3. Half-built Ship Frame
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

        // 4. 3D Project Showcase Stands (Multiple Projects physically displayed on island)
        const gemColors = [0x00f0ff, 0xffd166, 0x06d6a0, 0xf72585, 0xa78bfa, 0xff6b35];
        const floatingGems = [];

        const projectList = (Array.isArray(d.projects) && d.projects.length > 0)
            ? d.projects
            : [
                { title: 'QuizPro' },
                { title: 'E-Commerce' },
                { title: '3D Portfolio' },
                { title: 'AI/ML Health' },
                { title: 'Chat App' },
            ];

        const totalProjects = Math.min(projectList.length, 6);
        const arcStart = Math.PI * 0.7;
        const arcEnd = Math.PI * 1.35;
        const standRadius = 6.2;

        for (let i = 0; i < totalProjects; i++) {
            const angle = arcStart + (i / Math.max(1, totalProjects - 1)) * (arcEnd - arcStart);
            const px = Math.cos(angle) * standRadius;
            const pz = Math.sin(angle) * standRadius;
            const facingAngle = Math.atan2(px, pz);

            const proj = projectList[i];
            const cleanTitle = (proj.title || `Project ${i + 1}`).split('-')[0].trim();
            const displayTitle = cleanTitle.length > 15 ? cleanTitle.substr(0, 13) + '..' : cleanTitle;

            // Pedestal column
            cyl(g, 0.35, 0.45, 0.9, 0x3d2716, px, PLAT + 0.45, pz, { seg: 10 });
            box(g, 1.2, 0.12, 0.7, 0x5c3a21, px, PLAT + 0.94, pz, { ry: facingAngle });

            // Project signboard
            const sign = signPlane(displayTitle, 1.6, 0.45, '#1e140d', '#ffd166');
            sign.position.set(px, PLAT + 1.25, pz);
            sign.rotation.y = facingAngle;
            sign.rotation.x = -0.22; // slight upward tilt for camera visibility
            g.add(sign);

            // Floating spinning tech crystal / polyhedron
            const color = gemColors[i % gemColors.length];
            const gemGeo = new THREE.OctahedronGeometry(0.24, 0);
            const gemMat = new THREE.MeshPhongMaterial({
                color,
                emissive: color,
                emissiveIntensity: 0.55,
                shininess: 95,
            });
            const gem = new THREE.Mesh(gemGeo, gemMat);
            const baseY = PLAT + 1.85;
            gem.position.set(px, baseY, pz);
            g.add(gem);

            floatingGems.push({
                mesh: gem,
                baseY,
                phase: i * 1.2,
                speed: 1.4 + (i % 3) * 0.3,
            });

            // Solid collision so player cannot walk inside the stand
            S.push({ x: px, z: pz, r: 0.75 });
        }

        // 5. Dynamic pushable crates and barrel
        return {
            solids: S,
            update: (t) => {
                arm.rotation.y = Math.sin(t * 0.4) * 0.7;
                for (const item of floatingGems) {
                    item.mesh.rotation.y = t * item.speed + item.phase;
                    item.mesh.rotation.x = Math.sin(t * item.speed * 0.7 + item.phase) * 0.35;
                    item.mesh.position.y = item.baseY + Math.sin(t * 2.4 + item.phase) * 0.08;
                }
            },
            props: [
                { type: 'box', w: 0.8, h: 0.8, d: 0.8, color: 0xa8723c, x: -3.6, y: PLAT + 0.4, z: 1.4, mass: 1.0 },
                { type: 'box', w: 0.6, h: 0.6, d: 0.6, color: 0xb8823c, x: -2.6, y: PLAT + 0.3, z: 2.0, mass: 0.7 },
                { type: 'barrel', rt: 0.35, rb: 0.35, h: 0.8, color: 0x7a4a28, x: -4.3, y: PLAT + 0.4, z: 0.6, mass: 1.2 },
            ],
        };
    },
};

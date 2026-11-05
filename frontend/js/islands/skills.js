import * as THREE from 'three';
import { PLAT, SAND, mat, add, box, cyl, cone, sph } from './helpers.js';

// ============================================================================
// DYNAMIC PROCEDURAL MAGMA TEXTURE GENERATOR
// Creates animated, high-velocity glowing molten veins and cooling basalt crust
// ============================================================================
function createMagmaTexture(w = 256, h = 512, mode = 'flow') {
    if (typeof document === 'undefined') return null;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');

    // Incandescent molten base gradient (core yellow-orange to deep volcanic red)
    const grad = ctx.createLinearGradient(0, 0, mode === 'flow' ? 0 : w, h);
    grad.addColorStop(0.0, '#ff1a00');
    grad.addColorStop(0.22, '#ff4d00');
    grad.addColorStop(0.5, '#ff8000');
    grad.addColorStop(0.78, '#ffaa00');
    grad.addColorStop(1.0, '#ff2200');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    if (mode === 'flow') {
        // High-velocity molten magma streaks and veins running along the Y axis
        for (let i = 0; i < 34; i++) {
            ctx.beginPath();
            const sx = (i / 34) * w + (Math.sin(i * 3.7) * 8);
            ctx.moveTo(sx, 0);
            let cx = sx;
            for (let y = 0; y <= h; y += 20) {
                cx += Math.sin(y * 0.038 + i * 1.3) * 14 + Math.sin(i * 7 + y * 0.08) * 6;
                ctx.lineTo(cx, y);
            }
            ctx.strokeStyle = i % 4 === 0 ? '#fffda8' : (i % 2 === 0 ? '#ffca28' : '#ff5722');
            ctx.lineWidth = i % 4 === 0 ? 3.5 : (i % 2 === 0 ? 5.5 : 7.5);
            ctx.stroke();
        }

        // Dark cooling basalt crust flakes (hardened volcanic crust floating on the current)
        for (let c = 0; c < 48; c++) {
            const cx = ((c * 43) % w);
            const cy = ((c * 79) % h);
            const rx = 4 + (c % 6) * 2;
            const ry = 8 + (c % 9) * 3;
            ctx.fillStyle = c % 2 === 0 ? '#260a03' : '#160502';
            ctx.beginPath();
            ctx.ellipse(cx, cy, rx, ry, (c * 0.5), 0, Math.PI * 2);
            ctx.fill();
            // Glowing incandescent seam around crust chunks
            ctx.strokeStyle = '#ff6d00';
            ctx.lineWidth = 1.0;
            ctx.stroke();
        }
    } else {
        // Swirling convective magma cells for the caldera lake
        const cx = w / 2;
        const cy = h / 2;
        for (let r = 12; r < w * 0.72; r += 16) {
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.strokeStyle = r % 32 === 0 ? '#fff380' : '#ff6a00';
            ctx.lineWidth = 4 + (r % 4);
            ctx.stroke();
        }
        for (let p = 0; p < 22; p++) {
            const a = (p / 22) * Math.PI * 2;
            const dist = 16 + (p % 4) * 22;
            ctx.fillStyle = '#220802';
            ctx.beginPath();
            ctx.arc(cx + Math.cos(a) * dist, cy + Math.sin(a) * dist, 8 + (p % 5) * 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#ff7700';
            ctx.lineWidth = 1.2;
            ctx.stroke();
        }
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(1, mode === 'flow' ? 3 : 1);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
}

export default {
    customBase: true,
    grass: 0x423932, // Natural volcanic loam / weathered ash earth
    labelY: 24,
    build(g, r = 13, d = {}) {
        const S = [];

        // ====================================================================
        // 1. NATURAL VOLCANIC COLOR PALETTE & ISLAND LANDMASS
        // Real volcanoes feature weathered basalt, oxidized iron scoria,
        // warm terracotta tuff, dark mineral ash, and basalt flagstones.
        // ====================================================================
        const C_BEDROCK     = 0x2e2724; // Submerged volcanic basalt shelf
        const C_BASALT_DARK = 0x38312b; // Dark weathered basalt rock
        const C_SCORIA_RED  = 0x583e30; // Oxidized iron volcanic scoria
        const C_TUFF_WARM   = 0x694232; // Terracotta volcanic tuff
        const C_ASH_STONE   = 0x4a433d; // Mineral ash stone & pumice
        const C_BLACK_SAND  = 0x36302a; // Natural volcanic mineral beach sand
        const C_PLATEAU     = 0x423932; // Main walking volcanic ash loam

        // 1. Natural dark volcanic sand beach ring (top at exactly y = 2.0, matching islandSurface)
        cyl(g, r * 0.9, r, 3.0, C_BLACK_SAND, 0, 0.5, 0, { seg: 28, mat: { flatShading: false } });

        // 2. Main walking volcanic plateau (top at exactly y = 2.95 PLAT, matching islandSurface)
        cyl(g, r * 0.62, r * 0.74, 1.5, C_PLATEAU, 0, 2.2, 0, { seg: 28, mat: { flatShading: false } });

        // 3. Submerged volcanic basalt bedrock (safely underwater)
        cyl(g, r * 1.02, r * 1.1, 2.5, C_BEDROCK, 0, -0.6, 0, { seg: 24, mat: { flatShading: false } });

        // Variegated natural basalt flagstones & oxidized ironstone tiles on the plateau
        const tileColors = [0x5c392b, 0x4a423b, 0x564c42, 0x352e2a, 0x434a36]; // terracotta, basalt, pumice, obsidian, scorched lichen
        for (let i = 0; i < 20; i++) {
            const pa = (i / 20) * Math.PI * 2;
            const pDist = 3.0 + (i % 5) * 1.1;
            const px = Math.cos(pa) * pDist;
            const pz = Math.sin(pa) * pDist + 0.6;
            // Keep clear of the central lava river (x between -0.8 and 0.8, z > -1.0)
            if (Math.abs(px) < 0.9 && pz > -0.5 && pz < 7.5) continue;
            box(g, 1.6, 0.08, 1.6, tileColors[i % tileColors.length], px, PLAT + 0.04, pz, {
                ry: pa + 0.25,
            });
        }

        // ====================================================================
        // 2. THE NATURAL STRATIFIED VOLCANO CONE & CALDERA
        // Multi-tiered geological strata with natural basalt, scoria, and tuff
        // Positioned cleanly on the north plateau (vz = -3.8) with watertight collision
        // ====================================================================
        const vx = 0, vz = -3.8;

        // Tier 1: Broad volcanic mountain base (bottom radius 4.4, strictly within r = 4.8 collision)
        cyl(g, 3.4, 4.4, 2.0, C_BASALT_DARK, vx, PLAT + 1.0, vz, { seg: 14 });
        // Tier 2: Lower mountain slope (weathered scoria)
        cyl(g, 2.4, 3.4, 2.0, C_SCORIA_RED, vx, PLAT + 2.8, vz, { seg: 12 });
        // Tier 3: Mid-caldera cone (oxidized terracotta tuff)
        cyl(g, 1.6, 2.4, 2.0, C_TUFF_WARM, vx, PLAT + 4.6, vz, { seg: 10 });
        // Tier 4: Upper cone (mineral ash & pumice band)
        cyl(g, 1.2, 1.7, 1.8, C_ASH_STONE, vx, PLAT + 6.3, vz, { seg: 10 });
        // Tier 5: Caldera summit rim (rugged craggy basalt rim)
        cyl(g, 1.1, 1.4, 1.2, 0x362c26, vx, PLAT + 7.5, vz, { seg: 12 });

        // Natural volcanic crags behind the mountain (north side)
        cyl(g, 0.9, 1.5, 3.0, C_BASALT_DARK, vx - 3.6, PLAT + 1.5, vz - 2.2, { seg: 8 });
        cyl(g, 0.9, 1.5, 3.0, C_BASALT_DARK, vx + 3.6, PLAT + 1.5, vz - 2.2, { seg: 8 });

        // Radial volcanic ribs formed by ancient hardened lava (within r = 3.6)
        for (let rIdx = 0; rIdx < 6; rIdx++) {
            const ra = (rIdx / 6) * Math.PI * 2;
            if (ra > 1.0 && ra < 2.2) continue; // Leave south front open for lava cascade
            const rDist = 2.6;
            const rx = vx + Math.cos(ra) * rDist;
            const rz = vz + Math.sin(ra) * rDist;
            const ridgeColor = rIdx % 2 === 0 ? C_SCORIA_RED : C_BASALT_DARK;
            box(g, 0.9, 2.2, 1.5, ridgeColor, rx, PLAT + 1.8, rz, {
                ry: -ra + Math.PI / 2,
                rx: 0.35,
            });
        }

        // Caldera summit crags & jagged rim teeth
        for (let tIdx = 0; tIdx < 8; tIdx++) {
            const ta = (tIdx / 8) * Math.PI * 2;
            if (ta > 1.1 && ta < 2.1) continue;
            const tx = vx + Math.cos(ta) * 1.3;
            const tz = vz + Math.sin(ta) * 1.3;
            const toothH = 0.6 + (tIdx % 3) * 0.3;
            cyl(g, 0.18, 0.38, toothH, 0x322822, tx, PLAT + 8.0 + toothH / 2, tz, { seg: 6 });
        }

        // ====================================================================
        // 3. RUNNING LAVA SYSTEM: CALDERA, CASCADES, RIVER & OCEAN FALL
        // Molten lava streams with animated scrolling UV textures and emissive glow
        // ====================================================================
        const flowTex = createMagmaTexture(256, 512, 'flow');
        const poolTex = createMagmaTexture(256, 256, 'pool');

        // Dynamic molten materials
        const lavaMat = new THREE.MeshPhongMaterial({
            color: 0xff3b00,
            emissive: 0xff2800,
            emissiveIntensity: 1.4,
            map: flowTex,
            emissiveMap: flowTex,
            flatShading: true,
            shininess: 60,
        });

        const poolMat = new THREE.MeshPhongMaterial({
            color: 0xff4d00,
            emissive: 0xff3000,
            emissiveIntensity: 1.45,
            map: poolTex,
            emissiveMap: poolTex,
            flatShading: true,
            shininess: 70,
        });

        // 3A. SUMMIT CALDERA MAGMA LAKE (Boiling molten core at PLAT + 7.52)
        const magmaLake = cyl(g, 1.45, 1.45, 0.25, 0xff4500, vx, PLAT + 7.52, vz, {
            seg: 16,
            material: poolMat,
        });

        // Floating cooled basalt crust plates in the crater
        const craterPlates = [];
        for (let cp = 0; cp < 4; cp++) {
            const cpa = (cp / 4) * Math.PI * 2;
            const cpr = 0.65 + (cp % 2) * 0.35;
            const plate = box(g, 0.6, 0.08, 0.55, 0x240903, vx + Math.cos(cpa) * cpr, PLAT + 7.66, vz + Math.sin(cpa) * cpr, {
                ry: cpa + 0.4,
            });
            craterPlates.push({ mesh: plate, angle: cpa, dist: cpr, speed: 0.3 + cp * 0.1 });
        }

        // Caldera magma bubbles that swell, pop, and reset
        const magmaBubbles = [];
        const bubbleLocs = [
            { x: vx - 0.4, z: vz + 0.3, s: 1.4 },
            { x: vx + 0.5, z: vz - 0.2, s: 1.1 },
            { x: vx + 0.1, z: vz + 0.7, s: 1.6 },
            { x: vx - 0.5, z: vz - 0.4, s: 1.3 },
        ];
        bubbleLocs.forEach((bDef, bIdx) => {
            const bMesh = sph(g, 0.25, 0xff7b00, bDef.x, PLAT + 7.52, bDef.z, {
                mat: { emissive: 0xff3300, emissiveIntensity: 1.6 },
            });
            magmaBubbles.push({ mesh: bMesh, baseY: PLAT + 7.52, speed: bDef.s, offset: bIdx * 0.25 });
        });

        // 3B. MOUNTAIN LAVA CASCADE (Lava actively rushing down the volcano slope)
        // Upper steep chute descending from caldera rim notch down to mid-shelf
        const cascadeUpper = new THREE.Mesh(
            new THREE.BoxGeometry(1.3, 0.18, 2.8),
            lavaMat
        );
        cascadeUpper.position.set(vx, PLAT + 5.8, vz + 1.8);
        cascadeUpper.rotation.x = 0.65; // Angled down south face
        g.add(cascadeUpper);

        // Mid-slope basalt plunge pool / shelf
        const shelfPool = new THREE.Mesh(
            new THREE.BoxGeometry(1.5, 0.14, 1.0),
            lavaMat
        );
        shelfPool.position.set(vx, PLAT + 4.3, vz + 2.8);
        g.add(shelfPool);

        // Lower steep cascade plunging into the plateau base
        const cascadeLower = new THREE.Mesh(
            new THREE.BoxGeometry(1.4, 0.18, 3.4),
            lavaMat
        );
        cascadeLower.position.set(vx, PLAT + 2.2, vz + 4.0);
        cascadeLower.rotation.x = 0.55; // Sloping down to plateau
        g.add(cascadeLower);

        // Rock gorge walls framing the mountain lava cascade
        [-0.8, 0.8].forEach((gOffset, gIdx) => {
            box(g, 0.5, 1.2, 2.4, C_BASALT_DARK, vx + gOffset, PLAT + 1.8, vz + 3.4, {
                rx: 0.55,
                ry: gIdx === 0 ? 0.08 : -0.08,
            });
        });

        // 3C. WINDING PLATEAU LAVA RIVER
        // Carved basalt river channel winding from mountain base, under the bridge, to southwest coast
        const riverSegments = [
            // Segment 1: Mountain base to bridge
            { w: 1.3, h: 0.1, d: 2.0, x: 0.0, z: 1.4, ry: 0 },
            // Segment 2: Under bridge and center basin
            { w: 1.3, h: 0.1, d: 2.4, x: -0.4, z: 3.5, ry: 0.28 },
            // Segment 3: Reaching the coastal cliff edge
            { w: 1.3, h: 0.1, d: 2.6, x: -1.0, z: 5.8, ry: 0.38 },
        ];
        riverSegments.forEach((seg) => {
            const rMesh = new THREE.Mesh(
                new THREE.BoxGeometry(seg.w, seg.h, seg.d),
                lavaMat
            );
            rMesh.position.set(seg.x, PLAT + 0.05, seg.z);
            if (seg.ry) rMesh.rotation.y = seg.ry;
            g.add(rMesh);

            // Subtle curb stones along river edges
            box(g, 0.25, 0.12, seg.d * 0.9, C_BASALT_DARK, seg.x - seg.w * 0.54, PLAT + 0.06, seg.z, { ry: seg.ry });
            box(g, 0.25, 0.12, seg.d * 0.9, C_SCORIA_RED, seg.x + seg.w * 0.54, PLAT + 0.06, seg.z, { ry: seg.ry });
        });

        // East flank secondary fissure stream
        const eastFissure = new THREE.Mesh(
            new THREE.BoxGeometry(0.55, 0.1, 4.2),
            lavaMat
        );
        eastFissure.position.set(2.4, PLAT + 0.05, 1.2);
        eastFissure.rotation.y = -0.42;
        g.add(eastFissure);

        // 3D. OCEAN LAVA CASCADE (Molten lava plunging into the sea)
        // Plunges from the southwest island cliff (PLAT) down to water level (y = 0.2)
        const oceanLavaFall = new THREE.Mesh(
            new THREE.BoxGeometry(1.5, 0.2, 3.4),
            lavaMat
        );
        const oceanX = -1.9, oceanZ = 8.8;
        oceanLavaFall.position.set(oceanX, PLAT * 0.48, oceanZ);
        oceanLavaFall.rotation.x = 0.95; // Steep waterfall angle into sea
        oceanLavaFall.rotation.y = 0.38;
        g.add(oceanLavaFall);

        // Boiling ocean water foam ring where lava strikes the sea
        const oceanFoamRing = cyl(g, 1.8, 1.8, 0.08, 0xffedd0, oceanX - 0.2, 0.15, oceanZ + 1.2, {
            seg: 18,
            mat: { transparent: true, opacity: 0.72 },
        });

        // Thermal ocean steam plume (billowing white/grey steam clouds rising from the ocean clash)
        const oceanSteamPuffs = [];
        for (let os = 0; os < 8; os++) {
            const sm = new THREE.Mesh(
                new THREE.SphereGeometry(0.4 + (os % 3) * 0.18, 8, 6),
                new THREE.MeshPhongMaterial({
                    color: 0xf2f0ed,
                    transparent: true,
                    opacity: 0.5,
                    flatShading: true,
                })
            );
            sm.position.set(oceanX, 0.3, oceanZ + 1.0);
            g.add(sm);
            oceanSteamPuffs.push({
                mesh: sm,
                offset: os / 8,
                driftAngle: os * 1.8,
            });
        }

        // Glowing molten splash embers jumping from the water collision
        const oceanSparks = [];
        for (let sp = 0; sp < 5; sp++) {
            const spark = new THREE.Mesh(
                new THREE.OctahedronGeometry(0.14, 0),
                new THREE.MeshBasicMaterial({ color: 0xffaa00 })
            );
            g.add(spark);
            oceanSparks.push({
                mesh: spark,
                dx: Math.cos(sp * 1.3) * 0.9,
                dz: Math.sin(sp * 1.3) * 0.9,
                speed: 1.8 + sp * 0.4,
                offset: sp * 0.2,
            });
        }

        // ====================================================================
        // 4. NATURAL BASALT ARCHED BRIDGE OVER THE LAVA RIVER
        // Lets Luffy safely cross between Languages (West) and Libraries/Tools (East)
        // ====================================================================
        const bridgeX = 0.05, bridgeZ = 1.1;
        const bridgeArch = box(g, 3.2, 0.35, 1.8, 0x4a423b, bridgeX, PLAT + 0.25, bridgeZ);
        // Approach ramps on West & East banks
        box(g, 0.9, 0.22, 1.7, 0x3d352e, bridgeX - 1.8, PLAT + 0.12, bridgeZ, { rz: 0.12 });
        box(g, 0.9, 0.22, 1.7, 0x3d352e, bridgeX + 1.8, PLAT + 0.12, bridgeZ, { rz: -0.12 });
        // Heavy volcanic basalt railings
        box(bridgeArch, 3.4, 0.4, 0.16, 0x322b26, 0, 0.32, 0.82);
        box(bridgeArch, 3.4, 0.4, 0.16, 0x322b26, 0, 0.32, -0.82);

        // Glowing volcanic amber crystal lanterns on the 4 bridge corners
        [
            { x: -1.4, z: 0.8 }, { x: 1.4, z: 0.8 },
            { x: -1.4, z: -0.8 }, { x: 1.4, z: -0.8 },
        ].forEach((lPost) => {
            cyl(bridgeArch, 0.08, 0.1, 0.65, 0x2e2722, lPost.x, 0.5, lPost.z, { seg: 6 });
            sph(bridgeArch, 0.16, 0xffc107, lPost.x, 0.9, lPost.z, {
                mat: { emissive: 0xff9800, emissiveIntensity: 1.3 },
            });
        });

        // ====================================================================
        // 5. VOLCANIC DYNAMIC LIGHTING
        // Warm glowing point lights for crater, river, and steam
        // ====================================================================
        const craterLight = new THREE.PointLight(0xff4d00, 2.6, 20);
        craterLight.position.set(vx, PLAT + 8.0, vz);
        g.add(craterLight);

        const riverLight = new THREE.PointLight(0xff3700, 1.7, 12);
        riverLight.position.set(bridgeX, PLAT + 1.1, bridgeZ);
        g.add(riverLight);

        // ====================================================================
        // 6. SOLID COLLISION BOUNDARIES
        // Completely encloses the mountain base, all rock crags, and platforms
        // so Luffy CANNOT walk inside any rock geometry
        // ====================================================================
        S.push(
            // Main mountain caldera cone (base radius 4.4, collision radius 4.8 - watertight barrier)
            { x: vx, z: vz, r: 4.8 },
            // Rear crags north of the mountain
            { x: vx - 3.6, z: vz - 2.2, r: 1.7 },
            { x: vx + 3.6, z: vz - 2.2, r: 1.7 },
            // Arched basalt footbridge (walkable platform at height 0.22)
            { x: bridgeX, z: bridgeZ, r: 1.4, h: 0.22 }
        );

        // Carved volcanic stone signposts for the 3 Study Districts
        const signLang = box(g, 1.3, 0.12, 0.5, 0x483a31, -4.8, PLAT + 0.9, 0.2);
        box(signLang, 0.14, 0.9, 0.14, 0x2e241f, 0, -0.45, 0);
        const signLib = box(g, 1.3, 0.12, 0.5, 0x483a31, 0, PLAT + 0.9, -0.7);
        box(signLib, 0.14, 0.9, 0.14, 0x2e241f, 0, -0.45, 0);
        const signTech = box(g, 1.3, 0.12, 0.5, 0x483a31, 4.8, PLAT + 0.9, 0.2);
        box(signTech, 0.14, 0.9, 0.14, 0x2e241f, 0, -0.45, 0);

        // ====================================================================
        // 7. CALDERA SMOKE COLUMN & MAGMA EMBERS
        // Billowing volcanic smoke column rising high into the sky
        // ====================================================================
        const smokeClouds = [];
        for (let i = 0; i < 11; i++) {
            const sm = new THREE.Mesh(
                new THREE.SphereGeometry(0.85 + (i % 3) * 0.35, 9, 8),
                new THREE.MeshPhongMaterial({
                    color: i % 2 === 0 ? 0x4f4945 : 0x68615c,
                    transparent: true,
                    opacity: 0.52,
                    flatShading: true,
                })
            );
            sm.position.set(vx, PLAT + 8.2, vz);
            g.add(sm);
            smokeClouds.push(sm);
        }

        // Floating glowing magma ember motes
        const embers = [];
        for (let e = 0; e < 8; e++) {
            const em = new THREE.Mesh(
                new THREE.OctahedronGeometry(0.2, 0),
                new THREE.MeshBasicMaterial({ color: 0xff8c00 })
            );
            g.add(em);
            embers.push({
                mesh: em,
                angle: (e / 8) * Math.PI * 2,
                dist: 1.1 + (e % 3) * 0.8,
                speed: 1.2 + e * 0.2,
                baseY: PLAT + 7.8,
            });
        }

        // ====================================================================
        // 8. THE 12 PUSHABLE TECH STUDY BLOCKS
        // Branded, pushable physics blocks with interactive study knowledge
        // ====================================================================
        const pushableTechProps = [
            // --- A. PROGRAMMING LANGUAGES (Left Volcanic Terrace) ---
            {
                type: 'box',
                id: 'tech_python',
                label: 'PYTHON',
                icon: '🐍',
                category: 'Languages',
                color: 0x3776ab,
                w: 1.0, h: 1.0, d: 1.0,
                mass: 1.0,
                x: -4.8, y: PLAT + 0.52, z: 1.6,
                studyData: {
                    title: 'Python',
                    icon: '🐍',
                    category: 'Programming Language',
                    level: 'Advanced / Core Stack',
                    desc: 'Primary language for AI/ML modeling, data pipelines, mathematical analysis, and high-performance asynchronous backends.',
                    skills: ['NumPy', 'Pandas', 'Scikit-Learn', 'FastAPI', 'Flask', 'OOP'],
                    mudassirExp: 'Architected supervised ML classification pipelines for disease diagnosis and automated analytical scripts with clean modular code.',
                    projects: ['AI/ML Health Prediction System', 'Data Science Analytics Toolkit'],
                },
            },
            {
                type: 'box',
                id: 'tech_javascript',
                label: 'JAVASCRIPT',
                icon: '⚡',
                category: 'Languages',
                color: 0xf7df1e,
                w: 1.0, h: 1.0, d: 1.0,
                mass: 1.0,
                x: -3.4, y: PLAT + 0.52, z: 2.7,
                studyData: {
                    title: 'JavaScript (ES6+)',
                    icon: '⚡',
                    category: 'Programming Language',
                    level: 'Advanced / Daily Driver',
                    desc: 'Deep mastery of asynchronous event-driven JavaScript, DOM manipulation, promises, closures, and full-stack architecture.',
                    skills: ['ES6+ Syntax', 'Async/Await', 'Event Loop', 'DOM Engine', 'WebSockets', 'WebGL / Canvas'],
                    mudassirExp: 'Engineered this entire 3D pirate sailing world in Three.js, built real-time WebSocket messaging, and developed interactive exam portals.',
                    projects: ['One Piece 3D Sailing Portfolio', 'QuizPro Exam System', 'Full-Stack E-Commerce'],
                },
            },
            {
                type: 'box',
                id: 'tech_typescript',
                label: 'TYPESCRIPT',
                icon: '🔷',
                category: 'Languages',
                color: 0x3178c6,
                w: 0.95, h: 0.95, d: 0.95,
                mass: 1.0,
                x: -4.8, y: PLAT + 0.5, z: 3.9,
                studyData: {
                    title: 'TypeScript',
                    icon: '🔷',
                    category: 'Programming Language',
                    level: 'Intermediate / Advanced',
                    desc: 'Static typing powerhouse enabling scalable architecture, strict contracts, interfaces, generics, and compile-time error prevention.',
                    skills: ['Type Interfaces', 'Generics', 'Strict Null Safety', 'Enums & Unions', 'Type Narrowing'],
                    mudassirExp: 'Utilized TypeScript to build predictable, bug-free components and strictly-typed API client layers in enterprise-grade applications.',
                    projects: ['Scalable Web Services', 'Typed Component Libraries'],
                },
            },
            {
                type: 'box',
                id: 'tech_cpp',
                label: 'C / C++',
                icon: '⚙️',
                category: 'Languages',
                color: 0x00599c,
                w: 0.95, h: 0.95, d: 0.95,
                mass: 1.1,
                x: -3.4, y: PLAT + 0.5, z: 5.1,
                studyData: {
                    title: 'C / C++',
                    icon: '⚙️',
                    category: 'Programming Language',
                    level: 'Intermediate (Data Structures & Algorithms)',
                    desc: 'Low-level systems language grounding in manual memory management, pointer arithmetic, and algorithmic problem solving.',
                    skills: ['Pointers & References', 'Memory Allocation', 'Time & Space Complexity', 'STL Algorithms', 'OOP'],
                    mudassirExp: 'Solved 150+ Data Structures & Algorithms problems (Arrays, Linked Lists, Trees, Dynamic Programming, Graphs) with peak efficiency.',
                    projects: ['Algorithm Visualizer', 'Competitive Programming LeetCode Portfolio'],
                },
            },

            // --- B. FRAMEWORKS & LIBRARIES (Center Lava Basin Banks) ---
            {
                type: 'box',
                id: 'tech_react',
                label: 'REACT',
                icon: '⚛️',
                category: 'Libraries',
                color: 0x61dafb,
                w: 1.0, h: 1.0, d: 1.0,
                mass: 1.0,
                x: -1.5, y: PLAT + 0.52, z: 2.4,
                studyData: {
                    title: 'React.js',
                    icon: '⚛️',
                    category: 'Frontend Library',
                    level: 'Advanced / Core Stack',
                    desc: 'Component-driven reactive UI framework utilizing state machines, hooks, reconciliation, virtual DOM diffing, and single-page routing.',
                    skills: ['Custom Hooks', 'Context API', 'State Architecture', 'Virtual DOM', 'React Router', 'Component Lifecycle'],
                    mudassirExp: 'Developed responsive client dashboards for QuizPro, interactive product feeds with live carts, and dynamic CMS panels.',
                    projects: ['QuizPro Exam Manager', 'E-Commerce Storefront', 'Interactive Admin CMS'],
                },
            },
            {
                type: 'box',
                id: 'tech_express',
                label: 'EXPRESS',
                icon: '🚂',
                category: 'Libraries',
                color: 0xffffff,
                w: 0.95, h: 0.95, d: 0.95,
                mass: 1.0,
                x: -1.5, y: PLAT + 0.5, z: 4.1,
                studyData: {
                    title: 'Express.js',
                    icon: '🚂',
                    category: 'Backend Framework',
                    level: 'Advanced / Core Stack',
                    desc: 'Minimalist web framework providing powerful routing pipelines, custom middleware stacks, rate limiting, and REST API controllers.',
                    skills: ['REST Controllers', 'Custom Middleware', 'JWT Auth Verification', 'Error Middleware', 'CORS Security'],
                    mudassirExp: 'Built secured RESTful CRUD endpoints for portfolio islands, messages database, user token sessions, and product catalogs.',
                    projects: ['Portfolio REST API', 'QuizPro Examination Engine', 'E-Commerce Checkout API'],
                },
            },
            {
                type: 'box',
                id: 'tech_threejs',
                label: 'THREE.JS',
                icon: '🌐',
                category: 'Libraries',
                color: 0x00f0ff,
                w: 1.0, h: 1.0, d: 1.0,
                mass: 1.0,
                x: 1.5, y: PLAT + 0.52, z: 2.1,
                studyData: {
                    title: 'Three.js / WebGL',
                    icon: '🌐',
                    category: '3D Graphics Library',
                    level: 'Advanced / Specialist',
                    desc: 'WebGL 3D graphics library for procedural geometry synthesis, realistic lighting, material shading, particle systems, and 3D camera controls.',
                    skills: ['Procedural Wave Shaders', 'Custom Mesh Geometries', 'Impulse Collision Physics', 'Canvas Textures', 'Scene Graph Optimization'],
                    mudassirExp: 'Designed this entire One Piece 3D world from scratch, including dynamic ocean swells with foam crests, ship buoyancy, and physics crates.',
                    projects: ['3D Sailing Pirate Portfolio', 'Procedural Ocean Simulation', 'Physics Prop Sandbox'],
                },
            },
            {
                type: 'box',
                id: 'tech_nodejs',
                label: 'NODE.JS',
                icon: '🟢',
                category: 'Libraries',
                color: 0x68a063,
                w: 1.0, h: 1.0, d: 1.0,
                mass: 1.0,
                x: 1.5, y: PLAT + 0.52, z: 3.6,
                studyData: {
                    title: 'Node.js',
                    icon: '🟢',
                    category: 'Backend Runtime',
                    level: 'Advanced / Core Stack',
                    desc: 'V8-powered asynchronous non-blocking event-driven runtime powering scalable microservices, background jobs, and RESTful servers.',
                    skills: ['Event Loop', 'Stream Pipelines', 'File System API', 'Cluster Management', 'NPM Tooling', 'Process Architecture'],
                    mudassirExp: 'Engineered the backend serving this 3D portfolio with multi-layered asset streaming, fallback data safety, and fast startup.',
                    projects: ['Portfolio Backend Daemon', 'QuizPro Backend API', 'Authentication Microservice'],
                },
            },

            // --- C. DATABASES, TOOLS & AI (Right Volcanic Terraces) ---
            {
                type: 'box',
                id: 'tech_mongodb',
                label: 'MONGODB',
                icon: '🍃',
                category: 'Tech & Tools',
                color: 0x47a248,
                w: 1.0, h: 1.0, d: 1.0,
                mass: 1.0,
                x: 3.4, y: PLAT + 0.52, z: 1.7,
                studyData: {
                    title: 'MongoDB & Mongoose',
                    icon: '🍃',
                    category: 'NoSQL Database',
                    level: 'Advanced / Core Stack',
                    desc: 'Document-oriented flexible NoSQL database with schema modeling, complex aggregation pipelines, indexing, and cloud Atlas scaling.',
                    skills: ['Mongoose ODM', 'Aggregation Pipelines', 'Schema Validation', 'Compound Indexing', 'MongoDB Atlas Cloud'],
                    mudassirExp: 'Structured flexible data schemas for dynamic island portfolios, quiz records, test submissions, and real-time contact messages.',
                    projects: ['QuizPro Examination DB', 'Portfolio Island CMS Store', 'User Profiles & Orders'],
                },
            },
            {
                type: 'box',
                id: 'tech_aiml',
                label: 'AI / ML',
                icon: '🤖',
                category: 'Tech & Tools',
                color: 0x8a2be2,
                w: 1.0, h: 1.0, d: 1.0,
                mass: 1.1,
                x: 4.8, y: PLAT + 0.52, z: 2.8,
                studyData: {
                    title: 'AI & Machine Learning',
                    icon: '🤖',
                    category: 'Artificial Intelligence',
                    level: 'Specialization (B.Tech in AI & Data Science)',
                    desc: 'Supervised & unsupervised machine learning, predictive analytics, feature engineering, model tuning, and data science workflows.',
                    skills: ['Scikit-Learn', 'Classification & Regression', 'Feature Scaling', 'Model Evaluation (F1/ROC)', 'Pandas EDA'],
                    mudassirExp: 'Trained and cross-validated multi-class health diagnostic prediction models, attaining strong predictive accuracy across test sets.',
                    projects: ['Multi-Disease Health Predictor', 'Predictive Analytics Suite', 'AI Exploratory Notebooks'],
                },
            },
            {
                type: 'box',
                id: 'tech_git',
                label: 'GIT',
                icon: '🐙',
                category: 'Tech & Tools',
                color: 0xf05032,
                w: 0.95, h: 0.95, d: 0.95,
                mass: 1.0,
                x: 3.2, y: PLAT + 0.5, z: 4.2,
                studyData: {
                    title: 'Git & GitHub',
                    icon: '🐙',
                    category: 'DevOps & Collaboration',
                    level: 'Advanced / Daily Driver',
                    desc: 'Distributed version control system, branch workflows, pull request reviews, rebasing, CI/CD automated deployments, and repository safety.',
                    skills: ['Branching Models (Gitflow)', 'Merge Conflicts', 'Interactive Rebase', 'GitHub Actions', 'Semantic Versioning'],
                    mudassirExp: 'Maintained production git repositories with structured commit histories, release tagging, and automated deployments.',
                    projects: ['All GitHub Open Source Repositories', 'Agile Collaborative Sprints'],
                },
            },
            {
                type: 'box',
                id: 'tech_api',
                label: 'REST APIs',
                icon: '🔌',
                category: 'Tech & Tools',
                color: 0xff6b35,
                w: 0.95, h: 0.95, d: 0.95,
                mass: 1.0,
                x: 4.7, y: PLAT + 0.5, z: 4.9,
                studyData: {
                    title: 'RESTful APIs & WebSockets',
                    icon: '🔌',
                    category: 'Network Architecture',
                    level: 'Advanced / Core Stack',
                    desc: 'Designing intuitive, stateless REST APIs with standardized HTTP status codes, structured JSON payloads, and bi-directional WebSockets.',
                    skills: ['REST Principles', 'Socket.io / WS Protocol', 'Token Bearer Auth', 'Status Codes & Errors', 'Postman Testing'],
                    mudassirExp: 'Architected full REST specifications and real-time bi-directional streaming protocols connecting client web apps to server clusters.',
                    projects: ['REST API Gateway', 'Real-Time Multi-Room Chat', 'Admin CMS Endpoints'],
                },
            },
        ];

        return {
            solids: S,
            props: pushableTechProps,
            update: (t) => {
                // 1. RUNNING LAVA DYNAMICS (Continuous downward flow offset)
                if (flowTex) {
                    flowTex.offset.y = -(t * 0.45) % 1; // Lava streams rush downwards!
                }
                if (poolTex) {
                    poolTex.offset.x = (t * 0.08) % 1;
                    poolTex.offset.y = Math.sin(t * 0.3) * 0.08;
                }

                // Pulsating emissive magma heat
                const pulse = 1.35 + Math.sin(t * 3.8) * 0.25;
                lavaMat.emissiveIntensity = pulse;
                poolMat.emissiveIntensity = 1.4 + Math.sin(t * 2.8 + 1.0) * 0.22;

                // 2. MAGMA BUBBLES IN CALDERA (Rise, expand, pop)
                magmaBubbles.forEach((b) => {
                    const cycle = (t * b.speed + b.offset) % 1;
                    const popY = Math.sin(cycle * Math.PI);
                    b.mesh.position.y = b.baseY + popY * 0.25;
                    b.mesh.scale.setScalar(0.4 + popY * 0.85);
                });

                // 3. DRIFTING CRATER CRUST PLATES
                craterPlates.forEach((cp) => {
                    const curA = cp.angle + t * cp.speed * 0.2;
                    cp.mesh.position.x = vx + Math.cos(curA) * cp.dist;
                    cp.mesh.position.z = vz + Math.sin(curA) * cp.dist;
                    cp.mesh.rotation.y = curA + 0.5;
                });

                // 4. THERMAL OCEAN STEAM PUFFS (Billow upward where lava hits sea)
                oceanSteamPuffs.forEach((st) => {
                    const cycle = (t * 0.65 + st.offset) % 1;
                    const spread = cycle * 0.9;
                    st.mesh.position.set(
                        oceanX - 0.2 + Math.cos(st.driftAngle) * spread,
                        0.25 + cycle * 3.2,
                        oceanZ + 1.1 + Math.sin(st.driftAngle) * spread - cycle * 0.4
                    );
                    st.mesh.scale.setScalar(0.6 + cycle * 2.4);
                    st.mesh.material.opacity = Math.max(0, 0.52 * (1 - cycle));
                });

                // Pulsing ocean water boiling foam ring
                const foamPulse = 1.0 + Math.sin(t * 4.5) * 0.12;
                oceanFoamRing.scale.set(foamPulse, 1, foamPulse);

                // Ocean molten splash sparks
                oceanSparks.forEach((sp) => {
                    const cycle = (t * sp.speed + sp.offset) % 1;
                    const arcY = Math.sin(cycle * Math.PI) * 0.9;
                    sp.mesh.position.set(
                        oceanX - 0.2 + sp.dx * cycle,
                        0.25 + arcY,
                        oceanZ + 1.1 + sp.dz * cycle
                    );
                });

                // 5. FLICKERING VOLCANIC LIGHTING
                craterLight.intensity = 2.5 + Math.sin(t * 7.5) * 0.35 + Math.cos(t * 12.0) * 0.2;
                riverLight.intensity = 1.6 + Math.sin(t * 6.0 + 1.5) * 0.25;

                // 6. BILLOWING VOLCANIC SMOKE COLUMN
                smokeClouds.forEach((sm, idx) => {
                    const cycle = (t * 0.2 + idx / smokeClouds.length) % 1;
                    const driftAngle = idx * 1.6 + t * 0.12;
                    const driftR = cycle * 2.4;
                    sm.position.set(
                        vx + Math.cos(driftAngle) * driftR,
                        PLAT + 8.2 + cycle * 8.2,
                        vz + Math.sin(driftAngle) * driftR - cycle * 2.0
                    );
                    sm.scale.setScalar(0.75 + cycle * 2.6);
                    sm.material.opacity = Math.max(0, 0.55 * (1 - cycle));
                });

                // 7. GLOWING MAGMA EMBERS
                embers.forEach((em) => {
                    const curAngle = em.angle + t * em.speed * 0.5;
                    em.mesh.position.set(
                        vx + Math.cos(curAngle) * em.dist,
                        em.baseY + Math.sin(t * em.speed + em.angle) * 0.65,
                        vz + Math.sin(curAngle) * em.dist
                    );
                    em.mesh.rotation.y = t * 2.5;
                    em.mesh.rotation.x = t * 1.8;
                });
            },
        };
    },
};

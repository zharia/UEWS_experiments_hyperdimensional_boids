/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { createSandMesh } from './sandTexture';
import { createProceduralRockTextures, createSculptedRockGeometry } from './rockTexture';
import {
  createAcroporaTreeGeometry,
  createGiantKelpGeometry,
  createCabombaMilfoilGeometry,
  createAmazonSwordGeometry,
} from './plantMorphology';
import { createPlantSplatMesh } from './plantSplats';
import { createPlantShaderMaterial } from './plantShaders';
import { PlantLifecycleSimulation } from '../simulation/plantLifecycle';

export interface CoralSceneObjects {
  coralGroup: THREE.Group;
  anemoneMesh: THREE.InstancedMesh;
  anemoneBasePositions: THREE.Vector3[];
  bubbleSystem: THREE.Points;
  bubblePositions: Float32Array;
  bubbleVelocities: Float32Array;
  plantMaterials: THREE.ShaderMaterial[];
  plantLifecycleSim: PlantLifecycleSimulation;
}

/**
 * Creates the coral reef ecosystem, procedural sand bed, upgraded botanical flora, and airstone.
 */
export function createCoralReef(scene: THREE.Scene): CoralSceneObjects {
  const coralGroup = new THREE.Group();
  coralGroup.name = 'coralReef';
  const plantMaterials: THREE.ShaderMaterial[] = [];
  const plantLifecycleSim = new PlantLifecycleSimulation();

  // 1. Procedural Sand bed / Sea floor with multi-frequency noise
  const sandMesh = createSandMesh();
  coralGroup.add(sandMesh);

  // 2. High-Fidelity Natural Reef Rocks (Sculpted organic stone with procedural strata & mineral veining)
  const { rockTexture, rockBumpTexture } = createProceduralRockTextures();
  const rockGeo = createSculptedRockGeometry(2.4, 2);
  const rockMat = new THREE.MeshStandardMaterial({
    color: 0xc8c2ba, // Crisp, natural, clearly visible stone grey/buff
    map: rockTexture,
    bumpMap: rockBumpTexture,
    bumpScale: 0.14,
    roughness: 0.68,
    metalness: 0.05,
    emissive: 0x2e2924, // Warm ambient baseline so rocks never collapse into pitch-black shadow
    emissiveIntensity: 0.42,
  });

  const rockPositions = [
    { x: -9.5, y: -5.8, z: -2.0, scale: [1.8, 1.4, 1.6] },
    { x: -7.0, y: -6.0, z: 1.5, scale: [1.4, 1.2, 1.3] },
    { x: 7.5, y: -5.9, z: -1.5, scale: [2.0, 1.5, 1.7] },
    { x: 9.8, y: -5.6, z: 1.2, scale: [1.6, 1.3, 1.4] },
    { x: -0.5, y: -6.2, z: -2.8, scale: [2.2, 1.1, 1.5] },
  ];

  rockPositions.forEach(r => {
    const rock = new THREE.Mesh(rockGeo, rockMat);
    rock.position.set(r.x, r.y, r.z);
    rock.scale.set(r.scale[0], r.scale[1], r.scale[2]);
    rock.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
    rock.castShadow = true;
    rock.receiveShadow = true;
    coralGroup.add(rock);
  });

  // 3. Brain Coral (Diploria) with undulating convolutions
  const brainGeo = new THREE.SphereGeometry(1.6, 36, 24);
  const bPos = brainGeo.attributes.position;
  for (let i = 0; i < bPos.count; i++) {
    const v = new THREE.Vector3().fromBufferAttribute(bPos, i);
    const phi = Math.atan2(v.z, v.x);
    const len = v.length();
    const cosVal = len > 0.0001 ? Math.max(-1, Math.min(1, v.y / len)) : 0;
    const theta = Math.acos(cosVal);
    const ridge = Math.sin(phi * 8.0 + Math.cos(theta * 6.0) * 3.0) * 0.14;
    const norm = len > 0.0001 ? v.clone().normalize() : new THREE.Vector3(0, 1, 0);
    v.addScaledVector(norm, ridge);
    bPos.setXYZ(i, v.x, v.y, v.z);
  }
  brainGeo.computeVertexNormals();
  brainGeo.computeBoundingSphere();

  const brainMat1 = new THREE.MeshStandardMaterial({
    color: 0x4fb89a,
    roughness: 0.65,
    metalness: 0.08,
  });
  const brainCoral1 = new THREE.Mesh(brainGeo, brainMat1);
  brainCoral1.position.set(-6.5, -4.6, 0.5);
  brainCoral1.scale.set(1.1, 0.9, 1.0);
  brainCoral1.receiveShadow = true;
  coralGroup.add(brainCoral1);

  const brainMat2 = new THREE.MeshStandardMaterial({
    color: 0xd95a72,
    roughness: 0.62,
    metalness: 0.08,
  });
  const brainCoral2 = new THREE.Mesh(brainGeo, brainMat2);
  brainCoral2.position.set(6.2, -4.8, -1.0);
  brainCoral2.scale.set(0.9, 0.8, 0.85);
  brainCoral2.receiveShadow = true;
  coralGroup.add(brainCoral2);

  // =========================================================================
  // 4. UPGRADED BOTANICAL FLORA (smin Collars, Splats & Biological Lifecycle)
  // =========================================================================

  // --- PLANT 1: Acropora Millepora Tree 1 (Amethyst / Royal Violet -> Neon Magenta) ---
  const treeMat1 = createPlantShaderMaterial({
    baseColor: new THREE.Color(0x281238),
    midColor: new THREE.Color(0x8a3ab9),
    tipColor: new THREE.Color(0xff49db),
    senescentColor: new THREE.Color(0x8a5528),
    minY: -6.8,
    maxY: -1.2,
    noiseScale: 1.35,
    swayStrength: 0.22,
  });
  plantMaterials.push(treeMat1);

  const treePos1 = new THREE.Vector3(-9.2, -6.6, -1.8);
  const treeData1 = createAcroporaTreeGeometry(treePos1, 3.4, 0.42, 4);
  const treeMesh1 = new THREE.Mesh(treeData1.stemGeometry, treeMat1);
  treeMesh1.castShadow = true;
  treeMesh1.receiveShadow = true;

  // Polyp splats for Tree 1
  const treeSplats1 = createPlantSplatMesh({
    splats: treeData1.splats,
    baseColor: new THREE.Color(0x8a3ab9),
    midColor: new THREE.Color(0xba45d4),
    tipColor: new THREE.Color(0xff6ef0),
    senescentColor: new THREE.Color(0x8a5528),
    subsurfaceColor: new THREE.Color(0xff88f5),
  });
  plantMaterials.push(treeSplats1.material);

  const treeGroup1 = new THREE.Group();
  treeGroup1.add(treeMesh1);
  treeGroup1.add(treeSplats1.mesh);
  coralGroup.add(treeGroup1);

  plantLifecycleSim.registerPlant({
    id: 'acropora_amethyst',
    commonName: 'Amethyst Staghorn Coral',
    scientificName: 'Acropora millepora',
    morphology: 'acropora_tree',
    origin: treePos1,
    baseScale: new THREE.Vector3(1, 1, 1),
    stage: 'flourishing',
    stageProgress: 0.5,
    overallProgress: 0.55,
    age: 65,
    lifespan: 140,
    speedMultiplier: 1.0,
    growthScale: 1.0,
    wiltAmount: 0.0,
    chlorosis: 0.0,
    health: 100,
    sporeEmit: 0.5,
    shedLeavesCount: 0,
    group: treeGroup1,
    stemMesh: treeMesh1,
    stemMaterial: treeMat1,
    splatMesh: treeSplats1.mesh,
    splatMaterial: treeSplats1.material,
  });

  // --- PLANT 2: Acropora Coral Tree 2 (Terracotta Umber -> Coral Amber -> Translucent Peach) ---
  const treeMat2 = createPlantShaderMaterial({
    baseColor: new THREE.Color(0x3d1c08),
    midColor: new THREE.Color(0xe66025),
    tipColor: new THREE.Color(0xffbe53),
    senescentColor: new THREE.Color(0x73401c),
    minY: -6.8,
    maxY: -1.0,
    noiseScale: 1.4,
    swayStrength: 0.24,
  });
  plantMaterials.push(treeMat2);

  const treePos2 = new THREE.Vector3(8.5, -6.6, -1.0);
  const treeData2 = createAcroporaTreeGeometry(treePos2, 3.6, 0.44, 4);
  const treeMesh2 = new THREE.Mesh(treeData2.stemGeometry, treeMat2);
  treeMesh2.castShadow = true;
  treeMesh2.receiveShadow = true;

  const treeSplats2 = createPlantSplatMesh({
    splats: treeData2.splats,
    baseColor: new THREE.Color(0xd95a20),
    midColor: new THREE.Color(0xf59e0b),
    tipColor: new THREE.Color(0xfde047),
    senescentColor: new THREE.Color(0x73401c),
    subsurfaceColor: new THREE.Color(0xfef08a),
  });
  plantMaterials.push(treeSplats2.material);

  const treeGroup2 = new THREE.Group();
  treeGroup2.add(treeMesh2);
  treeGroup2.add(treeSplats2.mesh);
  coralGroup.add(treeGroup2);

  plantLifecycleSim.registerPlant({
    id: 'acropora_amber',
    commonName: 'Sunfire Coral Bush',
    scientificName: 'Dendronephthya aurea',
    morphology: 'acropora_tree',
    origin: treePos2,
    baseScale: new THREE.Vector3(1, 1, 1),
    stage: 'growing',
    stageProgress: 0.6,
    overallProgress: 0.32,
    age: 42,
    lifespan: 130,
    speedMultiplier: 1.05,
    growthScale: 0.88,
    wiltAmount: 0.0,
    chlorosis: 0.0,
    health: 95,
    sporeEmit: 0.0,
    shedLeavesCount: 0,
    group: treeGroup2,
    stemMesh: treeMesh2,
    stemMaterial: treeMat2,
    splatMesh: treeSplats2.mesh,
    splatMaterial: treeSplats2.material,
  });

  // --- PLANT 3: Macrocystis Giant Kelp 1 (Deep Peat -> Emerald Chlorophyll -> Chartreuse Blades) ---
  const kelpMat1 = createPlantShaderMaterial({
    baseColor: new THREE.Color(0x0f2b18),
    midColor: new THREE.Color(0x16a34a),
    tipColor: new THREE.Color(0xa3e635),
    senescentColor: new THREE.Color(0xb58025),
    minY: -6.8,
    maxY: 1.5,
    noiseScale: 1.1,
    swayStrength: 0.45,
  });
  plantMaterials.push(kelpMat1);

  const kelpPos1 = new THREE.Vector3(-2.8, -6.8, -3.2);
  const kelpData1 = createGiantKelpGeometry(kelpPos1, 24, 7.8);
  const kelpMesh1 = new THREE.Mesh(kelpData1.stemGeometry, kelpMat1);
  kelpMesh1.receiveShadow = true;

  const kelpSplats1 = createPlantSplatMesh({
    splats: kelpData1.splats,
    baseColor: new THREE.Color(0x15803d),
    midColor: new THREE.Color(0x22c55e),
    tipColor: new THREE.Color(0xbbf7d0),
    senescentColor: new THREE.Color(0xb58025),
    subsurfaceColor: new THREE.Color(0xa3e635),
  });
  plantMaterials.push(kelpSplats1.material);

  const kelpGroup1 = new THREE.Group();
  kelpGroup1.add(kelpMesh1);
  kelpGroup1.add(kelpSplats1.mesh);
  coralGroup.add(kelpGroup1);

  plantLifecycleSim.registerPlant({
    id: 'giant_kelp_emerald',
    commonName: 'Giant Ribbon Kelp',
    scientificName: 'Macrocystis pyrifera',
    morphology: 'giant_kelp',
    origin: kelpPos1,
    baseScale: new THREE.Vector3(1, 1, 1),
    stage: 'flourishing',
    stageProgress: 0.35,
    overallProgress: 0.52,
    age: 82,
    lifespan: 160,
    speedMultiplier: 0.95,
    growthScale: 1.0,
    wiltAmount: 0.0,
    chlorosis: 0.0,
    health: 100,
    sporeEmit: 0.6,
    shedLeavesCount: 0,
    group: kelpGroup1,
    stemMesh: kelpMesh1,
    stemMaterial: kelpMat1,
    splatMesh: kelpSplats1.mesh,
    splatMaterial: kelpSplats1.material,
  });

  // --- PLANT 4: Macrocystis Kelp 2 (Abyssal Teal -> Seafoam Aquamarine -> Radiant Cyan) ---
  const kelpMat2 = createPlantShaderMaterial({
    baseColor: new THREE.Color(0x082630),
    midColor: new THREE.Color(0x0d9488),
    tipColor: new THREE.Color(0x38bdf8),
    senescentColor: new THREE.Color(0x78602b),
    minY: -6.8,
    maxY: 1.2,
    noiseScale: 1.15,
    swayStrength: 0.42,
  });
  plantMaterials.push(kelpMat2);

  const kelpPos2 = new THREE.Vector3(3.4, -6.8, -2.6);
  const kelpData2 = createGiantKelpGeometry(kelpPos2, 20, 7.2);
  const kelpMesh2 = new THREE.Mesh(kelpData2.stemGeometry, kelpMat2);
  kelpMesh2.receiveShadow = true;

  const kelpSplats2 = createPlantSplatMesh({
    splats: kelpData2.splats,
    baseColor: new THREE.Color(0x0e7490),
    midColor: new THREE.Color(0x06b6d4),
    tipColor: new THREE.Color(0xa5f3fc),
    senescentColor: new THREE.Color(0x78602b),
    subsurfaceColor: new THREE.Color(0x67e8f9),
  });
  plantMaterials.push(kelpSplats2.material);

  const kelpGroup2 = new THREE.Group();
  kelpGroup2.add(kelpMesh2);
  kelpGroup2.add(kelpSplats2.mesh);
  coralGroup.add(kelpGroup2);

  plantLifecycleSim.registerPlant({
    id: 'giant_kelp_cyan',
    commonName: 'Seafoam Ribbon Kelp',
    scientificName: 'Laminaria saccharina',
    morphology: 'giant_kelp',
    origin: kelpPos2,
    baseScale: new THREE.Vector3(1, 1, 1),
    stage: 'senescent',
    stageProgress: 0.25,
    overallProgress: 0.77,
    age: 115,
    lifespan: 150,
    speedMultiplier: 1.0,
    growthScale: 0.96,
    wiltAmount: 0.22,
    chlorosis: 0.35,
    health: 68,
    sporeEmit: 0.0,
    shedLeavesCount: 3,
    group: kelpGroup2,
    stemMesh: kelpMesh2,
    stemMaterial: kelpMat2,
    splatMesh: kelpSplats2.mesh,
    splatMaterial: kelpSplats2.material,
  });

  // --- PLANT 5: Cabomba Caroliniana (Fine-Feather Milfoil with Nodal Sheaths & Ruby Apical Buds) ---
  const milfoilMat = createPlantShaderMaterial({
    baseColor: new THREE.Color(0x1f2113),
    midColor: new THREE.Color(0x2e8b57),
    tipColor: new THREE.Color(0xf43f5e), // ruby apical tips
    senescentColor: new THREE.Color(0x996d28),
    minY: -6.8,
    maxY: 0.2,
    noiseScale: 1.6,
    swayStrength: 0.36,
  });
  plantMaterials.push(milfoilMat);

  const milfoilPos = new THREE.Vector3(0.5, -6.8, -1.6);
  const milfoilData = createCabombaMilfoilGeometry(milfoilPos, 6.5, 9);
  const milfoilMesh = new THREE.Mesh(milfoilData.stemGeometry, milfoilMat);
  milfoilMesh.receiveShadow = true;

  const milfoilSplats = createPlantSplatMesh({
    splats: milfoilData.splats,
    baseColor: new THREE.Color(0x166534),
    midColor: new THREE.Color(0x22c55e),
    tipColor: new THREE.Color(0xfb7185), // rose apical feather tips
    senescentColor: new THREE.Color(0x996d28),
    subsurfaceColor: new THREE.Color(0x86efac),
  });
  plantMaterials.push(milfoilSplats.material);

  const milfoilGroup = new THREE.Group();
  milfoilGroup.add(milfoilMesh);
  milfoilGroup.add(milfoilSplats.mesh);
  coralGroup.add(milfoilGroup);

  plantLifecycleSim.registerPlant({
    id: 'cabomba_ruby',
    commonName: 'Green & Pink Fanwort',
    scientificName: 'Cabomba caroliniana',
    morphology: 'cabomba_milfoil',
    origin: milfoilPos,
    baseScale: new THREE.Vector3(1, 1, 1),
    stage: 'growing',
    stageProgress: 0.85,
    overallProgress: 0.40,
    age: 48,
    lifespan: 120,
    speedMultiplier: 1.1,
    growthScale: 0.95,
    wiltAmount: 0.0,
    chlorosis: 0.0,
    health: 98,
    sporeEmit: 0.0,
    shedLeavesCount: 0,
    group: milfoilGroup,
    stemMesh: milfoilMesh,
    stemMaterial: milfoilMat,
    splatMesh: milfoilSplats.mesh,
    splatMaterial: milfoilSplats.material,
  });

  // --- PLANT 6: Echinodorus Amazon Sword (Broad Lanceolate Rosette with Midrib & Secondary Veins) ---
  const swordMat = createPlantShaderMaterial({
    baseColor: new THREE.Color(0x142e1b),
    midColor: new THREE.Color(0x15803d),
    tipColor: new THREE.Color(0x86efac), // luminous pale lime tips
    senescentColor: new THREE.Color(0xa87422),
    minY: -6.4,
    maxY: -1.2,
    noiseScale: 1.25,
    swayStrength: 0.28,
  });
  plantMaterials.push(swordMat);

  const swordPos = new THREE.Vector3(-5.2, -6.4, 0.4);
  const swordData = createAmazonSwordGeometry(swordPos, 16, 5.2);
  const swordMesh = new THREE.Mesh(swordData.stemGeometry, swordMat);
  swordMesh.receiveShadow = true;

  const swordSplats = createPlantSplatMesh({
    splats: swordData.splats,
    baseColor: new THREE.Color(0x166534),
    midColor: new THREE.Color(0x22c55e),
    tipColor: new THREE.Color(0x4ade80),
    senescentColor: new THREE.Color(0xa87422),
    subsurfaceColor: new THREE.Color(0x86efac),
  });
  plantMaterials.push(swordSplats.material);

  const swordGroup = new THREE.Group();
  swordGroup.add(swordMesh);
  swordGroup.add(swordSplats.mesh);
  coralGroup.add(swordGroup);

  plantLifecycleSim.registerPlant({
    id: 'amazon_sword_bleheri',
    commonName: 'Amazon Sword Plant',
    scientificName: 'Echinodorus bleheri',
    morphology: 'amazon_sword',
    origin: swordPos,
    baseScale: new THREE.Vector3(1, 1, 1),
    stage: 'sprout',
    stageProgress: 0.6,
    overallProgress: 0.09,
    age: 12,
    lifespan: 135,
    speedMultiplier: 0.9,
    growthScale: 0.32,
    wiltAmount: 0.0,
    chlorosis: 0.0,
    health: 90,
    sporeEmit: 0.0,
    shedLeavesCount: 0,
    group: swordGroup,
    stemMesh: swordMesh,
    stemMaterial: swordMat,
    splatMesh: swordSplats.mesh,
    splatMaterial: swordSplats.material,
  });

  // Add drifting plant detritus and luminous spore systems to scene
  coralGroup.add(plantLifecycleSim.detritusMesh);
  coralGroup.add(plantLifecycleSim.sporePoints);

  // 7. Tube Sponges with open osculum rims
  const spongeMat = new THREE.MeshStandardMaterial({
    color: 0xfa8231,
    roughness: 0.75,
    metalness: 0.08,
  });
  const spongePositions = [
    { x: -4.0, y: -5.4, z: -1.8, h: 2.4, r: 0.38 },
    { x: -3.5, y: -5.6, z: -1.5, h: 1.8, r: 0.32 },
    { x: -4.4, y: -5.8, z: -1.2, h: 1.4, r: 0.28 },
    { x: 4.2, y: -5.3, z: 0.8, h: 2.1, r: 0.35 },
    { x: 4.8, y: -5.6, z: 0.5, h: 1.6, r: 0.3 },
  ];

  spongePositions.forEach(sp => {
    const tubeGeo = new THREE.CylinderGeometry(sp.r * 1.1, sp.r * 0.8, sp.h, 12, 1, true);
    const sponge = new THREE.Mesh(tubeGeo, spongeMat);
    sponge.position.set(sp.x, sp.y + sp.h * 0.5, sp.z);
    sponge.rotation.z = (Math.random() - 0.5) * 0.2;
    sponge.rotation.x = (Math.random() - 0.5) * 0.2;
    sponge.receiveShadow = true;
    coralGroup.add(sponge);
  });

  // 8. Sea Anemone Forest (InstancedMesh with animated waving tentacles)
  const anemoneCount = 120;
  const tentacleGeo = new THREE.ConeGeometry(0.08, 1.4, 5);
  tentacleGeo.translate(0, 0.7, 0);

  const anemoneMat = new THREE.MeshStandardMaterial({
    color: 0xff6b81,
    roughness: 0.35,
    metalness: 0.15,
    emissive: 0x3a1020,
  });

  const anemoneMesh = new THREE.InstancedMesh(tentacleGeo, anemoneMat, anemoneCount);
  const dummy = new THREE.Object3D();
  const anemoneBasePositions: THREE.Vector3[] = [];

  const clusters = [
    { center: new THREE.Vector3(-6.2, -4.2, 1.2), count: 60, radius: 1.2 },
    { center: new THREE.Vector3(5.8, -4.4, 0.4), count: 60, radius: 1.1 },
  ];

  let idx = 0;
  clusters.forEach(c => {
    for (let i = 0; i < c.count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.sqrt(Math.random()) * c.radius;
      const x = c.center.x + Math.cos(angle) * dist;
      const y = c.center.y + (Math.random() - 0.5) * 0.3;
      const z = c.center.z + Math.sin(angle) * dist;

      dummy.position.set(x, y, z);
      dummy.rotation.x = (Math.random() - 0.5) * 0.6;
      dummy.rotation.z = (Math.random() - 0.5) * 0.6;
      dummy.rotation.y = Math.random() * Math.PI * 2;
      dummy.scale.set(1.0, 0.8 + Math.random() * 0.5, 1.0);
      dummy.updateMatrix();

      anemoneMesh.setMatrixAt(idx, dummy.matrix);
      anemoneBasePositions.push(new THREE.Vector3(x, y, z));
      idx++;
    }
  });
  anemoneMesh.instanceMatrix.needsUpdate = true;
  coralGroup.add(anemoneMesh);

  // 9. Airstone & Micro-Bubbles System
  const bubbleCount = 180;
  const bubbleGeo = new THREE.BufferGeometry();
  const bubblePositions = new Float32Array(bubbleCount * 3);
  const bubbleVelocities = new Float32Array(bubbleCount * 3);

  for (let i = 0; i < bubbleCount; i++) {
    bubblePositions[i * 3] = -8.0 + (Math.random() - 0.5) * 0.7;
    bubblePositions[i * 3 + 1] = -6.5 + Math.random() * 13.0;
    bubblePositions[i * 3 + 2] = -2.5 + (Math.random() - 0.5) * 0.7;

    bubbleVelocities[i * 3] = (Math.random() - 0.5) * 0.3;
    bubbleVelocities[i * 3 + 1] = 2.0 + Math.random() * 2.5;
    bubbleVelocities[i * 3 + 2] = (Math.random() - 0.5) * 0.3;
  }

  bubbleGeo.setAttribute('position', new THREE.BufferAttribute(bubblePositions, 3));

  const bubbleCanvas = document.createElement('canvas');
  bubbleCanvas.width = 64;
  bubbleCanvas.height = 64;
  const bCtx = bubbleCanvas.getContext('2d')!;
  const grad = bCtx.createRadialGradient(28, 28, 4, 32, 32, 28);
  grad.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
  grad.addColorStop(0.5, 'rgba(180, 240, 255, 0.6)');
  grad.addColorStop(0.9, 'rgba(100, 200, 255, 0.25)');
  grad.addColorStop(1, 'rgba(100, 200, 255, 0)');
  bCtx.fillStyle = grad;
  bCtx.beginPath();
  bCtx.arc(32, 32, 28, 0, Math.PI * 2);
  bCtx.fill();

  const bubbleTexture = new THREE.CanvasTexture(bubbleCanvas);
  const bubbleMat = new THREE.PointsMaterial({
    map: bubbleTexture,
    size: 0.35,
    transparent: true,
    opacity: 0.8,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const bubbleSystem = new THREE.Points(bubbleGeo, bubbleMat);
  coralGroup.add(bubbleSystem);

  scene.add(coralGroup);

  return {
    coralGroup,
    anemoneMesh,
    anemoneBasePositions,
    bubbleSystem,
    bubblePositions,
    bubbleVelocities,
    plantMaterials,
    plantLifecycleSim,
  };
}


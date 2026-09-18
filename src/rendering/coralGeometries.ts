/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { createSandMesh } from './sandTexture';
import {
  createGoldenBranchingCoralGeometry,
  createGoldenSpiralGrassGeometry,
  createGoldenWhorledPlantGeometry,
} from './goldenPlants';
import { createPlantShaderMaterial } from './plantShaders';

export interface CoralSceneObjects {
  coralGroup: THREE.Group;
  anemoneMesh: THREE.InstancedMesh;
  anemoneBasePositions: THREE.Vector3[];
  bubbleSystem: THREE.Points;
  bubblePositions: Float32Array;
  bubbleVelocities: Float32Array;
  plantMaterials: THREE.ShaderMaterial[];
}

/**
 * Creates the coral reef ecosystem, procedural sand bed, golden-ratio plants, and airstone.
 */
export function createCoralReef(scene: THREE.Scene): CoralSceneObjects {
  const coralGroup = new THREE.Group();
  coralGroup.name = 'coralReef';
  const plantMaterials: THREE.ShaderMaterial[] = [];

  // 1. Procedural Sand bed / Sea floor with multi-frequency noise
  const sandMesh = createSandMesh();
  coralGroup.add(sandMesh);

  // 2. Volcanic Reef Rocks (Base mounds for coral anchor)
  const rockGeo = new THREE.DodecahedronGeometry(2.4, 2);
  const rockMat = new THREE.MeshStandardMaterial({
    color: 0x3d3844,
    roughness: 0.9,
    metalness: 0.1,
    flatShading: true,
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

  // 4. Golden-Ratio Branching Coral Trees (Phyllotaxis with height-varying multi-frequency texture)
  // Tree 1: Violet / Amethyst -> Electric Magenta tips
  const coralTreeMat1 = createPlantShaderMaterial({
    baseColor: new THREE.Color(0x281238), // dark plum root
    midColor: new THREE.Color(0x8a3ab9),  // rich royal purple
    tipColor: new THREE.Color(0xff49db),  // glowing neon magenta tips
    minY: -6.8,
    maxY: -1.2,
    noiseScale: 1.35,
    swayStrength: 0.22,
  });
  plantMaterials.push(coralTreeMat1);

  const treeGeo1 = createGoldenBranchingCoralGeometry(new THREE.Vector3(-9.2, -6.6, -1.8), 3.4, 0.42, 4);
  const coralTree1 = new THREE.Mesh(treeGeo1, coralTreeMat1);
  coralTree1.castShadow = true;
  coralTree1.receiveShadow = true;
  coralGroup.add(coralTree1);

  // Tree 2: Terracotta Ochre -> Golden Amber -> Translucent Peach tips
  const coralTreeMat2 = createPlantShaderMaterial({
    baseColor: new THREE.Color(0x3d1c08), // earthy umber root
    midColor: new THREE.Color(0xe66025),  // warm coral amber
    tipColor: new THREE.Color(0xffbe53),  // translucent golden-peach tips
    minY: -6.8,
    maxY: -1.0,
    noiseScale: 1.4,
    swayStrength: 0.24,
  });
  plantMaterials.push(coralTreeMat2);

  const treeGeo2 = createGoldenBranchingCoralGeometry(new THREE.Vector3(8.5, -6.6, -1.0), 3.6, 0.44, 4);
  const coralTree2 = new THREE.Mesh(treeGeo2, coralTreeMat2);
  coralTree2.castShadow = true;
  coralTree2.receiveShadow = true;
  coralGroup.add(coralTree2);

  // 5. Golden Spiral Ribbon Kelp / Vallisneria (Golden logarithmic spiral sea grass)
  // Grass Cluster 1: Deep Forest Green -> Emerald -> Chartreuse tips
  const kelpMat1 = createPlantShaderMaterial({
    baseColor: new THREE.Color(0x0f2b18), // dark peat green
    midColor: new THREE.Color(0x16a34a),  // vibrant chlorophyll emerald
    tipColor: new THREE.Color(0xa3e635),  // golden chartreuse tips
    minY: -6.8,
    maxY: 1.5,
    noiseScale: 1.1,
    swayStrength: 0.45,
  });
  plantMaterials.push(kelpMat1);

  const kelpGeo1 = createGoldenSpiralGrassGeometry(new THREE.Vector3(-2.8, -6.8, -3.2), 26, 7.8);
  const kelpMesh1 = new THREE.Mesh(kelpGeo1, kelpMat1);
  kelpMesh1.receiveShadow = true;
  coralGroup.add(kelpMesh1);

  // Grass Cluster 2: Marine Teal -> Aquamarine -> Cyan seafoam tips
  const kelpMat2 = createPlantShaderMaterial({
    baseColor: new THREE.Color(0x082630), // deep abyssal navy
    midColor: new THREE.Color(0x0d9488),  // seafoam aquamarine
    tipColor: new THREE.Color(0x38bdf8),  // translucent radiant cyan
    minY: -6.8,
    maxY: 1.2,
    noiseScale: 1.15,
    swayStrength: 0.42,
  });
  plantMaterials.push(kelpMat2);

  const kelpGeo2 = createGoldenSpiralGrassGeometry(new THREE.Vector3(3.4, -6.8, -2.6), 22, 7.2);
  const kelpMesh2 = new THREE.Mesh(kelpGeo2, kelpMat2);
  kelpMesh2.receiveShadow = true;
  coralGroup.add(kelpMesh2);

  // 6. Golden Phyllotaxis Whorled Plants (Cabomba / Rotala with height-varying leaf whorls)
  // Plant 1: Olive bronze -> Jade -> Ruby apical buds
  const whorledMat1 = createPlantShaderMaterial({
    baseColor: new THREE.Color(0x1f2113),
    midColor: new THREE.Color(0x2e8b57),
    tipColor: new THREE.Color(0xf43f5e), // ruby apical tips
    minY: -6.8,
    maxY: 0.2,
    noiseScale: 1.6,
    swayStrength: 0.36,
  });
  plantMaterials.push(whorledMat1);

  const whorledGeo1 = createGoldenWhorledPlantGeometry(new THREE.Vector3(0.5, -6.8, -1.6), 6.5, 9);
  const whorledMesh1 = new THREE.Mesh(whorledGeo1, whorledMat1);
  whorledMesh1.receiveShadow = true;
  coralGroup.add(whorledMesh1);

  // Plant 2: Dusky umber -> Lime jade -> Golden amber tips
  const whorledMat2 = createPlantShaderMaterial({
    baseColor: new THREE.Color(0x1a2118),
    midColor: new THREE.Color(0x4ade80),
    tipColor: new THREE.Color(0xfacc15), // golden amber tips
    minY: -6.4,
    maxY: -1.0,
    noiseScale: 1.5,
    swayStrength: 0.32,
  });
  plantMaterials.push(whorledMat2);

  const whorledGeo2 = createGoldenWhorledPlantGeometry(new THREE.Vector3(-5.2, -6.2, 0.4), 5.0, 7);
  const whorledMesh2 = new THREE.Mesh(whorledGeo2, whorledMat2);
  whorledMesh2.receiveShadow = true;
  coralGroup.add(whorledMesh2);

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
  };
}

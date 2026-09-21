/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { MicroFaunaEntity } from '../types';
import { MicroFaunaSimulation } from '../simulation/microFauna';
import {
  createHighDetailCrabCarapaceGeometry,
  createHighDetailCrabLegGeometries,
  createHighDetailClawGeometries,
  createSpiralSnailShellGeometry,
  createOrganicSnailFootGeometry,
  createSnailTentacleGeometry,
  createShrimpCarapaceGeometry,
  createShrimpSomiteGeometry,
  createShrimpTelsonGeometry,
  createShrimpUropodGeometry,
  createShrimpPereiopodGeometry,
} from './proceduralMorphology';

interface CrabRigLeg {
  coxaGroup: THREE.Group;
  kneeGroup: THREE.Group;
  ankleGroup: THREE.Group;
  side: number;
  pairIndex: number;
}

interface MedusaTentacleChain {
  line: THREE.Line;
  positions: Float32Array;
  nodes: THREE.Vector3[];
  localBase: THREE.Vector3;
}

interface EntityRenderNode {
  group: THREE.Group;
  category: string;

  // Crab Rig Components
  leftClaw?: THREE.Group;
  rightClaw?: THREE.Group;
  leftDactyl?: THREE.Mesh;
  rightDactyl?: THREE.Mesh;
  crabLegs?: CrabRigLeg[];
  crabAntennules?: THREE.Group;
  crabEyestalks?: THREE.Group[];

  // Snail Rig Components
  shell?: THREE.Mesh;
  foot?: THREE.Mesh;
  leftTentacle?: THREE.Mesh;
  rightTentacle?: THREE.Mesh;
  snailHead?: THREE.Group;
  snailOperculum?: THREE.Mesh;

  // Medusa Rig Components (Soft-Body Dynamic Mesoglea & Bioluminescence)
  medusaBellMesh?: THREE.Mesh;
  medusaBasePositions?: Float32Array;
  medusaRingCanal?: THREE.Mesh;
  medusaRadialCanals?: THREE.Mesh[];
  medusaRhopalia?: THREE.Mesh[];
  medusaManubrium?: THREE.Group;
  medusaTentacles?: MedusaTentacleChain[];

  // Entity-specific bioluminescent materials for slight living glow
  medusaBellMat?: THREE.MeshStandardMaterial;
  medusaCanalsMat?: THREE.MeshStandardMaterial;
  medusaManubriumMat?: THREE.MeshStandardMaterial;
  medusaRhopaliaMat?: THREE.MeshStandardMaterial;
  medusaTentacleMat?: THREE.LineBasicMaterial;

  // Ghost Shrimp Rig Components
  shrimpSomiteGroups?: THREE.Group[];
  shrimpPereiopods?: THREE.Mesh[];
  shrimpPleopods?: THREE.Mesh[];
  shrimpAntennae?: THREE.Line[];
}

export interface JellyfishPalette {
  name: string;
  bellColor: number;
  bellEmissive: number;
  canalsColor: number;
  canalsEmissive: number;
  manubriumColor: number;
  manubriumEmissive: number;
  rhopaliaColor: number;
  rhopaliaEmissive: number;
  tentacleColor: number;
}

export const JELLYFISH_PALETTES: JellyfishPalette[] = [
  // 1. Electric Cyan / Aquamarine (crystalline azure glow)
  {
    name: 'Electric Cyan',
    bellColor: 0xd8f8ff,
    bellEmissive: 0x06b6d4,
    canalsColor: 0x38bdf8,
    canalsEmissive: 0x0284c7,
    manubriumColor: 0xf59e0b,
    manubriumEmissive: 0xd97706,
    rhopaliaColor: 0x67e8f9,
    rhopaliaEmissive: 0x06b6d4,
    tentacleColor: 0x38bdf8,
  },
  // 2. Bioluminescent Violet / Amethyst (ethereal orchid & deep purple glow)
  {
    name: 'Bioluminescent Violet',
    bellColor: 0xf5eeff,
    bellEmissive: 0x9333ea,
    canalsColor: 0xc084fc,
    canalsEmissive: 0x7e22ce,
    manubriumColor: 0xf43f5e,
    manubriumEmissive: 0xbe123c,
    rhopaliaColor: 0xe879f9,
    rhopaliaEmissive: 0xa855f7,
    tentacleColor: 0xc084fc,
  },
  // 3. Emerald Seafoam / Mint (glowing lagoon turquoise & mint)
  {
    name: 'Emerald Seafoam',
    bellColor: 0xdcfce7,
    bellEmissive: 0x10b981,
    canalsColor: 0x34d399,
    canalsEmissive: 0x059669,
    manubriumColor: 0xfbbf24,
    manubriumEmissive: 0xb45309,
    rhopaliaColor: 0x6ee7b7,
    rhopaliaEmissive: 0x10b981,
    tentacleColor: 0x34d399,
  },
  // 4. Sunset Coral / Rose Gold (warm glowing pink & gold)
  {
    name: 'Sunset Coral',
    bellColor: 0xffe4e6,
    bellEmissive: 0xf43f5e,
    canalsColor: 0xfb7185,
    canalsEmissive: 0xe11d48,
    manubriumColor: 0xfbbf24,
    manubriumEmissive: 0xd97706,
    rhopaliaColor: 0xfda4af,
    rhopaliaEmissive: 0xf43f5e,
    tentacleColor: 0xfb7185,
  },
  // 5. Deep Azure / Sapphire (glacial ice-blue & royal sapphire glow)
  {
    name: 'Deep Azure',
    bellColor: 0xe0f2fe,
    bellEmissive: 0x2563eb,
    canalsColor: 0x60a5fa,
    canalsEmissive: 0x1d4ed8,
    manubriumColor: 0x10b981,
    manubriumEmissive: 0x047857,
    rhopaliaColor: 0x93c5fd,
    rhopaliaEmissive: 0x3b82f6,
    tentacleColor: 0x60a5fa,
  },
];

interface SharedGeometryCache {
  // Crab geometries
  shoreCrabCarapace: THREE.BufferGeometry;
  crabCoxa: THREE.BufferGeometry;
  crabMerus: THREE.BufferGeometry;
  crabCarpus: THREE.BufferGeometry;
  crabDactylus: THREE.BufferGeometry;
  crabClawPropodus: THREE.BufferGeometry;
  crabClawDactylus: THREE.BufferGeometry;
  crabEyeStem: THREE.BufferGeometry;
  crabEyeCornea: THREE.BufferGeometry;
  crabAntennule: THREE.BufferGeometry;

  // Snail geometries
  neriteShell: THREE.BufferGeometry;
  mysteryShell: THREE.BufferGeometry;
  snailFoot: THREE.BufferGeometry;
  snailTentacle: THREE.BufferGeometry;
  snailOperculum: THREE.BufferGeometry;

  // Medusa geometries (Soft-Body Hydrozoan)
  medusaBellBase: THREE.BufferGeometry;
  medusaRingCanal: THREE.BufferGeometry;
  medusaRadialCanal: THREE.BufferGeometry;
  medusaRhopalium: THREE.BufferGeometry;
  medusaManubriumTube: THREE.BufferGeometry;
  medusaOralArm: THREE.BufferGeometry;

  // Ghost Shrimp geometries
  shrimpCarapace: THREE.BufferGeometry;
  shrimpSomites: THREE.BufferGeometry[];
  shrimpTelson: THREE.BufferGeometry;
  shrimpUropodExo: THREE.BufferGeometry;
  shrimpUropodEndo: THREE.BufferGeometry;
  shrimpPereiopod: THREE.BufferGeometry;
  shrimpPereiopodChela: THREE.BufferGeometry;
  shrimpPleopod: THREE.BufferGeometry;
  shrimpEyeCornea: THREE.BufferGeometry;
  shrimpInternalOrgan: THREE.BufferGeometry;
}

function createSoftBodyMedusaGeometry(): THREE.BufferGeometry {
  const rings = 22;
  const sectors = 32;
  const vertices: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  const apexHeight = 0.44;
  const rimRadius = 0.45;

  for (let r = 0; r <= rings; r++) {
    const v = r / rings; // 0 = apex, 1 = margin rim
    // Smooth parabolic bell dome
    const y = apexHeight * (1.0 - Math.pow(v, 1.85));
    // Radial bell profile with delicate inward curve at the velum lip
    let rad = rimRadius * Math.sin(v * Math.PI * 0.5);
    if (v > 0.90) {
      rad -= (v - 0.90) * 0.12;
    }

    for (let s = 0; s <= sectors; s++) {
      const u = s / sectors;
      const theta = u * Math.PI * 2;

      vertices.push(rad * Math.cos(theta), y, rad * Math.sin(theta));
      uvs.push(u, v);
    }
  }

  for (let r = 0; r < rings; r++) {
    for (let s = 0; s < sectors; s++) {
      const a = r * (sectors + 1) + s;
      const b = (r + 1) * (sectors + 1) + s;
      const c = (r + 1) * (sectors + 1) + (s + 1);
      const d = r * (sectors + 1) + (s + 1);

      indices.push(a, b, d);
      indices.push(b, c, d);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

export class MicroFaunaRenderer {
  public group: THREE.Group;
  private scene: THREE.Scene;
  private sim: MicroFaunaSimulation;
  private nodes: Map<string, EntityRenderNode> = new Map();

  // Pre-allocated static geometry cache
  private geoCache!: SharedGeometryCache;

  // Shared high-fidelity PBR Materials
  private materials!: {
    shoreCrabCarapace: THREE.MeshStandardMaterial;
    crabLeg: THREE.MeshStandardMaterial;
    crabLegJoint: THREE.MeshStandardMaterial;
    crabClawTip: THREE.MeshStandardMaterial;
    crabEye: THREE.MeshStandardMaterial;
    neriteShell: THREE.MeshStandardMaterial;
    mysteryShell: THREE.MeshStandardMaterial;
    snailFoot: THREE.MeshStandardMaterial;
    snailTentacle: THREE.MeshStandardMaterial;
    snailOperculum: THREE.MeshStandardMaterial;
    medusaBell: THREE.MeshStandardMaterial;
    medusaCanals: THREE.MeshStandardMaterial;
    medusaManubrium: THREE.MeshStandardMaterial;
    medusaRhopalia: THREE.MeshStandardMaterial;
    medusaTentacle: THREE.LineBasicMaterial;
    shrimpExoskeleton: THREE.MeshStandardMaterial;
    shrimpInternal: THREE.MeshStandardMaterial;
    shrimpEye: THREE.MeshStandardMaterial;
    shrimpAntenna: THREE.LineBasicMaterial;
  };

  constructor(scene: THREE.Scene, sim: MicroFaunaSimulation) {
    this.scene = scene;
    this.sim = sim;
    this.group = new THREE.Group();
    this.scene.add(this.group);

    this.initGeometries();
    this.initMaterials();
    this.rebuildMeshes();
  }

  private initGeometries() {
    // Generate high-detail crab leg & claw components
    const crabLegParts = createHighDetailCrabLegGeometries();
    const crabClawParts = createHighDetailClawGeometries();

    // Crab eyestalks & antennules
    const crabEyeStem = new THREE.CylinderGeometry(0.024, 0.028, 0.16, 12);
    const crabEyeCornea = new THREE.SphereGeometry(0.044, 12, 10);
    const crabAntennule = new THREE.CylinderGeometry(0.009, 0.004, 0.24, 8);

    // Snail operculum (trapdoor plate)
    const snailOperculum = new THREE.CylinderGeometry(0.14, 0.14, 0.015, 20);
    snailOperculum.scale(0.82, 1.0, 1.22);

    // Soft-Body Medusa Geometries
    const medusaBellBase = createSoftBodyMedusaGeometry();
    const medusaRingCanal = new THREE.TorusGeometry(0.44, 0.010, 8, 32);
    medusaRingCanal.rotateX(Math.PI * 0.5);

    const medusaRadialCanal = new THREE.CylinderGeometry(0.007, 0.007, 0.40, 8);
    medusaRadialCanal.translate(0, 0.20, 0);

    const medusaRhopalium = new THREE.SphereGeometry(0.020, 8, 8);

    const medusaManubriumTube = new THREE.CylinderGeometry(0.038, 0.068, 0.22, 14);
    medusaManubriumTube.translate(0, 0.11, 0);

    const medusaOralArm = new THREE.CylinderGeometry(0.014, 0.003, 0.26, 8);
    medusaOralArm.rotateX(0.18);

    // Ghost Shrimp Geometries
    const shrimpCarapace = createShrimpCarapaceGeometry();
    const shrimpSomites: THREE.BufferGeometry[] = [];
    for (let s = 0; s < 6; s++) {
      shrimpSomites.push(createShrimpSomiteGeometry(s));
    }
    const shrimpTelson = createShrimpTelsonGeometry();
    const shrimpUropodExo = createShrimpUropodGeometry(true);
    const shrimpUropodEndo = createShrimpUropodGeometry(false);
    const shrimpPereiopod = createShrimpPereiopodGeometry(false);
    const shrimpPereiopodChela = createShrimpPereiopodGeometry(true);
    const shrimpPleopod = new THREE.CylinderGeometry(0.007, 0.002, 0.15, 6);
    shrimpPleopod.translate(0, -0.075, 0);
    const shrimpEyeCornea = new THREE.SphereGeometry(0.034, 10, 8);
    const shrimpInternalOrgan = new THREE.SphereGeometry(0.048, 12, 10);
    shrimpInternalOrgan.scale(0.85, 0.9, 1.4);

    this.geoCache = {
      shoreCrabCarapace: createHighDetailCrabCarapaceGeometry(),
      crabCoxa: crabLegParts.coxa,
      crabMerus: crabLegParts.merus,
      crabCarpus: crabLegParts.carpusPropodus,
      crabDactylus: crabLegParts.dactylus,
      crabClawPropodus: crabClawParts.propodus,
      crabClawDactylus: crabClawParts.dactylus,
      crabEyeStem,
      crabEyeCornea,
      crabAntennule,

      neriteShell: createSpiralSnailShellGeometry(true),
      mysteryShell: createSpiralSnailShellGeometry(false),
      snailFoot: createOrganicSnailFootGeometry(),
      snailTentacle: createSnailTentacleGeometry(),
      snailOperculum,

      medusaBellBase,
      medusaRingCanal,
      medusaRadialCanal,
      medusaRhopalium,
      medusaManubriumTube,
      medusaOralArm,

      shrimpCarapace,
      shrimpSomites,
      shrimpTelson,
      shrimpUropodExo,
      shrimpUropodEndo,
      shrimpPereiopod,
      shrimpPereiopodChela,
      shrimpPleopod,
      shrimpEyeCornea,
      shrimpInternalOrgan,
    };
  }

  private initMaterials() {
    this.materials = {
      shoreCrabCarapace: new THREE.MeshStandardMaterial({
        color: 0xa83c26, // Deep rich carcinus terracotta rust
        roughness: 0.36,
        metalness: 0.14,
      }),
      crabLeg: new THREE.MeshStandardMaterial({
        color: 0xc25e36,
        roughness: 0.42,
        metalness: 0.08,
      }),
      crabLegJoint: new THREE.MeshStandardMaterial({
        color: 0x8a321c,
        roughness: 0.5,
      }),
      crabClawTip: new THREE.MeshStandardMaterial({
        color: 0x2e120c,
        roughness: 0.25,
        metalness: 0.3,
      }),
      crabEye: new THREE.MeshStandardMaterial({
        color: 0x08080a,
        roughness: 0.06,
        metalness: 0.95,
      }),
      neriteShell: new THREE.MeshStandardMaterial({
        color: 0x3e3830,
        roughness: 0.28,
        metalness: 0.18,
      }),
      mysteryShell: new THREE.MeshStandardMaterial({
        color: 0xd99a22,
        roughness: 0.22,
        metalness: 0.12,
      }),
      snailFoot: new THREE.MeshStandardMaterial({
        color: 0xede6dc,
        roughness: 0.32,
        transparent: true,
        opacity: 0.90,
      }),
      snailTentacle: new THREE.MeshStandardMaterial({
        color: 0xe0d6cb,
        roughness: 0.45,
      }),
      snailOperculum: new THREE.MeshStandardMaterial({
        color: 0x5a4838,
        roughness: 0.7,
        metalness: 0.05,
      }),
      medusaBell: new THREE.MeshStandardMaterial({
        color: 0xd6f4fa,
        roughness: 0.18,
        metalness: 0.05,
        transparent: true,
        opacity: 0.55,
        depthWrite: false,
        emissive: 0x0284c7,
        emissiveIntensity: 0.35,
      }),
      medusaCanals: new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        emissive: 0x0284c7,
        emissiveIntensity: 0.50,
        transparent: true,
        opacity: 0.80,
        depthWrite: false,
      }),
      medusaManubrium: new THREE.MeshStandardMaterial({
        color: 0xf59e0b,
        emissive: 0xb45309,
        emissiveIntensity: 0.35,
        roughness: 0.3,
        transparent: true,
        opacity: 0.85,
        depthWrite: false,
      }),
      medusaRhopalia: new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        emissive: 0x0284c7,
        emissiveIntensity: 0.45,
      }),
      medusaTentacle: new THREE.LineBasicMaterial({
        color: 0x7dd3fc,
        transparent: true,
        opacity: 0.65,
        depthWrite: false,
      }),
      shrimpExoskeleton: new THREE.MeshStandardMaterial({
        color: 0xebf8ff,
        roughness: 0.16,
        metalness: 0.05,
        transparent: true,
        opacity: 0.58,
        depthWrite: false,
      }),
      shrimpInternal: new THREE.MeshStandardMaterial({
        color: 0xd97706,
        roughness: 0.35,
        metalness: 0.1,
        emissive: 0xb45309,
        emissiveIntensity: 0.3,
      }),
      shrimpEye: new THREE.MeshStandardMaterial({
        color: 0x09090b,
        roughness: 0.1,
        metalness: 0.9,
      }),
      shrimpAntenna: new THREE.LineBasicMaterial({
        color: 0xc7d2fe,
        transparent: true,
        opacity: 0.7,
        depthWrite: false,
      }),
    };
  }

  private disposeNode(node: EntityRenderNode) {
    if (node.medusaBellMesh) {
      node.medusaBellMesh.geometry.dispose();
    }
    if (node.medusaTentacles) {
      for (const t of node.medusaTentacles) {
        t.line.geometry.dispose();
      }
    }
    if (node.shrimpAntennae) {
      for (const ant of node.shrimpAntennae) {
        ant.geometry.dispose();
      }
    }
    if (node.medusaBellMat) node.medusaBellMat.dispose();
    if (node.medusaCanalsMat) node.medusaCanalsMat.dispose();
    if (node.medusaManubriumMat) node.medusaManubriumMat.dispose();
    if (node.medusaRhopaliaMat) node.medusaRhopaliaMat.dispose();
    if (node.medusaTentacleMat) node.medusaTentacleMat.dispose();
  }

  public rebuildMeshes() {
    for (const [, node] of this.nodes.entries()) {
      this.disposeNode(node);
    }

    while (this.group.children.length > 0) {
      this.group.remove(this.group.children[0]);
    }
    this.nodes.clear();

    for (const entity of this.sim.entities) {
      let node: EntityRenderNode | null = null;
      switch (entity.category) {
        case 'crab':
          node = this.buildCrabMesh(entity);
          break;
        case 'snail':
          node = this.buildSnailMesh(entity);
          break;
        case 'medusa':
          node = this.buildMedusaMesh(entity);
          break;
        case 'shrimp':
          node = this.buildShrimpMesh(entity);
          break;
      }

      if (node) {
        this.nodes.set(entity.id, node);
        this.group.add(node.group);
      }
    }
  }

  // ==========================================================================
  // 1. HIGH-FIDELITY ANATOMICALLY SCULPTED CRAB RIG
  // ==========================================================================
  private buildCrabMesh(entity: MicroFaunaEntity): EntityRenderNode {
    const root = new THREE.Group();

    // Anatomically sculpted shore crab carapace with gastric/cardiac lobes & lateral denticles
    const shellMesh = new THREE.Mesh(this.geoCache.shoreCrabCarapace, this.materials.shoreCrabCarapace);
    shellMesh.position.y = 0.08;
    root.add(shellMesh);

    // 2. Eyestalks & Antennules
    const eyestalkGroups: THREE.Group[] = [];
    [-0.10, 0.10].forEach((xOffset) => {
      const eyeGrp = new THREE.Group();
      eyeGrp.position.set(xOffset, 0.18, 0.22);

      const stem = new THREE.Mesh(this.geoCache.crabEyeStem, this.materials.crabLeg);
      stem.rotation.x = 0.35;
      eyeGrp.add(stem);

      const cornea = new THREE.Mesh(this.geoCache.crabEyeCornea, this.materials.crabEye);
      cornea.position.set(0, 0.09, 0.04);
      eyeGrp.add(cornea);

      root.add(eyeGrp);
      eyestalkGroups.push(eyeGrp);
    });

    // Twin exploratory antennules between the eyestalks
    const antennuleGroup = new THREE.Group();
    antennuleGroup.position.set(0, 0.16, 0.26);
    [-0.03, 0.03].forEach(x => {
      const ant = new THREE.Mesh(this.geoCache.crabAntennule, this.materials.crabLeg);
      ant.position.set(x, 0.06, 0.04);
      ant.rotation.x = 0.5;
      ant.rotation.z = x * 3.0;
      antennuleGroup.add(ant);
    });
    root.add(antennuleGroup);

    // 3. Chelipeds (Claws): Articulated Arm, Swollen Propodus Palm & Clamping Dactylus
    const buildClaw = (isLeft: boolean) => {
      const clawGroup = new THREE.Group();
      const side = isLeft ? -1 : 1;
      const clawScale = 1.15;

      // Arm segment (merus/carpus) connecting from body socket
      const arm = new THREE.Mesh(this.geoCache.crabMerus, this.materials.crabLeg);
      arm.rotation.z = side * 0.72;
      arm.rotation.x = -0.32;
      arm.scale.set(clawScale, clawScale, clawScale);
      clawGroup.add(arm);

      // Palm (propodus) with fixed lower molariform pollex finger
      const palm = new THREE.Mesh(this.geoCache.crabClawPropodus, this.materials.shoreCrabCarapace);
      palm.position.set(side * 0.20 * clawScale, 0.04, 0.22 * clawScale);
      palm.rotation.y = side * 0.28;
      palm.scale.set(clawScale, clawScale, clawScale);
      clawGroup.add(palm);

      // Movable upper dactylus finger hinged at dorsal pivot of the palm
      const dactylPivot = new THREE.Group();
      dactylPivot.position.set(side * 0.20 * clawScale, 0.09 * clawScale, 0.32 * clawScale);
      dactylPivot.rotation.y = side * 0.28;

      const dactyl = new THREE.Mesh(this.geoCache.crabClawDactylus, this.materials.crabLeg);
      dactyl.scale.set(clawScale, clawScale, clawScale);
      dactylPivot.add(dactyl);
      clawGroup.add(dactylPivot);

      clawGroup.position.set(side * 0.26, 0.08, 0.14);
      root.add(clawGroup);

      return { clawGroup, dactyl: dactyl as unknown as THREE.Mesh };
    };

    const left = buildClaw(true);
    const right = buildClaw(false);

    // 4. Seamless Articulated Walking Legs (4 pairs for Shore Crab = 8 legs)
    const crabLegs: CrabRigLeg[] = [];
    const legPairs = 4;
    const sideOffsets = [-1, 1];

    sideOffsets.forEach(side => {
      for (let p = 0; p < legPairs; p++) {
        // Coxa pivot positioned directly at the ventral sternum sockets
        const coxaGroup = new THREE.Group();
        const legZ = -0.22 + p * 0.13;
        const legX = side * (0.34 - Math.abs(legZ) * 0.12);
        coxaGroup.position.set(legX, 0.04, legZ);

        // Angle legs radially outward like real crabs
        const legAngleY = (p - (legPairs - 1) * 0.5) * 0.32;
        coxaGroup.rotation.y = legAngleY;

        // Basal Coxa segment inserted into sternal socket
        const coxaMesh = new THREE.Mesh(this.geoCache.crabCoxa, this.materials.crabLegJoint);
        coxaMesh.rotation.z = side * (Math.PI * 0.22);
        coxaGroup.add(coxaMesh);

        // Segment 1: Merus (muscular upper thigh)
        const merusMesh = new THREE.Mesh(this.geoCache.crabMerus, this.materials.crabLeg);
        merusMesh.position.set(side * 0.06, 0.03, 0);
        merusMesh.rotation.z = side * (Math.PI * 0.38);
        coxaGroup.add(merusMesh);

        // Knee joint group at distal end of merus
        const kneeGroup = new THREE.Group();
        kneeGroup.position.set(side * 0.28, 0.14, 0);

        // Segment 2: Carpus & Propodus (knee + shin)
        const carpusMesh = new THREE.Mesh(this.geoCache.crabCarpus, this.materials.crabLeg);
        carpusMesh.rotation.z = side * (Math.PI * 0.68);
        kneeGroup.add(carpusMesh);

        // Ankle joint group at distal end of carpus/propodus
        const ankleGroup = new THREE.Group();
        ankleGroup.position.set(side * 0.18, -0.16, 0);

        // Segment 3: Dactylus (curved walking claw tip)
        const dactylMesh = new THREE.Mesh(this.geoCache.crabDactylus, this.materials.crabClawTip);
        dactylMesh.rotation.z = side * (Math.PI * 0.85);
        ankleGroup.add(dactylMesh);

        kneeGroup.add(ankleGroup);
        coxaGroup.add(kneeGroup);
        root.add(coxaGroup);

        crabLegs.push({ coxaGroup, kneeGroup, ankleGroup, side, pairIndex: p });
      }
    });

    const scale = entity.sizeScale * 1.55;
    root.scale.set(scale, scale, scale);

    return {
      group: root,
      category: 'crab',
      leftClaw: left.clawGroup,
      rightClaw: right.clawGroup,
      leftDactyl: left.dactyl,
      rightDactyl: right.dactyl,
      crabLegs,
      crabAntennules: antennuleGroup,
      crabEyestalks: eyestalkGroups,
      shell: shellMesh,
    };
  }

  // ==========================================================================
  // 2. HIGH-RESOLUTION GASTROPOD SNAIL RIG
  // ==========================================================================
  private buildSnailMesh(entity: MicroFaunaEntity): EntityRenderNode {
    const root = new THREE.Group();
    const isNerite = entity.species === 'nerite_snail';

    // 1. Helicospiral Shell
    const shellGeo = isNerite ? this.geoCache.neriteShell : this.geoCache.mysteryShell;
    const shellMat = isNerite ? this.materials.neriteShell : this.materials.mysteryShell;
    const shellMesh = new THREE.Mesh(shellGeo, shellMat);
    root.add(shellMesh);

    // 2. Cohesive Muscular Snail Foot with Smooth Sole
    const footMesh = new THREE.Mesh(this.geoCache.snailFoot, this.materials.snailFoot);
    root.add(footMesh);

    // 3. Operculum (Hard protective shell trapdoor)
    const operculum = new THREE.Mesh(this.geoCache.snailOperculum, this.materials.snailOperculum);
    operculum.position.set(0.02, 0.08, -0.18);
    operculum.rotation.x = Math.PI * 0.12;
    root.add(operculum);

    // 4. Snail Head & Sensory Ommatophore Tentacles
    const snailHead = new THREE.Group();
    snailHead.position.set(0, 0.06, 0.32);

    const leftTentacle = new THREE.Mesh(this.geoCache.snailTentacle, this.materials.snailTentacle);
    leftTentacle.position.set(-0.05, 0.04, 0);
    leftTentacle.rotation.z = 0.28;
    leftTentacle.rotation.x = 0.45;
    snailHead.add(leftTentacle);

    const rightTentacle = new THREE.Mesh(this.geoCache.snailTentacle, this.materials.snailTentacle);
    rightTentacle.position.set(0.05, 0.04, 0);
    rightTentacle.rotation.z = -0.28;
    rightTentacle.rotation.x = 0.45;
    snailHead.add(rightTentacle);

    root.add(snailHead);

    const scale = entity.sizeScale * 0.95;
    root.scale.set(scale, scale, scale);

    return {
      group: root,
      category: 'snail',
      shell: shellMesh,
      foot: footMesh,
      leftTentacle,
      rightTentacle,
      snailHead,
      snailOperculum: operculum,
    };
  }

  // ==========================================================================
  // 3. BIOLUMINESCENT HYDROMEDUSA RIG (Soft-Body Gelatinous Hydrozoan)
  // ==========================================================================
  private buildMedusaMesh(entity: MicroFaunaEntity): EntityRenderNode {
    const root = new THREE.Group();

    // Pick distinct bioluminescent color palette per entity
    let hash = 0;
    for (let i = 0; i < entity.id.length; i++) {
      hash = (hash << 5) - hash + entity.id.charCodeAt(i);
      hash |= 0;
    }
    const paletteIdx = Math.abs(hash) % JELLYFISH_PALETTES.length;
    const palette = JELLYFISH_PALETTES[paletteIdx];

    // Individual bioluminescent materials for slight living glow
    const bellMat = new THREE.MeshStandardMaterial({
      color: palette.bellColor,
      roughness: 0.18,
      metalness: 0.05,
      transparent: true,
      opacity: 0.58,
      depthWrite: false,
      emissive: palette.bellEmissive,
      emissiveIntensity: 0.40,
    });

    const canalsMat = new THREE.MeshStandardMaterial({
      color: palette.canalsColor,
      emissive: palette.canalsEmissive,
      emissiveIntensity: 0.65,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
    });

    const manubriumMat = new THREE.MeshStandardMaterial({
      color: palette.manubriumColor,
      emissive: palette.manubriumEmissive,
      emissiveIntensity: 0.45,
      roughness: 0.28,
      transparent: true,
      opacity: 0.88,
      depthWrite: false,
    });

    const rhopaliaMat = new THREE.MeshStandardMaterial({
      color: palette.rhopaliaColor,
      emissive: palette.rhopaliaEmissive,
      emissiveIntensity: 0.70,
    });

    const tentacleMat = new THREE.LineBasicMaterial({
      color: palette.tentacleColor,
      transparent: true,
      opacity: 0.72,
      depthWrite: false,
    });

    // 1. Soft-Body Deformable Bell Mesh
    // Clone instance-specific geometry and store rest coordinates for dynamic deformation
    const bellGeo = this.geoCache.medusaBellBase.clone();
    const basePositions = Float32Array.from(bellGeo.attributes.position.array);

    const bellMesh = new THREE.Mesh(bellGeo, bellMat);
    root.add(bellMesh);

    // 2. Marginal Ring Canal (Glows along the lower margin rim)
    const ringMesh = new THREE.Mesh(this.geoCache.medusaRingCanal, canalsMat);
    ringMesh.position.y = 0.01;
    root.add(ringMesh);

    // 3. 4 Radiating Canals (Radiating from apex to margin rim)
    const radialCanals: THREE.Mesh[] = [];
    for (let c = 0; c < 4; c++) {
      const canal = new THREE.Mesh(this.geoCache.medusaRadialCanal, canalsMat);
      canal.rotation.y = (c * Math.PI) / 2;
      canal.rotation.z = 0.76;
      canal.position.set(0, 0.05, 0);
      root.add(canal);
      radialCanals.push(canal);
    }

    // 4. Marginal Rhopalia Beads (12 glowing sensory light beads along rim)
    const rhopalia: THREE.Mesh[] = [];
    for (let r = 0; r < 12; r++) {
      const angle = (r / 12) * Math.PI * 2;
      const rhop = new THREE.Mesh(this.geoCache.medusaRhopalium, rhopaliaMat);
      rhop.position.set(Math.cos(angle) * 0.44, 0.01, Math.sin(angle) * 0.44);
      root.add(rhop);
      rhopalia.push(rhop);
    }

    // 5. Central Manubrium & 4 Oral Arms (Hanging in subumbrella cavity)
    const manubriumGroup = new THREE.Group();
    manubriumGroup.position.set(0, 0.18, 0);

    const tube = new THREE.Mesh(this.geoCache.medusaManubriumTube, manubriumMat);
    tube.position.set(0, -0.06, 0);
    manubriumGroup.add(tube);

    for (let a = 0; a < 4; a++) {
      const arm = new THREE.Mesh(this.geoCache.medusaOralArm, manubriumMat);
      arm.position.set(0, -0.04, 0);
      arm.rotation.y = (a * Math.PI) / 2;
      manubriumGroup.add(arm);
    }
    root.add(manubriumGroup);

    // 6. Trailing Marginal Tentacles (12 delicate dynamic hydrozoan tentacles)
    const tentacleChains: MedusaTentacleChain[] = [];
    const numTentacles = 12;
    const numNodes = 10;
    const initialSpacing = 0.10 * entity.sizeScale;
    const rimRadius = 0.44;

    for (let t = 0; t < numTentacles; t++) {
      const angle = (t / numTentacles) * Math.PI * 2;
      const localBase = new THREE.Vector3(Math.cos(angle) * rimRadius, 0.01, Math.sin(angle) * rimRadius);

      const positions = new Float32Array(numNodes * 3);
      const nodes: THREE.Vector3[] = [];

      for (let j = 0; j < numNodes; j++) {
        const worldPt = new THREE.Vector3(
          entity.x + localBase.x * entity.sizeScale * 1.3,
          entity.y + localBase.y * entity.sizeScale * 1.3 - j * initialSpacing,
          entity.z + localBase.z * entity.sizeScale * 1.3
        );
        nodes.push(worldPt);

        positions[j * 3] = localBase.x;
        positions[j * 3 + 1] = localBase.y - j * initialSpacing;
        positions[j * 3 + 2] = localBase.z;
      }

      const lineGeo = new THREE.BufferGeometry();
      lineGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const line = new THREE.Line(lineGeo, tentacleMat);
      root.add(line);

      tentacleChains.push({
        line,
        positions,
        nodes,
        localBase,
      });
    }

    const scale = entity.sizeScale * 1.3;
    root.scale.set(scale, scale, scale);

    return {
      group: root,
      category: 'medusa',
      medusaBellMesh: bellMesh,
      medusaBasePositions: basePositions,
      medusaRingCanal: ringMesh,
      medusaRadialCanals: radialCanals,
      medusaRhopalia: rhopalia,
      medusaManubrium: manubriumGroup,
      medusaTentacles: tentacleChains,
      medusaBellMat: bellMat,
      medusaCanalsMat: canalsMat,
      medusaManubriumMat: manubriumMat,
      medusaRhopaliaMat: rhopaliaMat,
      medusaTentacleMat: tentacleMat,
    };
  }

  // ==========================================================================
  // 4. HIGH-RESOLUTION GHOST SHRIMP RIG (PALAEMONETES TRANSLUCENT CARIDOID)
  // ==========================================================================
  private buildShrimpMesh(entity: MicroFaunaEntity): EntityRenderNode {
    const root = new THREE.Group();

    // 1. Translucent Carapace with Serrated Rostrum
    const carapaceMesh = new THREE.Mesh(this.geoCache.shrimpCarapace, this.materials.shrimpExoskeleton);
    root.add(carapaceMesh);

    // Internal Visceral Organ / Hepatopancreas (Amber Glowing Gem inside Glass Cephalothorax)
    const organMesh = new THREE.Mesh(this.geoCache.shrimpInternalOrgan, this.materials.shrimpInternal);
    organMesh.position.set(0, 0.02, -0.04);
    root.add(organMesh);

    // 2. Dark Compound Stalked Eyes
    const eyeL = new THREE.Mesh(this.geoCache.shrimpEyeCornea, this.materials.shrimpEye);
    eyeL.position.set(-0.065, 0.05, 0.16);
    root.add(eyeL);

    const eyeR = new THREE.Mesh(this.geoCache.shrimpEyeCornea, this.materials.shrimpEye);
    eyeR.position.set(0.065, 0.05, 0.16);
    root.add(eyeR);

    // 3. Long Sweeping Sensory Antennae
    const shrimpAntennae: THREE.Line[] = [];
    const buildAntenna = (isLeft: boolean) => {
      const numPts = 14;
      const pts: THREE.Vector3[] = [];
      const side = isLeft ? -1 : 1;
      for (let i = 0; i < numPts; i++) {
        const t = i / (numPts - 1);
        const z = 0.18 + Math.sin(t * Math.PI * 0.4) * 0.12 - t * 0.85;
        const x = side * (0.05 + Math.sin(t * Math.PI * 0.6) * 0.18);
        const y = 0.06 + Math.sin(t * Math.PI * 0.8) * 0.14 - t * 0.05;
        pts.push(new THREE.Vector3(x, y, z));
      }
      const lineGeo = new THREE.BufferGeometry().setFromPoints(pts);
      const line = new THREE.Line(lineGeo, this.materials.shrimpAntenna);
      root.add(line);
      shrimpAntennae.push(line);
    };
    buildAntenna(true);
    buildAntenna(false);

    // 4. Ventral Pereiopods (Walking Legs with miniature chelae)
    const shrimpPereiopods: THREE.Mesh[] = [];
    const numLegs = 5;
    for (let l = 0; l < numLegs; l++) {
      const hasChela = l < 2;
      const legGeo = hasChela ? this.geoCache.shrimpPereiopodChela : this.geoCache.shrimpPereiopod;
      const zOffset = 0.08 - l * 0.055;

      const legL = new THREE.Mesh(legGeo, this.materials.shrimpExoskeleton);
      legL.position.set(-0.06, -0.04, zOffset);
      legL.rotation.z = 0.28;
      legL.rotation.x = -0.15 + l * 0.08;
      root.add(legL);
      shrimpPereiopods.push(legL);

      const legR = new THREE.Mesh(legGeo, this.materials.shrimpExoskeleton);
      legR.position.set(0.06, -0.04, zOffset);
      legR.rotation.z = -0.28;
      legR.rotation.x = -0.15 + l * 0.08;
      root.add(legR);
      shrimpPereiopods.push(legR);
    }

    // 5. Hierarchically Articulated 6 Abdominal Somites (Chained Tail Engine)
    const shrimpSomiteGroups: THREE.Group[] = [];
    const shrimpPleopods: THREE.Mesh[] = [];
    let currentParent: THREE.Group = root;

    for (let s = 0; s < 6; s++) {
      const somiteGroup = new THREE.Group();
      if (s === 0) {
        somiteGroup.position.set(0, 0, -0.22);
      } else {
        somiteGroup.position.set(0, -0.015, -0.14);
      }

      const somiteMesh = new THREE.Mesh(this.geoCache.shrimpSomites[s], this.materials.shrimpExoskeleton);
      somiteGroup.add(somiteMesh);

      // Ventral swimmerets (pleopods) under somites 0 to 4
      if (s < 5) {
        const pleopodL = new THREE.Mesh(this.geoCache.shrimpPleopod, this.materials.shrimpExoskeleton);
        pleopodL.position.set(-0.035, -0.06, 0);
        pleopodL.rotation.z = 0.25;
        somiteGroup.add(pleopodL);
        shrimpPleopods.push(pleopodL);

        const pleopodR = new THREE.Mesh(this.geoCache.shrimpPleopod, this.materials.shrimpExoskeleton);
        pleopodR.position.set(0.035, -0.06, 0);
        pleopodR.rotation.z = -0.25;
        somiteGroup.add(pleopodR);
        shrimpPleopods.push(pleopodR);
      }

      currentParent.add(somiteGroup);
      shrimpSomiteGroups.push(somiteGroup);
      currentParent = somiteGroup;
    }

    // 6. Tail Fan: Telson Spine + Uropods
    const telsonMesh = new THREE.Mesh(this.geoCache.shrimpTelson, this.materials.shrimpExoskeleton);
    telsonMesh.position.set(0, 0, -0.08);
    currentParent.add(telsonMesh);

    const uropodExoL = new THREE.Mesh(this.geoCache.shrimpUropodExo, this.materials.shrimpExoskeleton);
    uropodExoL.position.set(-0.03, -0.01, -0.06);
    uropodExoL.rotation.y = 0.32;
    currentParent.add(uropodExoL);

    const uropodExoR = new THREE.Mesh(this.geoCache.shrimpUropodExo, this.materials.shrimpExoskeleton);
    uropodExoR.position.set(0.03, -0.01, -0.06);
    uropodExoR.rotation.y = -0.32;
    currentParent.add(uropodExoR);

    const uropodEndoL = new THREE.Mesh(this.geoCache.shrimpUropodEndo, this.materials.shrimpExoskeleton);
    uropodEndoL.position.set(-0.015, -0.005, -0.06);
    uropodEndoL.rotation.y = 0.16;
    currentParent.add(uropodEndoL);

    const uropodEndoR = new THREE.Mesh(this.geoCache.shrimpUropodEndo, this.materials.shrimpExoskeleton);
    uropodEndoR.position.set(0.015, -0.005, -0.06);
    uropodEndoR.rotation.y = -0.16;
    currentParent.add(uropodEndoR);

    const scale = entity.sizeScale * 1.35;
    root.scale.set(scale, scale, scale);

    return {
      group: root,
      category: 'shrimp',
      shrimpSomiteGroups,
      shrimpPereiopods,
      shrimpPleopods,
      shrimpAntennae,
    };
  }

  // ==========================================================================
  // RENDER LOOP & REAL-TIME ANATOMICAL ANIMATION
  // ==========================================================================
  public update(dt: number) {
    const currentEntityIds = new Set(this.sim.entities.map(e => e.id));

    // Remove defunct entities
    for (const [id, node] of this.nodes.entries()) {
      if (!currentEntityIds.has(id)) {
        this.disposeNode(node);
        this.group.remove(node.group);
        this.nodes.delete(id);
      }
    }

    // Update active entities
    for (const entity of this.sim.entities) {
      let node = this.nodes.get(entity.id);
      if (!node) {
        switch (entity.category) {
          case 'crab':
            node = this.buildCrabMesh(entity);
            break;
          case 'snail':
            node = this.buildSnailMesh(entity);
            break;
          case 'medusa':
            node = this.buildMedusaMesh(entity);
            break;
          case 'shrimp':
            node = this.buildShrimpMesh(entity);
            break;
        }
        if (node) {
          this.nodes.set(entity.id, node);
          this.group.add(node.group);
        }
      }

      if (!node) continue;

      // Synchronize world transform
      node.group.position.set(entity.x, entity.y, entity.z);
      node.group.rotation.set(entity.pitch, entity.rotationY, entity.roll);

      switch (entity.category) {
        case 'crab':
          this.animateCrab(node, entity);
          break;
        case 'snail':
          this.animateSnail(node, entity);
          break;
        case 'medusa':
          this.animateMedusa(node, entity, dt);
          break;
        case 'shrimp':
          this.animateShrimp(node, entity);
          break;
      }
    }
  }

  private animateCrab(node: EntityRenderNode, entity: MicroFaunaEntity) {
    const cycle = entity.animCycle;
    const isMoving = Math.abs(entity.vx) > 0.05 || Math.abs(entity.vz) > 0.05;

    // 1. Articulated Walking Leg Kinematics (Alternating Decapod Tripod Gait)
    if (node.crabLegs) {
      for (let i = 0; i < node.crabLegs.length; i++) {
        const { coxaGroup, kneeGroup, ankleGroup, side, pairIndex } = node.crabLegs[i];
        const phaseOffset = (pairIndex % 2) * Math.PI + (side < 0 ? 0 : Math.PI);

        if (isMoving) {
          const stepWave = Math.sin(cycle * 3.4 + phaseOffset);
          const liftWave = Math.cos(cycle * 3.4 + phaseOffset);

          coxaGroup.rotation.y = (pairIndex - 1.5) * 0.28 + stepWave * 0.24;
          kneeGroup.rotation.z = Math.max(0, liftWave) * 0.32 * side;
          kneeGroup.rotation.x = stepWave * 0.12;
          ankleGroup.rotation.z = -Math.max(0, liftWave) * 0.22 * side;
        } else {
          coxaGroup.rotation.y = (pairIndex - 1.5) * 0.28;
          kneeGroup.rotation.z *= 0.88;
          kneeGroup.rotation.x *= 0.88;
          ankleGroup.rotation.z *= 0.88;
        }
      }
    }

    // 2. Cheliped Claws Posture & Pincer Snapping / Grooming / Sifting
    if (node.leftClaw && node.rightClaw) {
      if (entity.state === 'defensive') {
        // Threat display: both claws held high in aggressive stance
        node.leftClaw.rotation.z = -0.92;
        node.leftClaw.rotation.x = -0.55 + Math.sin(cycle * 5.0) * 0.15;
        node.rightClaw.rotation.z = 0.92;
        node.rightClaw.rotation.x = -0.55 + Math.cos(cycle * 5.0) * 0.15;

        if (node.leftDactyl) node.leftDactyl.rotation.z = -0.72;
        if (node.rightDactyl) node.rightDactyl.rotation.z = 0.72;
      } else if (entity.state === 'eating') {
        // Alternating pincers bringing food to mouthparts
        node.leftClaw.rotation.z = -0.22 + Math.sin(cycle * 4.0) * 0.22;
        node.rightClaw.rotation.z = 0.22 - Math.cos(cycle * 4.0) * 0.22;
        node.leftClaw.rotation.x = -0.18;
        node.rightClaw.rotation.x = -0.18;

        if (node.leftDactyl) node.leftDactyl.rotation.z = Math.sin(cycle * 7.0) * 0.28;
        if (node.rightDactyl) node.rightDactyl.rotation.z = Math.cos(cycle * 7.0) * 0.28;
      } else if (entity.state === 'foraging' && isMoving) {
        // Substrate sifting: claws dip down toward sand
        node.leftClaw.rotation.z = -0.36;
        node.rightClaw.rotation.z = 0.36;
        node.leftClaw.rotation.x = 0.14 + Math.sin(cycle * 2.8) * 0.12;
        node.rightClaw.rotation.x = 0.14 + Math.cos(cycle * 2.8) * 0.12;

        if (node.leftDactyl) node.leftDactyl.rotation.z = Math.max(0, Math.sin(cycle * 3.0)) * 0.2;
        if (node.rightDactyl) node.rightDactyl.rotation.z = Math.max(0, Math.cos(cycle * 3.0)) * 0.2;
      } else if (!isMoving) {
        // Idle Grooming: claws tuck in and rub mouthparts / maxillipeds
        node.leftClaw.rotation.z = -0.18 + Math.sin(cycle * 3.0) * 0.06;
        node.rightClaw.rotation.z = 0.18 - Math.sin(cycle * 3.0) * 0.06;
        node.leftClaw.rotation.x = -0.22;
        node.rightClaw.rotation.x = -0.22;

        if (node.leftDactyl) node.leftDactyl.rotation.z = 0;
        if (node.rightDactyl) node.rightDactyl.rotation.z = 0;
      } else {
        node.leftClaw.rotation.z = -0.32 + Math.sin(cycle * 1.2) * 0.05;
        node.rightClaw.rotation.z = 0.32 - Math.sin(cycle * 1.2) * 0.05;
        node.leftClaw.rotation.x = 0.06;
        node.rightClaw.rotation.x = 0.06;

        if (node.leftDactyl) node.leftDactyl.rotation.z = 0;
        if (node.rightDactyl) node.rightDactyl.rotation.z = 0;
      }
    }

    // 3. Eyestalks & Antennules: Eyestalk retraction socket flick
    if (node.crabEyestalks && node.crabEyestalks.length >= 2) {
      const flickTime = entity.eyestalkFlick ?? 0;
      // Socket dip during flick
      const isFlicking = flickTime > 0.1 && flickTime < 0.45;
      const eyeH = isFlicking ? 0.07 : 0.12;
      node.crabEyestalks[0].position.y = eyeH;
      node.crabEyestalks[1].position.y = isFlicking ? 0.09 : 0.12;
    }

    if (node.crabAntennules) {
      node.crabAntennules.rotation.x = 0.15 + Math.sin(cycle * 9.0) * 0.12;
      node.crabAntennules.rotation.y = Math.cos(cycle * 7.0) * 0.10;
    }
  }

  private animateSnail(node: EntityRenderNode, entity: MicroFaunaEntity) {
    const cycle = entity.animCycle;
    const isMoving = Math.abs(entity.vx) > 0.01 || Math.abs(entity.vz) > 0.01;
    const radulaPhase = entity.radulaPhase ?? 0;
    const isRasping = radulaPhase > 0.45 && radulaPhase <= 0.85;

    // 1. Cephalic Ommatophore Tentacle Sensation & Retraction
    if (node.leftTentacle && node.rightTentacle) {
      if (entity.state === 'retracted') {
        node.leftTentacle.scale.set(0.15, 0.15, 0.15);
        node.rightTentacle.scale.set(0.15, 0.15, 0.15);
        if (node.foot) node.foot.scale.set(0.55, 0.55, 0.55);
        if (node.snailOperculum) node.snailOperculum.position.y = 0.04;
      } else {
        node.leftTentacle.scale.set(1, 1, 1);
        node.rightTentacle.scale.set(1, 1, 1);
        if (node.foot) node.foot.scale.set(1, 1, 1);
        if (node.snailOperculum) node.snailOperculum.position.y = 0.08;

        // Independent Chemoreceptive probing frequencies
        const splay = isRasping ? 0.16 : 0;
        node.leftTentacle.rotation.z = 0.28 + splay + Math.sin(cycle * 2.7) * 0.18;
        node.leftTentacle.rotation.x = 0.45 + Math.cos(cycle * 2.1) * 0.12;

        node.rightTentacle.rotation.z = -0.28 - splay - Math.cos(cycle * 3.3) * 0.18;
        node.rightTentacle.rotation.x = 0.45 + Math.sin(cycle * 2.5) * 0.12;
      }
    }

    // 2. Muscular Pedal Locomotion Wave & Radula Scraping Head Dip
    if (node.foot && isMoving) {
      node.foot.rotation.x = Math.sin(cycle * 2.2) * 0.022;
    }

    if (node.snailHead) {
      if (isRasping) {
        // Head lowers toward substrate, rasping biofilm
        node.snailHead.position.y = 0.035;
        node.snailHead.rotation.x = 0.14 + Math.sin(cycle * 6.0) * 0.04;
      } else {
        node.snailHead.position.y = 0.06;
        node.snailHead.rotation.x = isMoving ? Math.sin(cycle * 2.2 + 0.8) * 0.05 : 0;
      }
    }

    // 3. Gravitational Shell Torque
    if (node.shell && entity.attachedSurface === 'front_glass') {
      // In front glass pane, gravity exerts a downward torque on the heavy shell whorls
      node.shell.rotation.z = -entity.roll + Math.sin(cycle * 0.8) * 0.03;
      node.shell.rotation.x = 0.16 + Math.cos(cycle * 0.8) * 0.02;
    }
  }

  // ==========================================================================
  // GHOST SHRIMP KINEMATICS & METACHRONAL PLEOPOD SWIMMING
  // ==========================================================================
  private animateShrimp(node: EntityRenderNode, entity: MicroFaunaEntity) {
    const cycle = entity.animCycle;
    const isDarting = entity.state === 'escape_dart';
    const isMoving = Math.abs(entity.vx) > 0.05 || Math.abs(entity.vz) > 0.05 || Math.abs(entity.vy) > 0.05;

    // 1. Pleopod (Swimmeret) Metachronal Paddling Wave
    if (node.shrimpPleopods) {
      const pleopodPhase = entity.pleopodPhase ?? (cycle * 6.0);
      for (let i = 0; i < node.shrimpPleopods.length; i++) {
        const pairIdx = Math.floor(i / 2);
        const phase = pleopodPhase - pairIdx * 0.7;
        const wave = Math.sin(phase);
        node.shrimpPleopods[i].rotation.x = isDarting ? 0.85 : wave * 0.55;
      }
    }

    // 2. Chained Somite Abdominal Articulation
    if (node.shrimpSomiteGroups) {
      const flexTarget = isDarting ? (entity.abdomenFlex ?? 1.2) : (entity.state === 'foraging' ? 0.35 : 0.22);
      const somitePitch = flexTarget * 0.18;
      for (let s = 0; s < node.shrimpSomiteGroups.length; s++) {
        const humpFactor = (s === 1 || s === 2) ? 1.35 : 1.0;
        node.shrimpSomiteGroups[s].rotation.x = somitePitch * humpFactor;
        node.shrimpSomiteGroups[s].rotation.y = isMoving ? Math.sin(cycle * 4.0 - s * 0.4) * 0.04 : 0;
      }
    }

    // 3. Pereiopod Walking Legs
    if (node.shrimpPereiopods) {
      for (let p = 0; p < node.shrimpPereiopods.length; p++) {
        const leg = node.shrimpPereiopods[p];
        const legIdx = Math.floor(p / 2);
        if (isDarting) {
          leg.rotation.x = 0.55;
        } else if (entity.state === 'foraging' && isMoving) {
          leg.rotation.x = -0.15 + Math.sin(cycle * 7.0 + legIdx * 1.1) * 0.24;
        } else {
          leg.rotation.x = -0.15 + Math.sin(cycle * 1.5 + legIdx * 0.5) * 0.06;
        }
      }
    }

    // 4. Sweeping Antennae Fluid Drag
    if (node.shrimpAntennae) {
      const spd = Math.sqrt(entity.vx * entity.vx + entity.vy * entity.vy + entity.vz * entity.vz);
      for (let a = 0; a < node.shrimpAntennae.length; a++) {
        const antenna = node.shrimpAntennae[a];
        const side = a === 0 ? -1 : 1;
        antenna.rotation.z = side * (0.05 + Math.sin(cycle * 2.0) * 0.04);
        antenna.rotation.x = -spd * 0.08 + Math.cos(cycle * 1.6) * 0.03;
      }
    }
  }

  // ==========================================================================
  // REAL-TIME HYDRODYNAMIC MEDUSA ANIMATION (Soft-Body Gelatinous Deformation)
  // ==========================================================================
  private animateMedusa(node: EntityRenderNode, entity: MicroFaunaEntity, dt: number) {
    const cycle = entity.animCycle;
    const constriction = entity.constriction ?? 0;

    // 1. Soft-Body Bell Dynamic Hydrodynamic Vertex Deformation
    if (node.medusaBellMesh && node.medusaBasePositions) {
      const geo = node.medusaBellMesh.geometry;
      const posAttr = geo.attributes.position as THREE.BufferAttribute;
      const base = node.medusaBasePositions;
      const count = posAttr.count;

      for (let i = 0; i < count; i++) {
        const x0 = base[i * 3];
        const y0 = base[i * 3 + 1];
        const z0 = base[i * 3 + 2];

        const r0 = Math.sqrt(x0 * x0 + z0 * z0);
        const h = Math.max(0, Math.min(1, y0 / 0.44)); // 1.0 at apex, 0.0 at margin rim
        const marginWeight = Math.pow(1.0 - h, 1.35); // Concentrated along the flexible margin

        const angle = Math.atan2(z0, x0);

        // Muscular contraction: rim draws inward during power stroke, flaring open during elastic recoil
        let r = r0 * (1.0 - constriction * marginWeight * 0.46);

        // Fluid traveling wave along the bell rim (hydrozoan velar ripple)
        const wave = Math.sin(cycle * 3.0 - (1.0 - h) * 3.8);
        r += wave * 0.010 * marginWeight;

        // Apex vertical elongation during propulsion thrust
        const y = y0 * (1.0 + constriction * 0.24) + wave * 0.008 * marginWeight;

        posAttr.setXYZ(i, r * Math.cos(angle), y, r * Math.sin(angle));
      }
      posAttr.needsUpdate = true;
      geo.computeVertexNormals();
    }

    // 2. Synchronize Ring Canal with Soft-Body Margin
    const marginDeform = Math.max(0.40, 1.0 - constriction * 0.46);
    if (node.medusaRingCanal) {
      node.medusaRingCanal.scale.set(marginDeform, 1.0, marginDeform);
    }

    // 3. Synchronize 4 Radial Canals
    if (node.medusaRadialCanals) {
      const canalScaleY = 1.0 + constriction * 0.18;
      for (const canal of node.medusaRadialCanals) {
        canal.scale.set(marginDeform, canalScaleY, marginDeform);
      }
    }

    // 4. Synchronize 12 Marginal Rhopalia Beads
    if (node.medusaRhopalia) {
      const numRhop = node.medusaRhopalia.length;
      for (let r = 0; r < numRhop; r++) {
        const ang = (r / numRhop) * Math.PI * 2;
        node.medusaRhopalia[r].position.set(
          Math.cos(ang) * 0.44 * marginDeform,
          0.01,
          Math.sin(ang) * 0.44 * marginDeform
        );
      }
    }

    // 5. Central Manubrium & Oral Arms Fluid Swaying
    if (node.medusaManubrium) {
      node.medusaManubrium.rotation.z = Math.sin(cycle * 2.0) * 0.12;
      node.medusaManubrium.rotation.x = Math.cos(cycle * 1.7) * 0.12;
    }

    // 6. Subtle, Living Bioluminescent Slight Glow with Startle Flash Reaction
    // Gently brightens on muscular contraction stroke, with bioluminescent surge on fish disturbance
    const alertness = entity.alertness ?? 0;
    const flashMultiplier = 1.0 + alertness * 2.2;
    const slightGlow = (0.38 + Math.max(0, constriction) * 0.22 + Math.sin(cycle * 1.5) * 0.05) * flashMultiplier;
    if (node.medusaBellMat) {
      node.medusaBellMat.emissiveIntensity = slightGlow;
    }
    if (node.medusaCanalsMat) {
      node.medusaCanalsMat.emissiveIntensity = slightGlow * 1.5;
    }
    if (node.medusaManubriumMat) {
      node.medusaManubriumMat.emissiveIntensity = slightGlow * 1.2;
    }
    if (node.medusaRhopaliaMat) {
      node.medusaRhopaliaMat.emissiveIntensity = slightGlow * 1.6;
    }

    // 7. Trailing Dynamic Tentacles (Verlet physics + water drag)
    if (node.medusaTentacles && node.group) {
      const segLen = 0.10 * entity.sizeScale;
      const rootPos = node.group.position;
      const rootQuat = node.group.quaternion;
      const invQuat = rootQuat.clone().invert();
      const rootScale = entity.sizeScale * 1.3;

      for (let t = 0; t < node.medusaTentacles.length; t++) {
        const tentacle = node.medusaTentacles[t];

        // Anchor dynamically tracks the deformed soft-body bell rim
        const localMargin = new THREE.Vector3(
          tentacle.localBase.x * marginDeform * rootScale,
          tentacle.localBase.y * rootScale,
          tentacle.localBase.z * marginDeform * rootScale
        );
        const worldAnchor = localMargin.applyQuaternion(rootQuat).add(rootPos);
        tentacle.nodes[0].copy(worldAnchor);

        // Relax trailing nodes along chain with fluid drag & inertia
        for (let j = 1; j < tentacle.nodes.length; j++) {
          const prev = tentacle.nodes[j - 1];
          const curr = tentacle.nodes[j];

          // Gentle negative buoyancy & water current undulation
          curr.y -= 0.55 * dt;
          curr.x += Math.sin(cycle * 2.0 + j * 0.35 + t) * 0.0025;
          curr.z += Math.cos(cycle * 1.8 + j * 0.35 + t) * 0.0025;

          // Distance constraint to previous node
          const diff = curr.clone().sub(prev);
          const dist = diff.length();
          if (dist > 0.001) {
            diff.normalize().multiplyScalar(segLen);
            curr.copy(prev).add(diff);
          }
        }

        // Convert world points to local space for Line BufferGeometry
        const posAttr = tentacle.line.geometry.attributes.position as THREE.BufferAttribute;
        for (let j = 0; j < tentacle.nodes.length; j++) {
          const localPt = tentacle.nodes[j].clone().sub(rootPos).applyQuaternion(invQuat).divideScalar(rootScale);
          posAttr.setXYZ(j, localPt.x, localPt.y, localPt.z);
        }
        posAttr.needsUpdate = true;
      }
    }
  }

  public destroy() {
    this.scene.remove(this.group);
    this.dispose();
  }

  public dispose() {
    for (const [, node] of this.nodes.entries()) {
      this.disposeNode(node);
    }
    for (const geo of Object.values(this.geoCache)) {
      if (Array.isArray(geo)) {
        geo.forEach(g => g.dispose());
      } else {
        geo.dispose();
      }
    }
    for (const mat of Object.values(this.materials)) {
      mat.dispose();
    }
  }
}

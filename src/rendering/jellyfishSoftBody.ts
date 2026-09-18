/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { MicroFaunaEntity } from '../types';

export interface VerletNode {
  x: number;
  y: number;
  z: number;
  prevX: number;
  prevY: number;
  prevZ: number;
}

export interface TentacleChain {
  angle: number;
  restLength: number;
  nodes: VerletNode[];
}

export interface OralArmChain {
  angle: number;
  restLength: number;
  nodes: VerletNode[];
}

interface BellVertexInfo {
  baseX: number;
  baseY: number;
  baseZ: number;
  baseR: number;
  baseAngle: number;
  cosAngle: number;
  sinAngle: number;
  sinFlutingAngle: number;
  vNormalized: number; // 0.0 at margin rim, 1.0 at apex dome
}

/**
 * High-fidelity Soft-Body Physics and Procedural Mesh for Hydromedusae.
 * Implements:
 * - Real-time deforming bell lattice with traveling peristaltic constriction waves
 * - Incompressible mesogleal hydrostatic volume preservation (axial dome elongation)
 * - Viscous fluid drag margin lag & eversion flaring during elastic recoil
 * - Circumferential hoop-stress fluting (8-lobed margin lappets)
 * - Multi-node Verlet integration trailing tentacles with fluid drag & jet wake stream
 * - Flexible trailing manubrium oral arms
 * - Bioluminescent photophore excitation
 */
export class JellyfishSoftBody {
  public root: THREE.Group;
  public bellMesh: THREE.Mesh;
  public bellGeometry: THREE.BufferGeometry;
  public coreMesh: THREE.Mesh;
  public tentaclesLine: THREE.LineSegments;
  public oralArmsLine: THREE.LineSegments;

  private bellVertexData: BellVertexInfo[] = [];
  private tentacleChains: TentacleChain[] = [];
  private oralArmChains: OralArmChain[] = [];

  // Cached arrays for zero garbage collection
  private tentaclePositions: Float32Array;
  private tentacleColors: Float32Array;
  private oralArmPositions: Float32Array;

  // Geometry configuration (optimized for 60fps silky soft-body physics)
  private readonly radialSegs = 24;
  private readonly heightRings = 14;
  private readonly tentacleCount = 10;
  private readonly nodesPerTentacle = 8;
  private readonly oralArmCount = 4;
  private readonly nodesPerOralArm = 6;

  // Materials
  private bellMaterial: THREE.MeshStandardMaterial;
  private coreMaterial: THREE.MeshBasicMaterial;
  private tentacleMaterial: THREE.LineBasicMaterial;
  private oralArmMaterial: THREE.LineBasicMaterial;

  constructor(entity: MicroFaunaEntity) {
    this.root = new THREE.Group();

    // 1. Materials - lightweight translucent standard materials
    this.bellMaterial = new THREE.MeshStandardMaterial({
      color: 0x67e8f9,
      roughness: 0.12,
      metalness: 0.05,
      transparent: true,
      opacity: 0.65,
      depthWrite: false,
      side: THREE.DoubleSide,
    });

    this.coreMaterial = new THREE.MeshBasicMaterial({
      color: 0x22d3ee,
      transparent: true,
      opacity: 0.85,
    });

    this.tentacleMaterial = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.75,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    this.oralArmMaterial = new THREE.LineBasicMaterial({
      color: 0xa5f3fc,
      transparent: true,
      opacity: 0.6,
      depthWrite: false,
    });

    // 2. Build Deformable Bell Lattice Geometry
    this.bellGeometry = this.buildBellGeometry();
    this.bellMesh = new THREE.Mesh(this.bellGeometry, this.bellMaterial);
    this.bellMesh.frustumCulled = false;
    this.root.add(this.bellMesh);

    // 3. Bioluminescent Subumbrella Coronal Ring & Radial Canals
    const torusGeo = new THREE.TorusGeometry(0.24, 0.024, 8, 20);
    torusGeo.rotateX(Math.PI * 0.5);
    this.coreMesh = new THREE.Mesh(torusGeo, this.coreMaterial);
    this.coreMesh.position.y = -0.05;
    this.coreMesh.frustumCulled = false;
    this.root.add(this.coreMesh);

    // 4. Initialize Trailing Margin Tentacles (Verlet Particle Chains)
    const segsPerTentacle = this.nodesPerTentacle - 1;
    const totalTentacleSegs = this.tentacleCount * segsPerTentacle;
    this.tentaclePositions = new Float32Array(totalTentacleSegs * 2 * 3);
    this.tentacleColors = new Float32Array(totalTentacleSegs * 2 * 3);

    this.initTentacles(entity.x, entity.y, entity.z);

    const tGeo = new THREE.BufferGeometry();
    const tPosAttr = new THREE.BufferAttribute(this.tentaclePositions, 3);
    tPosAttr.setUsage(THREE.DynamicDrawUsage);
    tGeo.setAttribute('position', tPosAttr);
    tGeo.setAttribute('color', new THREE.BufferAttribute(this.tentacleColors, 3));
    tGeo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, -0.6, 0), 2.5);
    this.tentaclesLine = new THREE.LineSegments(tGeo, this.tentacleMaterial);
    this.tentaclesLine.frustumCulled = false;
    this.root.add(this.tentaclesLine);

    // 5. Initialize Central Frilly Oral Arms (Manubrium)
    const segsPerArm = this.nodesPerOralArm - 1;
    const totalArmSegs = this.oralArmCount * segsPerArm;
    this.oralArmPositions = new Float32Array(totalArmSegs * 2 * 3);

    this.initOralArms(entity.x, entity.y, entity.z);

    const oGeo = new THREE.BufferGeometry();
    const oPosAttr = new THREE.BufferAttribute(this.oralArmPositions, 3);
    oPosAttr.setUsage(THREE.DynamicDrawUsage);
    oGeo.setAttribute('position', oPosAttr);
    oGeo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, -0.4, 0), 2.0);
    this.oralArmsLine = new THREE.LineSegments(oGeo, this.oralArmMaterial);
    this.oralArmsLine.frustumCulled = false;
    this.root.add(this.oralArmsLine);

    // Scale root group
    const scale = entity.sizeScale * 1.45;
    this.root.scale.set(scale, scale, scale);
  }

  /**
   * Constructs the parametric hydrozoan bell geometry.
   * Campanulate bell profile with apex dome at top and curved margin rim at base.
   */
  private buildBellGeometry(): THREE.BufferGeometry {
    const geo = new THREE.BufferGeometry();
    const vertices: number[] = [];
    const indices: number[] = [];
    const uvs: number[] = [];
    this.bellVertexData = [];

    const numRings = this.heightRings;
    const numSegs = this.radialSegs;

    for (let r = 0; r <= numRings; r++) {
      const v = r / numRings; // 0 = margin rim, 1 = apex dome
      // Bell curvature: campanulate hydrozoan profile
      // At margin (v=0), radius is ~0.40; at apex (v=1), radius is 0
      const radius = 0.42 * Math.sin(Math.acos(v * 0.95)) * (1.0 - Math.pow(v, 3.5) * 0.4);
      const y = -0.24 + Math.pow(v, 0.85) * 0.48; // from -0.24 up to +0.24

      for (let s = 0; s <= numSegs; s++) {
        const u = s / numSegs;
        const angle = u * Math.PI * 2;
        const cosAngle = Math.cos(angle);
        const sinAngle = Math.sin(angle);
        const x = cosAngle * radius;
        const z = sinAngle * radius;

        vertices.push(x, y, z);
        uvs.push(u, v);

        this.bellVertexData.push({
          baseX: x,
          baseY: y,
          baseZ: z,
          baseR: radius,
          baseAngle: angle,
          cosAngle,
          sinAngle,
          sinFlutingAngle: Math.sin(angle * 8),
          vNormalized: v,
        });
      }
    }

    // Generate quadrilateral face indices
    for (let r = 0; r < numRings; r++) {
      for (let s = 0; s < numSegs; s++) {
        const i0 = r * (numSegs + 1) + s;
        const i1 = r * (numSegs + 1) + (s + 1);
        const i2 = (r + 1) * (numSegs + 1) + (s + 1);
        const i3 = (r + 1) * (numSegs + 1) + s;

        indices.push(i0, i1, i2);
        indices.push(i0, i2, i3);
      }
    }

    geo.setIndex(indices);
    const posAttr = new THREE.Float32BufferAttribute(vertices, 3);
    posAttr.setUsage(THREE.DynamicDrawUsage);
    geo.setAttribute('position', posAttr);
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geo.computeVertexNormals();
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 2.0);

    return geo;
  }

  /**
   * Initializes the 12 trailing tentacles along the margin rim.
   */
  private initTentacles(worldX: number, worldY: number, worldZ: number) {
    this.tentacleChains = [];
    const restLen = 0.11;

    for (let t = 0; t < this.tentacleCount; t++) {
      const angle = (t / this.tentacleCount) * Math.PI * 2;
      const nodes: VerletNode[] = [];
      const rimRadius = 0.38;
      const rootX = Math.cos(angle) * rimRadius;
      const rootZ = Math.sin(angle) * rimRadius;
      const rootY = -0.24;

      for (let n = 0; n < this.nodesPerTentacle; n++) {
        const ny = rootY - n * restLen;
        nodes.push({
          x: rootX,
          y: ny,
          z: rootZ,
          prevX: rootX,
          prevY: ny,
          prevZ: rootZ,
        });
      }

      this.tentacleChains.push({
        angle,
        restLength: restLen,
        nodes,
      });
    }

    // Set up vertex color gradient (luminous cyan at root, translucent ethereal tip)
    let colorIdx = 0;
    for (let t = 0; t < this.tentacleCount; t++) {
      for (let s = 0; s < this.nodesPerTentacle - 1; s++) {
        const t0 = s / (this.nodesPerTentacle - 1);
        const t1 = (s + 1) / (this.nodesPerTentacle - 1);

        // Vertex 1 of segment
        this.tentacleColors[colorIdx++] = 0.25 + 0.45 * (1 - t0); // R
        this.tentacleColors[colorIdx++] = 0.85 + 0.15 * (1 - t0); // G
        this.tentacleColors[colorIdx++] = 1.0;                    // B

        // Vertex 2 of segment
        this.tentacleColors[colorIdx++] = 0.25 + 0.45 * (1 - t1); // R
        this.tentacleColors[colorIdx++] = 0.85 + 0.15 * (1 - t1); // G
        this.tentacleColors[colorIdx++] = 1.0;                    // B
      }
    }
  }

  /**
   * Initializes the 4 central oral arms hanging from the subumbrella.
   */
  private initOralArms(worldX: number, worldY: number, worldZ: number) {
    this.oralArmChains = [];
    const restLen = 0.12;

    for (let a = 0; a < this.oralArmCount; a++) {
      const angle = (a / this.oralArmCount) * Math.PI * 2 + Math.PI * 0.25;
      const nodes: VerletNode[] = [];
      const rootR = 0.08;
      const rootX = Math.cos(angle) * rootR;
      const rootZ = Math.sin(angle) * rootR;
      const rootY = -0.06;

      for (let n = 0; n < this.nodesPerOralArm; n++) {
        const ny = rootY - n * restLen;
        nodes.push({
          x: rootX,
          y: ny,
          z: rootZ,
          prevX: rootX,
          prevY: ny,
          prevZ: rootZ,
        });
      }

      this.oralArmChains.push({
        angle,
        restLength: restLen,
        nodes,
      });
    }
  }

  /**
   * Updates the soft-body simulation and deformable mesh for this jellyfish.
   */
  public update(entity: MicroFaunaEntity, dt: number, currentX: number = 0, currentZ: number = 0) {
    const clampedDt = Math.min(dt, 0.05);

    // Current constriction: [-0.35, 0.95]
    // > 0 = muscular power stroke constriction
    // < 0 = elastic recoil flaring & vortex expansion
    const constriction = entity.constriction ?? 0.0;
    const strokePhase = entity.strokePhase ?? 0.0;
    const vy = entity.vy;

    // 1. Soft-Body Bell Deformable Mesh Update
    this.updateBellDeformation(constriction, strokePhase, vy);

    // 2. Bioluminescent Subumbrella Coronal Ring Update
    this.updateCoronalRing(constriction);

    // 3. Multi-Node Verlet Physics Trailing Tentacles Update
    this.updateTentaclesPhysics(entity, clampedDt, currentX, currentZ);

    // 4. Soft-Body Central Frilly Oral Arms Update
    this.updateOralArmsPhysics(entity, clampedDt, currentX, currentZ);
  }

  /**
   * Computes continuous soft-body vertex positions on the bell lattice.
   */
  private updateBellDeformation(constriction: number, strokePhase: number, vy: number) {
    const posAttr = this.bellGeometry.attributes.position as THREE.BufferAttribute;
    const arr = posAttr.array as Float32Array;
    const count = this.bellVertexData.length;

    // Fluid drag factor proportional to swimming velocity
    const dragAmount = Math.max(-0.25, Math.min(0.25, vy * 0.065));

    for (let i = 0; i < count; i++) {
      const vData = this.bellVertexData[i];
      const v = vData.vNormalized; // 0 = margin rim, 1 = apex dome
      const theta = vData.baseAngle;

      let r = vData.baseR;
      let y = vData.baseY;

      if (constriction >= 0) {
        // ========== POWER STROKE (MUSCULAR CONSTRICTION WAVE) ==========
        // Traveling peristaltic wave: starts near coronal groove (v ~ 0.6) and sweeps down to margin (v = 0)
        const waveDelay = (1.0 - v) * 0.75;
        const localC = Math.max(0, constriction - waveDelay * 0.25);

        // Radial constriction: apex (v=1) stays anchored dome, margin (v=0) contracts inward by up to 55%
        const constrictionFactor = localC * Math.pow(1.0 - v * 0.7, 1.2) * 0.58;

        // Circumferential 8-lobed fluting / lappets (elastic hoop-stress buckling creases)
        const fluting = vData.sinFlutingAngle * 0.038 * localC * (1.0 - v);

        r = vData.baseR * Math.max(0.35, 1.0 - constrictionFactor + fluting);

        // Hydrostatic volume conservation: as the waist contracts, mesogleal fluid pushes dome upward
        const domeElongation = localC * Math.pow(v, 0.9) * 0.18;

        // Viscous fluid drag: flexible margin rim lags backward against the flow of water
        const marginLag = -dragAmount * Math.pow(1.0 - v, 1.8);

        y = vData.baseY + domeElongation + marginLag;
      } else {
        // ========== RECOVERY STROKE (ELASTIC RECOIL & FLARING EVERSION) ==========
        // When constriction < 0, the bell springs open beyond resting radius (flaring saucer eversion)
        const flareStrength = -constriction; // 0 to 0.35

        // Flaring expands the margin rim outwards by up to +32%
        const flareFactor = flareStrength * Math.pow(1.0 - v, 1.4) * 0.85;

        // Eversion: margin lip curls slightly upward and outward
        const eversionLip = flareStrength * Math.pow(1.0 - v, 2.0) * 0.06;

        r = vData.baseR * (1.0 + flareFactor);
        y = vData.baseY + eversionLip - dragAmount * Math.pow(1.0 - v, 1.5);
      }

      // Update position buffer using precomputed trigonometric values
      arr[i * 3] = vData.cosAngle * r;
      arr[i * 3 + 1] = y;
      arr[i * 3 + 2] = vData.sinAngle * r;
    }

    posAttr.needsUpdate = true;
  }

  /**
   * Updates the subumbrella coronal ring and bioluminescence.
   */
  private updateCoronalRing(constriction: number) {
    // The coronal ring contracts with the local subumbrella radius (v ~ 0.35)
    const ringConstriction = Math.max(-0.25, Math.min(0.65, constriction * 0.6));
    const ringRadius = 1.0 - ringConstriction * 0.45;
    this.coreMesh.scale.set(ringRadius, 1.0, ringRadius);

    // Bioluminescent excitation: glows brighter during contraction
    const glow = Math.max(0.4, 0.4 + 0.6 * Math.max(0, constriction));
    this.coreMaterial.opacity = glow;
  }

  /**
   * Simulates trailing margin tentacles using multi-node Verlet physics.
   */
  private updateTentaclesPhysics(
    entity: MicroFaunaEntity,
    dt: number,
    currentX: number,
    currentZ: number
  ) {
    const posAttr = this.tentaclesLine.geometry.attributes.position as THREE.BufferAttribute;
    const arr = posAttr.array as Float32Array;
    let idx = 0;

    const constriction = entity.constriction ?? 0.0;
    const rimRadius = 0.38 * (1.0 - constriction * 0.45);
    const rimY = -0.24 - (constriction > 0 ? 0.04 : 0);

    const damping = 0.88;
    const gravity = -0.22;
    const jetForce = constriction > 0 ? -1.8 * constriction : 0;
    const maxSpeed = 0.08;

    for (const chain of this.tentacleChains) {
      const nodes = chain.nodes;
      const count = nodes.length;

      // Node 0: Rooted at the moving, deforming margin rim in local space
      const rootX = Math.cos(chain.angle) * rimRadius;
      const rootZ = Math.sin(chain.angle) * rimRadius;
      const rootY = rimY;

      nodes[0].x = rootX;
      nodes[0].y = rootY;
      nodes[0].z = rootZ;
      nodes[0].prevX = rootX;
      nodes[0].prevY = rootY;
      nodes[0].prevZ = rootZ;

      // Nodes 1..N: Stabilized Verlet numerical physics integration
      for (let i = 1; i < count; i++) {
        const node = nodes[i];

        // Inertial velocity from previous step (clamped for stability)
        const rawVx = (node.x - node.prevX) * damping;
        const rawVy = (node.y - node.prevY) * damping;
        const rawVz = (node.z - node.prevZ) * damping;

        const vx = Math.max(-maxSpeed, Math.min(maxSpeed, rawVx));
        const vy = Math.max(-maxSpeed, Math.min(maxSpeed, rawVy));
        const vz = Math.max(-maxSpeed, Math.min(maxSpeed, rawVz));

        node.prevX = node.x;
        node.prevY = node.y;
        node.prevZ = node.z;

        // Forces: gravity + jet wake stream + ambient currents + gentle micro-sway
        const sway = Math.sin(entity.animCycle * 2.0 + chain.angle * 3 + i * 0.8) * 0.04;
        const ax = currentX * 0.4 + sway;
        const ay = gravity + jetForce * (1.0 - i / count) * 0.6;
        const az = currentZ * 0.4 + Math.cos(entity.animCycle * 2.2 + chain.angle * 2 + i * 0.8) * 0.04;

        node.x += vx + Math.max(-0.03, Math.min(0.03, ax * dt));
        node.y += vy + Math.max(-0.03, Math.min(0.03, ay * dt));
        node.z += vz + Math.max(-0.03, Math.min(0.03, az * dt));
      }

      // Elastic link distance constraints (satisfaction relaxation)
      for (let iter = 0; iter < 2; iter++) {
        for (let i = 1; i < count; i++) {
          const nA = nodes[i - 1];
          const nB = nodes[i];

          const dx = nB.x - nA.x;
          const dy = nB.y - nA.y;
          const dz = nB.z - nA.z;
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
          if (dist > 0.0001) {
            const diff = (dist - chain.restLength) / dist;
            nB.x -= dx * diff * 0.75;
            nB.y -= dy * diff * 0.75;
            nB.z -= dz * diff * 0.75;
          }

          // Strict NaN / Infinity safety guard
          if (!Number.isFinite(nB.x) || !Number.isFinite(nB.y) || !Number.isFinite(nB.z)) {
            nB.x = nA.x;
            nB.y = nA.y - chain.restLength;
            nB.z = nA.z;
            nB.prevX = nB.x;
            nB.prevY = nB.y;
            nB.prevZ = nB.z;
          }
        }
      }

      // Write to line segments buffer
      for (let i = 0; i < count - 1; i++) {
        const nA = nodes[i];
        const nB = nodes[i + 1];

        arr[idx++] = nA.x;
        arr[idx++] = nA.y;
        arr[idx++] = nA.z;

        arr[idx++] = nB.x;
        arr[idx++] = nB.y;
        arr[idx++] = nB.z;
      }
    }

    posAttr.needsUpdate = true;
  }

  /**
   * Simulates the 4 central oral arms hanging down from the subumbrella.
   */
  private updateOralArmsPhysics(
    entity: MicroFaunaEntity,
    dt: number,
    currentX: number,
    currentZ: number
  ) {
    const posAttr = this.oralArmsLine.geometry.attributes.position as THREE.BufferAttribute;
    const arr = posAttr.array as Float32Array;
    let idx = 0;

    const constriction = entity.constriction ?? 0.0;
    // When bell constricts, oral arms are compressed together in the central wake; when relaxed, they flare
    const armSpread = Math.max(0.03, 0.08 * (1.0 - constriction * 0.6));
    const damping = 0.88;
    const maxSpeed = 0.07;

    for (const arm of this.oralArmChains) {
      const nodes = arm.nodes;
      const count = nodes.length;

      const rootX = Math.cos(arm.angle) * armSpread;
      const rootZ = Math.sin(arm.angle) * armSpread;
      const rootY = -0.06;

      nodes[0].x = rootX;
      nodes[0].y = rootY;
      nodes[0].z = rootZ;
      nodes[0].prevX = rootX;
      nodes[0].prevY = rootY;
      nodes[0].prevZ = rootZ;

      for (let i = 1; i < count; i++) {
        const node = nodes[i];

        const rawVx = (node.x - node.prevX) * damping;
        const rawVy = (node.y - node.prevY) * damping;
        const rawVz = (node.z - node.prevZ) * damping;

        const vx = Math.max(-maxSpeed, Math.min(maxSpeed, rawVx));
        const vy = Math.max(-maxSpeed, Math.min(maxSpeed, rawVy));
        const vz = Math.max(-maxSpeed, Math.min(maxSpeed, rawVz));

        node.prevX = node.x;
        node.prevY = node.y;
        node.prevZ = node.z;

        // Frilly ribbon billow undulation
        const billowX = Math.sin(entity.animCycle * 3.0 + arm.angle + i * 1.2) * 0.05;
        const billowZ = Math.cos(entity.animCycle * 2.8 + arm.angle + i * 1.2) * 0.05;

        const ax = currentX * 0.3 + billowX;
        const ay = -0.28 - (constriction > 0 ? 1.2 * constriction : 0);
        const az = currentZ * 0.3 + billowZ;

        node.x += vx + Math.max(-0.03, Math.min(0.03, ax * dt));
        node.y += vy + Math.max(-0.03, Math.min(0.03, ay * dt));
        node.z += vz + Math.max(-0.03, Math.min(0.03, az * dt));
      }

      // Distance constraints
      for (let i = 1; i < count; i++) {
        const nA = nodes[i - 1];
        const nB = nodes[i];
        const dx = nB.x - nA.x;
        const dy = nB.y - nA.y;
        const dz = nB.z - nA.z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (dist > 0.0001) {
          const diff = (dist - arm.restLength) / dist;
          nB.x -= dx * diff * 0.75;
          nB.y -= dy * diff * 0.75;
          nB.z -= dz * diff * 0.75;
        }

        // NaN safety guard
        if (!Number.isFinite(nB.x) || !Number.isFinite(nB.y) || !Number.isFinite(nB.z)) {
          nB.x = nA.x;
          nB.y = nA.y - arm.restLength;
          nB.z = nA.z;
          nB.prevX = nB.x;
          nB.prevY = nB.y;
          nB.prevZ = nB.z;
        }
      }

      for (let i = 0; i < count - 1; i++) {
        const nA = nodes[i];
        const nB = nodes[i + 1];
        arr[idx++] = nA.x;
        arr[idx++] = nA.y;
        arr[idx++] = nA.z;

        arr[idx++] = nB.x;
        arr[idx++] = nB.y;
        arr[idx++] = nB.z;
      }
    }

    posAttr.needsUpdate = true;
  }

  public dispose() {
    this.bellGeometry.dispose();
    this.bellMaterial.dispose();
    this.coreMesh.geometry.dispose();
    this.coreMaterial.dispose();
    this.tentaclesLine.geometry.dispose();
    this.tentacleMaterial.dispose();
    this.oralArmsLine.geometry.dispose();
    this.oralArmMaterial.dispose();
  }
}

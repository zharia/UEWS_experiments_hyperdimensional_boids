/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';

export type PlantLifecycleStage =
  | 'sprout'       // Germinating tender juvenile shoot pushing from holdfast
  | 'growing'      // Vegetative elongation, leaf bud unfurling, vascular thickening
  | 'flourishing'  // Full maturity, peak chlorophyll, luminous spore/gamete release
  | 'senescent'    // Wilting, chlorosis yellowing, necrotic browning, leaf shedding
  | 'rebirth';     // Senescent dissolution and emergence of fresh vigorous sprout

export interface BotanicalPlant {
  id: string;
  commonName: string;
  scientificName: string;
  morphology: 'acropora_tree' | 'giant_kelp' | 'cabomba_milfoil' | 'amazon_sword';
  origin: THREE.Vector3;
  baseScale: THREE.Vector3;

  // Lifecycle parameters
  stage: PlantLifecycleStage;
  stageProgress: number;   // 0.0 to 1.0 within current stage
  overallProgress: number; // 0.0 to 1.0 across full lifetime
  age: number;             // seconds alive in current cycle
  lifespan: number;        // total duration of full lifecycle in seconds
  speedMultiplier: number; // individual growth rate variation

  // Physiological metrics
  growthScale: number;     // 0.15 to 1.05
  wiltAmount: number;      // 0.0 (turgid upright) to 0.75 (drooping)
  chlorosis: number;       // 0.0 (lush green/pigment) to 0.9 (yellow/brown)
  health: number;          // 0 to 100%
  sporeEmit: number;       // 0.0 to 1.0 bioluminescent spore radiance
  shedLeavesCount: number; // cumulative leaf fragments shed

  // Three.js Render references
  group: THREE.Group;
  stemMesh: THREE.Mesh;
  stemMaterial: THREE.ShaderMaterial;
  splatMesh?: THREE.Mesh;
  splatMaterial?: THREE.ShaderMaterial;
}

export interface FloatingDetritusParticle {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  size: number;
  rot: number;
  rotSpeed: number;
  color: THREE.Color;
  life: number;
  maxLife: number;
}

export interface LuminousSporeParticle {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  size: number;
  color: THREE.Color;
  life: number;
  maxLife: number;
}

/**
 * The Botanical Lifecycle Simulation Engine.
 * Manages slow organic growth, maturation, senescence wilting, chlorosis decay,
 * spore dispersal, leaf detritus shedding, and perennial holdfast rebirth.
 */
export class PlantLifecycleSimulation {
  public plants: BotanicalPlant[] = [];
  public globalSpeedMultiplier: number = 1.0;
  public isPaused: boolean = false;

  // Drifting environmental particles
  public detritusParticles: FloatingDetritusParticle[] = [];
  public sporeParticles: LuminousSporeParticle[] = [];

  // Particle systems for Three.js rendering
  public detritusMesh!: THREE.InstancedMesh;
  public sporePoints!: THREE.Points;

  private detritusDummy = new THREE.Object3D();
  private maxDetritus = 80;
  private maxSpores = 120;

  constructor() {
    this.initParticleSystems();
  }

  private initParticleSystems() {
    // 1. Decaying leaf detritus flakes that drift downward
    const flakeGeo = new THREE.PlaneGeometry(0.18, 0.12);
    const flakeMat = new THREE.MeshStandardMaterial({
      color: 0x8b6529, // senescent golden amber
      roughness: 0.9,
      metalness: 0.05,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
    });

    this.detritusMesh = new THREE.InstancedMesh(flakeGeo, flakeMat, this.maxDetritus);
    this.detritusMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.detritusMesh.count = 0;

    // 2. Luminous spores drifting upward
    const sporeGeo = new THREE.BufferGeometry();
    const sporePositions = new Float32Array(this.maxSpores * 3);
    const sporeColors = new Float32Array(this.maxSpores * 3);

    sporeGeo.setAttribute('position', new THREE.BufferAttribute(sporePositions, 3));
    sporeGeo.setAttribute('color', new THREE.BufferAttribute(sporeColors, 3));

    const sporeMat = new THREE.PointsMaterial({
      size: 0.22,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.sporePoints = new THREE.Points(sporeGeo, sporeMat);
  }

  public registerPlant(plant: BotanicalPlant) {
    this.plants.push(plant);
  }

  /**
   * Main simulation step for plant lifecycles.
   */
  public update(dt: number, timeSpeedFactor: number = 1.0) {
    if (this.isPaused || dt <= 0) return;

    const effectiveDt = Math.min(0.2, dt) * this.globalSpeedMultiplier * (timeSpeedFactor > 0 ? 1.0 : 0.0);

    for (let i = 0; i < this.plants.length; i++) {
      const p = this.plants[i];
      p.age += effectiveDt * p.speedMultiplier;
      p.overallProgress = (p.age % p.lifespan) / p.lifespan;

      // Stage transitions across life cycle:
      // 0.00 - 0.15 : Sprout (Germinating)
      // 0.15 - 0.45 : Growing (Vegetative Elongation)
      // 0.45 - 0.72 : Flourishing (Peak Bloom & Spore Release)
      // 0.72 - 0.93 : Senescent (Wilting, Chlorosis & Leaf Shedding)
      // 0.93 - 1.00 : Rebirth (Dissolution & Fresh Sprout Emergence)
      const prog = p.overallProgress;

      if (prog < 0.15) {
        // --- 1. SPROUT STAGE ---
        p.stage = 'sprout';
        p.stageProgress = prog / 0.15;
        // Scale from 0.18 up to 0.45
        p.growthScale = 0.18 + 0.27 * Math.pow(p.stageProgress, 1.4);
        p.wiltAmount = 0.0;
        p.chlorosis = 0.0;
        p.sporeEmit = 0.0;
        p.health = 80 + 20 * p.stageProgress;

      } else if (prog < 0.45) {
        // --- 2. GROWING STAGE ---
        p.stage = 'growing';
        p.stageProgress = (prog - 0.15) / 0.30;
        // Smooth Hermite curve up to full size (0.45 -> 1.0)
        const t = p.stageProgress;
        const smoothT = t * t * (3.0 - 2.0 * t);
        p.growthScale = 0.45 + 0.55 * smoothT;
        p.wiltAmount = 0.0;
        p.chlorosis = 0.0;
        p.sporeEmit = 0.0;
        p.health = 100;

      } else if (prog < 0.72) {
        // --- 3. FLOURISHING STAGE ---
        p.stage = 'flourishing';
        p.stageProgress = (prog - 0.45) / 0.27;
        p.growthScale = 1.0 + 0.04 * Math.sin(p.stageProgress * Math.PI);
        p.wiltAmount = 0.0;
        p.chlorosis = 0.0;
        p.health = 100;
        // Bioluminescent spore emission pulses
        p.sporeEmit = Math.sin(p.stageProgress * Math.PI);

        // Periodically spawn floating luminous spores
        if (Math.random() < 0.15 * effectiveDt * 3.0) {
          this.emitSporeFromPlant(p);
        }

      } else if (prog < 0.93) {
        // --- 4. SENESCENT STAGE ---
        p.stage = 'senescent';
        p.stageProgress = (prog - 0.72) / 0.21;
        const t = p.stageProgress;
        // Shrink slightly and wilt/droop heavily under gravity
        p.growthScale = 1.0 - 0.12 * t;
        p.wiltAmount = Math.pow(t, 1.5) * 0.7; // progressive drooping
        p.chlorosis = Math.min(1.0, t * 1.15); // yellowing & browning
        p.health = Math.max(10, 100 * (1.0 - t));
        p.sporeEmit = 0.0;

        // Periodically shed decaying leaf flakes
        if (Math.random() < 0.22 * effectiveDt * 4.0) {
          this.emitDetritusFromPlant(p);
        }

      } else {
        // --- 5. REBIRTH STAGE ---
        p.stage = 'rebirth';
        p.stageProgress = (prog - 0.93) / 0.07;
        const t = p.stageProgress;
        // Old biomass dissolves, new sprout begins at base
        p.growthScale = mix(0.88, 0.18, t);
        p.wiltAmount = mix(0.7, 0.0, t);
        p.chlorosis = mix(0.85, 0.0, t);
        p.health = mix(10, 85, t);
        p.sporeEmit = 0.0;
      }

      // Sync updated parameters to Three.js shader uniforms
      p.stemMaterial.uniforms.uGrowthScale.value = p.growthScale;
      p.stemMaterial.uniforms.uWiltAmount.value = p.wiltAmount;
      p.stemMaterial.uniforms.uChlorosis.value = p.chlorosis;
      p.stemMaterial.uniforms.uSporeEmit.value = p.sporeEmit;

      if (p.splatMaterial) {
        p.splatMaterial.uniforms.uGrowthScale.value = p.growthScale;
        p.splatMaterial.uniforms.uWiltAmount.value = p.wiltAmount;
        p.splatMaterial.uniforms.uChlorosis.value = p.chlorosis;
      }
    }

    // Update drifting particles
    this.updateDetritus(effectiveDt);
    this.updateSpores(effectiveDt);
  }

  private emitSporeFromPlant(plant: BotanicalPlant) {
    if (this.sporeParticles.length >= this.maxSpores) return;

    // Spore emits from upper canopy
    const angle = Math.random() * Math.PI * 2;
    const rad = Math.random() * 0.8;
    const px = plant.origin.x + Math.cos(angle) * rad;
    const py = plant.origin.y + (2.5 + Math.random() * 2.0) * plant.growthScale;
    const pz = plant.origin.z + Math.sin(angle) * rad;

    const sporeColor = plant.stemMaterial.uniforms.uTipColor.value.clone();

    this.sporeParticles.push({
      x: px,
      y: py,
      z: pz,
      vx: (Math.random() - 0.5) * 0.15,
      vy: 0.18 + Math.random() * 0.22, // buoyant drift upward
      vz: (Math.random() - 0.5) * 0.15,
      size: 0.14 + Math.random() * 0.1,
      color: sporeColor,
      life: 0,
      maxLife: 5.0 + Math.random() * 4.0,
    });
  }

  private emitDetritusFromPlant(plant: BotanicalPlant) {
    if (this.detritusParticles.length >= this.maxDetritus) return;

    // Detritus flakes drop from senescent leaves
    const angle = Math.random() * Math.PI * 2;
    const rad = 0.4 + Math.random() * 1.2;
    const px = plant.origin.x + Math.cos(angle) * rad;
    const py = plant.origin.y + (1.5 + Math.random() * 2.5) * plant.growthScale;
    const pz = plant.origin.z + Math.sin(angle) * rad;

    const flakeColor = new THREE.Color().lerpColors(
      new THREE.Color(0xb5782a), // senescent yellow
      new THREE.Color(0x3a2512), // decaying dark peat
      Math.random()
    );

    this.detritusParticles.push({
      x: px,
      y: py,
      z: pz,
      vx: (Math.random() - 0.5) * 0.08,
      vy: -0.22 - Math.random() * 0.18, // sink slowly to sand bed
      vz: (Math.random() - 0.5) * 0.08,
      size: 0.12 + Math.random() * 0.08,
      rot: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 1.5,
      color: flakeColor,
      life: 0,
      maxLife: 10.0 + Math.random() * 6.0,
    });

    plant.shedLeavesCount++;
  }

  private updateDetritus(dt: number) {
    const alive: FloatingDetritusParticle[] = [];

    for (let i = 0; i < this.detritusParticles.length; i++) {
      const d = this.detritusParticles[i];
      d.life += dt;
      if (d.life >= d.maxLife) continue;

      // Gentle hydrodynamic flutter
      d.vx += Math.sin(d.y * 3.0 + d.life * 2.0) * 0.005;
      d.vz += Math.cos(d.y * 3.0 + d.life * 1.8) * 0.005;
      d.rot += d.rotSpeed * dt;

      d.x += d.vx * dt;
      d.y += d.vy * dt;
      d.z += d.vz * dt;

      // Rest on sand floor (y ~ -6.5)
      if (d.y <= -6.6) {
        d.y = -6.6;
        d.vy = 0;
        d.vx *= 0.8;
        d.vz *= 0.8;
      }

      alive.push(d);
    }

    this.detritusParticles = alive;
    this.detritusMesh.count = Math.min(this.maxDetritus, alive.length);

    for (let i = 0; i < this.detritusMesh.count; i++) {
      const d = alive[i];
      this.detritusDummy.position.set(d.x, d.y, d.z);
      this.detritusDummy.rotation.set(0.4, d.rot, d.rot * 0.5);
      this.detritusDummy.scale.set(d.size, d.size, d.size);
      this.detritusDummy.updateMatrix();

      this.detritusMesh.setMatrixAt(i, this.detritusDummy.matrix);
      this.detritusMesh.setColorAt(i, d.color);
    }

    if (this.detritusMesh.count > 0) {
      this.detritusMesh.instanceMatrix.needsUpdate = true;
      if (this.detritusMesh.instanceColor) this.detritusMesh.instanceColor.needsUpdate = true;
    }
  }

  private updateSpores(dt: number) {
    const alive: LuminousSporeParticle[] = [];
    const posAttr = this.sporePoints.geometry.attributes.position as THREE.BufferAttribute;
    const colAttr = this.sporePoints.geometry.attributes.color as THREE.BufferAttribute;
    const posArr = posAttr.array as Float32Array;
    const colArr = colAttr.array as Float32Array;

    for (let i = 0; i < this.sporeParticles.length; i++) {
      const s = this.sporeParticles[i];
      s.life += dt;
      if (s.life >= s.maxLife) continue;

      // Buoyant water drift
      s.vx += Math.sin(s.y * 2.0 + s.life * 1.5) * 0.008;
      s.vz += Math.cos(s.y * 2.0 + s.life * 1.2) * 0.008;

      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.z += s.vz * dt;

      // Pop at water surface meniscus (y ~ 6.6)
      if (s.y >= 6.7) continue;

      alive.push(s);
    }

    this.sporeParticles = alive;
    const count = Math.min(this.maxSpores, alive.length);

    for (let i = 0; i < count; i++) {
      const s = alive[i];
      const i3 = i * 3;
      posArr[i3] = s.x;
      posArr[i3 + 1] = s.y;
      posArr[i3 + 2] = s.z;

      const alpha = Math.sin((s.life / s.maxLife) * Math.PI);
      colArr[i3] = s.color.r * alpha;
      colArr[i3 + 1] = s.color.g * alpha;
      colArr[i3 + 2] = s.color.b * alpha;
    }

    // Clear unused slots
    for (let i = count; i < this.maxSpores; i++) {
      const i3 = i * 3;
      posArr[i3] = 0;
      posArr[i3 + 1] = -999;
      posArr[i3 + 2] = 0;
      colArr[i3] = 0;
      colArr[i3 + 1] = 0;
      colArr[i3 + 2] = 0;
    }

    posAttr.needsUpdate = true;
    colAttr.needsUpdate = true;
  }

  // --- Interactive Control Methods ---

  /**
   * Fertilizes a plant with micro-nutrients: boosts health to 100%,
   * spurs vigorous vegetative growth, and halts senescent decay.
   */
  public fertilizePlant(plantId: string) {
    const p = this.plants.find(x => x.id === plantId);
    if (!p) return;

    p.health = 100;
    // Advance into flourishing vegetative state
    p.age = p.lifespan * 0.35;
    p.wiltAmount = 0.0;
    p.chlorosis = 0.0;
  }

  /**
   * Prunes senescent decayed foliage, triggering immediate fresh rebirth.
   */
  public prunePlant(plantId: string) {
    const p = this.plants.find(x => x.id === plantId);
    if (!p) return;

    p.age = p.lifespan * 0.94; // Advance to rebirth transition
  }

  /**
   * Synchronized spore dispersal across all mature specimens.
   */
  public triggerSynchronizedBloom() {
    for (let i = 0; i < this.plants.length; i++) {
      const p = this.plants[i];
      p.age = p.lifespan * 0.55; // Set to peak flourishing
      for (let s = 0; s < 8; s++) {
        this.emitSporeFromPlant(p);
      }
    }
  }

  public setSpeedMultiplier(val: number) {
    this.globalSpeedMultiplier = Math.max(0.1, Math.min(20.0, val));
  }
}

function mix(a: number, b: number, t: number): number {
  return a * (1 - t) + b * t;
}

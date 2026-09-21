/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Boid4D, FireflyBoid4D, FireflyCycleConfig, FoodPellet, ProcessRegimePreset, TankBounds } from '../types';
import { SPECIES_CONFIGS } from './species';

export class BoidSimulation4D {
  public boids: Boid4D[] = [];
  public fireflies: FireflyBoid4D[] = [];

  public bounds: TankBounds = {
    minX: -14.0,
    maxX: 14.0,
    minY: -7.0,
    maxY: 7.0,
    minZ: -6.0,
    maxZ: 6.0,
    minW: 0.0,
    maxW: 100.0,
  };

  // Multi-scalar population targets - optimized defaults for 60 FPS
  public macroCount: number = 2;
  public mesoCount: number = 120;
  public fireflyCount: number = 150;
  public activePreset: ProcessRegimePreset = 'balanced';

  // Spatial Partitioning Grid for O(N) neighbor lookup and wake dispersion
  private readonly cellSize: number = 4.5;
  private readonly invCellSize: number = 1.0 / 4.5;
  private colsX: number = 7;
  private colsY: number = 4;
  private colsZ: number = 3;
  private totalCells: number = 84;
  private fishGrid: number[][] = [];
  public macroBoidsCache: Boid4D[] = [];

  // Separate Tunable Firefly Population Cycle (Biological bloom & ebb tide)
  public fireflyCycle: FireflyCycleConfig = {
    enabled: true,
    periodSeconds: 40.0, // 40-second continuous tide wave
    currentPhase: 0.0, // 0 to 2*PI
    minCount: 30, // Trough swarm
    maxCount: 240, // Peak bloom swarm
  };

  // 4D Temporal parameters
  public currentTimeW: number = 50.0;
  public timeFlowDirection: number = 1.0; // 1 = forward, -1 = reverse, 0 = paused
  public timeSpeed: number = 6.0; // W units per second
  public temporalWindow: number = 18.0; // Visibility window around currentTimeW
  public showTemporalEchoes: boolean = true; // Show faint ghosts of past/future boids

  // Flocking weights
  public separationWeight: number = 2.4;
  public alignmentWeight: number = 1.4;
  public cohesionWeight: number = 1.1;
  public boundaryWeight: number = 3.5;
  public foodWeight: number = 4.8;
  public temporalWeight: number = 0.8; // Influence of 4th dimension in distance metric

  // Perception radii
  public neighborRadius: number = 4.2;
  public separationRadius: number = 1.6;
  public foodSenseRadius: number = 12.0;

  // Kuramoto Flash Synchronization for Micro-Fireflies
  public kuramotoEnabled: boolean = true;
  public kuramotoCoupling: number = 2.6; // Coupling constant K
  public kuramotoSync: number = 0.82; // Coherence order parameter r in [0, 1]

  // Active food pellets in the tank
  public foodPellets: FoodPellet[] = [];

  // Disturbance point (when user stirs water)
  public disturbance: { x: number; y: number; z: number; strength: number } | null = null;

  // Light target for micro-firefly phototaxis
  public lightTarget: { x: number; y: number; z: number; intensity: number } = {
    x: 0,
    y: 5.5,
    z: 0,
    intensity: 1.0,
  };

  // Spatial clustering tracking for dynamic lighting
  public schoolCenter: { x: number; y: number; z: number } = { x: 0, y: 0, z: 0 };
  public schoolActivity: number = 0; // overall kinetic turbulence

  // Event callback when food is consumed
  public onFoodEaten?: (x: number, y: number, z: number) => void;

  constructor(macroCount: number = 2, mesoCount: number = 120, fireflyCount: number = 150) {
    this.macroCount = macroCount;
    this.mesoCount = mesoCount;
    this.fireflyCount = fireflyCount;
    this.initSpatialGrid();
    this.initMultiScalarBoids();
  }

  private initSpatialGrid() {
    const spanX = this.bounds.maxX - this.bounds.minX;
    const spanY = this.bounds.maxY - this.bounds.minY;
    const spanZ = this.bounds.maxZ - this.bounds.minZ;
    this.colsX = Math.max(1, Math.ceil(spanX / this.cellSize));
    this.colsY = Math.max(1, Math.ceil(spanY / this.cellSize));
    this.colsZ = Math.max(1, Math.ceil(spanZ / this.cellSize));
    this.totalCells = this.colsX * this.colsY * this.colsZ;
    this.fishGrid = [];
    for (let i = 0; i < this.totalCells; i++) {
      this.fishGrid.push([]);
    }
  }

  public initMultiScalarBoids() {
    this.boids = [];
    this.fireflies = [];

    // 1. Spawn Macro Pelagic Giants (Species 0 & 1: Titan Leviathan, Celestial Ray)
    const macroSpeciesCount = 2;
    for (let i = 0; i < this.macroCount; i++) {
      const speciesIndex = i % macroSpeciesCount;
      const cfg = SPECIES_CONFIGS[speciesIndex];

      const x = (Math.random() - 0.5) * 22.0;
      const y = -4.5 + Math.random() * 8.0; // Grazes between bottom reef & mid column
      const z = (Math.random() - 0.5) * 8.0;
      const w = this.bounds.minW + Math.random() * (this.bounds.maxW - this.bounds.minW);

      const theta = Math.random() * Math.PI * 2;
      const speed = 1.6 + Math.random() * 0.5;

      this.boids.push({
        x,
        y,
        z,
        w,
        vx: Math.cos(theta) * speed,
        vy: (Math.random() - 0.5) * 0.4,
        vz: Math.sin(theta) * speed,
        vw: (Math.random() - 0.5) * 1.5, // Slow, dignified temporal drift
        speciesIndex,
        regime: 'macro_pelagic',
        scale: cfg.baseScale * (0.95 + Math.random() * 0.15),
        swimPhase: Math.random() * Math.PI * 2,
        speed,
        temporalAlpha: 1.0,
        bioluminescence: 0.8 + Math.random() * 0.2,
        mass: 7.5, // High inertia
        burstPhase: Math.random(),
        isBursting: true,
        curiosityTimer: 0,
      });
    }

    // Cache macro boids for instant avoidance & wake lookup without per-frame allocations
    this.macroBoidsCache = this.boids.filter(b => b.regime === 'macro_pelagic');

    // 2. Spawn Meso Schooling Teleosts (Species 2..5: Tetras, Guppies, Discus, Tangs)
    for (let i = 0; i < this.mesoCount; i++) {
      const speciesIndex = 2 + Math.floor(Math.random() * (SPECIES_CONFIGS.length - 2));
      const cfg = SPECIES_CONFIGS[speciesIndex];

      const x = this.bounds.minX + Math.random() * (this.bounds.maxX - this.bounds.minX);
      const y = this.bounds.minY + Math.random() * (this.bounds.maxY - this.bounds.minY);
      const z = this.bounds.minZ + Math.random() * (this.bounds.maxZ - this.bounds.minZ);
      const w = this.bounds.minW + Math.random() * (this.bounds.maxW - this.bounds.minW);

      const theta = Math.random() * Math.PI * 2;
      const phi = (Math.random() - 0.5) * Math.PI * 0.5;
      const speed = 1.8 + Math.random() * (cfg.maxSpeed - 1.8);

      this.boids.push({
        x,
        y,
        z,
        w,
        vx: Math.cos(theta) * Math.cos(phi) * speed,
        vy: Math.sin(phi) * speed * 0.6,
        vz: Math.sin(theta) * Math.cos(phi) * speed * 0.8,
        vw: (Math.random() - 0.5) * 4.5,
        speciesIndex,
        regime: 'meso_schooling',
        scale: cfg.baseScale * (0.85 + Math.random() * 0.3),
        swimPhase: Math.random() * Math.PI * 2,
        speed,
        temporalAlpha: 1.0,
        bioluminescence: 0.5 + Math.random() * 0.5,
        mass: 1.0,
        burstPhase: Math.random(),
        isBursting: Math.random() > 0.4,
        curiosityTimer: 0,
      });
    }

    // 3. Spawn Micro-Firefly Bioluminescent Plankton
    for (let i = 0; i < this.fireflyCount; i++) {
      // Cluster organically near bottom plants, rocks, and water center
      const angle = Math.random() * Math.PI * 2;
      const radius = 2.0 + Math.random() * 10.0;
      const x = Math.cos(angle) * radius;
      const y = -5.8 + Math.random() * 9.5;
      const z = (Math.random() - 0.5) * 9.0;
      const w = this.bounds.minW + Math.random() * (this.bounds.maxW - this.bounds.minW);

      const colorRand = Math.random();
      const colorType = colorRand < 0.6 ? 0 : colorRand < 0.85 ? 1 : 2;

      this.fireflies.push({
        id: i,
        x,
        y,
        z,
        w,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.3,
        vz: (Math.random() - 0.5) * 0.5,
        vw: (Math.random() - 0.5) * 2.0,
        flashPhase: Math.random() * Math.PI * 2,
        naturalFrequency: 2.1 + (Math.random() - 0.5) * 0.7, // ~0.35 Hz natural cycle
        flashIntensity: 0.1,
        scale: 0.12 + Math.random() * 0.12, // Micro scale
        colorType,
        temporalAlpha: 1.0,
      });
    }
  }

  public applyRegimePreset(preset: ProcessRegimePreset) {
    this.activePreset = preset;
    switch (preset) {
      case 'balanced':
        this.macroCount = 3;
        this.mesoCount = 190;
        this.fireflyCount = 240;
        this.kuramotoCoupling = 2.6;
        this.kuramotoEnabled = true;
        break;
      case 'firefly_bloom':
        this.macroCount = 1;
        this.mesoCount = 60;
        this.fireflyCount = 450;
        this.kuramotoCoupling = 4.2; // Intense flash synchronization!
        this.kuramotoEnabled = true;
        break;
      case 'leviathan_abyss':
        this.macroCount = 5;
        this.mesoCount = 100;
        this.fireflyCount = 140;
        this.kuramotoCoupling = 1.8;
        this.kuramotoEnabled = true;
        break;
      case 'schooling_frenzy':
        this.macroCount = 2;
        this.mesoCount = 340;
        this.fireflyCount = 120;
        this.kuramotoCoupling = 2.0;
        this.kuramotoEnabled = true;
        break;
    }
    // Update firefly cycle bounds according to preset
    if (preset === 'firefly_bloom') {
      this.fireflyCycle.minCount = 160;
      this.fireflyCycle.maxCount = 480;
      this.fireflyCycle.periodSeconds = 30.0;
    } else if (preset === 'balanced') {
      this.fireflyCycle.minCount = 35;
      this.fireflyCycle.maxCount = 380;
      this.fireflyCycle.periodSeconds = 40.0;
    } else if (preset === 'leviathan_abyss') {
      this.fireflyCycle.minCount = 20;
      this.fireflyCycle.maxCount = 180;
      this.fireflyCycle.periodSeconds = 50.0;
    } else if (preset === 'schooling_frenzy') {
      this.fireflyCycle.minCount = 20;
      this.fireflyCycle.maxCount = 160;
      this.fireflyCycle.periodSeconds = 45.0;
    }
    this.initMultiScalarBoids();
  }

  public spawnSingleFirefly(id: number): FireflyBoid4D {
    const angle = Math.random() * Math.PI * 2;
    const radius = 2.0 + Math.random() * 10.0;
    const x = Math.cos(angle) * radius;
    const y = -5.8 + Math.random() * 9.5;
    const z = (Math.random() - 0.5) * 9.0;
    const w = this.bounds.minW + Math.random() * (this.bounds.maxW - this.bounds.minW);

    const colorRand = Math.random();
    const colorType = colorRand < 0.6 ? 0 : colorRand < 0.85 ? 1 : 2;

    return {
      id,
      x,
      y,
      z,
      w,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.3,
      vz: (Math.random() - 0.5) * 0.5,
      vw: (Math.random() - 0.5) * 2.0,
      flashPhase: Math.random() * Math.PI * 2,
      naturalFrequency: 2.1 + (Math.random() - 0.5) * 0.7,
      flashIntensity: 0.05,
      scale: 0.12 + Math.random() * 0.12,
      colorType,
      temporalAlpha: 0.05, // Spawn with faint alpha to prevent sudden pop
    };
  }

  public smoothAdjustFireflies(targetCount: number) {
    targetCount = Math.max(0, Math.min(targetCount, 520));
    this.fireflyCount = targetCount;
    const current = this.fireflies.length;

    if (current < targetCount) {
      const diff = targetCount - current;
      const toAdd = Math.min(diff, 10); // Smoothly stream in up to 10 fireflies per frame
      for (let i = 0; i < toAdd; i++) {
        this.fireflies.push(this.spawnSingleFirefly(current + i));
      }
    } else if (current > targetCount) {
      const diff = current - targetCount;
      const toRemove = Math.min(diff, 10);
      for (let i = 0; i < toRemove; i++) {
        this.fireflies.pop();
      }
    }
  }

  public setFireflyCycleEnabled(enabled: boolean) {
    this.fireflyCycle.enabled = enabled;
  }

  public setFireflyCyclePeriod(periodSeconds: number) {
    this.fireflyCycle.periodSeconds = Math.max(8.0, Math.min(periodSeconds, 300.0));
  }

  public setFireflyCycleMinMax(minCount: number, maxCount: number) {
    this.fireflyCycle.minCount = Math.max(0, Math.min(minCount, 250));
    this.fireflyCycle.maxCount = Math.max(this.fireflyCycle.minCount + 20, Math.min(maxCount, 500));
  }

  public setFireflyCyclePhase(phase: number) {
    this.fireflyCycle.currentPhase = ((phase % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    const tide = (1 - Math.cos(this.fireflyCycle.currentPhase)) * 0.5;
    const target = Math.round(
      this.fireflyCycle.minCount + (this.fireflyCycle.maxCount - this.fireflyCycle.minCount) * tide
    );
    this.smoothAdjustFireflies(target);
  }

  public setMacroCount(count: number) {
    this.macroCount = Math.max(0, Math.min(count, 8));
    this.initMultiScalarBoids();
  }

  public setMesoCount(count: number) {
    this.mesoCount = Math.max(20, Math.min(count, 500));
    this.initMultiScalarBoids();
  }

  public setFireflyCount(count: number) {
    this.fireflyCount = Math.max(0, Math.min(count, 500));
    // If cycle is currently on, disable it so manual slider holds
    this.fireflyCycle.enabled = false;
    this.smoothAdjustFireflies(count);
  }

  public addFood(x: number, y: number, z: number) {
    this.foodPellets.push({
      id: Math.random().toString(36).substring(2, 9),
      x,
      y,
      z,
      w: this.currentTimeW, // dropped into current temporal hyperplane
      vx: (Math.random() - 0.5) * 0.3,
      vy: -0.6 - Math.random() * 0.5, // slowly sinking
      vz: (Math.random() - 0.5) * 0.3,
      radius: 0.22,
      nutrition: 1.0,
      createdAt: performance.now(),
    });
  }

  public removeFoodPellet(id: string) {
    const idx = this.foodPellets.findIndex((p) => p.id === id);
    if (idx !== -1) {
      const p = this.foodPellets[idx];
      this.onFoodEaten?.(p.x, p.y, p.z);
      this.foodPellets.splice(idx, 1);
    }
  }

  public update(dt: number) {
    const clampedDt = Math.min(dt, 0.05);

    // 1. Advance tank observation time
    this.currentTimeW += this.timeFlowDirection * this.timeSpeed * clampedDt;
    const wSpan = this.bounds.maxW - this.bounds.minW;
    if (this.currentTimeW > this.bounds.maxW) {
      this.currentTimeW = this.bounds.minW + (this.currentTimeW - this.bounds.maxW) % wSpan;
    } else if (this.currentTimeW < this.bounds.minW) {
      this.currentTimeW = this.bounds.maxW - (this.bounds.minW - this.currentTimeW) % wSpan;
    }

    // 1b. Advance Separate Firefly Quantity Cycle (Biological Bloom & Ebb)
    if (this.fireflyCycle.enabled && this.fireflyCycle.periodSeconds > 0) {
      this.fireflyCycle.currentPhase += (clampedDt / this.fireflyCycle.periodSeconds) * Math.PI * 2;
      if (this.fireflyCycle.currentPhase > Math.PI * 2) {
        this.fireflyCycle.currentPhase -= Math.PI * 2;
      }
      const tide = (1 - Math.cos(this.fireflyCycle.currentPhase)) * 0.5;
      const targetCount = Math.round(
        this.fireflyCycle.minCount + (this.fireflyCycle.maxCount - this.fireflyCycle.minCount) * tide
      );
      this.smoothAdjustFireflies(targetCount);
    }

    // 2. Update food pellets (sink gently with water drag)
    for (let i = this.foodPellets.length - 1; i >= 0; i--) {
      const food = this.foodPellets[i];
      food.x += food.vx * clampedDt;
      food.y += food.vy * clampedDt;
      food.z += food.vz * clampedDt;

      food.vx += (Math.random() - 0.5) * 0.2 * clampedDt;
      food.vz += (Math.random() - 0.5) * 0.2 * clampedDt;
      food.vx *= 0.98;
      food.vz *= 0.98;

      if (food.y < this.bounds.minY + 0.3) {
        food.y = this.bounds.minY + 0.3;
        food.vy = 0;
        food.vx = 0;
        food.vz = 0;
      }

      if (performance.now() - food.createdAt > 35000) {
        this.foodPellets.splice(i, 1);
      }
    }

    // 3. Fade disturbance
    if (this.disturbance) {
      this.disturbance.strength *= Math.pow(0.92, clampedDt * 60);
      if (this.disturbance.strength < 0.05) {
        this.disturbance = null;
      }
    }

    // 4. Update Fish Boids (Macro & Meso)
    this.updateFishBoids(clampedDt, wSpan);

    // 5. Update Micro-Firefly Swarm (Kuramoto sync, wake reaction, Brownian drift)
    this.updateFireflies(clampedDt, wSpan);
  }

  private updateFishBoids(clampedDt: number, wSpan: number) {
    let sumX = 0, sumY = 0, sumZ = 0;
    let visibleCount = 0;
    let totalKinetic = 0;

    const boidCount = this.boids.length;
    const neighborDistSq = this.neighborRadius * this.neighborRadius;
    const separationDistSq = this.separationRadius * this.separationRadius;
    const gammaW = this.temporalWeight;

    // 0. Populate spatial partition grid for ultra-fast O(N) neighbor lookup
    for (let c = 0; c < this.totalCells; c++) {
      this.fishGrid[c].length = 0;
    }
    for (let i = 0; i < boidCount; i++) {
      const b = this.boids[i];
      const cx = Math.max(0, Math.min(this.colsX - 1, Math.floor((b.x - this.bounds.minX) * this.invCellSize)));
      const cy = Math.max(0, Math.min(this.colsY - 1, Math.floor((b.y - this.bounds.minY) * this.invCellSize)));
      const cz = Math.max(0, Math.min(this.colsZ - 1, Math.floor((b.z - this.bounds.minZ) * this.invCellSize)));
      const cellIdx = (cx * this.colsY + cy) * this.colsZ + cz;
      this.fishGrid[cellIdx].push(i);
    }

    for (let i = 0; i < boidCount; i++) {
      const b = this.boids[i];
      const cfg = SPECIES_CONFIGS[b.speciesIndex];
      const isMacro = b.regime === 'macro_pelagic';

      // 4D temporal distance
      let dw = Math.abs(b.w - this.currentTimeW);
      if (dw > wSpan * 0.5) dw = wSpan - dw;

      // Temporal alpha fade
      if (dw < this.temporalWindow) {
        const ratio = dw / this.temporalWindow;
        b.temporalAlpha = Math.max(0, 1.0 - ratio * ratio);
      } else {
        b.temporalAlpha = this.showTemporalEchoes ? 0.06 : 0.0;
      }

      if (b.temporalAlpha > 0.15) {
        sumX += b.x;
        sumY += b.y;
        sumZ += b.z;
        visibleCount++;
      }

      // Acceleration accumulators
      let ax = 0, ay = 0, az = 0, aw = 0;

      // Meso fish avoid Macro Leviathans (dynamic obstacle clearance with lateral fountain splitting)
      if (!isMacro) {
        for (let m = 0; m < this.macroBoidsCache.length; m++) {
          const macro = this.macroBoidsCache[m];
          const mdx = b.x - macro.x;
          const mdy = b.y - macro.y;
          const mdz = b.z - macro.z;
          const distSq = mdx * mdx + mdy * mdy + mdz * mdz;
          const clearanceRadius = 5.2;
          if (distSq < clearanceRadius * clearanceRadius && distSq > 0.001) {
            const dist = Math.sqrt(distSq);
            const repelStrength = (clearanceRadius - dist) * 8.5;
            // Radial pushback
            ax += (mdx / dist) * repelStrength;
            ay += (mdy / dist) * repelStrength * 0.6;
            az += (mdz / dist) * repelStrength;

            // Lateral fountain split around incoming leviathan heading
            const mSpeed = Math.sqrt(macro.vx * macro.vx + macro.vz * macro.vz) || 0.01;
            const lateralX = -macro.vz / mSpeed;
            const lateralZ = macro.vx / mSpeed;
            const sideDot = (mdx * lateralX + mdz * lateralZ) >= 0 ? 1 : -1;
            ax += lateralX * sideDot * repelStrength * 0.55;
            az += lateralZ * sideDot * repelStrength * 0.55;

            b.isBursting = true; // Trigger startle burst
          }
        }

        // Reef & Substrate Curiosity Hovering (fish break off briefly to inspect rock/plants/glass)
        if (b.curiosityTimer === undefined) b.curiosityTimer = 0;
        if (b.curiosityTimer > 0) {
          b.curiosityTimer -= clampedDt;
          if (b.curiosityTarget) {
            const cdx = b.curiosityTarget.x - b.x;
            const cdy = b.curiosityTarget.y - b.y;
            const cdz = b.curiosityTarget.z - b.z;
            const cDist = Math.sqrt(cdx * cdx + cdy * cdy + cdz * cdz) || 1;
            if (cDist > 0.6) {
              ax += (cdx / cDist) * 2.4;
              ay += (cdy / cDist) * 1.8;
              az += (cdz / cDist) * 2.4;
            } else {
              // Gentle hovering & pitching down toward substrate
              ax -= b.vx * 1.6;
              ay -= b.vy * 1.6;
              az -= b.vz * 1.6;
            }
          }
        } else {
          // Subtle probability to explore a reef crevice, plant frond, or glass
          if (Math.random() < 0.0025 && this.foodPellets.length === 0) {
            b.curiosityTimer = 2.2 + Math.random() * 2.5;
            const pick = Math.random();
            if (pick < 0.45) {
              // Central rock cluster crevices
              b.curiosityTarget = {
                x: -4.0 + Math.random() * 8.0,
                y: -5.0 + Math.random() * 1.8,
                z: -2.0 + Math.random() * 4.0,
              };
            } else if (pick < 0.8) {
              // Lateral plant fronds
              b.curiosityTarget = {
                x: (Math.random() > 0.5 ? 6.5 : -6.5) + (Math.random() - 0.5) * 3.0,
                y: -3.8 + Math.random() * 3.5,
                z: -2.5 + Math.random() * 4.0,
              };
            } else {
              // Front glass inspection
              b.curiosityTarget = {
                x: -7.0 + Math.random() * 14.0,
                y: -3.5 + Math.random() * 6.0,
                z: 4.8 + Math.random() * 0.8,
              };
            }
          }
        }
      }

      // 4D Flocking forces using Spatial Grid (27 neighboring cells)
      let neighborCount = 0;
      let avgVx = 0, avgVy = 0, avgVz = 0, avgVw = 0;
      let centerX = 0, centerY = 0, centerZ = 0, centerW = 0;
      let sepX = 0, sepY = 0, sepZ = 0, sepW = 0;

      const maxNeighbors = isMacro ? 8 : 18;
      const nRadius = isMacro ? 6.0 : this.neighborRadius;
      const sepDist = isMacro ? 4.5 : this.separationRadius;

      const bcx = Math.max(0, Math.min(this.colsX - 1, Math.floor((b.x - this.bounds.minX) * this.invCellSize)));
      const bcy = Math.max(0, Math.min(this.colsY - 1, Math.floor((b.y - this.bounds.minY) * this.invCellSize)));
      const bcz = Math.max(0, Math.min(this.colsZ - 1, Math.floor((b.z - this.bounds.minZ) * this.invCellSize)));

      cellLoop:
      for (let ox = -1; ox <= 1; ox++) {
        const nx = bcx + ox;
        if (nx < 0 || nx >= this.colsX) continue;
        for (let oy = -1; oy <= 1; oy++) {
          const ny = bcy + oy;
          if (ny < 0 || ny >= this.colsY) continue;
          for (let oz = -1; oz <= 1; oz++) {
            const nz = bcz + oz;
            if (nz < 0 || nz >= this.colsZ) continue;

            const cell = this.fishGrid[(nx * this.colsY + ny) * this.colsZ + nz];
            const cLen = cell.length;
            for (let k = 0; k < cLen; k++) {
              const j = cell[k];
              if (i === j) continue;
              const other = this.boids[j];

              // Macro giants do not flock with meso minnows
              if (isMacro && other.regime !== 'macro_pelagic') continue;

              const dx = other.x - b.x;
              if (dx > nRadius || dx < -nRadius) continue;
              const dy = other.y - b.y;
              if (dy > nRadius || dy < -nRadius) continue;
              const dz = other.z - b.z;
              if (dz > nRadius || dz < -nRadius) continue;

              let deltaW = other.w - b.w;
              if (deltaW > wSpan * 0.5) deltaW -= wSpan;
              if (deltaW < -wSpan * 0.5) deltaW += wSpan;
              if (deltaW * deltaW * gammaW > neighborDistSq) continue;

              const distSq4D = dx * dx + dy * dy + dz * dz + gammaW * (deltaW * deltaW);

              if (distSq4D < neighborDistSq && distSq4D > 0.0001) {
                const dist4D = Math.sqrt(distSq4D);

                if (distSq4D < sepDist * sepDist) {
                  const force = (1.0 - dist4D / sepDist) / dist4D;
                  sepX -= dx * force;
                  sepY -= dy * force;
                  sepZ -= dz * force;
                  sepW -= deltaW * force * 0.5;
                }

                avgVx += other.vx;
                avgVy += other.vy;
                avgVz += other.vz;
                avgVw += other.vw;

                centerX += other.x;
                centerY += other.y;
                centerZ += other.z;
                centerW += other.w;

                neighborCount++;
                if (neighborCount >= maxNeighbors) break cellLoop;
              }
            }
          }
        }
      }

      if (neighborCount > 0) {
        const alignWt = isMacro ? 0.6 : this.alignmentWeight;
        const cohesWt = isMacro ? 0.3 : this.cohesionWeight;
        const sepWt = isMacro ? 3.5 : this.separationWeight;

        avgVx /= neighborCount;
        avgVy /= neighborCount;
        avgVz /= neighborCount;
        avgVw /= neighborCount;
        ax += (avgVx - b.vx) * alignWt;
        ay += (avgVy - b.vy) * alignWt;
        az += (avgVz - b.vz) * alignWt;
        aw += (avgVw - b.vw) * (alignWt * 0.6);

        centerX /= neighborCount;
        centerY /= neighborCount;
        centerZ /= neighborCount;
        centerW /= neighborCount;
        ax += (centerX - b.x) * cohesWt * 0.15;
        ay += (centerY - b.y) * cohesWt * 0.15;
        az += (centerZ - b.z) * cohesWt * 0.15;
        let cdw = centerW - b.w;
        if (cdw > wSpan * 0.5) cdw -= wSpan;
        if (cdw < -wSpan * 0.5) cdw += wSpan;
        aw += cdw * cohesWt * 0.08;

        ax += sepX * sepWt;
        ay += sepY * sepWt;
        az += sepZ * sepWt;
        aw += sepW * (sepWt * 0.5);
      }

      // Food Attraction
      let closestFood: FoodPellet | null = null;
      let minFoodDistSq = this.foodSenseRadius * this.foodSenseRadius;

      for (let f = 0; f < this.foodPellets.length; f++) {
        const food = this.foodPellets[f];
        const fdx = food.x - b.x;
        const fdy = food.y - b.y;
        const fdz = food.z - b.z;
        let fdw = Math.abs(food.w - b.w);
        if (fdw > wSpan * 0.5) fdw = wSpan - fdw;

        const fDistSq = fdx * fdx + fdy * fdy + fdz * fdz + gammaW * (fdw * fdw);
        if (fDistSq < minFoodDistSq) {
          minFoodDistSq = fDistSq;
          closestFood = food;
        }

        const nibbleDist = isMacro ? 1.8 : 0.64;
        if (fDistSq < nibbleDist) {
          food.nutrition -= isMacro ? 0.8 : 0.35;
          b.bioluminescence = 1.0;
          if (food.nutrition <= 0) {
            const eatenX = food.x;
            const eatenY = food.y;
            const eatenZ = food.z;
            this.foodPellets.splice(f, 1);
            this.onFoodEaten?.(eatenX, eatenY, eatenZ);
            break;
          }
        }
      }

      if (closestFood) {
        const fdx = closestFood.x - b.x;
        const fdy = closestFood.y - b.y;
        const fdz = closestFood.z - b.z;
        const fdist = Math.sqrt(fdx * fdx + fdy * fdy + fdz * fdz) || 1;
        const foodPower = isMacro ? 2.5 : this.foodWeight;
        const steerStrength = foodPower * Math.min(1.0, 5.0 / fdist);
        ax += (fdx / fdist) * steerStrength;
        ay += (fdy / fdist) * steerStrength;
        az += (fdz / fdist) * steerStrength;

        let fdw = closestFood.w - b.w;
        if (fdw > wSpan * 0.5) fdw -= wSpan;
        if (fdw < -wSpan * 0.5) fdw += wSpan;
        aw += fdw * 0.8;
      }

      // Boundary Soft Avoidance
      const margin = isMacro ? 3.4 : 2.0;
      const bWeight = isMacro ? 5.5 : this.boundaryWeight;

      if (b.x < this.bounds.minX + margin) ax += Math.pow((this.bounds.minX + margin - b.x) / margin, 2) * bWeight;
      if (b.x > this.bounds.maxX - margin) ax -= Math.pow((b.x - (this.bounds.maxX - margin)) / margin, 2) * bWeight;

      if (b.y < this.bounds.minY + margin + 0.8) ay += Math.pow((this.bounds.minY + margin + 0.8 - b.y) / margin, 2) * (bWeight * 1.3);
      if (b.y > this.bounds.maxY - margin - 0.4) ay -= Math.pow((b.y - (this.bounds.maxY - margin - 0.4)) / margin, 2) * (bWeight * 1.5);

      if (b.z < this.bounds.minZ + margin) az += Math.pow((this.bounds.minZ + margin - b.z) / margin, 2) * bWeight;
      if (b.z > this.bounds.maxZ - margin) az -= Math.pow((b.z - (this.bounds.maxZ - margin)) / margin, 2) * bWeight;

      // Temporal boundaries
      if (b.w < this.bounds.minW) b.w += wSpan;
      if (b.w > this.bounds.maxW) b.w -= wSpan;

      // Disturbance avoidance (Macro is resilient, Meso executes dynamic flash expansion)
      if (this.disturbance && !isMacro) {
        const ddx = b.x - this.disturbance.x;
        const ddy = b.y - this.disturbance.y;
        const ddz = b.z - this.disturbance.z;
        const distDisturbSq = ddx * ddx + ddy * ddy + ddz * ddz;
        if (distDisturbSq < 36.0 && distDisturbSq > 0.01) {
          const ddist = Math.sqrt(distDisturbSq);
          const force = (1.0 - ddist / 6.0) * this.disturbance.strength * 12.0;
          // Radial explosive scatter
          ax += (ddx / ddist) * force;
          ay += (ddy / ddist) * force * 0.7;
          az += (ddz / ddist) * force;
          // Lateral fountain curling split
          ax += (-ddz / ddist) * force * 0.4;
          az += (ddx / ddist) * force * 0.4;

          b.isBursting = true;
          b.bioluminescence = Math.min(1.0, b.bioluminescence + 0.5);
        }
      }

      // Macro cruising rhythm & gentle sinusoidal sweeps
      if (isMacro) {
        ax += Math.cos(b.swimPhase * 0.4) * 0.4;
        az += Math.sin(b.swimPhase * 0.3) * 0.35;
      }

      // Burst-and-Coast Kinematics: Natural Intermittent Swimming Rhythm
      if (!isMacro) {
        if (b.burstPhase === undefined) b.burstPhase = Math.random();
        const burstPeriod = 1.1 + (b.speciesIndex % 3) * 0.25;
        b.burstPhase = (b.burstPhase + clampedDt / burstPeriod) % 1.0;

        const isUrgent = (this.disturbance !== null) || (closestFood !== null) || (b.curiosityTimer !== undefined && b.curiosityTimer > 0);
        b.isBursting = isUrgent || (b.burstPhase < 0.38);

        const currentSpeed = Math.sqrt(b.vx * b.vx + b.vy * b.vy + b.vz * b.vz) || 0.01;
        if (b.isBursting) {
          // Burst phase: active tail propulsion acceleration
          const burstThrust = 0.45;
          ax += (b.vx / currentSpeed) * burstThrust;
          ay += (b.vy / currentSpeed) * (burstThrust * 0.3);
          az += (b.vz / currentSpeed) * burstThrust;
        } else {
          // Coast phase: hydrodynamic gliding with low-drag decay
          ax -= b.vx * 0.22;
          ay -= b.vy * 0.22;
          az -= b.vz * 0.22;
        }
      } else {
        // Forward urge for macro giants
        const currentSpeed = Math.sqrt(b.vx * b.vx + b.vy * b.vy + b.vz * b.vz) || 0.01;
        ax += (b.vx / currentSpeed) * 0.08;
        ay += (b.vy / currentSpeed) * 0.04;
        az += (b.vz / currentSpeed) * 0.08;
      }

      // Mass inertia division
      ax /= b.mass;
      ay /= b.mass;
      az /= b.mass;
      aw /= b.mass;

      // Velocity integration
      b.vx += ax * clampedDt;
      b.vy += ay * clampedDt;
      b.vz += az * clampedDt;
      b.vw += aw * clampedDt;

      b.vw *= 0.98;
      b.vw += Math.sin(b.x * 0.2 + b.z * 0.2 + performance.now() * 0.001) * 0.25 * clampedDt;

      // Speed clamping
      const newSpeed = Math.sqrt(b.vx * b.vx + b.vy * b.vy + b.vz * b.vz);
      const targetMax = cfg.maxSpeed * (closestFood ? 1.35 : 1.0);
      const minSpeed = isMacro ? 0.9 : 0.55;
      if (newSpeed > targetMax) {
        const scale = targetMax / newSpeed;
        b.vx *= scale;
        b.vy *= scale;
        b.vz *= scale;
      } else if (newSpeed < minSpeed) {
        const scale = minSpeed / (newSpeed || 1);
        b.vx *= scale;
        b.vy *= scale;
        b.vz *= scale;
      }
      b.speed = Math.max(minSpeed, Math.min(newSpeed, targetMax));

      // Position integration
      b.x += b.vx * clampedDt;
      b.y += b.vy * clampedDt;
      b.z += b.vz * clampedDt;
      b.w += b.vw * clampedDt;

      // Boundaries hard clamp
      if (b.x < this.bounds.minX) { b.x = this.bounds.minX; b.vx = Math.abs(b.vx); }
      if (b.x > this.bounds.maxX) { b.x = this.bounds.maxX; b.vx = -Math.abs(b.vx); }
      const bottomFloor = isMacro ? this.bounds.minY + 1.2 : this.bounds.minY + 0.5;
      if (b.y < bottomFloor) { b.y = bottomFloor; b.vy = Math.abs(b.vy); }
      if (b.y > this.bounds.maxY - 0.4) { b.y = this.bounds.maxY - 0.4; b.vy = -Math.abs(b.vy); }
      if (b.z < this.bounds.minZ) { b.z = this.bounds.minZ; b.vz = Math.abs(b.vz); }
      if (b.z > this.bounds.maxZ) { b.z = this.bounds.maxZ; b.vz = -Math.abs(b.vz); }

      // Intermittent Swim Phase: Active tail strokes during burst, smooth glide during coast
      if (!isMacro) {
        const strokeMultiplier = b.isBursting ? 1.35 : 0.18;
        b.swimPhase += b.speed * cfg.tailWagFrequency * strokeMultiplier * clampedDt;
      } else {
        b.swimPhase += b.speed * cfg.tailWagFrequency * clampedDt;
      }
      b.bioluminescence = Math.max(0.35, b.bioluminescence - clampedDt * 0.2);

      totalKinetic += b.speed;
    }

    if (visibleCount > 0) {
      const targetCenterX = sumX / visibleCount;
      const targetCenterY = sumY / visibleCount;
      const targetCenterZ = sumZ / visibleCount;

      this.schoolCenter.x += (targetCenterX - this.schoolCenter.x) * 0.08;
      this.schoolCenter.y += (targetCenterY - this.schoolCenter.y) * 0.08;
      this.schoolCenter.z += (targetCenterZ - this.schoolCenter.z) * 0.08;
      this.schoolActivity = totalKinetic / (boidCount || 1);
    }
  }

  private updateFireflies(clampedDt: number, wSpan: number) {
    const fireflyCount = this.fireflies.length;
    if (fireflyCount === 0) return;

    // 1. Mean-Field Kuramoto Synchronization (O(N) global coupling)
    let sumCos = 0;
    let sumSin = 0;
    for (let i = 0; i < fireflyCount; i++) {
      sumCos += Math.cos(this.fireflies[i].flashPhase);
      sumSin += Math.sin(this.fireflies[i].flashPhase);
    }
    const meanCos = sumCos / fireflyCount;
    const meanSin = sumSin / fireflyCount;
    const orderR = Math.min(1.0, Math.sqrt(meanCos * meanCos + meanSin * meanSin));
    const meanPhase = Math.atan2(meanSin, meanCos);
    this.kuramotoSync = orderR;
    const K = this.kuramotoEnabled ? this.kuramotoCoupling : 0;

    for (let i = 0; i < fireflyCount; i++) {
      const fb = this.fireflies[i];

      // 4D temporal distance
      let dw = Math.abs(fb.w - this.currentTimeW);
      if (dw > wSpan * 0.5) dw = wSpan - dw;
      if (dw < this.temporalWindow) {
        const ratio = dw / this.temporalWindow;
        fb.temporalAlpha = Math.max(0, 1.0 - ratio * ratio);
      } else {
        fb.temporalAlpha = this.showTemporalEchoes ? 0.05 : 0.0;
      }

      // Advance Kuramoto phase
      if (K > 0) {
        const phaseCouplingDelta = K * orderR * Math.sin(meanPhase - fb.flashPhase);
        fb.flashPhase += (fb.naturalFrequency + phaseCouplingDelta) * clampedDt;
      } else {
        fb.flashPhase += fb.naturalFrequency * clampedDt;
      }
      if (fb.flashPhase > Math.PI * 2) {
        fb.flashPhase -= Math.PI * 2;
      } else if (fb.flashPhase < 0) {
        fb.flashPhase += Math.PI * 2;
      }

      // Flash pulse profile: sharp photophore flare at phase peak
      const sinPhase = Math.max(0.0, Math.sin(fb.flashPhase));
      fb.flashIntensity = Math.max(0.06, Math.pow(sinPhase, 12.0));

      // Forces on micro-firefly
      let ax = 0, ay = 0, az = 0;

      // 1. Hydrodynamic Wake Dispersal (macro giants + local spatial cell fish)
      for (let m = 0; m < this.macroBoidsCache.length; m++) {
        const macro = this.macroBoidsCache[m];
        const fdx = fb.x - macro.x;
        const fdy = fb.y - macro.y;
        const fdz = fb.z - macro.z;
        const fDistSq = fdx * fdx + fdy * fdy + fdz * fdz;
        const wakeRadius = 4.2;
        if (fDistSq < wakeRadius * wakeRadius && fDistSq > 0.001) {
          const fDist = Math.sqrt(fDistSq);
          const pushForce = (1.0 - fDist / wakeRadius) * 8.5;
          ax += (fdx / fDist) * pushForce;
          ay += (fdy / fDist) * pushForce;
          az += (fdz / fDist) * pushForce;
          fb.flashIntensity = Math.min(1.0, fb.flashIntensity + 0.4);
        }
      }

      const fcx = Math.max(0, Math.min(this.colsX - 1, Math.floor((fb.x - this.bounds.minX) * this.invCellSize)));
      const fcy = Math.max(0, Math.min(this.colsY - 1, Math.floor((fb.y - this.bounds.minY) * this.invCellSize)));
      const fcz = Math.max(0, Math.min(this.colsZ - 1, Math.floor((fb.z - this.bounds.minZ) * this.invCellSize)));
      const fCell = this.fishGrid[(fcx * this.colsY + fcy) * this.colsZ + fcz];
      if (fCell) {
        const fCellLen = fCell.length;
        for (let k = 0; k < fCellLen; k++) {
          const fish = this.boids[fCell[k]];
          if (fish.regime === 'macro_pelagic') continue; // already checked above
          const fdx = fb.x - fish.x;
          const fdy = fb.y - fish.y;
          const fdz = fb.z - fish.z;
          const fDistSq = fdx * fdx + fdy * fdy + fdz * fdz;
          const wakeRadius = 2.0;
          if (fDistSq < wakeRadius * wakeRadius && fDistSq > 0.001) {
            const fDist = Math.sqrt(fDistSq);
            const pushForce = (1.0 - fDist / wakeRadius) * 4.5;
            ax += (fdx / fDist) * pushForce;
            ay += (fdy / fDist) * pushForce;
            az += (fdz / fDist) * pushForce;
            fb.flashIntensity = Math.min(1.0, fb.flashIntensity + 0.3);
          }
        }
      }

      // 2. Brownian Thermal Flutter
      ax += (Math.random() - 0.5) * 1.2;
      ay += (Math.random() - 0.5) * 0.9;
      az += (Math.random() - 0.5) * 1.2;

      // 3. Gentle Convective Upwelling Current
      ay += Math.sin(fb.x * 0.35 + performance.now() * 0.001) * 0.3;

      // 4. Phototaxis (Attraction to canopy light / desk lamp)
      const ldx = this.lightTarget.x - fb.x;
      const ldy = this.lightTarget.y - fb.y;
      const ldz = this.lightTarget.z - fb.z;
      const lDist = Math.sqrt(ldx * ldx + ldy * ldy + ldz * ldz) || 1;
      ax += (ldx / lDist) * 0.15 * this.lightTarget.intensity;
      ay += (ldy / lDist) * 0.12 * this.lightTarget.intensity;
      az += (ldz / lDist) * 0.15 * this.lightTarget.intensity;

      // 5. Water Stir Disturbance
      if (this.disturbance) {
        const ddx = fb.x - this.disturbance.x;
        const ddy = fb.y - this.disturbance.y;
        const ddz = fb.z - this.disturbance.z;
        const dDistSq = ddx * ddx + ddy * ddy + ddz * ddz;
        if (dDistSq < 16.0 && dDistSq > 0.01) {
          const ddist = Math.sqrt(dDistSq);
          const force = (1.0 - ddist / 4.0) * this.disturbance.strength * 7.0;
          ax += (ddx / ddist) * force;
          ay += (ddy / ddist) * force;
          az += (ddz / ddist) * force;
        }
      }

      // Velocity integration with micro-fluidic viscous damping
      fb.vx = (fb.vx + ax * clampedDt) * Math.pow(0.92, clampedDt * 60);
      fb.vy = (fb.vy + ay * clampedDt) * Math.pow(0.92, clampedDt * 60);
      fb.vz = (fb.vz + az * clampedDt) * Math.pow(0.92, clampedDt * 60);
      fb.vw = (fb.vw + (Math.random() - 0.5) * 0.3 * clampedDt) * 0.96;

      // Position update
      fb.x += fb.vx * clampedDt;
      fb.y += fb.vy * clampedDt;
      fb.z += fb.vz * clampedDt;
      fb.w += fb.vw * clampedDt;

      // Boundaries soft bounce
      if (fb.x < this.bounds.minX + 0.5) { fb.x = this.bounds.minX + 0.5; fb.vx = Math.abs(fb.vx); }
      if (fb.x > this.bounds.maxX - 0.5) { fb.x = this.bounds.maxX - 0.5; fb.vx = -Math.abs(fb.vx); }
      if (fb.y < this.bounds.minY + 0.4) { fb.y = this.bounds.minY + 0.4; fb.vy = Math.abs(fb.vy); }
      if (fb.y > this.bounds.maxY - 0.5) { fb.y = this.bounds.maxY - 0.5; fb.vy = -Math.abs(fb.vy); }
      if (fb.z < this.bounds.minZ + 0.5) { fb.z = this.bounds.minZ + 0.5; fb.vz = Math.abs(fb.vz); }
      if (fb.z > this.bounds.maxZ - 0.5) { fb.z = this.bounds.maxZ - 0.5; fb.vz = -Math.abs(fb.vz); }

      if (fb.w < this.bounds.minW) fb.w += wSpan;
      if (fb.w > this.bounds.maxW) fb.w -= wSpan;
    }

    // Compute Kuramoto Order Parameter: r = |(1/N) * sum(e^(i*theta_j))|
    this.kuramotoSync = Math.sqrt(sumCos * sumCos + sumSin * sumSin) / fireflyCount;
  }
}

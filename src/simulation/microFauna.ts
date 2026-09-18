/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  MicroFaunaCategory,
  MicroFaunaEntity,
  MicroFaunaPopulationConfig,
  MicroFaunaSpecies,
  MicroFaunaState,
} from '../types';
import { BoidSimulation4D } from './boids4D';
import { ProceduralFloraSimulation } from './flora';
import { aquariumAudio } from '../audio/aquariumAudio';

/**
 * Calculates the exact seabed height at (x, z) to match the procedural sand dunes.
 */
export function getSandBedHeight(x: number, z: number): number {
  const macroDunes = Math.sin(x * 0.25) * 0.35 + Math.cos(z * 0.4) * 0.25;
  const currentRipples = Math.sin(x * 1.6 + z * 0.8) * 0.12 + Math.cos(x * 2.4 - z * 1.2) * 0.06;
  const microHollows = Math.sin(x * 4.0 + z * 3.0) * 0.03;
  return -6.72 + macroDunes + currentRipples + microHollows;
}

export class MicroFaunaSimulation {
  public entities: MicroFaunaEntity[] = [];
  public boidSim: BoidSimulation4D;
  public floraSim: ProceduralFloraSimulation;

  // Configuration counts
  public config: MicroFaunaPopulationConfig = {
    crabs: 4,
    snails: 4,
    shrimp: 6,
    medusae: 4,
  };

  // Callbacks for visual micro-effects (bubbles, particles)
  public onSpawnBubble?: (x: number, y: number, z: number, count?: number) => void;

  private lastGrazeTime: Map<string, number> = new Map();

  constructor(boidSim: BoidSimulation4D, floraSim: ProceduralFloraSimulation) {
    this.boidSim = boidSim;
    this.floraSim = floraSim;
    this.initPopulation();
  }

  public initPopulation() {
    this.entities = [];

    // 1. Crabs (Hermit Crabs & Shore Sand Crabs)
    for (let i = 0; i < this.config.crabs; i++) {
      const isHermit = i % 2 === 0;
      const x = -10 + (i * 5.2) + (Math.random() - 0.5) * 2;
      const z = -3.5 + Math.random() * 7;
      const y = getSandBedHeight(x, z) + 0.22;

      this.entities.push({
        id: `crab_${i}_${Date.now()}`,
        category: 'crab',
        species: isHermit ? 'hermit_crab' : 'shore_crab',
        name: isHermit ? 'Reef Hermit Crab' : 'Pacific Sand Shore Crab',
        x,
        y,
        z,
        vx: 0,
        vy: 0,
        vz: 0,
        rotationY: Math.random() * Math.PI * 2,
        pitch: 0,
        roll: 0,
        targetX: x,
        targetY: y,
        targetZ: z,
        state: 'foraging',
        stateTimer: 2 + Math.random() * 4,
        energy: 85,
        sizeScale: isHermit ? 0.95 : 1.1,
        attachedSurface: 'sand',
        animCycle: Math.random() * 10,
        secondaryCycle: Math.random() * 10,
        alertness: 0,
      });
    }

    // 2. Snails (Zebra Nerite & Golden Mystery Snails)
    for (let i = 0; i < this.config.snails; i++) {
      const isNerite = i % 2 === 0;
      // Distribute snails: 2 on front glass, 1 on side, 1 on rocks/sand
      let surface: 'front_glass' | 'sand' | 'left_glass' | 'right_glass' = 'front_glass';
      let x = -8 + i * 4.5;
      let y = -4.5 + Math.random() * 6;
      let z = 6.18; // Front glass surface

      if (i === 2) {
        surface = 'left_glass';
        x = -13.8;
        z = -2 + Math.random() * 4;
      } else if (i === 3) {
        surface = 'sand';
        x = 6 + Math.random() * 3;
        z = -2 + Math.random() * 3;
        y = getSandBedHeight(x, z) + 0.15;
      }

      this.entities.push({
        id: `snail_${i}_${Date.now()}`,
        category: 'snail',
        species: isNerite ? 'nerite_snail' : 'mystery_snail',
        name: isNerite ? 'Zebra Nerite Snail' : 'Golden Mystery Snail',
        x,
        y,
        z,
        vx: 0,
        vy: 0,
        vz: 0,
        rotationY: surface === 'front_glass' ? Math.PI : Math.random() * Math.PI * 2,
        pitch: 0,
        roll: 0,
        targetX: x + (Math.random() - 0.5) * 4,
        targetY: y + (Math.random() - 0.5) * 4,
        targetZ: z,
        state: 'gliding',
        stateTimer: 3 + Math.random() * 5,
        energy: 90,
        sizeScale: isNerite ? 0.9 : 1.15,
        attachedSurface: surface,
        animCycle: Math.random() * 10,
        secondaryCycle: Math.random() * 10,
        alertness: 0,
      });
    }

    // 3. Crystal Ghost Shrimp (Surprise benthic/hovering micro-crustacean)
    for (let i = 0; i < this.config.shrimp; i++) {
      const x = -11 + i * 3.8 + (Math.random() - 0.5) * 1.5;
      const z = -4 + Math.random() * 7;
      const y = getSandBedHeight(x, z) + 0.5 + Math.random() * 1.8;

      this.entities.push({
        id: `shrimp_${i}_${Date.now()}`,
        category: 'shrimp',
        species: 'ghost_shrimp',
        name: 'Crystal Glass Shrimp',
        x,
        y,
        z,
        vx: 0,
        vy: 0,
        vz: 0,
        rotationY: Math.random() * Math.PI * 2,
        pitch: 0,
        roll: 0,
        targetX: x,
        targetY: y,
        targetZ: z,
        state: Math.random() > 0.4 ? 'perched' : 'hovering',
        stateTimer: 2 + Math.random() * 3,
        energy: 95,
        sizeScale: 0.85 + Math.random() * 0.25,
        attachedSurface: 'rock',
        animCycle: Math.random() * 10,
        secondaryCycle: Math.random() * 10,
        alertness: 0,
      });
    }

    // 4. Bioluminescent Hydromedusae (Surprise pulsating micro-jellyfish)
    for (let i = 0; i < this.config.medusae; i++) {
      const x = -9 + i * 5.0 + (Math.random() - 0.5) * 2;
      const y = -1.5 + Math.random() * 5.0;
      const z = -3.5 + Math.random() * 6;

      const isInitiallyContracting = Math.random() > 0.6;
      this.entities.push({
        id: `medusa_${i}_${Date.now()}`,
        category: 'medusa',
        species: 'hydromedusa',
        name: 'Bioluminescent Hydromedusa',
        x,
        y,
        z,
        vx: (Math.random() - 0.5) * 0.2,
        vy: 0.1,
        vz: (Math.random() - 0.5) * 0.2,
        rotationY: Math.random() * Math.PI * 2,
        pitch: 0,
        roll: 0,
        targetX: x,
        targetY: y,
        targetZ: z,
        state: isInitiallyContracting ? 'contracting' : 'relaxing',
        stateTimer: isInitiallyContracting ? (0.15 + Math.random() * 0.25) : (0.4 + Math.random() * 1.2),
        energy: 100,
        sizeScale: 0.75 + Math.random() * 0.35,
        attachedSurface: 'free_water',
        animCycle: Math.random() * Math.PI * 2,
        secondaryCycle: Math.random() * Math.PI * 2,
        alertness: 0,
      });
    }
  }

  public setPopulationCounts(counts: Partial<MicroFaunaPopulationConfig>) {
    if (counts.crabs !== undefined) this.config.crabs = Math.max(0, Math.min(12, counts.crabs));
    if (counts.snails !== undefined) this.config.snails = Math.max(0, Math.min(12, counts.snails));
    if (counts.shrimp !== undefined) this.config.shrimp = Math.max(0, Math.min(15, counts.shrimp));
    if (counts.medusae !== undefined) this.config.medusae = Math.max(0, Math.min(12, counts.medusae));
    this.initPopulation();
  }

  public update(dt: number) {
    const clampedDt = Math.min(dt, 0.05);

    for (let i = 0; i < this.entities.length; i++) {
      const e = this.entities[i];
      e.animCycle += clampedDt * 3.5;
      e.secondaryCycle += clampedDt * 2.0;

      // Relax alertness gradually
      if (e.alertness > 0) {
        e.alertness = Math.max(0, e.alertness - clampedDt * 0.6);
      }

      switch (e.category) {
        case 'crab':
          this.updateCrab(e, clampedDt);
          break;
        case 'snail':
          this.updateSnail(e, clampedDt);
          break;
        case 'shrimp':
          this.updateShrimp(e, clampedDt);
          break;
        case 'medusa':
          this.updateMedusa(e, clampedDt);
          break;
      }
    }
  }

  // ==================== CRAB BEHAVIOR ====================
  private updateCrab(crab: MicroFaunaEntity, dt: number) {
    crab.stateTimer -= dt;

    // Check for sunken food flakes on the seabed
    if (crab.state !== 'eating' && crab.state !== 'defensive') {
      const nearbyPellet = this.findNearestSunkenFood(crab.x, crab.z, 7.5);
      if (nearbyPellet) {
        crab.state = 'seeking_food';
        crab.targetX = nearbyPellet.x;
        crab.targetZ = nearbyPellet.z;
      }
    }

    if (crab.state === 'seeking_food') {
      const dx = crab.targetX - crab.x;
      const dz = crab.targetZ - crab.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist < 0.65) {
        // Grabbed the food!
        crab.state = 'eating';
        crab.stateTimer = 2.8;
        aquariumAudio.playCrabSnap();
        this.onSpawnBubble?.(crab.x, crab.y + 0.3, crab.z, 3);

        // Remove the eaten pellet from boidSim
        const pellet = this.findNearestSunkenFood(crab.x, crab.z, 1.2);
        if (pellet) {
          this.boidSim.removeFoodPellet(pellet.id);
        }
      } else {
        // Scuttle toward food with sideways orientation
        const moveSpeed = 1.4;
        const angle = Math.atan2(dz, dx);
        crab.rotationY = angle + Math.PI * 0.5; // Scuttle sideways
        crab.vx = (dx / dist) * moveSpeed;
        crab.vz = (dz / dist) * moveSpeed;
      }
    } else if (crab.state === 'foraging') {
      if (crab.stateTimer <= 0) {
        if (Math.random() < 0.4) {
          crab.state = 'resting';
          crab.stateTimer = 1.5 + Math.random() * 3.5;
          crab.vx = 0;
          crab.vz = 0;
        } else {
          // Pick a new foraging destination on sand
          crab.targetX = Math.max(-12, Math.min(12, crab.x + (Math.random() - 0.5) * 5));
          crab.targetZ = Math.max(-4.8, Math.min(4.8, crab.z + (Math.random() - 0.5) * 5));
          crab.stateTimer = 2.5 + Math.random() * 3;
        }
      }

      const dx = crab.targetX - crab.x;
      const dz = crab.targetZ - crab.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist > 0.4) {
        const moveSpeed = 0.65;
        const angle = Math.atan2(dz, dx);
        // Crabs prefer scuttling sideways (+/- 90 degrees to heading)
        crab.rotationY = angle + (Math.PI * 0.5);
        crab.vx = (dx / dist) * moveSpeed;
        crab.vz = (dz / dist) * moveSpeed;
      } else {
        crab.vx *= 0.8;
        crab.vz *= 0.8;
      }
    } else if (crab.state === 'eating') {
      crab.vx = 0;
      crab.vz = 0;
      if (crab.stateTimer <= 0) {
        crab.state = 'foraging';
        crab.stateTimer = 3 + Math.random() * 4;
      }
    } else if (crab.state === 'defensive') {
      crab.vx = 0;
      crab.vz = 0;
      if (crab.stateTimer <= 0) {
        crab.state = 'foraging';
        crab.stateTimer = 2;
      }
    } else if (crab.state === 'resting') {
      crab.vx = 0;
      crab.vz = 0;
      if (crab.stateTimer <= 0) {
        crab.state = 'foraging';
        crab.stateTimer = 3 + Math.random() * 3;
      }
    }

    // Apply motion and conform strictly to seabed topography
    crab.x = Math.max(-12.5, Math.min(12.5, crab.x + crab.vx * dt));
    crab.z = Math.max(-4.8, Math.min(4.8, crab.z + crab.vz * dt));
    crab.y = getSandBedHeight(crab.x, crab.z) + 0.22;
  }

  // ==================== SNAIL BEHAVIOR ====================
  private updateSnail(snail: MicroFaunaEntity, dt: number) {
    snail.stateTimer -= dt;

    if (snail.state === 'retracted') {
      if (snail.stateTimer <= 0) {
        snail.state = 'gliding';
        snail.stateTimer = 4 + Math.random() * 5;
      }
      return;
    }

    // Front Glass Grazing Snail
    if (snail.attachedSurface === 'front_glass') {
      const crawlSpeed = 0.28;
      const dx = snail.targetX - snail.x;
      const dy = snail.targetY - snail.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > 0.3) {
        snail.vx = (dx / dist) * crawlSpeed;
        snail.vy = (dy / dist) * crawlSpeed;
        snail.x += snail.vx * dt;
        snail.y += snail.vy * dt;
        snail.rotationY = Math.PI; // Adheres flat against front glass pane
        snail.roll = Math.atan2(dy, dx);
      } else {
        // Pick next grazing coordinate on front glass
        snail.targetX = Math.max(-11.5, Math.min(11.5, snail.x + (Math.random() - 0.5) * 4));
        snail.targetY = Math.max(-5.0, Math.min(5.0, snail.y + (Math.random() - 0.5) * 3));
      }

      // Constrain inside front glass
      snail.x = Math.max(-12.0, Math.min(12.0, snail.x));
      snail.y = Math.max(-5.5, Math.min(5.5, snail.y));
      snail.z = 6.18;

      // Active Algae Grazing!
      const now = performance.now();
      const lastGraze = this.lastGrazeTime.get(snail.id) ?? 0;
      if (now - lastGraze > 900) {
        this.lastGrazeTime.set(snail.id, now);

        // Convert 3D glass coordinates (-14.2 to 14.2, -7.2 to 7.2) into canvas UV coords
        const canvasX = ((snail.x - -14.2) / 28.4) * this.floraSim.width;
        const canvasY = ((7.2 - snail.y) / 14.4) * this.floraSim.height;

        this.floraSim.cleanRadius(canvasX, canvasY, 15);
        aquariumAudio.playSnailGraze();
        this.onSpawnBubble?.(snail.x, snail.y + 0.15, snail.z - 0.1, 1);
      }
    } else if (snail.attachedSurface === 'sand') {
      // Crawling on the substrate
      const crawlSpeed = 0.22;
      const dx = snail.targetX - snail.x;
      const dz = snail.targetZ - snail.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist > 0.3) {
        snail.vx = (dx / dist) * crawlSpeed;
        snail.vz = (dz / dist) * crawlSpeed;
        snail.x += snail.vx * dt;
        snail.z += snail.vz * dt;
        snail.rotationY = Math.atan2(dz, dx);
      } else {
        snail.targetX = Math.max(-11, Math.min(11, snail.x + (Math.random() - 0.5) * 3));
        snail.targetZ = Math.max(-4.5, Math.min(4.5, snail.z + (Math.random() - 0.5) * 3));
      }
      snail.y = getSandBedHeight(snail.x, snail.z) + 0.18;
    } else {
      // Left or Right Glass Panel
      const isLeft = snail.attachedSurface === 'left_glass';
      const crawlSpeed = 0.25;
      const dy = snail.targetY - snail.y;
      const dz = snail.targetZ - snail.z;
      const dist = Math.sqrt(dy * dy + dz * dz);

      if (dist > 0.3) {
        snail.vy = (dy / dist) * crawlSpeed;
        snail.vz = (dz / dist) * crawlSpeed;
        snail.y += snail.vy * dt;
        snail.z += snail.vz * dt;
      } else {
        snail.targetY = Math.max(-5.0, Math.min(5.0, snail.y + (Math.random() - 0.5) * 3));
        snail.targetZ = Math.max(-4.5, Math.min(4.5, snail.z + (Math.random() - 0.5) * 3));
      }
      snail.x = isLeft ? -13.8 : 13.8;
      snail.rotationY = isLeft ? Math.PI * 0.5 : -Math.PI * 0.5;
    }
  }

  // ==================== CRYSTAL GHOST SHRIMP BEHAVIOR ====================
  private updateShrimp(shrimp: MicroFaunaEntity, dt: number) {
    shrimp.stateTimer -= dt;

    if (shrimp.state === 'escape_dart') {
      // Rapid backward propulsion!
      shrimp.x += shrimp.vx * dt;
      shrimp.y += shrimp.vy * dt;
      shrimp.z += shrimp.vz * dt;

      // Friction & drag in water
      shrimp.vx *= Math.pow(0.1, dt);
      shrimp.vy *= Math.pow(0.1, dt);
      shrimp.vz *= Math.pow(0.1, dt);

      if (shrimp.stateTimer <= 0) {
        shrimp.state = 'hovering';
        shrimp.stateTimer = 1.5 + Math.random() * 2;
      }
    } else if (shrimp.state === 'perched') {
      shrimp.vx = 0;
      shrimp.vy = 0;
      shrimp.vz = 0;

      // Slight antenna twitching and claw picking
      if (shrimp.stateTimer <= 0) {
        shrimp.state = 'hovering';
        shrimp.stateTimer = 1.5 + Math.random() * 3.0;
        // Launch into gentle hover swim toward a new destination
        shrimp.targetX = Math.max(-12, Math.min(12, shrimp.x + (Math.random() - 0.5) * 4));
        shrimp.targetY = Math.max(-5.5, Math.min(1.5, shrimp.y + (Math.random() - 0.5) * 2));
        shrimp.targetZ = Math.max(-4.5, Math.min(4.5, shrimp.z + (Math.random() - 0.5) * 3));
      }
    } else if (shrimp.state === 'hovering') {
      const dx = shrimp.targetX - shrimp.x;
      const dy = shrimp.targetY - shrimp.y;
      const dz = shrimp.targetZ - shrimp.z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

      if (dist > 0.4) {
        const hoverSpeed = 0.95;
        shrimp.vx = (dx / dist) * hoverSpeed;
        shrimp.vy = (dy / dist) * hoverSpeed;
        shrimp.vz = (dz / dist) * hoverSpeed;

        shrimp.x += shrimp.vx * dt;
        shrimp.y += shrimp.vy * dt;
        shrimp.z += shrimp.vz * dt;

        shrimp.rotationY = Math.atan2(dz, dx);
      } else {
        // Landed on perch
        shrimp.state = 'perched';
        shrimp.stateTimer = 2.5 + Math.random() * 4.0;
        shrimp.vx = 0;
        shrimp.vy = 0;
        shrimp.vz = 0;
      }
    }

    // Keep within tank interior bounds
    shrimp.x = Math.max(-12.5, Math.min(12.5, shrimp.x));
    const sandFloor = getSandBedHeight(shrimp.x, shrimp.z) + 0.3;
    shrimp.y = Math.max(sandFloor, Math.min(3.5, shrimp.y));
    shrimp.z = Math.max(-4.8, Math.min(4.8, shrimp.z));
  }

  // ==================== HYDROMEDUSA BEHAVIOR ====================
  private updateMedusa(medusa: MicroFaunaEntity, dt: number) {
    medusa.stateTimer -= dt;
    medusa.animCycle += dt * 1.5;

    const pulseIntensity = medusa.pulseIntensity ?? 1.0;

    if (medusa.state === 'contracting') {
      // Systole: Muscular Power Stroke (approx 0.38s normal, 0.26s escape)
      const duration = (medusa.escapePulsesRemaining && medusa.escapePulsesRemaining > 0) ? 0.26 : 0.38;
      const progress = Math.max(0, Math.min(1.0, 1.0 - medusa.stateTimer / duration));

      // Constriction curve: deep progressive tightening of the margin orifice
      medusa.constriction = Math.sin(progress * Math.PI * 0.5) * pulseIntensity;
      medusa.strokePhase = progress * 0.45;

      // Hydrodynamic thrust: peak acceleration early in the stroke, tapering off as nozzle reaches max compression
      const thrust = (3.8 + pulseIntensity * 1.2) * Math.cos(progress * Math.PI * 0.5) * dt;
      medusa.vy += thrust;

      // Soft forward kinetic push along current tilt
      medusa.vx += (medusa.targetX - medusa.x) * 0.05 * dt;
      medusa.vz += (medusa.targetZ - medusa.z) * 0.05 * dt;

      // Viscous water resistance on vertical ascent
      medusa.vy *= (1.0 - 0.22 * dt);

      medusa.y += medusa.vy * dt;
      medusa.x += medusa.vx * dt;
      medusa.z += medusa.vz * dt;

      if (medusa.stateTimer <= 0) {
        medusa.state = 'relaxing';
        if (medusa.escapePulsesRemaining && medusa.escapePulsesRemaining > 0) {
          medusa.escapePulsesRemaining--;
          medusa.stateTimer = 0.45; // Fast recovery between escape pulses
        } else {
          medusa.stateTimer = 1.1 + Math.random() * 0.8;
          medusa.pulseIntensity = 1.0;
        }
      }
    } else {
      // Diastole: Elastic Recoil, Flaring Expansion, and Negative Buoyancy Glide
      const totalRelax = 1.4;
      const progress = Math.max(0, Math.min(1.0, 1.0 - medusa.stateTimer / totalRelax));
      medusa.strokePhase = 0.45 + progress * 0.55;

      if (progress < 0.45) {
        // Early Diastole: Elastic recoil of mesoglea springs bell open into wide flare
        const flareProg = progress / 0.45; // 0 to 1
        // Swings from +1.0 through 0 to -0.35 (flared outward saucer shape)
        medusa.constriction = Math.cos(flareProg * Math.PI * 0.5) - Math.sin(flareProg * Math.PI) * 0.35;
      } else {
        // Late Diastole: Damped harmonic settling towards neutral resting bell
        const settleProg = (progress - 0.45) / 0.55;
        medusa.constriction = -0.15 * Math.cos(settleProg * Math.PI) * Math.exp(-settleProg * 2.5);
      }

      // Negative buoyancy: gentle sinking glide
      medusa.vy -= 0.52 * dt;
      medusa.vx *= 0.96;
      medusa.vz *= 0.96;

      medusa.y += medusa.vy * dt;
      medusa.x += medusa.vx * dt;
      medusa.z += medusa.vz * dt;

      if (medusa.stateTimer <= 0) {
        medusa.state = 'contracting';
        const isEscaping = (medusa.escapePulsesRemaining && medusa.escapePulsesRemaining > 0);
        medusa.stateTimer = isEscaping ? 0.26 : 0.38;
        if (!isEscaping) {
          medusa.pulseIntensity = 1.0;
        }

        // Direct next pulse with gentle random drift
        medusa.targetX = Math.max(-11, Math.min(11, medusa.x + (Math.random() - 0.5) * 3));
        medusa.targetZ = Math.max(-4, Math.min(4, medusa.z + (Math.random() - 0.5) * 3));
        medusa.vx = (Math.random() - 0.5) * 0.35;
        medusa.vz = (Math.random() - 0.5) * 0.35;

        aquariumAudio.playMedusaPulse();
      }
    }

    // Dynamic hydrodynamic tilt: bell naturally leans into direction of travel with fluid damping
    const targetPitch = Math.max(-0.4, Math.min(0.4, medusa.vz * 0.45));
    const targetRoll = Math.max(-0.4, Math.min(0.4, -medusa.vx * 0.45));
    medusa.pitch += (targetPitch - medusa.pitch) * 0.08;
    medusa.roll += (targetRoll - medusa.roll) * 0.08;

    // Tank vertical bounds
    if (medusa.y > 5.5) {
      medusa.y = 5.5;
      medusa.vy = -0.15;
    }
    const sandFloor = getSandBedHeight(medusa.x, medusa.z) + 1.2;
    if (medusa.y < sandFloor) {
      medusa.y = sandFloor;
      if (medusa.state !== 'contracting') {
        medusa.state = 'contracting';
        medusa.stateTimer = 0.38;
        medusa.vy = 1.0;
        aquariumAudio.playMedusaPulse();
      } else {
        medusa.vy = Math.max(medusa.vy, 0.8);
      }
    }

    medusa.x = Math.max(-12, Math.min(12, medusa.x));
    medusa.z = Math.max(-4.5, Math.min(4.5, medusa.z));
  }

  // ==================== INTERACTIONS & EVENTS ====================
  public startleNearby(worldX: number, worldY: number, worldZ: number, radius: number = 4.5) {
    const rSq = radius * radius;

    for (const e of this.entities) {
      const dx = e.x - worldX;
      const dy = e.y - worldY;
      const dz = e.z - worldZ;
      const distSq = dx * dx + dy * dy + dz * dz;

      if (distSq < rSq) {
        e.alertness = 1.0;

        if (e.category === 'crab') {
          // Threat display: both claws up!
          e.state = 'defensive';
          e.stateTimer = 2.8;
          aquariumAudio.playCrabSnap();
          this.onSpawnBubble?.(e.x, e.y + 0.3, e.z, 2);
        } else if (e.category === 'snail') {
          // Retract foot into shell
          e.state = 'retracted';
          e.stateTimer = 2.2;
        } else if (e.category === 'shrimp') {
          // Caridoid escape response: backward tail-flip thrust!
          e.state = 'escape_dart';
          e.stateTimer = 0.7;
          const dist = Math.max(0.2, Math.sqrt(distSq));
          const thrust = 5.5;
          e.vx = (dx / dist) * thrust;
          e.vy = 1.2 + Math.random() * 0.8;
          e.vz = (dz / dist) * thrust;
          aquariumAudio.playShrimpDart();
          this.onSpawnBubble?.(e.x, e.y + 0.2, e.z, 4);
        } else if (e.category === 'medusa') {
          // Hydromedusa escape response: series of rapid, deep power-stroke pulses
          e.escapePulsesRemaining = 3 + Math.floor(Math.random() * 2);
          e.pulseIntensity = 1.65;
          e.state = 'contracting';
          e.stateTimer = 0.25;

          const dist = Math.max(0.3, Math.sqrt(distSq));
          // Jet away from disturbance and upward
          e.vx = (dx / dist) * 0.85;
          e.vz = (dz / dist) * 0.85;
          e.vy = 2.4;

          aquariumAudio.playMedusaPulse();
          this.onSpawnBubble?.(e.x, e.y - 0.2, e.z, 3);
        }
      }
    }
  }

  public dropSubstrateWafer(screenX?: number, screenZ?: number) {
    const x = screenX ?? (Math.random() - 0.5) * 16;
    const z = screenZ ?? (Math.random() - 0.5) * 6;
    const y = getSandBedHeight(x, z) + 0.1;

    // Drop as sinking food pellet into the tank
    this.boidSim.foodPellets.push({
      id: `wafer_${Date.now()}_${Math.random()}`,
      x,
      y: -5.8,
      z,
      w: this.boidSim.currentTimeW,
      vx: 0,
      vy: -0.8,
      vz: 0,
      radius: 0.35,
      nutrition: 2.5,
      createdAt: performance.now(),
    });

    aquariumAudio.playFoodDrop();
    this.onSpawnBubble?.(x, y + 0.2, z, 3);
  }

  private findNearestSunkenFood(x: number, z: number, maxDist: number) {
    let nearest = null;
    let minDist = maxDist;

    for (const p of this.boidSim.foodPellets) {
      if (p.y < -5.0) {
        const dx = p.x - x;
        const dz = p.z - z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist < minDist) {
          minDist = dist;
          nearest = p;
        }
      }
    }
    return nearest;
  }
}

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
    snails: 2,
    shrimp: 4,
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

    // 1. Crabs (High-fidelity Pacific Sand Shore Crabs)
    for (let i = 0; i < this.config.crabs; i++) {
      const x = -10 + (i * 5.2) + (Math.random() - 0.5) * 2;
      const z = -3.5 + Math.random() * 7;
      const y = getSandBedHeight(x, z) + 0.22;

      this.entities.push({
        id: `crab_${i}_${Date.now()}`,
        category: 'crab',
        species: 'shore_crab',
        name: 'Pacific Sand Shore Crab',
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
        sizeScale: 1.15,
        attachedSurface: 'sand',
        animCycle: Math.random() * 10,
        secondaryCycle: Math.random() * 10,
        alertness: 0,
      });
    }

    // 2. Snails (Zebra Nerite & Golden Mystery Snails)
    for (let i = 0; i < this.config.snails; i++) {
      const isNerite = i % 2 === 0;
      const onGlass = i === 1; // First snail crawls on substrate, second grazes on glass
      const surface: 'sand' | 'front_glass' = onGlass ? 'front_glass' : 'sand';
      const x = onGlass ? 4.0 : -6.0 + i * 5.0;
      const z = onGlass ? 5.95 : -1.5 + (Math.random() - 0.5) * 3;
      const y = onGlass ? -1.5 : getSandBedHeight(x, z) + 0.04;

      const targetX = x + (Math.random() - 0.5) * 3;
      const targetY = onGlass ? y + (Math.random() - 0.5) * 2 : y;
      const targetZ = onGlass ? z : z + (Math.random() - 0.5) * 2;
      const initAngle = onGlass
        ? Math.atan2(targetY - y, targetX - x)
        : Math.atan2(targetZ - z, targetX - x);

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
        rotationY: onGlass ? 0 : initAngle,
        pitch: onGlass ? -Math.PI * 0.5 : 0,
        roll: onGlass ? initAngle : 0,
        targetX,
        targetY,
        targetZ,
        state: 'gliding',
        stateTimer: 4 + Math.random() * 5,
        energy: 90,
        sizeScale: isNerite ? 0.32 : 0.38,
        attachedSurface: surface,
        animCycle: Math.random() * 10,
        secondaryCycle: Math.random() * 10,
        alertness: 0,
      });
    }

    // 3. Bioluminescent Hydromedusae (Graceful pelagic hydrozoans)
    for (let i = 0; i < this.config.medusae; i++) {
      const x = -8 + i * 4.8 + (Math.random() - 0.5) * 2;
      const y = -1.2 + Math.random() * 4.8;
      const z = -3.5 + Math.random() * 7;

      const isInitiallyContracting = Math.random() > 0.65;
      this.entities.push({
        id: `medusa_${i}_${Date.now()}`,
        category: 'medusa',
        species: 'hydromedusa',
        name: 'Bioluminescent Hydromedusa',
        x,
        y,
        z,
        vx: (Math.random() - 0.5) * 0.15,
        vy: 0.08,
        vz: (Math.random() - 0.5) * 0.15,
        rotationY: Math.random() * Math.PI * 2,
        pitch: 0,
        roll: 0,
        targetX: x,
        targetY: y,
        targetZ: z,
        state: isInitiallyContracting ? 'contracting' : 'relaxing',
        stateTimer: isInitiallyContracting ? (0.15 + Math.random() * 0.2) : (0.5 + Math.random() * 1.0),
        energy: 100,
        sizeScale: 0.85 + Math.random() * 0.3,
        attachedSurface: 'free_water',
        animCycle: Math.random() * Math.PI * 2,
        secondaryCycle: Math.random() * Math.PI * 2,
        alertness: 0,
        constriction: 0,
        strokePhase: 0,
        pulseIntensity: 1.0,
      });
    }

    // 4. Ghost Shrimp (Delicate translucent glass scavengers)
    for (let i = 0; i < this.config.shrimp; i++) {
      const onRock = i % 2 === 0;
      const x = onRock ? (-3.5 + i * 2.2 + (Math.random() - 0.5) * 1.5) : (-7 + i * 3.5 + (Math.random() - 0.5) * 2);
      const z = -2.5 + Math.random() * 5.0;
      const y = onRock ? (getSandBedHeight(x, z) + 0.8 + Math.random() * 0.5) : (getSandBedHeight(x, z) + 0.18);

      this.entities.push({
        id: `shrimp_${i}_${Date.now()}`,
        category: 'shrimp',
        species: 'ghost_shrimp',
        name: 'Crystal Ghost Shrimp',
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
        state: onRock ? 'perched' : 'foraging',
        stateTimer: 3 + Math.random() * 4,
        energy: 90,
        sizeScale: 0.38 + Math.random() * 0.08,
        attachedSurface: onRock ? 'rock' : 'sand',
        animCycle: Math.random() * 10,
        secondaryCycle: Math.random() * 10,
        alertness: 0,
        pleopodPhase: Math.random() * Math.PI * 2,
        abdomenFlex: 0.2,
      });
    }
  }

  public setPopulationCounts(counts: Partial<MicroFaunaPopulationConfig>) {
    if (counts.crabs !== undefined) this.config.crabs = Math.max(0, Math.min(12, counts.crabs));
    if (counts.snails !== undefined) this.config.snails = Math.max(0, Math.min(6, counts.snails));
    if (counts.shrimp !== undefined) this.config.shrimp = Math.max(0, Math.min(12, counts.shrimp));
    if (counts.medusae !== undefined) this.config.medusae = Math.max(0, Math.min(10, counts.medusae));
    this.initPopulation();
  }

  public update(dt: number, dayNightPhase: number = 0.25) {
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
          this.updateMedusa(e, clampedDt, dayNightPhase);
          break;
      }
    }
  }

  // ==================== CRAB BEHAVIOR ====================
  private updateCrab(crab: MicroFaunaEntity, dt: number) {
    crab.stateTimer -= dt;

    // Conspecific Proximity Reactions: Standoff and lateral yield
    for (let j = 0; j < this.entities.length; j++) {
      const other = this.entities[j];
      if (other.category === 'crab' && other.id !== crab.id) {
        const cdx = crab.x - other.x;
        const cdz = crab.z - other.z;
        const cDistSq = cdx * cdx + cdz * cdz;
        if (cDistSq < 1.6 && cDistSq > 0.001) {
          const cDist = Math.sqrt(cDistSq);
          crab.alertness = Math.min(1.0, crab.alertness + 0.35);
          const push = (1.26 - cDist) * 0.8;
          crab.vx += (cdx / cDist) * push;
          crab.vz += (cdz / cDist) * push;
        }
      }
    }

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
          crab.stateTimer = 1.8 + Math.random() * 3.5;
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

        // Substrate sifting: claws stir sand, occasionally ejecting micro-detritus
        if (Math.random() < 0.012) {
          this.onSpawnBubble?.(crab.x, crab.y + 0.12, crab.z, 1);
        }
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
      // Eyestalk flick & maxilliped grooming timer
      crab.eyestalkFlick = ((crab.eyestalkFlick ?? 0) + dt) % 4.5;

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
      // Retracted within shell: strictly stationary
      snail.vx = 0;
      snail.vy = 0;
      snail.vz = 0;
      if (snail.stateTimer <= 0) {
        snail.state = 'gliding';
        snail.stateTimer = 5 + Math.random() * 5;
      }
      return;
    }

    // Radula Scraping Cycle: Crawl forward -> rasp radula -> hesitation check
    snail.radulaPhase = ((snail.radulaPhase ?? 0) + dt * 0.9) % 1.0;
    let radulaSpeedFactor = 1.0;
    if (snail.radulaPhase > 0.45 && snail.radulaPhase <= 0.85) {
      radulaSpeedFactor = 0.24; // Head dips down, rasping radula against biofilm
    } else if (snail.radulaPhase > 0.85) {
      radulaSpeedFactor = 0.55; // Micro-hesitation before next thrust
    }

    if (snail.attachedSurface === 'front_glass') {
      // Front glass pane grazing: slow, steady, authentic gastropod glide
      const crawlSpeed = 0.06 * radulaSpeedFactor;
      const dx = snail.targetX - snail.x;
      const dy = snail.targetY - snail.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > 0.25) {
        let targetAngle = Math.atan2(dy, dx);

        // Avert glass perimeter
        if (snail.x < -11.0) targetAngle = 0;
        else if (snail.x > 11.0) targetAngle = Math.PI;
        if (snail.y < -4.5) targetAngle = Math.PI * 0.5;
        else if (snail.y > 4.5) targetAngle = -Math.PI * 0.5;

        // Smoothly interpolate roll angle (crawl heading in the XY plane) without snapping
        let diff = targetAngle - snail.roll;
        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;
        snail.roll += diff * Math.min(1.0, dt * 1.6);

        snail.vx = Math.cos(snail.roll) * crawlSpeed;
        snail.vy = Math.sin(snail.roll) * crawlSpeed;
        snail.x += snail.vx * dt;
        snail.y += snail.vy * dt;
      } else {
        snail.vx = 0;
        snail.vy = 0;
        if (snail.stateTimer <= 0) {
          // Pick next gentle grazing destination on glass
          snail.targetX = Math.max(-11.0, Math.min(11.0, snail.x + (Math.random() - 0.5) * 3.5));
          snail.targetY = Math.max(-4.8, Math.min(4.8, snail.y + (Math.random() - 0.5) * 2.5));
          snail.stateTimer = 4 + Math.random() * 5;
        }
      }

      // Proper glass alignment: sole (-Y) against glass pane, shell (+Y) visible into tank
      snail.pitch = -Math.PI * 0.5;
      snail.rotationY = 0;
      snail.z = 5.95;
      snail.x = Math.max(-12.0, Math.min(12.0, snail.x));
      snail.y = Math.max(-5.2, Math.min(5.2, snail.y));

      // Active Algae Grazing!
      const now = performance.now();
      const lastGraze = this.lastGrazeTime.get(snail.id) ?? 0;
      if (now - lastGraze > 1200 && snail.radulaPhase > 0.45 && snail.radulaPhase < 0.85) {
        this.lastGrazeTime.set(snail.id, now);
        const canvasX = ((snail.x - -14.2) / 28.4) * this.floraSim.width;
        const canvasY = ((7.2 - snail.y) / 14.4) * this.floraSim.height;
        this.floraSim.cleanRadius(canvasX, canvasY, 10);
        aquariumAudio.playSnailGraze();
        this.onSpawnBubble?.(snail.x, snail.y + 0.05, snail.z - 0.05, 1);
      }
    } else {
      // Substrate / Sand bed crawling: calm, continuous glide following terrain contours
      const crawlSpeed = 0.07 * radulaSpeedFactor;
      const dx = snail.targetX - snail.x;
      const dz = snail.targetZ - snail.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist > 0.25) {
        const targetAngle = Math.atan2(dz, dx);
        // Smoothly interpolate yaw rotation without angular snapping
        let diff = targetAngle - snail.rotationY;
        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;
        snail.rotationY += diff * Math.min(1.0, dt * 1.8);

        snail.vx = Math.cos(snail.rotationY) * crawlSpeed;
        snail.vz = Math.sin(snail.rotationY) * crawlSpeed;
        snail.x += snail.vx * dt;
        snail.z += snail.vz * dt;
      } else {
        snail.vx = 0;
        snail.vz = 0;
        if (snail.stateTimer <= 0) {
          snail.targetX = Math.max(-11.5, Math.min(11.5, snail.x + (Math.random() - 0.5) * 4.0));
          snail.targetZ = Math.max(-4.2, Math.min(4.2, snail.z + (Math.random() - 0.5) * 3.0));
          snail.stateTimer = 4 + Math.random() * 5;
        }
      }

      snail.x = Math.max(-12.0, Math.min(12.0, snail.x));
      snail.z = Math.max(-4.5, Math.min(4.5, snail.z));
      const targetY = getSandBedHeight(snail.x, snail.z) + 0.04;
      snail.y += (targetY - snail.y) * Math.min(1.0, dt * 6.0); // Smooth vertical adherence
      snail.pitch = 0;
      snail.roll = 0;
    }
  }

  // ==================== GHOST SHRIMP BEHAVIOR ====================
  private updateShrimp(shrimp: MicroFaunaEntity, dt: number) {
    shrimp.stateTimer -= dt;
    shrimp.animCycle += dt * 3.0;

    // Pleopod flutter frequency
    const isHovering = shrimp.state === 'hovering' || shrimp.state === 'escape_dart';
    const pleopodRate = shrimp.state === 'escape_dart' ? 32.0 : (isHovering ? 16.0 : 4.0);
    shrimp.pleopodPhase = ((shrimp.pleopodPhase ?? 0) + dt * pleopodRate) % (Math.PI * 2);

    // Threat detection: Crab approaching or fast fish triggers Caridoid Escape Reaction
    if (shrimp.state !== 'escape_dart') {
      for (let j = 0; j < this.entities.length; j++) {
        const other = this.entities[j];
        if (other.category === 'crab' || (other.category === 'shrimp' && other.id !== shrimp.id)) {
          const dx = shrimp.x - other.x;
          const dz = shrimp.z - other.z;
          const dSq = dx * dx + dz * dz;
          if (dSq < (other.category === 'crab' ? 2.5 : 0.8) && dSq > 0.001) {
            const dist = Math.sqrt(dSq);
            this.triggerShrimpEscape(shrimp, dx / dist, dz / dist);
            break;
          }
        }
      }
    }

    if (shrimp.state === 'escape_dart') {
      // Rapid retro-propulsion with hydrodynamic decay
      shrimp.x += shrimp.vx * dt;
      shrimp.y += shrimp.vy * dt;
      shrimp.z += shrimp.vz * dt;

      shrimp.vx *= (1.0 - 2.2 * dt);
      shrimp.vz *= (1.0 - 2.2 * dt);
      shrimp.vy -= 1.4 * dt;

      // Abdomen flex: curled under cephalothorax, then opening
      shrimp.abdomenFlex = Math.max(0.2, (shrimp.abdomenFlex ?? 1.2) - dt * 2.0);

      if (shrimp.stateTimer <= 0) {
        shrimp.state = 'hovering';
        shrimp.stateTimer = 1.6 + Math.random() * 2.0;
      }
    } else if (shrimp.state === 'hovering') {
      // Graceful midwater hovering with neutral buoyancy
      shrimp.abdomenFlex = 0.22;

      const dx = shrimp.targetX - shrimp.x;
      const dz = shrimp.targetZ - shrimp.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist > 0.3) {
        const hoverSpd = 0.65;
        const targetHeading = Math.atan2(dz, dx);
        let diff = targetHeading - shrimp.rotationY;
        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;
        shrimp.rotationY += diff * Math.min(1.0, dt * 2.5);

        shrimp.vx = Math.cos(shrimp.rotationY) * hoverSpd;
        shrimp.vz = Math.sin(shrimp.rotationY) * hoverSpd;
      } else {
        shrimp.vx *= 0.85;
        shrimp.vz *= 0.85;
      }

      // Neutral buoyancy gentle undulating
      shrimp.vy = Math.sin(shrimp.animCycle * 1.8) * 0.25;

      shrimp.x += shrimp.vx * dt;
      shrimp.y += shrimp.vy * dt;
      shrimp.z += shrimp.vz * dt;

      if (shrimp.stateTimer <= 0) {
        if (Math.random() < 0.5) {
          shrimp.state = 'perched';
          shrimp.stateTimer = 2.5 + Math.random() * 4.0;
        } else {
          shrimp.targetX = Math.max(-10, Math.min(10, shrimp.x + (Math.random() - 0.5) * 4.0));
          shrimp.targetZ = Math.max(-4, Math.min(4, shrimp.z + (Math.random() - 0.5) * 3.5));
          shrimp.stateTimer = 2.0 + Math.random() * 3.0;
        }
      }
    } else if (shrimp.state === 'foraging') {
      // Substrate / Rock foraging with chelae plucking
      shrimp.abdomenFlex = 0.32;
      const dx = shrimp.targetX - shrimp.x;
      const dz = shrimp.targetZ - shrimp.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist > 0.25) {
        const scuttleSpd = 0.55;
        const targetHeading = Math.atan2(dz, dx);
        let diff = targetHeading - shrimp.rotationY;
        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;
        shrimp.rotationY += diff * Math.min(1.0, dt * 3.5);

        shrimp.vx = Math.cos(shrimp.rotationY) * scuttleSpd;
        shrimp.vz = Math.sin(shrimp.rotationY) * scuttleSpd;
      } else {
        shrimp.vx = 0;
        shrimp.vz = 0;
        if (shrimp.stateTimer <= 0) {
          if (Math.random() < 0.4) {
            shrimp.state = 'hovering';
            shrimp.stateTimer = 2.0 + Math.random() * 3.0;
          } else {
            shrimp.targetX = Math.max(-11, Math.min(11, shrimp.x + (Math.random() - 0.5) * 3.0));
            shrimp.targetZ = Math.max(-4.2, Math.min(4.2, shrimp.z + (Math.random() - 0.5) * 3.0));
            shrimp.stateTimer = 2.0 + Math.random() * 3.0;
          }
        }
      }

      shrimp.x += shrimp.vx * dt;
      shrimp.z += shrimp.vz * dt;
      const sandY = getSandBedHeight(shrimp.x, shrimp.z) + 0.18;
      shrimp.y += (sandY - shrimp.y) * Math.min(1.0, dt * 5.0);
    } else {
      // Perched
      shrimp.vx = 0;
      shrimp.vy = 0;
      shrimp.vz = 0;
      shrimp.abdomenFlex = 0.28;

      if (shrimp.stateTimer <= 0) {
        shrimp.state = Math.random() < 0.6 ? 'foraging' : 'hovering';
        shrimp.stateTimer = 2.5 + Math.random() * 3.5;
        shrimp.targetX = Math.max(-10, Math.min(10, shrimp.x + (Math.random() - 0.5) * 4.0));
        shrimp.targetZ = Math.max(-4, Math.min(4, shrimp.z + (Math.random() - 0.5) * 3.5));
      }
    }

    // Boundaries
    shrimp.x = Math.max(-12, Math.min(12, shrimp.x));
    shrimp.z = Math.max(-4.5, Math.min(4.5, shrimp.z));
    const minY = getSandBedHeight(shrimp.x, shrimp.z) + 0.16;
    if (shrimp.y < minY) {
      shrimp.y = minY;
      if (shrimp.state === 'escape_dart') shrimp.vy = Math.abs(shrimp.vy) * 0.4;
    }
    if (shrimp.y > 4.8) {
      shrimp.y = 4.8;
      if (shrimp.state === 'escape_dart') shrimp.vy = -0.2;
    }
  }

  private triggerShrimpEscape(shrimp: MicroFaunaEntity, repelDirX: number, repelDirZ: number) {
    shrimp.state = 'escape_dart';
    shrimp.stateTimer = 0.38;
    shrimp.alertness = 1.0;
    shrimp.abdomenFlex = 1.35; // Instant tail curl snap
    const dartSpeed = 5.4;
    shrimp.vx = repelDirX * dartSpeed;
    shrimp.vz = repelDirZ * dartSpeed;
    shrimp.vy = 1.7 + Math.random() * 0.6;
    shrimp.rotationY = Math.atan2(-repelDirZ, -repelDirX);
    this.onSpawnBubble?.(shrimp.x, shrimp.y, shrimp.z, 2);
  }

  // ==================== BIOLUMINESCENT HYDROMEDUSA BEHAVIOR ====================
  private updateMedusa(medusa: MicroFaunaEntity, dt: number, dayNightPhase: number = 0.25) {
    medusa.stateTimer -= dt;
    medusa.animCycle += dt * 1.5;

    const pulseIntensity = medusa.pulseIntensity ?? 1.0;

    // Diel Vertical Migration: Phototaxis preferred water column layer
    // Day (0.15-0.45): shade seeking lower depth (-3.5 to -1.5)
    // Night (0.65-0.95): phototaxis ascent to upper surface (1.0 to 4.2)
    const isDaylight = dayNightPhase >= 0.15 && dayNightPhase <= 0.45;
    const isNight = dayNightPhase >= 0.65 || dayNightPhase < 0.10;
    let preferredDepth = 0.0;
    if (isDaylight) {
      preferredDepth = -2.8 + Math.sin(medusa.animCycle * 0.3) * 0.9;
    } else if (isNight) {
      preferredDepth = 2.4 + Math.sin(medusa.animCycle * 0.3) * 1.2;
    } else {
      preferredDepth = -0.5 + Math.sin(medusa.animCycle * 0.3) * 1.0;
    }

    // Bioluminescent Startle Flash: check nearby fish wake
    if (this.boidSim && this.boidSim.boids) {
      const boids = this.boidSim.boids;
      for (let bIdx = 0; bIdx < boids.length; bIdx += 4) {
        const fish = boids[bIdx];
        const fdx = medusa.x - fish.x;
        const fdy = medusa.y - fish.y;
        const fdz = medusa.z - fish.z;
        const fDistSq = fdx * fdx + fdy * fdy + fdz * fdz;
        if (fDistSq < 4.5 && fish.speed > 2.0) {
          medusa.alertness = 1.0;
          medusa.pulseIntensity = 2.2;
          medusa.escapePulsesRemaining = 3;
          if (medusa.state !== 'contracting') {
            medusa.state = 'contracting';
            medusa.stateTimer = 0.24;
            medusa.vy = Math.max(medusa.vy, 1.8);
          }
          break;
        }
      }
    }

    if (medusa.state === 'contracting') {
      // Systole: Muscular Power Stroke (0.38s normal, 0.26s escape)
      const duration = (medusa.escapePulsesRemaining && medusa.escapePulsesRemaining > 0) ? 0.26 : 0.38;
      const progress = Math.max(0, Math.min(1.0, 1.0 - medusa.stateTimer / duration));

      // Constriction curve: progressive tightening of the marginal velum/nozzle
      medusa.constriction = Math.sin(progress * Math.PI * 0.5) * pulseIntensity;
      medusa.strokePhase = progress * 0.45;

      // Hydrodynamic jet thrust: peak acceleration early in stroke
      const thrust = (3.6 + pulseIntensity * 1.2) * Math.cos(progress * Math.PI * 0.5) * dt;
      medusa.vy += thrust;

      // Soft kinetic push along target vector + diel phototaxis vertical bias
      medusa.vx += (medusa.targetX - medusa.x) * 0.04 * dt;
      medusa.vz += (medusa.targetZ - medusa.z) * 0.04 * dt;
      medusa.vy += (preferredDepth - medusa.y) * 0.12 * dt;

      // Water drag on vertical ascent
      medusa.vy *= (1.0 - 0.22 * dt);

      medusa.y += medusa.vy * dt;
      medusa.x += medusa.vx * dt;
      medusa.z += medusa.vz * dt;

      if (medusa.stateTimer <= 0) {
        medusa.state = 'relaxing';
        if (medusa.escapePulsesRemaining && medusa.escapePulsesRemaining > 0) {
          medusa.escapePulsesRemaining--;
          medusa.stateTimer = 0.42; // Fast recovery between escape pulses
        } else {
          medusa.stateTimer = 1.1 + Math.random() * 0.8;
          medusa.pulseIntensity = 1.0;
        }
      }
    } else {
      // Diastole: Elastic Mesoglea Recoil, Flaring, and Negative Buoyancy Glide
      const totalRelax = 1.4;
      const progress = Math.max(0, Math.min(1.0, 1.0 - medusa.stateTimer / totalRelax));
      medusa.strokePhase = 0.45 + progress * 0.55;

      if (progress < 0.45) {
        // Early Diastole: Elastic recoil springs bell open into flared saucer
        const flareProg = progress / 0.45;
        medusa.constriction = Math.cos(flareProg * Math.PI * 0.5) - Math.sin(flareProg * Math.PI) * 0.35;
      } else {
        // Late Diastole: Damped harmonic settling to neutral bell
        const settleProg = (progress - 0.45) / 0.55;
        medusa.constriction = -0.15 * Math.cos(settleProg * Math.PI) * Math.exp(-settleProg * 2.5);
      }

      // Negative buoyancy: gentle sinking glide
      medusa.vy -= 0.50 * dt;
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

        // Direct next pulse with gentle drift
        medusa.targetX = Math.max(-11, Math.min(11, medusa.x + (Math.random() - 0.5) * 3));
        medusa.targetZ = Math.max(-4, Math.min(4, medusa.z + (Math.random() - 0.5) * 3));
        medusa.vx = (Math.random() - 0.5) * 0.35;
        medusa.vz = (Math.random() - 0.5) * 0.35;

        aquariumAudio.playMedusaPulse();
      }
    }

    // Dynamic hydrodynamic tilt: bell leans into direction of travel with fluid damping
    const targetPitch = Math.max(-0.35, Math.min(0.35, medusa.vz * 0.45));
    const targetRoll = Math.max(-0.35, Math.min(0.35, -medusa.vx * 0.45));
    medusa.pitch += (targetPitch - medusa.pitch) * 0.08;
    medusa.roll += (targetRoll - medusa.roll) * 0.08;

    // Tank vertical bounds
    if (medusa.y > 5.2) {
      medusa.y = 5.2;
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
          // Instant caridoid tail flip retro-propulsion!
          const dist = Math.max(0.3, Math.sqrt(distSq));
          this.triggerShrimpEscape(e, dx / dist, dz / dist);
        } else if (e.category === 'medusa') {
          // Escape burst: rapid power strokes jetting away
          e.state = 'contracting';
          e.stateTimer = 0.26;
          e.pulseIntensity = 1.7;
          e.escapePulsesRemaining = 3;
          const dist = Math.max(0.3, Math.sqrt(distSq));
          e.vx = (dx / dist) * 1.5;
          e.vz = (dz / dist) * 1.5;
          e.vy = Math.max(e.vy, 1.4);
          aquariumAudio.playMedusaPulse();
          this.onSpawnBubble?.(e.x, e.y - 0.2, e.z, 2);
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

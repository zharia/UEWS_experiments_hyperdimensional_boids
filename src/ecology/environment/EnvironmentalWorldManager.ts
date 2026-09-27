/**
 * Authoritative Environmental World Manager (Program Increment v0.0.1 - Task 003).
 *
 * Implements continuous environmental dynamics, multi-timescale evolution,
 * hysteresis/inertia, ecological coupling, and deterministic seed management.
 *
 * Guiding Principle:
 *   "The aquarium should have an atmosphere, not a backdrop; an environment, not a wallpaper."
 */

import { Vector3D } from '../../space/physical/Vector3D';
import { SeededRandom } from '../../core/random/SeededRandom';
import {
  EnvironmentalSignature,
  EnvironmentalStructure,
  IEnvironmentalStateJSON,
  IlluminationState,
  ParticleState,
  SubstrateState,
  VegetationState,
  WaterState,
} from './EnvironmentalState';
import {
  AcousticEnvironmentalBoundary,
  EnvironmentalVisualProjection,
} from './EnvironmentalProjection';

export class EnvironmentalWorldManager {
  private _random: SeededRandom;

  // Authoritative Environmental State
  public water: WaterState;
  public illumination: IlluminationState;
  public substrate: SubstrateState;
  public vegetation: VegetationState;
  public particles: ParticleState;
  public structures: EnvironmentalStructure[] = [];
  public ecologicalActivity: number = 0.2;
  public disturbance: number = 0.0;

  // Hysteresis targets and smoothing filters
  private _targetTurbidity: number = 0.08;
  private _targetTurbulence: number = 0.15;
  private _targetEcologicalActivity: number = 0.2;
  private _targetFlow: Vector3D = new Vector3D(0.08, -0.01, 0.0);

  // Time constants (seconds)
  private readonly TURBIDITY_RESPONSE_TIME = 15.0; // Medium scale (minutes/tens of seconds)
  private readonly SEDIMENT_SETTLING_RATE = 0.03;   // Slow settling
  private readonly DISTURBANCE_DECAY_RATE = 0.35;   // Fast-to-medium decay
  private readonly FLOW_RESPONSE_TIME = 4.0;        // Fluid inertia

  constructor(seedOrRandom?: number | SeededRandom) {
    if (seedOrRandom instanceof SeededRandom) {
      this._random = seedOrRandom;
    } else {
      this._random = new SeededRandom(seedOrRandom);
    }

    // Initialize baseline authoritative state
    this.water = {
      flow: new Vector3D(0.08, -0.01, 0.0),
      turbulence: 0.15,
      temperature: 24.5,
      turbidity: 0.08,
      clarity: 0.92,
    };

    this.illumination = {
      intensity: 0.85,
      direction: new Vector3D(0.1, -1.0, 0.05).normalize(),
      depth_penetration: 0.82,
      temporal_phase: 0.25, // Midday
    };

    this.substrate = {
      composition: 'fine_sand',
      stability: 0.75,
      disturbance: 0.0,
      sediment: 0.12,
      benthicDetritus: 0.15,
    };

    this.vegetation = {
      density: 0.65,
      health: 0.88,
      growth: 0.72,
      movement_response: 0.65,
    };

    this.particles = {
      density: 120,
      distribution: 'uniform',
      drift: new Vector3D(0.08, -0.01, 0.0),
    };

    this.initDefaultStructures();
  }

  private initDefaultStructures(): void {
    this.structures = [
      {
        id: 'struct_reef_crest_left',
        type: 'rock',
        position: new Vector3D(-8.5, -5.8, -1.5),
        boundingRadius: 3.2,
        shelterAffordance: 0.75,
        habitatId: 'habitat_reef_crest',
      },
      {
        id: 'struct_reef_cave_recess',
        type: 'cave',
        position: new Vector3D(-0.5, -6.0, -3.2),
        boundingRadius: 2.8,
        shelterAffordance: 0.95,
        habitatId: 'habitat_cave_recess',
      },
      {
        id: 'struct_reef_column_right',
        type: 'rock',
        position: new Vector3D(8.0, -5.6, -1.0),
        boundingRadius: 3.0,
        shelterAffordance: 0.7,
        habitatId: 'habitat_reef_crest',
      },
      {
        id: 'struct_benthic_driftwood',
        type: 'debris',
        position: new Vector3D(4.5, -6.4, 1.2),
        boundingRadius: 1.8,
        shelterAffordance: 0.5,
        habitatId: 'habitat_benthic_floor',
      },
      {
        id: 'struct_kelp_holdfast_anchor',
        type: 'vegetation_anchor',
        position: new Vector3D(-9.8, -6.6, 1.0),
        boundingRadius: 1.5,
        shelterAffordance: 0.6,
        habitatId: 'habitat_vegetation_zone',
      },
    ];
  }

  /**
   * Continuous environmental evolution with multi-timescale integration and hysteresis.
   */
  public update(simDt: number, simTime: number): void {
    if (simDt <= 0) return;

    // 1. Fast Scale: Fluid current inertia and turbulence micro-fluctuations
    const fluidAlpha = 1.0 - Math.exp(-simDt / this.FLOW_RESPONSE_TIME);
    this.water.flow.x += (this._targetFlow.x - this.water.flow.x) * fluidAlpha;
    this.water.flow.y += (this._targetFlow.y - this.water.flow.y) * fluidAlpha;
    this.water.flow.z += (this._targetFlow.z - this.water.flow.z) * fluidAlpha;

    // Gentle pseudo-convective oscillating drift
    const waveSin = Math.sin(simTime * 0.45);
    const waveCos = Math.cos(simTime * 0.32);
    const convectiveFlow = new Vector3D(
      this.water.flow.x + waveSin * 0.03,
      this.water.flow.y + waveCos * 0.015,
      this.water.flow.z + waveSin * 0.02
    );

    // Particle drift tracks current plus micro-turbulence
    this.particles.drift.copy(convectiveFlow);

    // Turbulence hysteresis
    const turbAlpha = 1.0 - Math.exp(-simDt / 3.0);
    this.water.turbulence += (this._targetTurbulence - this.water.turbulence) * turbAlpha;

    // Disturbance exponential decay
    if (this.disturbance > 0.001) {
      this.disturbance *= Math.exp(-this.DISTURBANCE_DECAY_RATE * simDt);
      if (this.disturbance < 0.001) this.disturbance = 0.0;
    }
    this.substrate.disturbance = this.disturbance;

    // 2. Medium Scale: Turbidity & Sediment Hysteresis
    // Target turbidity rises with disturbance, substrate disturbance, and ecological activity
    const disturbanceTurbidityLift = this.disturbance * 0.45;
    const substrateTurbidityLift = (1.0 - this.substrate.stability) * this.substrate.disturbance * 0.25;
    const activityTurbidity = this.ecologicalActivity * 0.08;
    this._targetTurbidity = Math.max(0.04, 0.06 + disturbanceTurbidityLift + substrateTurbidityLift + activityTurbidity);

    // Gradual turbidity adaptation (hysteresis prevents instant jumps)
    const turbidAlpha = 1.0 - Math.exp(-simDt / this.TURBIDITY_RESPONSE_TIME);
    this.water.turbidity += (this._targetTurbidity - this.water.turbidity) * turbidAlpha;
    this.water.turbidity = Math.max(0.02, Math.min(0.95, this.water.turbidity));
    this.water.clarity = Math.max(0.05, 1.0 - this.water.turbidity);

    // Sediment settling: unsettled sediment slowly consolidates onto benthic substrate
    if (this.substrate.sediment > 0.08) {
      this.substrate.sediment = Math.max(0.08, this.substrate.sediment - this.SEDIMENT_SETTLING_RATE * simDt);
    }

    // Ecological activity smoothing
    const actAlpha = 1.0 - Math.exp(-simDt / 5.0);
    this.ecologicalActivity += (this._targetEcologicalActivity - this.ecologicalActivity) * actAlpha;

    // Dynamic suspended particle count tracks turbidity
    this.particles.density = Math.round(70 + this.water.turbidity * 180 + this.ecologicalActivity * 50);

    // 3. Slow Scale: Illumination circadian advance & temperature stability
    // 60-second default full circadian period
    const dayPeriod = 60.0;
    this.illumination.temporal_phase = (simTime / dayPeriod) % 1.0;

    // Diurnal sunlight intensity (bell curve centered at noon phase=0.25)
    const noonPhaseDist = Math.abs(this.illumination.temporal_phase - 0.25);
    const dayFactor = Math.max(0, 1.0 - noonPhaseDist * 3.2);
    this.illumination.intensity = 0.15 + 0.85 * Math.pow(dayFactor, 1.4);

    // Water temperature has high thermal inertia
    const targetTemp = 24.2 + dayFactor * 1.2;
    this.water.temperature += (targetTemp - this.water.temperature) * (simDt / 200.0);

    // Slow vegetative growth & health maintenance
    if (this.vegetation.health < 0.95 && this.water.clarity > 0.4) {
      this.vegetation.health = Math.min(1.0, this.vegetation.health + 0.0005 * simDt);
    }
  }

  /**
   * Ecological coupling: Agent locomotion, feeding events, and social density
   * feed authoritative input into the environmental world.
   */
  public recordAgentActivity(
    agentVelocities: number[],
    feedingEventsCount: number,
    totalBiomass: number
  ): void {
    if (agentVelocities.length === 0) return;

    let totalSpeed = 0;
    for (let i = 0; i < agentVelocities.length; i++) {
      totalSpeed += agentVelocities[i];
    }
    const avgSpeed = totalSpeed / agentVelocities.length;

    // High velocity swimming induces micro-turbulence and bulk flow variation
    this._targetTurbulence = Math.min(0.85, 0.12 + (avgSpeed / 4.0) * 0.45);
    this._targetFlow.x = 0.08 + Math.sin(avgSpeed) * 0.05;

    // Derived aggregate activity index
    this._targetEcologicalActivity = Math.min(
      1.0,
      (avgSpeed / 3.0) * 0.4 + (feedingEventsCount * 0.15) + (totalBiomass / 100.0) * 0.3
    );

    // If active feeding occurred, gently raise benthic sediment
    if (feedingEventsCount > 0) {
      this.substrate.sediment = Math.min(0.9, this.substrate.sediment + feedingEventsCount * 0.04);
    }
  }

  /**
   * External or ecological disturbance ripple (e.g. tap glass, predator dart, water stir).
   */
  public applyDisturbance(strength: number): void {
    const clamped = Math.max(0.05, Math.min(1.0, strength));
    this.disturbance = Math.min(1.0, this.disturbance + clamped);
    this.substrate.disturbance = this.disturbance;
    this.water.turbulence = Math.min(0.95, this.water.turbulence + clamped * 0.4);
    this._targetTurbulence = Math.min(0.95, this._targetTurbulence + clamped * 0.5);

    // Agitation kicks up loose benthic sediment into water column
    this.substrate.sediment = Math.min(1.0, this.substrate.sediment + clamped * 0.25);
    this.water.turbidity = Math.min(1.0, this.water.turbidity + clamped * 0.18);
  }

  /**
   * Feeding nutrient drop disturbance on substrate.
   */
  public applyFeedingDisturbance(position: Vector3D, amount: number = 0.5): void {
    // If food lands near substrate, kick up minor localized sediment
    if (position.y < -5.0) {
      this.substrate.sediment = Math.min(1.0, this.substrate.sediment + amount * 0.1);
      this.substrate.benthicDetritus = Math.min(1.0, this.substrate.benthicDetritus + amount * 0.05);
      this.water.turbidity = Math.min(1.0, this.water.turbidity + 0.03);
    }
  }

  /**
   * Ecological succession phase coupling (Increment 004 phase engine integration).
   */
  public onSuccessionPhaseChanged(phase: string): void {
    switch (phase) {
      case 'GENESIS':
        this.vegetation.density = 0.3;
        this.vegetation.growth = 0.35;
        this.water.turbidity = 0.04;
        this.substrate.composition = 'fine_sand';
        break;
      case 'COLONISATION':
        this.vegetation.density = 0.55;
        this.vegetation.growth = 0.6;
        this.water.turbidity = 0.07;
        break;
      case 'ESTABLISHMENT':
        this.vegetation.density = 0.75;
        this.vegetation.health = 0.92;
        this.substrate.stability = 0.82;
        break;
      case 'DIVERSIFICATION':
        this.vegetation.density = 0.88;
        this.substrate.benthicDetritus = 0.25;
        this.substrate.composition = 'biogenic_reef';
        break;
      case 'PERTURBATION':
        this.applyDisturbance(0.7);
        this.vegetation.health = Math.max(0.4, this.vegetation.health - 0.2);
        break;
      case 'SUCCESSION':
        this.vegetation.growth = 0.7;
        this.substrate.sediment = 0.25;
        break;
      case 'REGENERATION':
        this.vegetation.health = 0.95;
        this.water.turbidity = 0.05;
        this.substrate.stability = 0.88;
        break;
    }
  }

  /**
   * Computes derived compact environmental signature for projection, instrumentation, and Task 004 audio.
   */
  public getSignature(): EnvironmentalSignature {
    return {
      illumination: parseFloat(this.illumination.intensity.toFixed(3)),
      activity: parseFloat(this.ecologicalActivity.toFixed(3)),
      turbulence: parseFloat(this.water.turbulence.toFixed(3)),
      vegetation: parseFloat(this.vegetation.density.toFixed(3)),
      resource_density: parseFloat(this.substrate.benthicDetritus.toFixed(3)),
      population_density: 0.5,
      disturbance: parseFloat(this.disturbance.toFixed(3)),
      turbidity: parseFloat(this.water.turbidity.toFixed(3)),
      habitat_complexity: parseFloat((this.structures.length / 10.0).toFixed(3)),
    };
  }

  /**
   * Derives presentation projection for the 3D WebGL renderer.
   * Observer state modulates fidelity/sampling, NOT authoritative truth.
   */
  public getVisualProjection(observerState: string = 'WATCHING'): EnvironmentalVisualProjection {
    // Observer fidelity scale: INACTIVE/ABSENT reduces particle density, WATCHING is full fidelity
    const fidelityMultiplier = observerState === 'ABSENT' ? 0.3 : observerState === 'INACTIVE' ? 0.6 : 1.0;

    // Atmospheric deep-water scattering colors based on diurnal phase & clarity
    const p = this.illumination.temporal_phase;
    let topColor: [number, number, number] = [0.12, 0.42, 0.58];
    let deepColor: [number, number, number] = [0.02, 0.08, 0.15];

    if (p < 0.15) {
      // Dawn
      topColor = [0.25, 0.28, 0.42];
      deepColor = [0.04, 0.06, 0.12];
    } else if (p < 0.45) {
      // Midday
      topColor = [0.15, 0.48, 0.65];
      deepColor = [0.03, 0.10, 0.18];
    } else if (p < 0.65) {
      // Sunset
      topColor = [0.38, 0.22, 0.28];
      deepColor = [0.08, 0.04, 0.09];
    } else {
      // Night / Bioluminescent
      topColor = [0.05, 0.15, 0.25];
      deepColor = [0.01, 0.03, 0.07];
    }

    const turbidity = this.water.turbidity;
    const depthHaze = 0.12 + turbidity * 0.45;
    const extinction = 0.06 + turbidity * 0.18;

    return {
      waterVolume: {
        topWaterColor: topColor,
        deepWaterColor: deepColor,
        extinctionCoefficient: extinction,
        depthHazeDensity: depthHaze,
        surfaceAgitation: 0.2 + this.water.turbulence * 0.5 + this.disturbance * 0.3,
        godRayIntensity: this.illumination.intensity * (1.0 - turbidity * 0.6),
        causticStrength: Math.max(0.2, (1.0 - turbidity * 0.5) * this.illumination.intensity),
      },
      flow: {
        flowVelocity: this.water.flow.clone(),
        turbulence: this.water.turbulence,
      },
      particles: {
        targetCount: Math.round(this.particles.density * fidelityMultiplier),
        driftVelocity: this.particles.drift.clone(),
        opacity: Math.min(0.85, 0.2 + turbidity * 0.7),
        sizeScale: 0.9 + turbidity * 0.6,
      },
      substrate: {
        sedimentPuffIntensity: Math.min(1.0, this.substrate.disturbance * 1.5 + this.substrate.sediment * 0.4),
        detritusDarkening: this.substrate.benthicDetritus,
      },
      vegetation: {
        swayForce: this.water.flow.clone().multiplyScalar(this.vegetation.movement_response * 1.6),
        flutterMagnitude: this.water.turbulence * 0.4,
        growthScale: this.vegetation.growth,
        chlorosis: 1.0 - this.vegetation.health,
      },
      signature: this.getSignature(),
    };
  }

  /**
   * Provides the clean projection boundary for Program Increment v0.0.1 - Task 004 (Acoustic Ecology).
   */
  public getAcousticBoundary(): AcousticEnvironmentalBoundary {
    return {
      signature: this.getSignature(),
      ambientFlowIntensity: this.water.flow.length(),
      turbulenceLevel: this.water.turbulence,
      benthicDisturbance: this.substrate.disturbance,
      turbidityLevel: this.water.turbidity,
      biologicalActivity: this.ecologicalActivity,
      waterTemperature: this.water.temperature,
      bubbleGenerationRate: Math.max(0.1, this.water.turbulence * 2.0 + this.disturbance * 3.0),
    };
  }

  public toJSON(): IEnvironmentalStateJSON {
    return {
      water: {
        flow: { x: this.water.flow.x, y: this.water.flow.y, z: this.water.flow.z },
        turbulence: this.water.turbulence,
        temperature: this.water.temperature,
        turbidity: this.water.turbidity,
        clarity: this.water.clarity,
      },
      illumination: {
        intensity: this.illumination.intensity,
        direction: { x: this.illumination.direction.x, y: this.illumination.direction.y, z: this.illumination.direction.z },
        depth_penetration: this.illumination.depth_penetration,
        temporal_phase: this.illumination.temporal_phase,
      },
      substrate: {
        composition: this.substrate.composition,
        stability: this.substrate.stability,
        disturbance: this.substrate.disturbance,
        sediment: this.substrate.sediment,
        benthicDetritus: this.substrate.benthicDetritus,
      },
      vegetation: {
        density: this.vegetation.density,
        health: this.vegetation.health,
        growth: this.vegetation.growth,
        movement_response: this.vegetation.movement_response,
      },
      particles: {
        density: this.particles.density,
        distribution: this.particles.distribution,
        drift: { x: this.particles.drift.x, y: this.particles.drift.y, z: this.particles.drift.z },
      },
      structures: this.structures.map((s) => ({
        id: s.id,
        type: s.type,
        position: { x: s.position.x, y: s.position.y, z: s.position.z },
        boundingRadius: s.boundingRadius,
        shelterAffordance: s.shelterAffordance,
        habitatId: s.habitatId,
      })),
      ecological_activity: this.ecologicalActivity,
      disturbance: this.disturbance,
    };
  }

  public fromJSON(data: IEnvironmentalStateJSON): void {
    if (!data) return;

    if (data.water) {
      if (data.water.flow) {
        this.water.flow = new Vector3D(data.water.flow.x, data.water.flow.y, data.water.flow.z);
      }
      this.water.turbulence = data.water.turbulence ?? 0.15;
      this.water.temperature = data.water.temperature ?? 24.5;
      this.water.turbidity = data.water.turbidity ?? 0.08;
      this.water.clarity = data.water.clarity ?? (1.0 - this.water.turbidity);
    }

    if (data.illumination) {
      this.illumination.intensity = data.illumination.intensity ?? 0.85;
      if (data.illumination.direction) {
        this.illumination.direction = new Vector3D(
          data.illumination.direction.x,
          data.illumination.direction.y,
          data.illumination.direction.z
        );
      }
      this.illumination.depth_penetration = data.illumination.depth_penetration ?? 0.82;
      this.illumination.temporal_phase = data.illumination.temporal_phase ?? 0.25;
    }

    if (data.substrate) {
      this.substrate.composition = data.substrate.composition ?? 'fine_sand';
      this.substrate.stability = data.substrate.stability ?? 0.75;
      this.substrate.disturbance = data.substrate.disturbance ?? 0.0;
      this.substrate.sediment = data.substrate.sediment ?? 0.12;
      this.substrate.benthicDetritus = data.substrate.benthicDetritus ?? 0.15;
    }

    if (data.vegetation) {
      this.vegetation.density = data.vegetation.density ?? 0.65;
      this.vegetation.health = data.vegetation.health ?? 0.88;
      this.vegetation.growth = data.vegetation.growth ?? 0.72;
      this.vegetation.movement_response = data.vegetation.movement_response ?? 0.65;
    }

    if (data.particles) {
      this.particles.density = data.particles.density ?? 120;
      this.particles.distribution = data.particles.distribution ?? 'uniform';
      if (data.particles.drift) {
        this.particles.drift = new Vector3D(data.particles.drift.x, data.particles.drift.y, data.particles.drift.z);
      }
    }

    if (Array.isArray(data.structures) && data.structures.length > 0) {
      this.structures = data.structures.map((s) => ({
        id: s.id,
        type: s.type,
        position: new Vector3D(s.position.x, s.position.y, s.position.z),
        boundingRadius: s.boundingRadius,
        shelterAffordance: s.shelterAffordance,
        habitatId: s.habitatId,
      }));
    }

    this.ecologicalActivity = data.ecological_activity ?? 0.2;
    this.disturbance = data.disturbance ?? 0.0;
  }
}

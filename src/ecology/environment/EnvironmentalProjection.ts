/**
 * Environmental Projection Abstraction (Program Increment v0.0.1 - Task 003).
 *
 * Implements the semantic separation:
 *   Authoritative World -> Environmental Projection -> Visual Renderer & Future Acoustic Soundscape
 *
 * "Presentation may derive from simulation state; presentation must not silently become simulation state."
 */

import { Vector3D } from '../../space/physical/Vector3D';
import { EnvironmentalSignature } from './EnvironmentalState';

export interface VisualWaterVolumeProjection {
  /** Top water layer color [r, g, b] normalized 0..1 */
  topWaterColor: [number, number, number];
  /** Deep benthic water layer color [r, g, b] normalized 0..1 */
  deepWaterColor: [number, number, number];
  /** Water optical extinction / absorption coefficient */
  extinctionCoefficient: number;
  /** Atmospheric scattering / haze density across depth */
  depthHazeDensity: number;
  /** Surface ripple & wave agitation factor [0, 1] */
  surfaceAgitation: number;
  /** Volumetric downwelling light shaft intensity [0, 1] */
  godRayIntensity: number;
  /** Caustic modulation strength [0, 1] */
  causticStrength: number;
}

export interface VisualFlowProjection {
  /** Dominant 3D flow velocity for rendering particle drift */
  flowVelocity: Vector3D;
  /** Micro-turbulence magnitude */
  turbulence: number;
}

export interface VisualParticleProjection {
  /** Suggested active particle count based on turbidity and observer fidelity */
  targetCount: number;
  /** Mean particulate drift velocity vector */
  driftVelocity: Vector3D;
  /** Particulate opacity [0, 1] */
  opacity: number;
  /** Particle size multiplier */
  sizeScale: number;
}

export interface VisualSubstrateProjection {
  /** Active sediment puff / plume intensity [0, 1] */
  sedimentPuffIntensity: number;
  /** Substrate detritus tint factor */
  detritusDarkening: number;
}

export interface VisualVegetationProjection {
  /** Coupled hydrodynamic sway force vector */
  swayForce: Vector3D;
  /** High-frequency flutter magnitude from turbulence */
  flutterMagnitude: number;
  /** Overall vegetative growth scale [0, 1] */
  growthScale: number;
  /** Chlorosis necrosis factor (1.0 - health) */
  chlorosis: number;
}

export interface EnvironmentalVisualProjection {
  waterVolume: VisualWaterVolumeProjection;
  flow: VisualFlowProjection;
  particles: VisualParticleProjection;
  substrate: VisualSubstrateProjection;
  vegetation: VisualVegetationProjection;
  signature: EnvironmentalSignature;
}

/**
 * Clean boundary for future acoustic projection (Program Increment v0.0.1 - Task 004).
 * Task 004 will consume this exact projection interface.
 */
export interface AcousticEnvironmentalBoundary {
  signature: EnvironmentalSignature;
  ambientFlowIntensity: number;
  turbulenceLevel: number;
  benthicDisturbance: number;
  turbidityLevel: number;
  biologicalActivity: number;
  waterTemperature: number;
  bubbleGenerationRate: number;
}

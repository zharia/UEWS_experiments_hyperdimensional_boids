/**
 * Authoritative Environmental State Model (Program Increment v0.0.1 - Task 003).
 *
 * Defines the authoritative, renderer-independent environmental world model:
 *  - Water volume: flow, turbulence, temperature, turbidity, clarity
 *  - Illumination: intensity, direction, depth_penetration, temporal_phase
 *  - Substrate: composition, stability, disturbance, sediment, detritus
 *  - Vegetation: density, health, growth, movement_response
 *  - Particles: density, distribution, drift
 *  - Structures: physical habitat anchors, rocks, caves, debris
 *  - Ecological activity & disturbances
 *
 * Fundamental Invariant:
 *  "Presentation may derive from simulation state; presentation must not silently become simulation state."
 */

import { Vector3D } from '../../space/physical/Vector3D';

export interface WaterState {
  /** Laminar convective bulk flow vector (m/s) */
  flow: Vector3D;
  /** Dimensionless turbulence intensity [0, 1] */
  turbulence: number;
  /** Water temperature in degrees Celsius (e.g. 23.5 - 26.0) */
  temperature: number;
  /** Optical turbidity / suspended particulate concentration [0, 1] */
  turbidity: number;
  /** Water optical clarity [0, 1] (derived: 1.0 - turbidity) */
  clarity: number;
}

export interface IlluminationState {
  /** Global illumination intensity [0, 1] */
  intensity: number;
  /** Normalized downwelling directional light vector */
  direction: Vector3D;
  /** Depth penetration factor through water column [0, 1] */
  depth_penetration: number;
  /** Circadian diurnal phase [0, 1] (0.0=dawn, 0.25=noon, 0.5=sunset, 0.75=night) */
  temporal_phase: number;
}

export type SubstrateComposition =
  | 'fine_sand'
  | 'coarse_gravel'
  | 'biogenic_reef'
  | 'silt_detritus';

export interface SubstrateState {
  /** Dominant geological composition of tank floor */
  composition: SubstrateComposition;
  /** Structural stability / resistance to erosion [0, 1] */
  stability: number;
  /** Current mechanical disturbance level [0, 1] */
  disturbance: number;
  /** Thickness of loose unsettled sediment layer [0, 1] */
  sediment: number;
  /** Benthic organic biofilm/detritus layer [0, 1] */
  benthicDetritus: number;
}

export interface VegetationState {
  /** Overall vegetative biomass density [0, 1] */
  density: number;
  /** Mean vegetative physiological health [0, 1] */
  health: number;
  /** Phenotypic growth progress [0, 1] */
  growth: number;
  /** Hydrodynamic drag and movement coupling coefficient [0, 1] */
  movement_response: number;
}

export type ParticleDistributionType = 'uniform' | 'benthic_stratified' | 'plume';

export interface ParticleState {
  /** Mean suspended particulate density (particles / volume unit) */
  density: number;
  /** Spatial distribution profile */
  distribution: ParticleDistributionType;
  /** Drift velocity vector */
  drift: Vector3D;
}

export type EnvironmentalStructureType =
  | 'rock'
  | 'cave'
  | 'debris'
  | 'reef_column'
  | 'vegetation_anchor';

export interface EnvironmentalStructure {
  id: string;
  type: EnvironmentalStructureType;
  position: Vector3D;
  boundingRadius: number;
  shelterAffordance: number; // [0, 1]
  habitatId: string;
}

/**
 * Compact derived environmental signature.
 * Suitable for visual projection, instrumentation, and future acoustic projection (Task 004).
 */
export interface EnvironmentalSignature {
  illumination: number;
  activity: number;
  turbulence: number;
  vegetation: number;
  resource_density: number;
  population_density: number;
  disturbance: number;
  turbidity: number;
  habitat_complexity: number;
}

export interface IEnvironmentalStateJSON {
  water: {
    flow: { x: number; y: number; z: number };
    turbulence: number;
    temperature: number;
    turbidity: number;
    clarity: number;
  };
  illumination: {
    intensity: number;
    direction: { x: number; y: number; z: number };
    depth_penetration: number;
    temporal_phase: number;
  };
  substrate: {
    composition: SubstrateComposition;
    stability: number;
    disturbance: number;
    sediment: number;
    benthicDetritus: number;
  };
  vegetation: {
    density: number;
    health: number;
    growth: number;
    movement_response: number;
  };
  particles: {
    density: number;
    distribution: ParticleDistributionType;
    drift: { x: number; y: number; z: number };
  };
  structures: {
    id: string;
    type: EnvironmentalStructureType;
    position: { x: number; y: number; z: number };
    boundingRadius: number;
    shelterAffordance: number;
    habitatId: string;
  }[];
  ecological_activity: number;
  disturbance: number;
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Authoritative Acoustic State Model (Program Increment v0.0.1 - Task 004).
 *
 * Defines the authoritative, renderer-independent acoustic world model:
 *  - Continuous acoustic state (environmental bed, water dynamics, biological texture, spatial field)
 *  - Discrete acoustic events with full causal tracing
 *  - Semantic acoustic parameters describing how the world should sound
 *  - Separation between authoritative simulation and transient presentation
 *
 * Fundamental Invariant:
 *  "The aquarium should have an atmosphere, not a soundtrack."
 *  "Audio is a derived manifestation; the simulation is the source of truth."
 */

import { Vector3D, IVector3D } from '../../space/physical/Vector3D';

export type AcousticSourceType =
  | 'environmental_bed'
  | 'water_current'
  | 'water_turbulence'
  | 'bubble_stream'
  | 'biological_texture'
  | 'feeding_strike'
  | 'substrate_settling'
  | 'substrate_disturbance'
  | 'vegetation_rustle'
  | 'organism_collision'
  | 'antic_manifestation'
  | 'water_ripple'
  | 'glass_interaction';

/**
 * Semantic continuous acoustic state parameters.
 * These represent the physical & ecological properties of the acoustic field.
 */
export interface ContinuousAcousticState {
  /** Baseline environmental bed presence [0, 1] */
  ambient_level: number;
  /** Overall fluid kinetic activity [0, 1] */
  water_activity: number;
  /** Bulk convective laminar flow strength [0, 1] */
  current_activity: number;
  /** Dimensionless micro-eddy turbulence [0, 1] */
  turbulence: number;
  /** Aggregate population movement & metabolic density [0, 1] */
  biological_activity: number;
  /** Loose sediment motion & benthic disturbance [0, 1] */
  substrate_activity: number;
  /** Canopy hydrodynamic sway & drag interaction [0, 1] */
  vegetation_activity: number;
  /** Shock wave / mechanical stress disturbance [0, 1] */
  disturbance: number;
  /** Background diffuse ecological activity [0, 1] */
  distant_activity: number;
  /** Local focal activity in the observer's attentional field [0, 1] */
  local_activity: number;
  /** High-frequency vs low-frequency balance (0 = deep rumble, 1 = bright shimmer) */
  spectral_character: number;
  /** Diurnal circadian acoustic modifier [0, 1] (0.0=dawn, 0.25=noon, 0.75=night) */
  diurnal_factor: number;
}

/**
 * Compact derived acoustic signature for telemetry and instrumentation.
 */
export interface AcousticSignature {
  ambient_level: number;
  water_activity: number;
  current_activity: number;
  turbulence: number;
  biological_activity: number;
  substrate_activity: number;
  vegetation_activity: number;
  disturbance: number;
  spectral_character: number;
  diurnal_factor: number;
  estimated_loudness_db: number;
}

/**
 * Discrete acoustic event with authoritative causal trace.
 */
export interface AcousticEvent {
  id: string;
  simulationTime: number;
  source: AcousticSourceType;
  location: IVector3D;
  intensity: number; // [0, 1]
  duration: number; // seconds
  spectral_character: number; // [0, 1]
  significance: number; // [0, 1]
  ecological_context: {
    habitatId?: string;
    species?: string;
    phase?: string;
    targetOrganismId?: string;
  };
  cause?: {
    eventId?: string;
    anticId?: string;
    description: string;
  };
}

export interface AcousticTelemetry {
  simulationTime: number;
  state: ContinuousAcousticState;
  signature: AcousticSignature;
  activeEventsCount: number;
  recentEvents: AcousticEvent[];
  recentCausalTraces: {
    eventId: string;
    cause: string;
    timestamp: number;
    location: string;
    source: string;
    significance: number;
  }[];
  layerGains: {
    master: number;
    environmentalBed: number;
    waterDynamics: number;
    biologicalTexture: number;
    spatialEvents: number;
    anticManifestations: number;
  };
  audioUpdateCostMs: number;
  observerAudibility: number;
}

export interface IAcousticStateJSON {
  continuous: ContinuousAcousticState;
  recentEventCount: number;
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Vector3D, IVector3D } from '../../space/physical/Vector3D';
import { ContinuousAcousticState, AcousticSignature, AcousticEvent } from './AcousticState';
import { HabitatManager } from '../habitats/HabitatManager';

export interface LocalAcousticProperties {
  ambient_gain: number;
  water_reverberance: number;
  biological_density: number;
  spectral_damping: number; // 0 = bright, 1 = heavily lowpassed/occluded
  occlusion_factor: number; // 0 = clear water, 1 = occluded by rock/sand
}

export interface SpatialAudioProjection {
  pan: number; // -1.0 (far left) to +1.0 (far right)
  distanceAttenuation: number; // 0.0 to 1.0
  lowpassCutoffHz: number; // e.g. 300Hz (occluded) to 4500Hz (clear open water)
  reverberantMix: number; // 0.0 to 1.0
}

/**
 * Spatial and temporal acoustic field manager.
 * Models:
 *  - 3D spatial variation across aquarium habitats
 *  - Distance attenuation and stereo positioning
 *  - Environmental occlusion (vegetation canopy, benthic substrate, rock crevices)
 *  - Acoustic hysteresis (temporal inertia across fast, medium, and slow timescales)
 */
export class AcousticField {
  public currentState: ContinuousAcousticState;
  private targetState: ContinuousAcousticState;

  // Tank bounds for normalization
  public bounds = {
    minX: -14.0,
    maxX: 14.0,
    minY: -7.0,
    maxY: 7.0,
    minZ: -6.0,
    maxZ: 6.0,
  };

  constructor() {
    this.currentState = this.createDefaultAcousticState();
    this.targetState = { ...this.currentState };
  }

  public createDefaultAcousticState(): ContinuousAcousticState {
    return {
      ambient_level: 0.25,
      water_activity: 0.20,
      current_activity: 0.15,
      turbulence: 0.10,
      biological_activity: 0.18,
      substrate_activity: 0.05,
      vegetation_activity: 0.12,
      disturbance: 0.0,
      distant_activity: 0.15,
      local_activity: 0.20,
      spectral_character: 0.40,
      diurnal_factor: 0.50,
    };
  }

  /**
   * Sets target acoustic state derived from authoritative simulation.
   */
  public setTargetState(target: Partial<ContinuousAcousticState>) {
    this.targetState = {
      ...this.targetState,
      ...target,
    };
  }

  /**
   * Advances acoustic hysteresis with inertia over time.
   * Prevents abrupt unnatural audio clicks or binary volume switches.
   */
  public updateHysteresis(dt: number) {
    if (dt <= 0) return;

    // Multi-scalar time constants (tau in seconds)
    const tauFast = 0.35; // Disturbance, shocks, impacts
    const tauMedium = 2.2; // Water current, biological activity, substrate
    const tauSlow = 12.0; // Ambient bed, vegetation biomass, diurnal baseline

    const alphaFast = 1.0 - Math.exp(-dt / tauFast);
    const alphaMedium = 1.0 - Math.exp(-dt / tauMedium);
    const alphaSlow = 1.0 - Math.exp(-dt / tauSlow);

    // Fast response parameters
    this.currentState.disturbance += (this.targetState.disturbance - this.currentState.disturbance) * alphaFast;

    // Medium response parameters
    this.currentState.water_activity += (this.targetState.water_activity - this.currentState.water_activity) * alphaMedium;
    this.currentState.current_activity += (this.targetState.current_activity - this.currentState.current_activity) * alphaMedium;
    this.currentState.turbulence += (this.targetState.turbulence - this.currentState.turbulence) * alphaMedium;
    this.currentState.biological_activity += (this.targetState.biological_activity - this.currentState.biological_activity) * alphaMedium;
    this.currentState.substrate_activity += (this.targetState.substrate_activity - this.currentState.substrate_activity) * alphaMedium;
    this.currentState.local_activity += (this.targetState.local_activity - this.currentState.local_activity) * alphaMedium;
    this.currentState.distant_activity += (this.targetState.distant_activity - this.currentState.distant_activity) * alphaMedium;

    // Slow response parameters
    this.currentState.ambient_level += (this.targetState.ambient_level - this.currentState.ambient_level) * alphaSlow;
    this.currentState.vegetation_activity += (this.targetState.vegetation_activity - this.currentState.vegetation_activity) * alphaSlow;
    this.currentState.spectral_character += (this.targetState.spectral_character - this.currentState.spectral_character) * alphaSlow;
    this.currentState.diurnal_factor += (this.targetState.diurnal_factor - this.currentState.diurnal_factor) * alphaSlow;
  }

  /**
   * Samples local acoustic properties at any 3D point in the tank.
   * Incorporates habitat zoning and boundary geometry.
   */
  public sampleAt(x: number, y: number, z: number, habitatManager?: HabitatManager): LocalAcousticProperties {
    const pos = new Vector3D(x, y, z);
    const habitat = habitatManager?.getHabitatAt(pos);

    let ambientGain = this.currentState.ambient_level;
    let waterRev = 0.3;
    let bioDensity = this.currentState.biological_activity;
    let spectralDamping = 0.2;
    let occlusion = 0.0;

    if (habitat) {
      switch (habitat.type) {
        case 'SURFACE':
          ambientGain *= 1.25;
          spectralDamping = 0.05; // Bright, open to atmosphere
          waterRev = 0.2;
          break;
        case 'VEGETATION':
          bioDensity *= 1.45;
          spectralDamping = 0.45; // Canopy acoustic absorption
          ambientGain *= 0.9;
          waterRev = 0.25;
          break;
        case 'BENTHIC_SUBSTRATE':
          spectralDamping = 0.65; // Low-frequency floor damping
          occlusion = 0.2;
          waterRev = 0.4;
          break;
        case 'OPEN_WATER':
        default:
          spectralDamping = 0.15;
          waterRev = 0.35;
          break;
      }
    }

    // Proximity to bottom sand or rock adds acoustic grounding
    if (y < -5.5) {
      spectralDamping = Math.max(spectralDamping, 0.55);
    }

    return {
      ambient_gain: Math.max(0, Math.min(1, ambientGain)),
      water_reverberance: Math.max(0, Math.min(1, waterRev)),
      biological_density: Math.max(0, Math.min(1, bioDensity)),
      spectral_damping: Math.max(0, Math.min(1, spectralDamping)),
      occlusion_factor: Math.max(0, Math.min(1, occlusion)),
    };
  }

  /**
   * Computes spatial projection (panning, distance attenuation, and lowpass cutoff)
   * relative to a listener's position (typically front observer at (0, 0, 18)).
   */
  public calculateSpatialProjection(
    sourceLocation: IVector3D,
    listenerLocation: IVector3D = { x: 0, y: 0, z: 18 }
  ): SpatialAudioProjection {
    const dx = sourceLocation.x - listenerLocation.x;
    const dy = sourceLocation.y - listenerLocation.y;
    const dz = sourceLocation.z - listenerLocation.z;
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

    // Stereo pan based on lateral offset relative to tank width
    const halfWidth = (this.bounds.maxX - this.bounds.minX) * 0.5;
    const panRaw = sourceLocation.x / halfWidth;
    const pan = Math.max(-0.85, Math.min(0.85, panRaw)); // Gentle stereo width

    // Inverse distance attenuation with reference distance of 14 units
    const refDistance = 14.0;
    const rollOff = 0.08;
    const distanceAttenuation = Math.max(0.12, Math.min(1.0, 1.0 / (1.0 + rollOff * Math.max(0, distance - refDistance))));

    // Depth-based lowpass filtering (sounds deeper in the tank or near benthic floor lose highs)
    const normalizedDepth = (sourceLocation.z - this.bounds.minZ) / (this.bounds.maxZ - this.bounds.minZ);
    const normalizedHeight = (sourceLocation.y - this.bounds.minY) / (this.bounds.maxY - this.bounds.minY);

    const baseCutoff = 3600;
    const depthLoss = (1.0 - normalizedDepth) * 1200;
    const benthicLoss = (1.0 - normalizedHeight) * 800;
    const lowpassCutoffHz = Math.max(350, baseCutoff - depthLoss - benthicLoss);

    const reverberantMix = Math.min(0.65, 0.15 + (distance / 40.0) * 0.35);

    return {
      pan,
      distanceAttenuation,
      lowpassCutoffHz,
      reverberantMix,
    };
  }

  /**
   * Computes derived acoustic signature summary.
   */
  public getSignature(): AcousticSignature {
    const s = this.currentState;
    // Theoretical perceived loudness estimate based on weighted energy
    const totalEnergy =
      s.ambient_level * 0.25 +
      s.water_activity * 0.25 +
      s.biological_activity * 0.25 +
      s.disturbance * 0.25;

    const estimated_loudness_db = -48.0 + totalEnergy * 24.0; // Between -48dB (quiet ambient) and -24dB (peak activity)

    return {
      ambient_level: s.ambient_level,
      water_activity: s.water_activity,
      current_activity: s.current_activity,
      turbulence: s.turbulence,
      biological_activity: s.biological_activity,
      substrate_activity: s.substrate_activity,
      vegetation_activity: s.vegetation_activity,
      disturbance: s.disturbance,
      spectral_character: s.spectral_character,
      diurnal_factor: s.diurnal_factor,
      estimated_loudness_db,
    };
  }
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Vector3D, IVector3D } from '../../space/physical/Vector3D';
import { AcousticField, SpatialAudioProjection } from './AcousticField';
import { AcousticEvent, ContinuousAcousticState, AcousticTelemetry } from './AcousticState';
import { ObserverModel, ObserverState } from '../../observer/ObserverModel';

export interface ProjectedAudioMix {
  masterGain: number;
  environmentalBedGain: number;
  waterDynamicsGain: number;
  biologicalTextureGain: number;
  eventsGain: number;
  anticGain: number;
  lowpassFilterCutoffHz: number;
  isAudible: boolean;
}

export interface ProjectedEventDescriptor {
  event: AcousticEvent;
  spatial: SpatialAudioProjection;
  finalGain: number;
}

/**
 * Acoustic Projection Engine.
 * Translates authoritative AcousticField and discrete AcousticEvents into
 * concrete mixing levels and spatialized event descriptors, modulated by Observer state.
 */
export class AcousticProjection {
  public field: AcousticField;
  public listenerPosition: IVector3D = { x: 0, y: 0, z: 18 };
  public attentionFocus: IVector3D | null = null;

  constructor(field: AcousticField) {
    this.field = field;
  }

  /**
   * Computes projected audio mix levels modulated by observer presence and attention.
   */
  public projectMix(observerState: ObserverState = 'WATCHING'): ProjectedAudioMix {
    const state = this.field.currentState;

    // Observer manifestation modulation (Section 26 & 27)
    let observerAudibility = 1.0;
    let highFrequencyClarity = 1.0;

    switch (observerState) {
      case 'ABSENT':
        observerAudibility = 0.0;
        highFrequencyClarity = 0.5;
        break;
      case 'INACTIVE':
        observerAudibility = 0.45;
        highFrequencyClarity = 0.7;
        break;
      case 'INTERACTING':
        observerAudibility = 1.0;
        highFrequencyClarity = 1.1;
        break;
      case 'WATCHING':
      case 'PRESENT':
      default:
        observerAudibility = 0.85;
        highFrequencyClarity = 1.0;
        break;
    }

    if (observerAudibility <= 0.001) {
      return {
        masterGain: 0,
        environmentalBedGain: 0,
        waterDynamicsGain: 0,
        biologicalTextureGain: 0,
        eventsGain: 0,
        anticGain: 0,
        lowpassFilterCutoffHz: 200,
        isAudible: false,
      };
    }

    // Layer 0: Environmental Bed (quiet, continuous, unobtrusive)
    const environmentalBedGain = Math.max(0.08, Math.min(0.28, state.ambient_level * 0.45)) * observerAudibility;

    // Layer 1: Water Dynamics (flow + turbulence modulation)
    const waterDynamicsGain = Math.max(0.05, Math.min(0.35, state.water_activity * 0.40)) * observerAudibility;

    // Layer 2: Biological Texture (subtle aggregate micro-impulses)
    const biologicalTextureGain = Math.max(0.02, Math.min(0.30, state.biological_activity * 0.35)) * observerAudibility;

    // Layer 4 & 5: Events and Antics
    const eventsGain = Math.max(0.1, Math.min(0.5, 0.25 + state.disturbance * 0.25)) * observerAudibility;
    const anticGain = Math.max(0.1, Math.min(0.45, 0.30)) * observerAudibility;

    // Master filter cutoff influenced by spectral character and observer attention
    const baseCutoff = 2200;
    const lowpassFilterCutoffHz = Math.max(300, Math.min(6500, (baseCutoff + state.spectral_character * 2800) * highFrequencyClarity));

    return {
      masterGain: 0.50 * observerAudibility,
      environmentalBedGain,
      waterDynamicsGain,
      biologicalTextureGain,
      eventsGain,
      anticGain,
      lowpassFilterCutoffHz,
      isAudible: true,
    };
  }

  /**
   * Projects a discrete event into spatialized audio parameters relative to the observer.
   */
  public projectEvent(event: AcousticEvent): ProjectedEventDescriptor {
    const spatial = this.field.calculateSpatialProjection(event.location, this.listenerPosition);

    // If observer attention is focused on an organism or area, boost sounds from that focal region
    let attentionBoost = 1.0;
    if (this.attentionFocus) {
      const dx = event.location.x - this.attentionFocus.x;
      const dy = event.location.y - this.attentionFocus.y;
      const dz = event.location.z - this.attentionFocus.z;
      const distToFocus = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (distToFocus < 3.5) {
        attentionBoost = 1.35;
      }
    }

    const finalGain = Math.max(0.05, Math.min(1.0, event.intensity * spatial.distanceAttenuation * attentionBoost));

    return {
      event,
      spatial,
      finalGain,
    };
  }

  /**
   * Builds live telemetry for inspector UI and diagnostics.
   */
  public getTelemetry(
    simTime: number,
    recentEvents: AcousticEvent[],
    observerState: ObserverState,
    updateCostMs: number = 0.1
  ): AcousticTelemetry {
    const mix = this.projectMix(observerState);
    const signature = this.field.getSignature();

    const recentCausalTraces = recentEvents.slice(-8).reverse().map((e) => ({
      eventId: e.id,
      cause: e.cause?.description || 'Natural ecological condition',
      timestamp: e.simulationTime,
      location: `(${e.location.x.toFixed(1)}, ${e.location.y.toFixed(1)}, ${e.location.z.toFixed(1)})`,
      source: e.source,
      significance: e.significance,
    }));

    return {
      simulationTime: simTime,
      state: { ...this.field.currentState },
      signature,
      activeEventsCount: recentEvents.length,
      recentEvents: [...recentEvents],
      recentCausalTraces,
      layerGains: {
        master: mix.masterGain,
        environmentalBed: mix.environmentalBedGain,
        waterDynamics: mix.waterDynamicsGain,
        biologicalTexture: mix.biologicalTextureGain,
        spatialEvents: mix.eventsGain,
        anticManifestations: mix.anticGain,
      },
      audioUpdateCostMs: updateCostMs,
      observerAudibility: mix.masterGain,
    };
  }
}

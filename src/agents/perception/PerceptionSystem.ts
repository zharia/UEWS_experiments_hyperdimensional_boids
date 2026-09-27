/**
 * Non-Omniscient Local Perception Boundary.
 *
 * Filters world entities and environmental fields through an agent's sensory limits:
 *  - physical sensory radius & field-of-view
 *  - hyperdimensional sensitivity (e.g. perception attenuated by distance in temporal w or latent space)
 *  - water turbidity / illumination attenuation
 *  - sensory salience threshold
 */

import { Vector3D } from '../../space/physical/Vector3D';
import { LatentState } from '../../space/hyperdimensional/LatentState';
import { EnvironmentalFieldType, ISpatialFieldProvider } from '../../space/fields/EnvironmentalField';
import { AcousticEvent, AcousticSourceType } from '../../ecology/acoustic/AcousticState';
import { AcousticField } from '../../ecology/acoustic/AcousticField';
import { AcousticSensoryTraits } from '../../species/Species';

export interface PerceivedAgent {
  id: string;
  species: string;
  position: Vector3D;
  velocity: Vector3D;
  distance: number;
  apparentSize: number;
  affinity: number;
  fear: number;
  isConspecific: boolean;
}

export interface PerceivedResource {
  id: string;
  type: string; // 'food', 'shelter', 'biofilm', etc.
  position: Vector3D;
  distance: number;
  quantity: number;
  salience: number;
}

export interface PerceivedHazard {
  id: string;
  type: string; // 'predator', 'disturbance', 'toxic_zone'
  position: Vector3D;
  distance: number;
  threatLevel: number;
}

export interface PerceivedAcousticEvent {
  id: string;
  sourceType: AcousticSourceType;
  position: Vector3D;
  distance: number;
  perceivedIntensity: number; // 0 to 1, attenuated by distance & habitat damping
  salience: number; // 0 to 1
  isStartling: boolean; // Sudden loud shockwave / collision / disturbance
  isAttractive: boolean; // Feeding strike, surface water impact, food drop
  frequencyHz?: number;
  description: string;
}

export interface PerceivedAcousticSensoryState {
  ambientSoundPressureDb: number;
  flowVibrationLevel: number; // 0 to 1, neuromast lateral-line activation
  acousticGradient: Vector3D; // direction towards sound origin / turbulence
  dominantCondition: 'calm' | 'flowing' | 'turbulent' | 'disturbed';
}

export interface PerceptionConfig {
  visualRadius: number;
  fieldOfViewRad: number; // e.g. Math.PI * 1.5 (270 degrees)
  auditoryRadius: number; // omnidirectional hearing/lateral-line vibration sense
  latentSensitivity: number; // weight on 4D deltaW
  turbidityThreshold: number; // turbidity at which visual radius drops by 50%
}

export class PerceptionSystem {
  public config: PerceptionConfig;

  constructor(config?: Partial<PerceptionConfig>) {
    this.config = {
      visualRadius: config?.visualRadius ?? 6.5,
      fieldOfViewRad: config?.fieldOfViewRad ?? Math.PI * 1.6, // 288 degrees wide aquatic vision
      auditoryRadius: config?.auditoryRadius ?? 3.5, // lateral line vibration detection
      latentSensitivity: config?.latentSensitivity ?? 0.8,
      turbidityThreshold: config?.turbidityThreshold ?? 0.4,
    };
  }

  /**
   * Evaluates if a target position is perceivable from observer position and forward heading
   */
  public canPerceive(
    selfPos: Vector3D,
    selfForward: Vector3D,
    selfLatent: LatentState,
    targetPos: Vector3D,
    targetLatent?: LatentState,
    turbidity: number = 0
  ): { perceivable: boolean; distance: number; salience: number } {
    const distPhys = selfPos.distanceTo(targetPos);
    
    // Attenuate effective visual radius by water turbidity
    const effectiveRadius = this.config.visualRadius / (1.0 + Math.max(0, turbidity / this.config.turbidityThreshold));
    
    if (distPhys > effectiveRadius && distPhys > this.config.auditoryRadius) {
      return { perceivable: false, distance: distPhys, salience: 0 };
    }

    // 4D temporal check: if target is in a different temporal slice, attenuate perception
    if (targetLatent) {
      const deltaW = Math.abs(selfLatent.temporalW - targetLatent.temporalW);
      if (deltaW * this.config.latentSensitivity > 14.0) {
        return { perceivable: false, distance: distPhys, salience: 0 };
      }
    }

    // Lateral line vibration detection ignores FOV
    if (distPhys <= this.config.auditoryRadius) {
      const salience = 1.0 - (distPhys / this.config.auditoryRadius);
      return { perceivable: true, distance: distPhys, salience: Math.max(0.2, salience) };
    }

    // Vision cone check
    const toTarget = targetPos.clone().sub(selfPos).normalize();
    const forward = selfForward.clone().normalize();
    const dot = forward.dot(toTarget);
    const halfFov = this.config.fieldOfViewRad * 0.5;
    const minDot = Math.cos(halfFov);

    if (dot < minDot) {
      return { perceivable: false, distance: distPhys, salience: 0 };
    }

    const salience = (1.0 - distPhys / effectiveRadius) * (0.5 + 0.5 * dot);
    return { perceivable: true, distance: distPhys, salience: Math.max(0.05, salience) };
  }

  /**
   * Samples local environmental gradients around agent position
   */
  public senseField(
    fieldProvider: ISpatialFieldProvider,
    pos: Vector3D,
    field: EnvironmentalFieldType
  ): { value: number; gradient: Vector3D } {
    const eps = 0.5;
    const center = fieldProvider.sample(pos.x, pos.y, pos.z, field);
    const dx = fieldProvider.sample(pos.x + eps, pos.y, pos.z, field) - fieldProvider.sample(pos.x - eps, pos.y, pos.z, field);
    const dy = fieldProvider.sample(pos.x, pos.y + eps, pos.z, field) - fieldProvider.sample(pos.x, pos.y - eps, pos.z, field);
    const dz = fieldProvider.sample(pos.x, pos.y, pos.z + eps, field) - fieldProvider.sample(pos.x, pos.y, pos.z - eps, field);

    const gradient = new Vector3D(dx / (2 * eps), dy / (2 * eps), dz / (2 * eps));
    return { value: center, gradient };
  }

  /**
   * Senses discrete acoustic events within the agent's auditory & lateral-line detection radius.
   * Incorporates species hearing acuity, habitat spectral damping, and distance attenuation.
   */
  public senseAcousticEvents(
    selfPos: Vector3D,
    recentEvents: AcousticEvent[],
    acousticField: AcousticField,
    sensoryTraits?: AcousticSensoryTraits
  ): PerceivedAcousticEvent[] {
    const acuity = sensoryTraits?.hearingAcuity ?? 1.0;
    const effectiveRadius = (this.config.auditoryRadius * 2.5) * acuity; // e.g. ~8.75 to 12.5 units
    const startleThreshold = sensoryTraits?.startleThreshold ?? 0.5;
    const attractionTendency = sensoryTraits?.foragingAcousticAttraction ?? 0.5;

    const perceived: PerceivedAcousticEvent[] = [];
    const localProp = acousticField.sampleAt(selfPos.x, selfPos.y, selfPos.z);

    for (const ev of recentEvents) {
      const evPos = new Vector3D(ev.location.x, ev.location.y, ev.location.z);
      const dist = selfPos.distanceTo(evPos);
      if (dist > effectiveRadius) continue;

      // Distance attenuation + habitat spectral damping & benthic/canopy occlusion
      const damping = 1.0 + (localProp.spectral_damping * 1.4) + (localProp.occlusion_factor * 2.2);
      const attenuation = 1.0 / (1.0 + 0.12 * dist * damping);
      const perceivedIntensity = Math.min(1.0, ev.intensity * acuity * attenuation);

      if (perceivedIntensity < 0.06) continue;

      // Startling events: mechanical substrate shocks, glass taps, sudden collisions, surface splashes
      const isMechanicalDisturbance =
        ev.source === 'substrate_disturbance' ||
        ev.source === 'organism_collision' ||
        ev.source === 'water_ripple' ||
        ev.source === 'glass_interaction';

      const isStartling =
        (isMechanicalDisturbance || ev.intensity >= 0.55) &&
        (perceivedIntensity >= startleThreshold * 0.75);

      // Attractive events: feeding clicks, surface pellet drops
      const isFeedingOrFood =
        ev.source === 'feeding_strike' ||
        (ev.source === 'water_ripple' && ev.location.y > 4.5);
      const isAttractive =
        isFeedingOrFood &&
        (attractionTendency >= 0.3) &&
        (perceivedIntensity >= 0.08);

      const salience = Math.min(1.0, perceivedIntensity * (isStartling ? 1.5 : isAttractive ? 1.3 : 0.85));

      perceived.push({
        id: ev.id,
        sourceType: ev.source,
        position: evPos,
        distance: dist,
        perceivedIntensity,
        salience,
        isStartling,
        isAttractive,
        description: ev.cause?.description || `${ev.source.replace(/_/g, ' ')} at (${evPos.x.toFixed(1)}, ${evPos.y.toFixed(1)})`,
      });
    }

    return perceived.sort((a, b) => b.salience - a.salience);
  }

  /**
   * Senses continuous acoustic field parameters & lateral-line flow vibration gradients.
   */
  public senseAcousticSensoryState(
    selfPos: Vector3D,
    acousticField: AcousticField,
    sensoryTraits?: AcousticSensoryTraits
  ): PerceivedAcousticSensoryState {
    const latLineSensitivity = sensoryTraits?.lateralLineSensitivity ?? 1.0;
    const local = acousticField.sampleAt(selfPos.x, selfPos.y, selfPos.z);
    const signature = acousticField.getSignature();

    const ambientSoundPressureDb = signature.estimated_loudness_db + (local.ambient_gain - 0.25) * 12.0;
    const flowVibrationLevel = Math.min(1.0, (signature.water_activity * 0.6 + signature.turbulence * 0.4) * latLineSensitivity);

    const eps = 1.0;
    const pX1 = acousticField.sampleAt(selfPos.x + eps, selfPos.y, selfPos.z).ambient_gain;
    const pX0 = acousticField.sampleAt(selfPos.x - eps, selfPos.y, selfPos.z).ambient_gain;
    const pY1 = acousticField.sampleAt(selfPos.x, selfPos.y + eps, selfPos.z).ambient_gain;
    const pY0 = acousticField.sampleAt(selfPos.x, selfPos.y - eps, selfPos.z).ambient_gain;
    const pZ1 = acousticField.sampleAt(selfPos.x, selfPos.y, selfPos.z + eps).ambient_gain;
    const pZ0 = acousticField.sampleAt(selfPos.x, selfPos.y, selfPos.z - eps).ambient_gain;

    const acousticGradient = new Vector3D(
      (pX1 - pX0) / (2 * eps),
      (pY1 - pY0) / (2 * eps),
      (pZ1 - pZ0) / (2 * eps)
    );

    let dominantCondition: 'calm' | 'flowing' | 'turbulent' | 'disturbed' = 'calm';
    if (signature.disturbance > 0.3) {
      dominantCondition = 'disturbed';
    } else if (signature.turbulence > 0.4) {
      dominantCondition = 'turbulent';
    } else if (signature.water_activity > 0.35) {
      dominantCondition = 'flowing';
    }

    return {
      ambientSoundPressureDb,
      flowVibrationLevel,
      acousticGradient,
      dominantCondition,
    };
  }
}

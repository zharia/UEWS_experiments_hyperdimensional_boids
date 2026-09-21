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
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MorphologicalSignature } from './MorphologicalSignature';

/**
 * Instantaneous Physical Posture Configuration (Task 005).
 *
 * Core Principle:
 *   Morphology ≠ Posture ≠ Behaviour ≠ Animation
 *
 * Posture represents the moment-to-moment physical deformation of the organism's body
 * under hydrodynamic forces, turning acceleration, propulsion tension, and environmental flow.
 */
export interface PostureState {
  /** Lateral body spine curvature [-1.0 (hard left), +1.0 (hard right)] */
  curvature: number;
  /** Axial compression / elongation: [-0.4 (stretched cruising), +0.5 (compressed thrust)] */
  compression: number;
  /** Torsional twist / roll banking: [-0.6, +0.6] */
  twist: number;
  /** Propulsion stroke tension / muscle rigidity: [0.0 (passive coasting), 1.0 (peak thrust)] */
  propulsionTension: number;
  /** Instantaneous turning intensity: [0.0, 1.0] */
  turnIntensity: number;
  /** Bank angle in radians */
  bankAngle: number;
  /** Wave phase accumulator for organic undulation */
  wavePhase: number;
}

export interface PostureInputs {
  speed: number;
  maxSpeed: number;
  accelerationMagnitude: number;
  turnCurvature: number; // Signed lateral curvature from (vx * az - vz * ax)
  verticalPitch: number; // Pitch angle derived from vy / speed
  isBursting?: boolean;
  flockCoherence?: number; // [0, 1] local school alignment
  environmentalFlowVelocity?: number; // fluid drift magnitude
  behaviourType?: string;
}

export class PostureManager {
  /**
   * Creates a relaxed default posture initialized with individual resting curvature.
   */
  public static createDefaultPosture(signature: MorphologicalSignature): PostureState {
    return {
      curvature: signature.curvatureTendency + signature.asymmetryBias * 0.5,
      compression: 0.0,
      twist: 0.0,
      propulsionTension: 0.25,
      turnIntensity: 0.0,
      bankAngle: 0.0,
      wavePhase: Math.random() * Math.PI * 2,
    };
  }

  /**
   * Computes the target posture demanded by current locomotion, behaviour, and flow.
   */
  public static computeTargetPosture(
    inputs: PostureInputs,
    signature: MorphologicalSignature
  ): PostureState {
    const flex = signature.flexibility;
    const normSpeed = Math.min(1.5, inputs.speed / Math.max(0.1, inputs.maxSpeed));

    // 1. Turning Curvature Target
    // Scaled by flexibility and individual resting curvature bias
    const rawCurvature = inputs.turnCurvature * 0.65 * flex;
    const targetCurvature = Math.max(
      -0.85,
      Math.min(0.85, rawCurvature + signature.curvatureTendency + signature.asymmetryBias * 0.4)
    );

    // 2. Axial Compression Target
    // Accelerating or bursting compresses the body into a spring-like thrust tension;
    // steady cruising stretches into a low-drag streamlined hydrodynamic profile.
    let targetCompression = 0.0;
    if (inputs.isBursting || inputs.accelerationMagnitude > 1.2) {
      targetCompression = Math.min(0.45, inputs.accelerationMagnitude * 0.12 * flex);
    } else if (normSpeed > 0.6) {
      // Elongation during steady cruise
      targetCompression = -Math.min(0.25, (normSpeed - 0.5) * 0.25);
    } else if (inputs.behaviourType === 'rest') {
      targetCompression = -0.15; // completely relaxed
    }

    // 3. Torsional Twist / Banking
    // Banking into turns plus 3D vertical steering
    const targetBankAngle = -inputs.turnCurvature * normSpeed * 0.45;
    const targetTwist = Math.max(-0.5, Math.min(0.5, targetBankAngle * 0.8 + inputs.verticalPitch * 0.25));

    // 4. Propulsion Tension
    let targetTension = 0.20;
    if (inputs.isBursting) {
      targetTension = 0.85;
    } else if (inputs.behaviourType === 'flee') {
      targetTension = 0.95;
    } else if (inputs.behaviourType === 'rest') {
      targetTension = 0.05;
    } else {
      targetTension = Math.max(0.15, Math.min(0.70, normSpeed * 0.55));
    }

    // 5. Turn Intensity
    const turnIntensity = Math.min(1.0, Math.abs(inputs.turnCurvature) * 1.4);

    return {
      curvature: targetCurvature,
      compression: targetCompression,
      twist: targetTwist,
      propulsionTension: targetTension,
      turnIntensity,
      bankAngle: targetBankAngle,
      wavePhase: 0, // preserved in update
    };
  }

  /**
   * Advances posture with multi-scalar temporal hysteresis.
   *
   * Form:
   *   P(t + dt) = P(t) + (1 - exp(-dt / tau)) * (P_target - P(t))
   *
   * Eliminates instantaneous snapping or visual jitter.
   */
  public static updatePostureHysteresis(
    current: PostureState,
    target: PostureState,
    dt: number,
    signature: MorphologicalSignature,
    speed: number = 1.0
  ): void {
    if (dt <= 0) return;

    // Multi-scalar relaxation time constants
    const tauTurn = 0.18 / Math.max(0.5, signature.flexibility);
    const tauCompression = 0.28;
    const tauTwist = 0.22;
    const tauTension = 0.25;

    const alphaTurn = 1.0 - Math.exp(-dt / tauTurn);
    const alphaComp = 1.0 - Math.exp(-dt / tauCompression);
    const alphaTwist = 1.0 - Math.exp(-dt / tauTwist);
    const alphaTension = 1.0 - Math.exp(-dt / tauTension);

    current.curvature += (target.curvature - current.curvature) * alphaTurn;
    current.compression += (target.compression - current.compression) * alphaComp;
    current.twist += (target.twist - current.twist) * alphaTwist;
    current.propulsionTension += (target.propulsionTension - current.propulsionTension) * alphaTension;
    current.turnIntensity += (target.turnIntensity - current.turnIntensity) * alphaTurn;
    current.bankAngle += (target.bankAngle - current.bankAngle) * alphaTurn;

    // Wave phase progression scaled by tension and movement speed
    const strokeFreq = (2.5 + current.propulsionTension * 3.5) * Math.max(0.6, speed * 0.4);
    current.wavePhase = (current.wavePhase + dt * strokeFreq) % (Math.PI * 2);
  }
}

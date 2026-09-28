/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Boid4D } from '../types';
import {
  MorphologicalSignature,
  generateMorphologicalSignature,
} from './MorphologicalSignature';
import { PostureState, PostureManager, PostureInputs } from './PostureState';

export interface BoidMorphologyTelemetry {
  id: string | number;
  signature: MorphologicalSignature;
  posture: PostureState;
  turningCurvature: number;
  accelerationMagnitude: number;
}

/**
 * Central Morphology & Posture Manager (Task 005 / Task 006).
 *
 * Maintains deterministic per-execution morphological signatures tied to organism
 * identities (rather than shifting array positions) and applies multi-scalar temporal
 * hysteresis to posture dynamics for the entire boid population.
 */
export class BoidMorphologyManager {
  private signatures: Map<string | number, MorphologicalSignature> = new Map();
  private postures: Map<string | number, PostureState> = new Map();
  private prevVelocities: Map<string | number, { vx: number; vy: number; vz: number }> = new Map();
  private indexToId: Map<number, string | number> = new Map();

  // Pre-allocated typed arrays for WebGL instanced buffer attributes
  public attrMorphology: Float32Array; // vec4: aspect, bodyDepth, taper, massDistribution
  public attrSignature: Float32Array;  // vec4: flexibility, posteriorExpression, surfaceComplexity, asymmetryBias
  public attrPosture: Float32Array;    // vec4: curvature, compression, twist, propulsionTension
  public attrWavePhase: Float32Array;  // float: wavePhase

  public maxCount: number;
  public seed: number;

  constructor(maxCount: number = 1000, seed: number = 5005) {
    this.maxCount = maxCount;
    this.seed = seed;

    this.attrMorphology = new Float32Array(maxCount * 4);
    this.attrSignature = new Float32Array(maxCount * 4);
    this.attrPosture = new Float32Array(maxCount * 4);
    this.attrWavePhase = new Float32Array(maxCount);
  }

  /**
   * Retrieves or lazily creates the stable morphological signature for an organism by its identity.
   */
  public getSignature(id: string | number, speciesIndex: number = 0): MorphologicalSignature {
    let sig = this.signatures.get(id);
    if (!sig) {
      sig = generateMorphologicalSignature(id, speciesIndex, this.seed);
      this.signatures.set(id, sig);
    }
    return sig;
  }

  /**
   * Retrieves or lazily initializes the posture state for an organism by its identity.
   */
  public getPosture(id: string | number, signature: MorphologicalSignature): PostureState {
    let posture = this.postures.get(id);
    if (!posture) {
      posture = PostureManager.createDefaultPosture(signature);
      this.postures.set(id, posture);
    }
    return posture;
  }

  /**
   * Main per-frame update loop.
   * Derives locomotion kinematics, target posture, applies temporal hysteresis,
   * and populates the instanced buffer arrays.
   */
  public update(
    boids: Boid4D[],
    dt: number,
    flowVector?: { x: number; y: number; z: number }
  ): void {
    const count = Math.min(boids.length, this.maxCount);
    const clampedDt = Math.max(0.001, Math.min(0.1, dt));

    for (let i = 0; i < count; i++) {
      const b = boids[i];
      // Use organism execution-local identity if defined, fallback to stable index
      const organismId = b.id !== undefined ? b.id : i;
      this.indexToId.set(i, organismId);
      const sig = this.getSignature(organismId, b.speciesIndex);
      const currentPosture = this.getPosture(organismId, sig);

      // Kinematic analysis from frame-to-frame velocity
      const prevVel = this.prevVelocities.get(organismId) || { vx: b.vx, vy: b.vy, vz: b.vz };
      const ax = (b.vx - prevVel.vx) / clampedDt;
      const ay = (b.vy - prevVel.vy) / clampedDt;
      const az = (b.vz - prevVel.vz) / clampedDt;
      this.prevVelocities.set(organismId, { vx: b.vx, vy: b.vy, vz: b.vz });

      const speedSq = Math.max(0.001, b.vx * b.vx + b.vy * b.vy + b.vz * b.vz);
      const speed = Math.sqrt(speedSq);
      const accelMag = Math.sqrt(ax * ax + ay * ay + az * az);

      // Lateral turn curvature in horizontal/yaw plane: (vx * az - vz * ax) / speed^2
      // Positive = right turn, Negative = left turn
      const rawTurnCurvature = (b.vx * az - b.vz * ax) / speedSq;
      const turnCurvature = Math.max(-1.5, Math.min(1.5, rawTurnCurvature));

      // Pitch angle (swimming upwards/downwards)
      const verticalPitch = Math.asin(Math.max(-1.0, Math.min(1.0, b.vy / speed)));

      // Environmental flow influence
      let flowInfluence = 0.0;
      if (flowVector) {
        flowInfluence = (flowVector.x * b.vx + flowVector.y * b.vy + flowVector.z * b.vz) / speed;
      }

      // Compute demanded target posture from locomotion forces
      const postureInputs: PostureInputs = {
        speed,
        maxSpeed: 4.5,
        accelerationMagnitude: accelMag,
        turnCurvature,
        verticalPitch,
        isBursting: b.isBursting,
        environmentalFlowVelocity: flowInfluence,
        behaviourType: b.behaviourType,
      };

      const targetPosture = PostureManager.computeTargetPosture(postureInputs, sig);

      // Advance posture with multi-scalar temporal hysteresis
      PostureManager.updatePostureHysteresis(currentPosture, targetPosture, clampedDt, sig, speed);

      // Pack into GPU instanced buffer arrays
      const i4 = i * 4;

      // vec4 aMorphology: aspect, bodyDepth, taper, massDistribution
      this.attrMorphology[i4 + 0] = sig.aspect;
      this.attrMorphology[i4 + 1] = sig.bodyDepth;
      this.attrMorphology[i4 + 2] = sig.taper;
      this.attrMorphology[i4 + 3] = sig.massDistribution;

      // vec4 aSignature: flexibility, posteriorExpression, surfaceComplexity, asymmetryBias
      this.attrSignature[i4 + 0] = sig.flexibility;
      this.attrSignature[i4 + 1] = sig.posteriorExpression;
      this.attrSignature[i4 + 2] = sig.surfaceComplexity;
      this.attrSignature[i4 + 3] = sig.asymmetryBias;

      // vec4 aPosture: curvature, compression, twist, propulsionTension
      this.attrPosture[i4 + 0] = currentPosture.curvature;
      this.attrPosture[i4 + 1] = currentPosture.compression;
      this.attrPosture[i4 + 2] = currentPosture.twist;
      this.attrPosture[i4 + 3] = currentPosture.propulsionTension;

      // float aWavePhase
      this.attrWavePhase[i] = currentPosture.wavePhase;
    }
  }

  /**
   * Retrieves telemetry for an inspected boid by organism ID or array index.
   */
  public getBoidTelemetry(idOrIndex: string | number): BoidMorphologyTelemetry | null {
    const key = typeof idOrIndex === 'number' && !this.signatures.has(idOrIndex) && this.indexToId.has(idOrIndex)
      ? this.indexToId.get(idOrIndex)!
      : idOrIndex;

    const sig = this.signatures.get(key);
    const posture = this.postures.get(key);
    if (!sig || !posture) return null;

    return {
      id: sig.id !== undefined ? sig.id : key,
      signature: { ...sig },
      posture: { ...posture },
      turningCurvature: posture.curvature,
      accelerationMagnitude: posture.propulsionTension,
    };
  }

  /**
   * Resets all cached postures (e.g. on simulation reset).
   */
  public reset(): void {
    this.signatures.clear();
    this.postures.clear();
    this.prevVelocities.clear();
  }
}

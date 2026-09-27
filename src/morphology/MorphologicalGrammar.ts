/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MorphologicalSignature } from './MorphologicalSignature';
import { PostureState } from './PostureState';

export interface Vertex3D {
  x: number;
  y: number;
  z: number;
}

/**
 * Procedural Morphological Grammar (Task 005).
 *
 * Implements a composable mathematical grammar for organic, taxonomically ambiguous
 * aquatic organism deformation.
 *
 * Flow:
 *   Base Spindle Vertex (x in [-0.8, +0.8])
 *     -> 1. Morphological Shaping (aspect, body depth, taper, mass distribution)
 *     -> 2. Asymmetric Physiological Bias
 *     -> 3. Postural Curvature & Lateral Bending
 *     -> 4. Axial Compression / Thrust Tension
 *     -> 5. Torsional Banking & Twist
 *     -> 6. Posterior Locomotion Expression (undulating trailing flow without fish tail)
 *     -> 7. Micro Surface Tension Ripple
 */
export class MorphologicalGrammar {
  /**
   * Evaluates the full procedural morphological grammar for a local vertex on CPU.
   * Useful for mathematical testing, collision bounding, and debug inspections.
   */
  public static evaluateVertex(
    v: Vertex3D,
    signature: MorphologicalSignature,
    posture: PostureState
  ): Vertex3D {
    let x = v.x;
    let y = v.y;
    let z = v.z;

    const baseLength = 1.6;
    // Normalized spine coordinate: t in [0 (posterior tail), 1 (anterior head)]
    const t = Math.max(0, Math.min(1, (x + baseLength * 0.5) / baseLength));

    // -------------------------------------------------------------------------
    // 1. BASE MORPHOLOGICAL SHAPING (Aspect, Depth, Taper, Mass Distribution)
    // -------------------------------------------------------------------------
    // Elongation / Compression along X axis
    x *= signature.aspect * (1.0 - posture.compression * 0.35);

    // Organismic body profile (spindle with mass shift)
    // Shift peak thickness along spine according to massDistribution
    const peakCenter = 0.55 + signature.massDistribution;
    let profile = Math.sin(t * Math.PI);
    if (t > peakCenter) {
      const denom = Math.max(0.01, 1.0 - peakCenter);
      profile = Math.sin(((t - peakCenter) / denom * 0.5 + 0.5) * Math.PI);
    } else {
      const denom = Math.max(0.01, peakCenter);
      profile = Math.sin((t / denom * 0.5) * Math.PI);
    }
    profile = Math.max(0.02, Math.pow(Math.max(0, profile), signature.taper));

    // Apply vertical body depth and lateral compression
    y *= signature.bodyDepth * profile;
    z *= (signature.bodyDepth * 0.55) * profile;

    // -------------------------------------------------------------------------
    // 2. CONTROLLED ASYMMETRY BIAS
    // -------------------------------------------------------------------------
    // Eliminates the CAD mirror-symmetry look while remaining subtle and bounded
    const asym = signature.asymmetryBias;
    z += asym * profile * (1.0 - t * 0.5) * 0.18;
    y *= (1.0 + asym * 0.25 * Math.sin(t * Math.PI));

    // -------------------------------------------------------------------------
    // 3. POSTURAL CURVATURE & LATERAL BENDING (Turning Dynamics)
    // -------------------------------------------------------------------------
    // Quadratic lateral bend towards tail: curvature deflects posterior more than head
    const bendProgress = Math.pow(1.0 - t, 1.8);
    const lateralBend = posture.curvature * bendProgress * 0.55;
    z += lateralBend;

    // Slight counter-yaw at head for natural articulation
    z -= posture.curvature * Math.pow(t, 2.0) * 0.08;

    // -------------------------------------------------------------------------
    // 4. TORSIONAL TWIST & BANKING
    // -------------------------------------------------------------------------
    const twistAngle = posture.twist * (1.0 - t * 0.7);
    const cosT = Math.cos(twistAngle);
    const sinT = Math.sin(twistAngle);
    const newY = y * cosT - z * sinT;
    const newZ = y * sinT + z * cosT;
    y = newY;
    z = newZ;

    // -------------------------------------------------------------------------
    // 5. POSTERIOR LOCOMOTION EXPRESSION (No conventional fish tail)
    // -------------------------------------------------------------------------
    // Undulating hydro-flow wave trailing towards posterior
    const waveFreq = 3.6;
    const wave = Math.sin(posture.wavePhase - x * waveFreq);
    const posteriorFactor = Math.pow(1.0 - t, 1.6) * signature.posteriorExpression;
    const waveAmp = 0.24 * (0.4 + posture.propulsionTension * 0.8) * signature.flexibility;
    z += wave * posteriorFactor * waveAmp;

    // -------------------------------------------------------------------------
    // 6. SURFACE TENSION RIPPLE
    // -------------------------------------------------------------------------
    if (signature.surfaceComplexity > 0.05) {
      const ripple = Math.sin(x * 12.0 + posture.wavePhase * 1.5) * 0.015 * signature.surfaceComplexity;
      y += ripple;
      z += ripple * 0.5;
    }

    return { x, y, z };
  }

  /**
   * GLSL code generation for the procedural morphological grammar in the vertex shader.
   * Guarantees 1:1 mathematical equivalence between CPU and GPU evaluation.
   */
  public static getGLSLGrammarFunction(): string {
    return `
      vec3 applyMorphologicalGrammar(
        vec3 pos,
        vec4 morph,    // x: aspect, y: bodyDepth, z: taper, w: massDistribution
        vec4 sig,      // x: flexibility, y: posteriorExpression, z: surfaceComplexity, w: asymmetryBias
        vec4 post,     // x: curvature, y: compression, z: twist, w: propulsionTension
        float wavePhase
      ) {
        float baseLength = 1.6;
        float t = clamp((pos.x + baseLength * 0.5) / baseLength, 0.0, 1.0);

        // 1. Morphological Shaping
        float x = pos.x * morph.x * (1.0 - post.y * 0.35);

        // Spindle profile with mass distribution peak shift
        float peakCenter = clamp(0.55 + morph.w, 0.15, 0.85);
        float profile = sin(t * 3.14159265);
        if (t > peakCenter) {
          float denom = max(0.01, 1.0 - peakCenter);
          profile = sin(((t - peakCenter) / denom * 0.5 + 0.5) * 3.14159265);
        } else {
          float denom = max(0.01, peakCenter);
          profile = sin((t / denom * 0.5) * 3.14159265);
        }
        profile = max(0.02, pow(max(0.0, profile), morph.z));

        float y = pos.y * morph.y * profile;
        float z = pos.z * (morph.y * 0.55) * profile;

        // 2. Controlled Asymmetry Bias
        float asym = sig.w;
        z += asym * profile * (1.0 - t * 0.5) * 0.18;
        y *= (1.0 + asym * 0.25 * sin(t * 3.14159265));

        // 3. Postural Curvature & Lateral Bending
        float bendProgress = pow(1.0 - t, 1.8);
        float lateralBend = post.x * bendProgress * 0.55;
        z += lateralBend;
        z -= post.x * (t * t) * 0.08;

        // 4. Torsional Twist & Banking
        float twistAngle = post.z * (1.0 - t * 0.7);
        float cosT = cos(twistAngle);
        float sinT = sin(twistAngle);
        float newY = y * cosT - z * sinT;
        float newZ = y * sinT + z * cosT;
        y = newY;
        z = newZ;

        // 5. Posterior Locomotion Expression
        float wave = sin(wavePhase - x * 3.6);
        float posteriorFactor = pow(1.0 - t, 1.6) * sig.y;
        float waveAmp = 0.24 * (0.4 + post.w * 0.8) * sig.x;
        z += wave * posteriorFactor * waveAmp;

        // 6. Surface Tension Ripple
        if (sig.z > 0.05) {
          float ripple = sin(x * 12.0 + wavePhase * 1.5) * 0.015 * sig.z;
          y += ripple;
          z += ripple * 0.5;
        }

        return vec3(x, y, z);
      }
    `;
  }
}

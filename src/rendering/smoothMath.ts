/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Mathematical Smooth-Minimum (smin) and Smooth-Maximum (smax) Library.
 * Used for:
 * 1. Seamless organic branch collars and nodal junctions without harsh polygonal creasing.
 * 2. Flared holdfast-to-rock substrate attachment blending.
 * 3. Smooth union and intersection operations in procedural SDF geometry generation.
 * 4. Micro-texture distance blending, crevice ambient occlusion, and vascular tapering.
 */

// --- CPU TypeScript Implementations ---

/**
 * Polynomial Smooth Minimum (Inigo Quilez formulation).
 * Blends two scalar values or distance fields smoothly within radius k.
 * C1 continuous fillet transition.
 *
 * @param a First value / distance
 * @param b Second value / distance
 * @param k Smoothing radius / stiffness (> 0)
 * @returns Blended smooth minimum
 */
export function smin(a: number, b: number, k: number = 0.2): number {
  if (k <= 0.0001) return Math.min(a, b);
  const h = Math.max(0.0, Math.min(1.0, 0.5 + (0.5 * (b - a)) / k));
  return b * (1.0 - h) + a * h - k * h * (1.0 - h);
}

/**
 * Polynomial Smooth Maximum.
 * Smoothly blends the upper envelope of two shapes / radii.
 *
 * @param a First value / distance
 * @param b Second value / distance
 * @param k Smoothing radius (> 0)
 * @returns Blended smooth maximum
 */
export function smax(a: number, b: number, k: number = 0.2): number {
  return -smin(-a, -b, k);
}

/**
 * Normalized interpolation factor h in [0, 1] resulting from smin(a, b, k).
 * Useful for blending colors, textures, and normal orientations across the junction fillet.
 * When a << b, h -> 1 (dominated by a).
 * When b << a, h -> 0 (dominated by b).
 * At junction seam (a == b), h = 0.5.
 */
export function sminFactor(a: number, b: number, k: number = 0.2): number {
  if (k <= 0.0001) return a < b ? 1.0 : 0.0;
  return Math.max(0.0, Math.min(1.0, 0.5 + (0.5 * (b - a)) / k));
}

/**
 * Cubic Smooth Minimum (C2 continuous for ultra-smooth optical reflections).
 */
export function sminCubic(a: number, b: number, k: number = 0.2): number {
  if (k <= 0.0001) return Math.min(a, b);
  const h = Math.max(0.0, Math.min(1.0, 0.5 + (0.5 * (b - a)) / k));
  return b * (1.0 - h) + a * h - k * h * (1.0 - h) * (1.0 - 0.5 * Math.abs(a - b) / k);
}

/**
 * Calculates a flared branch collar radius where a child branch intersects a parent stem.
 * Preserves Leonardo da Vinci vascular cross-sectional area while creating an organic fillet.
 *
 * @param parentRadius Radius of parent stem at node
 * @param branchRadius Radius of child branch at base
 * @param distFromJunction Distance along child branch from intersection center
 * @param collarSpread Extent along branch where fillet operates
 * @param k Smoothing blend parameter
 */
export function calculateBranchCollarRadius(
  parentRadius: number,
  branchRadius: number,
  distFromJunction: number,
  collarSpread: number = 0.35,
  k: number = 0.15
): number {
  const normDist = Math.max(0.0, Math.min(1.0, distFromJunction / collarSpread));
  // Flare target radius at junction seam based on combined stem volume
  const flareTarget = Math.pow(Math.pow(parentRadius, 2.2) + Math.pow(branchRadius, 2.2), 1.0 / 2.2) * 0.85;
  // Blend from flared collar down to natural branch radius using smin
  const linearDecay = flareTarget * (1.0 - normDist) + branchRadius * normDist;
  return smax(branchRadius, linearDecay, k);
}

/**
 * GLSL shader chunk defining smooth-minimum, smooth-maximum, and junction blending routines.
 * Can be directly interpolated into plant vertex and fragment shaders.
 */
export const GLSL_SMOOTH_MATH = `
// Polynomial smooth minimum (k = smoothing radius)
float smin(float a, float b, float k) {
  if (k <= 0.0001) return min(a, b);
  float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
  return mix(b, a, h) - k * h * (1.0 - h);
}

// Polynomial smooth maximum
float smax(float a, float b, float k) {
  return -smin(-a, -b, k);
}

// Normalized blend factor h in [0.0, 1.0] from smin
float sminFactor(float a, float b, float k) {
  if (k <= 0.0001) return a < b ? 1.0 : 0.0;
  return clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
}

// 3D Distance to capsule/line segment for branch distance fields
float sdCapsule(vec3 p, vec3 a, vec3 b, float r) {
  vec3 pa = p - a, ba = b - a;
  float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  return length(pa - ba * h) - r;
}

// Smooth junction fillet distance field
float sdBranchJunction(vec3 p, vec3 stemA, vec3 stemB, float rStem, vec3 branchB, float rBranch, float k) {
  float dStem = sdCapsule(p, stemA, stemB, rStem);
  float dBranch = sdCapsule(p, stemA, branchB, rBranch);
  return smin(dStem, dBranch, k);
}
`;

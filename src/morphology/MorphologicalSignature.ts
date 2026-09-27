/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Morphological Identity & Procedural Signature Model (Task 005).
 *
 * Core Principle:
 *   Morphology ≠ Posture ≠ Behaviour ≠ Animation
 *
 * An individual boid possesses a stable morphological signature during execution.
 * Parameters are correlated rather than independently random, producing coherent
 * individual characters without resorting to anatomical fish simulation.
 */

export interface MorphologicalSignature {
  /** Unique boid identifier */
  id: string | number;
  /** Species index reference */
  speciesIndex: number;
  /** Elongation ratio (aspect): 0.75 = compact disc, 1.45 = elongated spindle */
  aspect: number;
  /** Body depth / dorso-ventral height multiplier: 0.65 = slender, 1.40 = deep-bodied */
  bodyDepth: number;
  /** Taper ratio: 0.60 = blunt anterior, 1.40 = sharp tapered anterior */
  taper: number;
  /** Mass distribution centroid offset along spine: [-0.25, +0.25] (- = posterior, + = anterior) */
  massDistribution: number;
  /** Intrinsic resting curvature bias: [-0.20, +0.20] */
  curvatureTendency: number;
  /** Bending & torsional compliance under locomotion forces: [0.60, 1.60] */
  flexibility: number;
  /** Posterior locomotion expression intensity: [0.50, 1.50] */
  posteriorExpression: number;
  /** Subtle surface undulation / longitudinal ridge complexity: [0.10, 0.70] */
  surfaceComplexity: number;
  /** Controlled stable lateral asymmetry bias: [-0.15, +0.15] */
  asymmetryBias: number;
  /** Translucency / material sheen tendency: [0.30, 0.85] */
  translucency: number;
}

/**
 * Deterministic PRNG float in [0, 1) derived from integer key and salt.
 */
function hashToFloat(n: number, salt: number = 0): number {
  let h = (n * 1610612741 + salt * 805306457) | 0;
  h = Math.imul(h ^ (h >>> 16), 0x45d9f3b);
  h = Math.imul(h ^ (h >>> 16), 0x45d9f3b);
  h = (h ^ (h >>> 16)) >>> 0;
  return h / 4294967296.0;
}

/**
 * Computes deterministic integer hash from string or number ID.
 */
export function hashBoidId(id: string | number): number {
  if (typeof id === 'number') {
    return Math.floor(id);
  }
  let hash = 5381;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) + hash) + id.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * Generates a correlated, bounded morphological signature for a boid.
 * Uses biological correlation rules:
 *   - Elongated individuals have higher flexibility and lower body depth.
 *   - Deep-bodied individuals have greater anterior mass and lower aspect.
 *   - Subtle, bounded asymmetry breaks mechanical procedural perfection.
 */
export function generateMorphologicalSignature(
  boidId: string | number,
  speciesIndex: number = 0,
  seed: number = 5001
): MorphologicalSignature {
  const hash = hashBoidId(boidId) ^ (seed * 1013);

  // Primary archetype axis: rAspect drives correlated physical tendencies
  const rAspect = hashToFloat(hash, 1);
  const rDepth = hashToFloat(hash, 2);
  const rTaper = hashToFloat(hash, 3);
  const rFlex = hashToFloat(hash, 4);
  const rCurve = hashToFloat(hash, 5);
  const rAsym = hashToFloat(hash, 6);
  const rSurf = hashToFloat(hash, 7);
  const rPost = hashToFloat(hash, 8);
  const rTrans = hashToFloat(hash, 9);

  // Correlated parameters:
  // Base aspect: 0.80 to 1.35
  const aspect = 0.80 + rAspect * 0.55;

  // Body depth is inversely correlated with aspect (elongated organisms are generally slenderer)
  const depthCorrelation = (1.20 - aspect * 0.40);
  const bodyDepth = Math.max(0.65, Math.min(1.40, depthCorrelation * (0.80 + rDepth * 0.55)));

  // Taper: sharper for streamlined organisms, softer for compact
  const taper = 0.70 + rTaper * 0.60;

  // Mass distribution: centered near anterior (+0.05) with bounded variance
  const massDistribution = (rDepth * 0.5 + (1.0 - rAspect) * 0.5 - 0.5) * 0.35;

  // Curvature tendency: subtle individual resting curve
  const curvatureTendency = (rCurve - 0.5) * 0.32;

  // Flexibility correlates positively with aspect (longer bodies flex more visibly)
  const flexibility = Math.max(0.60, Math.min(1.60, (0.65 + aspect * 0.45) * (0.85 + rFlex * 0.35)));

  // Posterior expression
  const posteriorExpression = 0.65 + rPost * 0.70;

  // Surface complexity
  const surfaceComplexity = 0.15 + rSurf * 0.45;

  // Controlled, bounded asymmetry bias [-0.12, +0.12]
  // Invariant: asymmetry != uncontrolled noise. It represents individual physiological bias.
  const asymmetryBias = (rAsym - 0.5) * 0.24;

  // Translucency
  const translucency = 0.35 + rTrans * 0.45;

  return {
    id: boidId,
    speciesIndex,
    aspect: parseFloat(aspect.toFixed(3)),
    bodyDepth: parseFloat(bodyDepth.toFixed(3)),
    taper: parseFloat(taper.toFixed(3)),
    massDistribution: parseFloat(massDistribution.toFixed(3)),
    curvatureTendency: parseFloat(curvatureTendency.toFixed(3)),
    flexibility: parseFloat(flexibility.toFixed(3)),
    posteriorExpression: parseFloat(posteriorExpression.toFixed(3)),
    surfaceComplexity: parseFloat(surfaceComplexity.toFixed(3)),
    asymmetryBias: parseFloat(asymmetryBias.toFixed(3)),
    translucency: parseFloat(translucency.toFixed(3)),
  };
}

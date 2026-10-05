/**
 * Task 001 (v0.0.3) — Feature Registry v2: Rich Procedural Environment Architecture
 * Environmental Descriptors: Morphology, Material, Spatial Hierarchy, and Environmental Suitability.
 */

import { FeatureDomain, FeatureKind, FeatureRelationshipType, MorphologyArchetype } from './taxonomy';
import { Vector3D, Vector4D } from './types';

export interface NumberRange {
  min: number;
  max: number;
  optimum?: number;
}

export interface MorphologyDescriptor {
  archetype: MorphologyArchetype;
  elongation?: number; // stretch along primary axis (1.0 = isotropic)
  flattening?: number; // compression along vertical axis (1.0 = normal)
  roughness?: number; // 0.0 (smooth polished) to 1.0 (highly jagged/fractured)
  asymmetry?: number; // 0.0 (symmetric) to 1.0 (highly skewed)
  orientation?: Vector3D;
  scaleVariance?: number;
  surfaceComplexity?: number; // fractal harmonic depth
}

export interface MaterialDescriptor {
  colorHex?: number;
  roughness?: number;
  metalness?: number;
  textureArchetype?: string;
  bumpScale?: number;
  porosity?: number; // for rocks and biological substrates
  translucency?: number;
}

export interface SpatialInfluence {
  radius: number;
  decay: 'linear' | 'gaussian' | 'step';
  falloffDistance?: number;
  affectsBoids?: boolean;
  shelterCapacity?: number;
}

export interface TemporalInfluence {
  frequency: number;
  amplitude: number;
  phase: number;
  temporalBehavior: 'static' | 'slow' | 'dynamic' | 'event';
}

export interface EnvironmentalPreferences {
  depth?: NumberRange;
  slope?: NumberRange;
  substrateAffinity?: Record<string, number>; // Substrate weight: e.g. { sand: 0.9, exposed_rock: 0.1 }
  light?: NumberRange;
  current?: NumberRange;
  temperature?: NumberRange;
  salinity?: NumberRange;
  nutrients?: NumberRange;
  exposure?: NumberRange;
}

export interface EnvironmentalConditions {
  depth: number;
  slope: number;
  substrate: string;
  light?: number;
  current?: number;
  nutrients?: number;
  exposure?: number;
}

export interface FeatureRelationship {
  sourceId: string;
  targetId: string;
  type: FeatureRelationshipType;
  strength?: number;
  metadata?: Record<string, unknown>;
}

export interface SpatialCluster {
  id: string;
  name: string;
  parentId: string; // Zone ID
  center: Vector3D;
  radius: number;
  featureIds: string[];
}

export interface SpatialZone {
  id: string;
  name: string;
  parentId: string; // Region ID
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number };
  clusterIds: string[];
  dominantSubstrate: string;
}

export interface SpatialRegion {
  id: string;
  name: string;
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number };
  zoneIds: string[];
  depthRange: [number, number];
  theme: string;
}

export interface FeatureEvaluationContext {
  conditions?: EnvironmentalConditions;
  currentW: number;
  deltaTime?: number;
}

/**
 * Evaluates environmental suitability [0.0, 1.0] given local conditions and preferences.
 */
export function evaluateSuitability(
  conditions: EnvironmentalConditions,
  preferences?: EnvironmentalPreferences
): number {
  if (!preferences) return 1.0;

  let totalScore = 0.0;
  let weights = 0.0;

  // Depth suitability
  if (preferences.depth) {
    weights += 1.0;
    const { min, max, optimum } = preferences.depth;
    if (conditions.depth < min || conditions.depth > max) {
      return 0.0; // Hard cutoff outside tolerable range
    }
    if (optimum !== undefined) {
      const span = conditions.depth < optimum ? optimum - min : max - optimum;
      const dist = Math.abs(conditions.depth - optimum);
      const score = Math.max(0.0, 1.0 - dist / Math.max(0.001, span));
      totalScore += score;
    } else {
      totalScore += 1.0;
    }
  }

  // Slope suitability
  if (preferences.slope) {
    weights += 1.0;
    const { min, max } = preferences.slope;
    if (conditions.slope < min || conditions.slope > max) {
      return 0.0;
    }
    totalScore += 1.0;
  }

  // Substrate affinity
  if (preferences.substrateAffinity) {
    weights += 1.2;
    const affinity = preferences.substrateAffinity[conditions.substrate] ?? 0.0;
    totalScore += affinity * 1.2;
  }

  // Current tolerance
  if (preferences.current && conditions.current !== undefined) {
    weights += 0.8;
    const { min, max } = preferences.current;
    if (conditions.current >= min && conditions.current <= max) {
      totalScore += 0.8;
    }
  }

  // Light tolerance
  if (preferences.light && conditions.light !== undefined) {
    weights += 0.8;
    const { min, max } = preferences.light;
    if (conditions.light >= min && conditions.light <= max) {
      totalScore += 0.8;
    }
  }

  return weights > 0 ? Math.min(1.0, Math.max(0.0, totalScore / weights)) : 1.0;
}

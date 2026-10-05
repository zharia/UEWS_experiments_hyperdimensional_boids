/**
 * Task 001 (v0.0.3) — Feature Registry v2: Rich Procedural Environment Architecture
 * FeatureGenerator: Generator interfaces and execution context for procedural environment generation.
 */

import { ILandscapeFeature } from '../LandscapeFeature';
import { EnvironmentalConditions } from '../environmentalTypes';
import { SurfaceResolution } from '../types';

export interface GenerationContext {
  seed: number;
  w?: number;
  sampleSurface?: (x: number, z: number, w?: number) => SurfaceResolution;
  sampleConditions?: (x: number, z: number) => EnvironmentalConditions;
  existingFeatureIds?: Set<string>;
  bounds?: { minX: number; maxX: number; minZ: number; maxZ: number };
}

export interface FeatureGenerator<T extends ILandscapeFeature = ILandscapeFeature> {
  readonly id: string;
  readonly name: string;
  generate(context: GenerationContext): T[];
}

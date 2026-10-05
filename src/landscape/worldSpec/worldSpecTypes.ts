/**
 * Task 001 (v0.0.3) — Feature Registry v2: Rich Procedural Environment Architecture
 * WorldSpecification: Versioned schema definitions for structured environment specifications.
 */

import { FeatureDomain, FeatureKind, FeatureRelationshipType, MorphologyArchetype } from '../taxonomy';
import {
  EnvironmentalPreferences,
  MaterialDescriptor,
  MorphologyDescriptor,
  NumberRange,
  SpatialInfluence,
  TemporalInfluence,
} from '../environmentalTypes';
import { Vector3D, Vector4D } from '../types';

export interface FeatureSpecification {
  id: string;
  name: string;
  domain: FeatureDomain;
  kind: FeatureKind;
  position4D: Vector4D;
  scale4D: Vector4D;
  wRange: [number, number];
  baseEmbedding?: number;
  morphology?: MorphologyDescriptor;
  material?: MaterialDescriptor;
  spatialInfluence?: SpatialInfluence;
  temporalInfluence?: TemporalInfluence;
  environmentalPreferences?: EnvironmentalPreferences;
  relationships?: Array<{
    targetId: string;
    type: FeatureRelationshipType;
    strength?: number;
  }>;
  parentId?: string;
  speciesType?: string;
}

export interface PopulationSpecification {
  id: string;
  name: string;
  domain: FeatureDomain;
  kind: FeatureKind;
  archetypes: MorphologyArchetype[];
  count: number;
  spatialBounds: { minX: number; maxX: number; minZ: number; maxZ: number };
  sizeDistribution: { minScale: Vector3D; maxScale: Vector3D };
  morphologyDistribution?: {
    roughness?: NumberRange;
    elongation?: NumberRange;
    flattening?: NumberRange;
    asymmetry?: NumberRange;
  };
  seed: number;
  wRange: [number, number];
  clusterCount?: number;
  clusterRadius?: number;
  parentId?: string;
  baseEmbedding?: number;
  environmentalPreferences?: EnvironmentalPreferences;
}

export interface ZoneSpecification {
  id: string;
  name: string;
  parentId: string; // Region ID
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number };
  dominantSubstrate: string;
}

export interface RegionSpecification {
  id: string;
  name: string;
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number };
  depthRange: [number, number];
  theme: string;
  zones?: ZoneSpecification[];
}

export interface WorldSpecification {
  schemaVersion: '2.0.0';
  seed: number;
  metadata: {
    name: string;
    description: string;
    author?: string;
    created?: string;
  };
  regions: RegionSpecification[];
  populations?: PopulationSpecification[];
  customFeatures?: FeatureSpecification[];
}

export interface ValidationIssue {
  path: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface WorldValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  issues: ValidationIssue[];
}

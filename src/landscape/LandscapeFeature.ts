/**
 * Task 007A / Task 001 (v0.0.3) — Feature Registry v2: Rich Procedural Environment Architecture
 * LandscapeFeature: Authoritative 4D landscape feature models, categories, domains,
 * kinds, morphology descriptors, relationships, and projection evaluations.
 */

import { SeededRandom } from '../core/random/SeededRandom';
import {
  FeatureDomain,
  FeatureKind,
  mapToLegacyCategory,
  MorphologyArchetype,
} from './taxonomy';
import {
  EnvironmentalConditions,
  EnvironmentalPreferences,
  evaluateSuitability,
  FeatureEvaluationContext,
  FeatureRelationship,
  MaterialDescriptor,
  MorphologyDescriptor,
  SpatialInfluence,
  TemporalInfluence,
} from './environmentalTypes';
import {
  LandscapeFeatureCategory,
  LandscapeFeatureState,
  SurfaceResolution,
  TopologyRelation,
  Vector3D,
  Vector4D,
} from './types';

export interface ILandscapeFeature {
  readonly id: string;
  readonly name: string;
  readonly domain: FeatureDomain;
  readonly kind: FeatureKind;
  readonly category: LandscapeFeatureCategory; // backward compat
  readonly position4D: Vector4D;
  readonly scale4D: Vector4D;
  readonly wRange: [number, number];
  readonly topologyRelations: TopologyRelation[];
  readonly baseEmbedding: number;

  readonly morphology?: MorphologyDescriptor;
  readonly material?: MaterialDescriptor;
  readonly spatialInfluence?: SpatialInfluence;
  readonly temporalInfluence?: TemporalInfluence;
  readonly environmentalPreferences?: EnvironmentalPreferences;
  readonly relationships?: FeatureRelationship[];
  readonly parentId?: string;

  evaluate(
    w: number,
    surface: SurfaceResolution,
    context?: FeatureEvaluationContext
  ): LandscapeFeatureState;
}

/**
 * 4D Rock Feature: Represents geological rock outcrops and boulders
 * participating in the evolving 4D world M^4.
 */
export class Rock4DFeature implements ILandscapeFeature {
  public readonly id: string;
  public readonly name: string;
  public readonly domain: FeatureDomain = 'structure';
  public readonly kind: FeatureKind;
  public readonly category: LandscapeFeatureCategory = 'rock';
  public readonly position4D: Vector4D;
  public readonly scale4D: Vector4D;
  public readonly wRange: [number, number];
  public readonly topologyRelations: TopologyRelation[];
  public readonly baseEmbedding: number;

  public readonly morphology?: MorphologyDescriptor;
  public readonly material?: MaterialDescriptor;
  public readonly spatialInfluence?: SpatialInfluence;
  public readonly temporalInfluence?: TemporalInfluence;
  public readonly environmentalPreferences?: EnvironmentalPreferences;
  public readonly relationships?: FeatureRelationship[];
  public readonly parentId?: string;

  private random: SeededRandom;
  private baseRotation: Vector3D;
  private rotationDriftSpeed: number;

  constructor(config: {
    id: string;
    name: string;
    seed: number;
    position4D: Vector4D;
    scale4D: Vector4D;
    wRange: [number, number];
    kind?: FeatureKind;
    topologyRelations?: TopologyRelation[];
    baseEmbedding?: number;
    morphology?: MorphologyDescriptor;
    material?: MaterialDescriptor;
    spatialInfluence?: SpatialInfluence;
    temporalInfluence?: TemporalInfluence;
    environmentalPreferences?: EnvironmentalPreferences;
    relationships?: FeatureRelationship[];
    parentId?: string;
  }) {
    this.id = config.id;
    this.name = config.name;
    this.kind = config.kind ?? 'rock';
    this.position4D = { ...config.position4D };
    this.scale4D = { ...config.scale4D };
    this.wRange = [...config.wRange];
    this.baseEmbedding = config.baseEmbedding ?? 0.22;
    this.topologyRelations = config.topologyRelations ?? [
      { targetId: 'TERRAIN', relation: 'supported_by' },
    ];

    this.morphology = config.morphology;
    this.material = config.material;
    this.spatialInfluence = config.spatialInfluence;
    this.temporalInfluence = config.temporalInfluence;
    this.environmentalPreferences = config.environmentalPreferences;
    this.relationships = config.relationships;
    this.parentId = config.parentId;

    this.random = new SeededRandom(config.seed);
    this.baseRotation = {
      x: this.random.next() * Math.PI,
      y: this.random.next() * Math.PI * 2,
      z: (this.random.next() - 0.5) * 0.4,
    };
    this.rotationDriftSpeed = (this.random.next() - 0.5) * 0.08;
  }

  public evaluate(
    w: number,
    surface: SurfaceResolution,
    context?: FeatureEvaluationContext
  ): LandscapeFeatureState {
    const [wMin, wMax] = this.wRange;
    const wSpan = Math.max(0.001, wMax - wMin);

    // Check if current 4D slice intersects feature's temporal support
    const inRange = w >= wMin && w <= wMax;
    const sliceProgress = inRange ? (w - wMin) / wSpan : w < wMin ? 0 : 1;

    // Emergence & Submersion smooth window function: smoothstep at boundaries
    let visibilityFactor = 0;
    if (inRange) {
      const edge = 0.18;
      if (sliceProgress < edge) {
        visibilityFactor = Math.sin((sliceProgress / edge) * (Math.PI * 0.5));
      } else if (sliceProgress > 1.0 - edge) {
        visibilityFactor = Math.sin(((1.0 - sliceProgress) / edge) * (Math.PI * 0.5));
      } else {
        visibilityFactor = 1.0;
      }
    }

    const visible = inRange && visibilityFactor > 0.001;

    // Full 3D spatial flow deformation applied to feature coordinates: (x, z) -> (x', z')
    const posX = this.position4D.x + surface.flowDelta.x;
    const posZ = this.position4D.z + surface.flowDelta.z;

    // Height is authoritative: rock base sits on live terrain surface minus embedding depth
    const baseScaleY = this.scale4D.y * Math.max(0.001, visibilityFactor);

    // Curvature influences local scale & micro-settling
    const curvatureScaleFactor =
      1.0 + Math.max(-0.25, Math.min(0.25, surface.curvature * 1.5));

    // Morphology factors
    const elongation = this.morphology?.elongation ?? 1.0;
    const flattening = this.morphology?.flattening ?? 1.0;

    // 4D breathing and modal expansion as w traverses
    const breath4D =
      1.0 + Math.sin(w * 0.1 + this.position4D.x * 0.15 + this.position4D.z * 0.2) * 0.08;

    // Dynamic 4D scale evolution
    const scaleX =
      this.scale4D.x * elongation * visibilityFactor * curvatureScaleFactor * breath4D;
    const scaleY = baseScaleY * flattening * curvatureScaleFactor * breath4D;
    const scaleZ =
      this.scale4D.z *
      visibilityFactor *
      (1.0 / Math.max(0.5, curvatureScaleFactor * 0.5 + 0.5)) *
      breath4D;

    const posY =
      surface.elevation + scaleY * 0.5 - this.baseEmbedding * visibilityFactor;

    // Subtle 4D rotational precession
    const rotX = this.baseRotation.x + Math.sin(w * 0.05) * 0.06;
    const rotY = this.baseRotation.y + w * this.rotationDriftSpeed;
    const rotZ = this.baseRotation.z + Math.cos(w * 0.04) * 0.05;

    // Environmental suitability
    let suitability = 1.0;
    if (context?.conditions && this.environmentalPreferences) {
      suitability = evaluateSuitability(context.conditions, this.environmentalPreferences);
    }

    return {
      id: this.id,
      name: this.name,
      domain: this.domain,
      kind: this.kind,
      category: this.category,
      position4D: { ...this.position4D },
      scale4D: { ...this.scale4D },
      wRange: [wMin, wMax],
      visible,
      projectedPosition: { x: posX, y: posY, z: posZ },
      projectedScale: {
        x: Math.max(0.0001, scaleX),
        y: Math.max(0.0001, scaleY),
        z: Math.max(0.0001, scaleZ),
      },
      projectedRotation: { x: rotX, y: rotY, z: rotZ },
      curvature: surface.curvature,
      deformation: { ...surface.flowDelta },
      topologyRelations: [...this.topologyRelations],
      relationships: this.relationships ? [...this.relationships] : undefined,
      morphology: this.morphology ? { ...this.morphology } : undefined,
      material: this.material ? { ...this.material } : undefined,
      parentId: this.parentId,
      environmentalSuitability: suitability,
      sliceProgress,
      surfaceElevation: surface.elevation,
      embeddingDepth: this.baseEmbedding * visibilityFactor,
    };
  }
}

/**
 * 4D Reef Structural Formation Feature: Represents prominent reef holdfasts,
 * mounds, walls, pillars, and arches.
 */
export class ReefStructure4DFeature implements ILandscapeFeature {
  public readonly id: string;
  public readonly name: string;
  public readonly domain: FeatureDomain = 'structure';
  public readonly kind: FeatureKind;
  public readonly category: LandscapeFeatureCategory = 'reef_structure';
  public readonly position4D: Vector4D;
  public readonly scale4D: Vector4D;
  public readonly wRange: [number, number];
  public readonly topologyRelations: TopologyRelation[];
  public readonly baseEmbedding: number;

  public readonly morphology?: MorphologyDescriptor;
  public readonly material?: MaterialDescriptor;
  public readonly spatialInfluence?: SpatialInfluence;
  public readonly temporalInfluence?: TemporalInfluence;
  public readonly environmentalPreferences?: EnvironmentalPreferences;
  public readonly relationships?: FeatureRelationship[];
  public readonly parentId?: string;

  constructor(config: {
    id: string;
    name: string;
    position4D: Vector4D;
    scale4D: Vector4D;
    wRange: [number, number];
    kind?: FeatureKind;
    topologyRelations?: TopologyRelation[];
    baseEmbedding?: number;
    morphology?: MorphologyDescriptor;
    material?: MaterialDescriptor;
    spatialInfluence?: SpatialInfluence;
    temporalInfluence?: TemporalInfluence;
    environmentalPreferences?: EnvironmentalPreferences;
    relationships?: FeatureRelationship[];
    parentId?: string;
  }) {
    this.id = config.id;
    this.name = config.name;
    this.kind = config.kind ?? 'reef_mound';
    this.position4D = { ...config.position4D };
    this.scale4D = { ...config.scale4D };
    this.wRange = [...config.wRange];
    this.baseEmbedding = config.baseEmbedding ?? 0.35;
    this.topologyRelations = config.topologyRelations ?? [
      { targetId: 'TERRAIN', relation: 'supported_by' },
      { targetId: 'STRUCTURE_001', relation: 'attached_to' },
    ];

    this.morphology = config.morphology;
    this.material = config.material;
    this.spatialInfluence = config.spatialInfluence;
    this.temporalInfluence = config.temporalInfluence;
    this.environmentalPreferences = config.environmentalPreferences;
    this.relationships = config.relationships;
    this.parentId = config.parentId;
  }

  public evaluate(
    w: number,
    surface: SurfaceResolution,
    context?: FeatureEvaluationContext
  ): LandscapeFeatureState {
    const [wMin, wMax] = this.wRange;
    const wSpan = Math.max(0.001, wMax - wMin);
    const inRange = w >= wMin && w <= wMax;
    const sliceProgress = inRange ? (w - wMin) / wSpan : w < wMin ? 0 : 1;

    let visibilityFactor = 0;
    if (inRange) {
      const edge = 0.15;
      if (sliceProgress < edge) {
        const t = sliceProgress / edge;
        visibilityFactor = t * t * (3.0 - 2.0 * t);
      } else if (sliceProgress > 1.0 - edge) {
        const t = (1.0 - sliceProgress) / edge;
        visibilityFactor = t * t * (3.0 - 2.0 * t);
      } else {
        visibilityFactor = 1.0;
      }
    }

    const visible = inRange && visibilityFactor > 0.001;

    const posX = this.position4D.x + surface.flowDelta.x;
    const posZ = this.position4D.z + surface.flowDelta.z;

    const breath = 1.0 + Math.sin(w * 0.08) * 0.06;
    const elongation = this.morphology?.elongation ?? 1.0;
    const flattening = this.morphology?.flattening ?? 1.0;

    const scaleX = this.scale4D.x * elongation * visibilityFactor * breath;
    const scaleY = this.scale4D.y * flattening * visibilityFactor * breath;
    const scaleZ = this.scale4D.z * visibilityFactor * breath;

    const posY = surface.elevation - this.baseEmbedding * visibilityFactor + scaleY * 0.45;

    return {
      id: this.id,
      name: this.name,
      domain: this.domain,
      kind: this.kind,
      category: this.category,
      position4D: { ...this.position4D },
      scale4D: { ...this.scale4D },
      wRange: [wMin, wMax],
      visible,
      projectedPosition: { x: posX, y: posY, z: posZ },
      projectedScale: {
        x: Math.max(0.0001, scaleX),
        y: Math.max(0.0001, scaleY),
        z: Math.max(0.0001, scaleZ),
      },
      projectedRotation: { x: 0, y: Math.sin(w * 0.03) * 0.08, z: 0 },
      curvature: surface.curvature,
      deformation: { ...surface.flowDelta },
      topologyRelations: [...this.topologyRelations],
      relationships: this.relationships ? [...this.relationships] : undefined,
      morphology: this.morphology ? { ...this.morphology } : undefined,
      material: this.material ? { ...this.material } : undefined,
      parentId: this.parentId,
      sliceProgress,
      surfaceElevation: surface.elevation,
      embeddingDepth: this.baseEmbedding * visibilityFactor,
    };
  }
}

/**
 * 4D Flora Anchor Feature: Spatial support anchor for botanical plants,
 * kelp holdfasts, and sea anemones. Keeps biological organisms firmly anchored
 * to the evolving seabed so they are never engulfed or left hovering.
 */
export class FloraAnchor4DFeature implements ILandscapeFeature {
  public readonly id: string;
  public readonly name: string;
  public readonly domain: FeatureDomain = 'vegetation';
  public readonly kind: FeatureKind = 'flora_anchor';
  public readonly category: LandscapeFeatureCategory = 'flora_anchor';
  public readonly position4D: Vector4D;
  public readonly scale4D: Vector4D;
  public readonly wRange: [number, number];
  public readonly topologyRelations: TopologyRelation[];
  public readonly baseEmbedding: number;
  public readonly initialSurfaceY: number;

  public readonly morphology?: MorphologyDescriptor;
  public readonly material?: MaterialDescriptor;
  public readonly spatialInfluence?: SpatialInfluence;
  public readonly temporalInfluence?: TemporalInfluence;
  public readonly environmentalPreferences?: EnvironmentalPreferences;
  public readonly relationships?: FeatureRelationship[];
  public readonly parentId?: string;

  constructor(config: {
    id: string;
    name: string;
    position4D: Vector4D;
    wRange?: [number, number];
    topologyRelations?: TopologyRelation[];
    baseEmbedding?: number;
    initialSurfaceY?: number;
    morphology?: MorphologyDescriptor;
    material?: MaterialDescriptor;
    environmentalPreferences?: EnvironmentalPreferences;
    relationships?: FeatureRelationship[];
    parentId?: string;
  }) {
    this.id = config.id;
    this.name = config.name;
    this.position4D = { ...config.position4D };
    this.scale4D = { x: 1, y: 1, z: 1, w: 1 };
    this.wRange = config.wRange ?? [-1000, 1000];
    this.baseEmbedding = config.baseEmbedding ?? 0.05;
    this.initialSurfaceY = config.initialSurfaceY ?? config.position4D.y;
    this.topologyRelations = config.topologyRelations ?? [
      { targetId: 'TERRAIN', relation: 'rooted_on' },
    ];

    this.morphology = config.morphology;
    this.material = config.material;
    this.environmentalPreferences = config.environmentalPreferences;
    this.relationships = config.relationships;
    this.parentId = config.parentId;
  }

  public evaluate(
    w: number,
    surface: SurfaceResolution,
    context?: FeatureEvaluationContext
  ): LandscapeFeatureState {
    const inRange = w >= this.wRange[0] && w <= this.wRange[1];

    const currentSurfaceY = surface.elevation - this.baseEmbedding;
    const deltaY = currentSurfaceY - this.initialSurfaceY;

    const posX = this.position4D.x + surface.flowDelta.x;
    const posZ = this.position4D.z + surface.flowDelta.z;
    const posY = currentSurfaceY;

    const tiltX = -surface.normal.z * 0.45;
    const tiltZ = surface.normal.x * 0.45;

    return {
      id: this.id,
      name: this.name,
      domain: this.domain,
      kind: this.kind,
      category: this.category,
      position4D: { ...this.position4D },
      scale4D: { ...this.scale4D },
      wRange: [...this.wRange],
      visible: inRange,
      projectedPosition: { x: posX, y: posY, z: posZ },
      projectedScale: { x: 1, y: 1, z: 1 },
      projectedRotation: { x: tiltX, y: 0, z: tiltZ },
      curvature: surface.curvature,
      deformation: {
        x: surface.flowDelta.x,
        y: deltaY,
        z: surface.flowDelta.z,
      },
      topologyRelations: [...this.topologyRelations],
      relationships: this.relationships ? [...this.relationships] : undefined,
      morphology: this.morphology ? { ...this.morphology } : undefined,
      material: this.material ? { ...this.material } : undefined,
      parentId: this.parentId,
      sliceProgress: 1.0,
      surfaceElevation: surface.elevation,
      embeddingDepth: this.baseEmbedding,
    };
  }
}

/**
 * 4D Geological Formation Feature: Macro-formations such as sand ridges,
 * trenches, and plateaus participating in M^4.
 */
export class GeologicalFormation4DFeature implements ILandscapeFeature {
  public readonly id: string;
  public readonly name: string;
  public readonly domain: FeatureDomain = 'geology';
  public readonly kind: FeatureKind;
  public readonly category: LandscapeFeatureCategory = 'formation';
  public readonly position4D: Vector4D;
  public readonly scale4D: Vector4D;
  public readonly wRange: [number, number];
  public readonly topologyRelations: TopologyRelation[];
  public readonly baseEmbedding: number;
  public readonly peakHeight: number;
  public readonly radiusX: number;
  public readonly radiusZ: number;
  public readonly radiusW: number;

  public readonly morphology?: MorphologyDescriptor;
  public readonly material?: MaterialDescriptor;
  public readonly spatialInfluence?: SpatialInfluence;
  public readonly temporalInfluence?: TemporalInfluence;
  public readonly environmentalPreferences?: EnvironmentalPreferences;
  public readonly relationships?: FeatureRelationship[];
  public readonly parentId?: string;

  constructor(config: {
    id: string;
    name: string;
    position4D: Vector4D;
    scale4D: Vector4D;
    kind?: FeatureKind;
    wRange?: [number, number];
    topologyRelations?: TopologyRelation[];
    baseEmbedding?: number;
    peakHeight?: number;
    radiusX?: number;
    radiusZ?: number;
    radiusW?: number;
    morphology?: MorphologyDescriptor;
    material?: MaterialDescriptor;
    spatialInfluence?: SpatialInfluence;
    temporalInfluence?: TemporalInfluence;
    environmentalPreferences?: EnvironmentalPreferences;
    relationships?: FeatureRelationship[];
    parentId?: string;
  }) {
    this.id = config.id;
    this.name = config.name;
    this.kind = config.kind ?? 'formation';
    this.position4D = { ...config.position4D };
    this.scale4D = { ...config.scale4D };
    this.baseEmbedding = config.baseEmbedding ?? 0.0;
    this.radiusX = config.radiusX ?? config.scale4D.x;
    this.peakHeight = config.peakHeight ?? config.scale4D.y;
    this.radiusZ = config.radiusZ ?? config.scale4D.z;
    this.radiusW = config.radiusW ?? config.scale4D.w;

    this.wRange = config.wRange ?? [
      this.position4D.w - this.radiusW,
      this.position4D.w + this.radiusW,
    ];

    this.topologyRelations = config.topologyRelations ?? [
      { targetId: 'TERRAIN', relation: 'adjacent_to' },
    ];

    this.morphology = config.morphology;
    this.material = config.material;
    this.spatialInfluence = config.spatialInfluence;
    this.temporalInfluence = config.temporalInfluence;
    this.environmentalPreferences = config.environmentalPreferences;
    this.relationships = config.relationships;
    this.parentId = config.parentId;
  }

  private getDeltaW(w: number, cw: number): number {
    const PERIOD_W = 100.0;
    const rawDeltaW = w - cw;
    return ((((rawDeltaW + PERIOD_W * 0.5) % PERIOD_W) + PERIOD_W) % PERIOD_W) - PERIOD_W * 0.5;
  }

  public evaluate(
    w: number,
    surface: SurfaceResolution,
    context?: FeatureEvaluationContext
  ): LandscapeFeatureState {
    const deltaW = this.getDeltaW(w, this.position4D.w);
    const dw = deltaW / Math.max(0.001, this.radiusW);
    const inRange = Math.abs(dw) < 1.0;

    const s = inRange ? Math.max(0, 1.0 - dw * dw) : 0;
    const visible = inRange && s > 0.001;

    const surfaceInfluence = inRange ? this.peakHeight * Math.pow(s, 3) : 0;

    const curvatureInfluence = inRange
      ? -6.0 * (this.peakHeight / (this.radiusX * this.radiusX)) * Math.pow(s, 2)
      : 0;

    const rxAtSlice = inRange ? this.radiusX * Math.sqrt(s) : 0;
    const rzAtSlice = inRange ? this.radiusZ * Math.sqrt(s) : 0;
    const heightAtSlice = Math.abs(surfaceInfluence);

    const posX = this.position4D.x + surface.flowDelta.x;
    const posZ = this.position4D.z + surface.flowDelta.z;
    const posY = surface.elevation;

    const bounds = {
      minX: posX - Math.max(0.1, rxAtSlice),
      maxX: posX + Math.max(0.1, rxAtSlice),
      minY: posY - Math.abs(this.peakHeight) * 0.5,
      maxY: posY + Math.abs(this.peakHeight) * 1.5,
      minZ: posZ - Math.max(0.1, rzAtSlice),
      maxZ: posZ + Math.max(0.1, rzAtSlice),
    };

    const sliceProgress = inRange ? (dw + 1.0) * 0.5 : deltaW < 0 ? 0 : 1;

    return {
      id: this.id,
      name: this.name,
      domain: this.domain,
      kind: this.kind,
      category: this.category,
      position4D: { ...this.position4D },
      scale4D: { ...this.scale4D },
      wRange: [...this.wRange],
      visible,
      projectedPosition: { x: posX, y: posY, z: posZ },
      projectedScale: {
        x: Math.max(0.01, rxAtSlice),
        y: Math.max(0.001, heightAtSlice),
        z: Math.max(0.01, rzAtSlice),
      },
      projectedRotation: { x: 0, y: 0, z: 0 },
      curvature: surface.curvature + curvatureInfluence,
      deformation: { ...surface.flowDelta },
      topologyRelations: [...this.topologyRelations],
      relationships: this.relationships ? [...this.relationships] : undefined,
      morphology: this.morphology ? { ...this.morphology } : undefined,
      material: this.material ? { ...this.material } : undefined,
      parentId: this.parentId,
      sliceProgress,
      surfaceElevation: surface.elevation,
      embeddingDepth: this.baseEmbedding,
      bounds,
      surfaceInfluence,
      curvatureInfluence,
    };
  }
}

/**
 * 4D Biological Colony Feature: Represents benthic colonies such as coral colonies,
 * sponge clusters, kelp patches, or seagrass meadows.
 */
export class BiologicalColony4DFeature implements ILandscapeFeature {
  public readonly id: string;
  public readonly name: string;
  public readonly domain: FeatureDomain;
  public readonly kind: FeatureKind;
  public readonly category: LandscapeFeatureCategory;
  public readonly position4D: Vector4D;
  public readonly scale4D: Vector4D;
  public readonly wRange: [number, number];
  public readonly topologyRelations: TopologyRelation[];
  public readonly baseEmbedding: number;

  public readonly colonyDensity: number;
  public readonly speciesType: string;
  public readonly morphology?: MorphologyDescriptor;
  public readonly material?: MaterialDescriptor;
  public readonly spatialInfluence?: SpatialInfluence;
  public readonly temporalInfluence?: TemporalInfluence;
  public readonly environmentalPreferences?: EnvironmentalPreferences;
  public readonly relationships?: FeatureRelationship[];
  public readonly parentId?: string;

  constructor(config: {
    id: string;
    name: string;
    domain?: FeatureDomain;
    kind: FeatureKind;
    speciesType: string;
    position4D: Vector4D;
    scale4D: Vector4D;
    wRange?: [number, number];
    colonyDensity?: number;
    topologyRelations?: TopologyRelation[];
    baseEmbedding?: number;
    morphology?: MorphologyDescriptor;
    material?: MaterialDescriptor;
    spatialInfluence?: SpatialInfluence;
    temporalInfluence?: TemporalInfluence;
    environmentalPreferences?: EnvironmentalPreferences;
    relationships?: FeatureRelationship[];
    parentId?: string;
  }) {
    this.id = config.id;
    this.name = config.name;
    this.domain = config.domain ?? (config.kind.includes('colony') ? 'colony' : 'vegetation');
    this.kind = config.kind;
    this.category = mapToLegacyCategory(this.domain, this.kind);
    this.speciesType = config.speciesType;
    this.position4D = { ...config.position4D };
    this.scale4D = { ...config.scale4D };
    this.wRange = config.wRange ?? [-100, 100];
    this.colonyDensity = config.colonyDensity ?? 0.75;
    this.baseEmbedding = config.baseEmbedding ?? 0.1;
    this.topologyRelations = config.topologyRelations ?? [
      { targetId: 'TERRAIN', relation: 'rooted_on' },
    ];

    this.morphology = config.morphology;
    this.material = config.material;
    this.spatialInfluence = config.spatialInfluence;
    this.temporalInfluence = config.temporalInfluence;
    this.environmentalPreferences = config.environmentalPreferences;
    this.relationships = config.relationships;
    this.parentId = config.parentId;
  }

  public evaluate(
    w: number,
    surface: SurfaceResolution,
    context?: FeatureEvaluationContext
  ): LandscapeFeatureState {
    const inRange = w >= this.wRange[0] && w <= this.wRange[1];
    const wSpan = Math.max(0.001, this.wRange[1] - this.wRange[0]);
    const sliceProgress = inRange ? (w - this.wRange[0]) / wSpan : 0;

    const posX = this.position4D.x + surface.flowDelta.x;
    const posZ = this.position4D.z + surface.flowDelta.z;
    const posY = surface.elevation - this.baseEmbedding;

    let suitability = 1.0;
    if (context?.conditions && this.environmentalPreferences) {
      suitability = evaluateSuitability(context.conditions, this.environmentalPreferences);
    }

    const visible = inRange && suitability > 0.05;
    const growthFactor = visible ? suitability * this.colonyDensity : 0;

    return {
      id: this.id,
      name: this.name,
      domain: this.domain,
      kind: this.kind,
      category: this.category,
      position4D: { ...this.position4D },
      scale4D: { ...this.scale4D },
      wRange: [...this.wRange],
      visible,
      projectedPosition: { x: posX, y: posY, z: posZ },
      projectedScale: {
        x: this.scale4D.x * growthFactor,
        y: this.scale4D.y * growthFactor,
        z: this.scale4D.z * growthFactor,
      },
      projectedRotation: { x: 0, y: Math.sin(w * 0.05) * 0.1, z: 0 },
      curvature: surface.curvature,
      deformation: { ...surface.flowDelta },
      topologyRelations: [...this.topologyRelations],
      relationships: this.relationships ? [...this.relationships] : undefined,
      morphology: this.morphology ? { ...this.morphology } : undefined,
      material: this.material ? { ...this.material } : undefined,
      parentId: this.parentId,
      environmentalSuitability: suitability,
      sliceProgress,
      surfaceElevation: surface.elevation,
      embeddingDepth: this.baseEmbedding,
    };
  }
}

/**
 * 4D Habitat Region Feature: Represents non-mesh semantic ecological zones
 * (shelter zones, nurseries, feeding grounds, spawning grounds).
 */
export class HabitatRegion4DFeature implements ILandscapeFeature {
  public readonly id: string;
  public readonly name: string;
  public readonly domain: FeatureDomain = 'habitat';
  public readonly kind: FeatureKind;
  public readonly category: LandscapeFeatureCategory = 'terrain';
  public readonly position4D: Vector4D;
  public readonly scale4D: Vector4D;
  public readonly wRange: [number, number];
  public readonly topologyRelations: TopologyRelation[];
  public readonly baseEmbedding: number = 0;

  public readonly shelterCapacity: number;
  public readonly morphology?: MorphologyDescriptor;
  public readonly material?: MaterialDescriptor;
  public readonly spatialInfluence?: SpatialInfluence;
  public readonly temporalInfluence?: TemporalInfluence;
  public readonly environmentalPreferences?: EnvironmentalPreferences;
  public readonly relationships?: FeatureRelationship[];
  public readonly parentId?: string;

  constructor(config: {
    id: string;
    name: string;
    kind: FeatureKind;
    position4D: Vector4D;
    scale4D: Vector4D;
    shelterCapacity?: number;
    wRange?: [number, number];
    topologyRelations?: TopologyRelation[];
    spatialInfluence?: SpatialInfluence;
    relationships?: FeatureRelationship[];
    parentId?: string;
  }) {
    this.id = config.id;
    this.name = config.name;
    this.kind = config.kind;
    this.position4D = { ...config.position4D };
    this.scale4D = { ...config.scale4D };
    this.shelterCapacity = config.shelterCapacity ?? 10;
    this.wRange = config.wRange ?? [-1000, 1000];
    this.topologyRelations = config.topologyRelations ?? [];
    this.spatialInfluence = config.spatialInfluence ?? {
      radius: config.scale4D.x,
      decay: 'gaussian',
      affectsBoids: true,
      shelterCapacity: this.shelterCapacity,
    };
    this.relationships = config.relationships;
    this.parentId = config.parentId;
  }

  public evaluate(
    w: number,
    surface: SurfaceResolution,
    context?: FeatureEvaluationContext
  ): LandscapeFeatureState {
    const inRange = w >= this.wRange[0] && w <= this.wRange[1];
    const posX = this.position4D.x + surface.flowDelta.x;
    const posZ = this.position4D.z + surface.flowDelta.z;
    const posY = surface.elevation;

    return {
      id: this.id,
      name: this.name,
      domain: this.domain,
      kind: this.kind,
      category: this.category,
      position4D: { ...this.position4D },
      scale4D: { ...this.scale4D },
      wRange: [...this.wRange],
      visible: inRange, // Semantic presence in simulation
      projectedPosition: { x: posX, y: posY, z: posZ },
      projectedScale: { ...this.scale4D },
      projectedRotation: { x: 0, y: 0, z: 0 },
      curvature: surface.curvature,
      deformation: { ...surface.flowDelta },
      topologyRelations: [...this.topologyRelations],
      relationships: this.relationships ? [...this.relationships] : undefined,
      parentId: this.parentId,
      sliceProgress: 1.0,
      surfaceElevation: surface.elevation,
      embeddingDepth: 0,
      bounds: {
        minX: posX - this.scale4D.x,
        maxX: posX + this.scale4D.x,
        minY: posY - this.scale4D.y * 0.5,
        maxY: posY + this.scale4D.y * 1.5,
        minZ: posZ - this.scale4D.z,
        maxZ: posZ + this.scale4D.z,
      },
    };
  }
}

/**
 * 4D Dynamic Phenomenon Feature: Represents dynamic environmental currents,
 * upwellings, sediment plumes, bubble fields, and thermal vents.
 */
export class DynamicPhenomenon4DFeature implements ILandscapeFeature {
  public readonly id: string;
  public readonly name: string;
  public readonly domain: FeatureDomain = 'phenomenon';
  public readonly kind: FeatureKind;
  public readonly category: LandscapeFeatureCategory = 'terrain';
  public readonly position4D: Vector4D;
  public readonly scale4D: Vector4D;
  public readonly wRange: [number, number];
  public readonly topologyRelations: TopologyRelation[];
  public readonly baseEmbedding: number = 0;

  public readonly flowVelocity: Vector3D;
  public readonly intensity: number;
  public readonly spatialInfluence?: SpatialInfluence;
  public readonly temporalInfluence?: TemporalInfluence;
  public readonly relationships?: FeatureRelationship[];
  public readonly parentId?: string;

  constructor(config: {
    id: string;
    name: string;
    kind: FeatureKind;
    position4D: Vector4D;
    scale4D: Vector4D;
    flowVelocity?: Vector3D;
    intensity?: number;
    wRange?: [number, number];
    topologyRelations?: TopologyRelation[];
    spatialInfluence?: SpatialInfluence;
    temporalInfluence?: TemporalInfluence;
    relationships?: FeatureRelationship[];
    parentId?: string;
  }) {
    this.id = config.id;
    this.name = config.name;
    this.kind = config.kind;
    this.position4D = { ...config.position4D };
    this.scale4D = { ...config.scale4D };
    this.flowVelocity = config.flowVelocity ?? { x: 0.1, y: 0.05, z: 0.0 };
    this.intensity = config.intensity ?? 0.8;
    this.wRange = config.wRange ?? [-1000, 1000];
    this.topologyRelations = config.topologyRelations ?? [];
    this.spatialInfluence = config.spatialInfluence;
    this.temporalInfluence = config.temporalInfluence;
    this.relationships = config.relationships;
    this.parentId = config.parentId;
  }

  public evaluate(
    w: number,
    surface: SurfaceResolution,
    context?: FeatureEvaluationContext
  ): LandscapeFeatureState {
    const inRange = w >= this.wRange[0] && w <= this.wRange[1];

    // Modulate intensity with w-frequency if temporal influence is provided
    let dynamicIntensity = this.intensity;
    if (this.temporalInfluence) {
      const { frequency, amplitude, phase } = this.temporalInfluence;
      dynamicIntensity = Math.max(0.0, dynamicIntensity + Math.sin(w * frequency + phase) * amplitude);
    }

    const posX = this.position4D.x + surface.flowDelta.x;
    const posZ = this.position4D.z + surface.flowDelta.z;
    const posY = surface.elevation;

    return {
      id: this.id,
      name: this.name,
      domain: this.domain,
      kind: this.kind,
      category: this.category,
      position4D: { ...this.position4D },
      scale4D: { ...this.scale4D },
      wRange: [...this.wRange],
      visible: inRange && dynamicIntensity > 0.01,
      projectedPosition: { x: posX, y: posY, z: posZ },
      projectedScale: {
        x: this.scale4D.x * dynamicIntensity,
        y: this.scale4D.y * dynamicIntensity,
        z: this.scale4D.z * dynamicIntensity,
      },
      projectedRotation: { x: 0, y: 0, z: 0 },
      curvature: surface.curvature,
      deformation: {
        x: surface.flowDelta.x + this.flowVelocity.x * dynamicIntensity,
        y: surface.flowDelta.y + this.flowVelocity.y * dynamicIntensity,
        z: surface.flowDelta.z + this.flowVelocity.z * dynamicIntensity,
      },
      topologyRelations: [...this.topologyRelations],
      relationships: this.relationships ? [...this.relationships] : undefined,
      parentId: this.parentId,
      sliceProgress: 1.0,
      surfaceElevation: surface.elevation,
      embeddingDepth: 0,
    };
  }
}

/**
 * General Parameterized Semantic Environment Feature: Flexible feature representation
 * capable of supporting any domain and kind in the taxonomy.
 */
export class SemanticEnvironmentFeature implements ILandscapeFeature {
  public readonly id: string;
  public readonly name: string;
  public readonly domain: FeatureDomain;
  public readonly kind: FeatureKind;
  public readonly category: LandscapeFeatureCategory;
  public readonly position4D: Vector4D;
  public readonly scale4D: Vector4D;
  public readonly wRange: [number, number];
  public readonly topologyRelations: TopologyRelation[];
  public readonly baseEmbedding: number;

  public readonly morphology?: MorphologyDescriptor;
  public readonly material?: MaterialDescriptor;
  public readonly spatialInfluence?: SpatialInfluence;
  public readonly temporalInfluence?: TemporalInfluence;
  public readonly environmentalPreferences?: EnvironmentalPreferences;
  public readonly relationships?: FeatureRelationship[];
  public readonly parentId?: string;

  constructor(config: {
    id: string;
    name: string;
    domain: FeatureDomain;
    kind: FeatureKind;
    position4D: Vector4D;
    scale4D: Vector4D;
    category?: LandscapeFeatureCategory;
    wRange?: [number, number];
    topologyRelations?: TopologyRelation[];
    baseEmbedding?: number;
    morphology?: MorphologyDescriptor;
    material?: MaterialDescriptor;
    spatialInfluence?: SpatialInfluence;
    temporalInfluence?: TemporalInfluence;
    environmentalPreferences?: EnvironmentalPreferences;
    relationships?: FeatureRelationship[];
    parentId?: string;
  }) {
    this.id = config.id;
    this.name = config.name;
    this.domain = config.domain;
    this.kind = config.kind;
    this.category = config.category ?? mapToLegacyCategory(config.domain, config.kind);
    this.position4D = { ...config.position4D };
    this.scale4D = { ...config.scale4D };
    this.wRange = config.wRange ?? [-1000, 1000];
    this.baseEmbedding = config.baseEmbedding ?? 0.1;
    this.topologyRelations = config.topologyRelations ?? [];

    this.morphology = config.morphology;
    this.material = config.material;
    this.spatialInfluence = config.spatialInfluence;
    this.temporalInfluence = config.temporalInfluence;
    this.environmentalPreferences = config.environmentalPreferences;
    this.relationships = config.relationships;
    this.parentId = config.parentId;
  }

  public evaluate(
    w: number,
    surface: SurfaceResolution,
    context?: FeatureEvaluationContext
  ): LandscapeFeatureState {
    const inRange = w >= this.wRange[0] && w <= this.wRange[1];
    const posX = this.position4D.x + surface.flowDelta.x;
    const posZ = this.position4D.z + surface.flowDelta.z;
    const posY = surface.elevation - this.baseEmbedding + this.scale4D.y * 0.5;

    let suitability = 1.0;
    if (context?.conditions && this.environmentalPreferences) {
      suitability = evaluateSuitability(context.conditions, this.environmentalPreferences);
    }

    return {
      id: this.id,
      name: this.name,
      domain: this.domain,
      kind: this.kind,
      category: this.category,
      position4D: { ...this.position4D },
      scale4D: { ...this.scale4D },
      wRange: [...this.wRange],
      visible: inRange && suitability > 0.05,
      projectedPosition: { x: posX, y: posY, z: posZ },
      projectedScale: { ...this.scale4D },
      projectedRotation: { x: 0, y: 0, z: 0 },
      curvature: surface.curvature,
      deformation: { ...surface.flowDelta },
      topologyRelations: [...this.topologyRelations],
      relationships: this.relationships ? [...this.relationships] : undefined,
      morphology: this.morphology ? { ...this.morphology } : undefined,
      material: this.material ? { ...this.material } : undefined,
      parentId: this.parentId,
      environmentalSuitability: suitability,
      sliceProgress: 1.0,
      surfaceElevation: surface.elevation,
      embeddingDepth: this.baseEmbedding,
    };
  }
}

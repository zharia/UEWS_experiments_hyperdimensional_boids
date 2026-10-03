/**
 * Task 007A — 4D Landscape Feature Integration
 * LandscapeFeature: Authoritative 4D landscape feature models, categories,
 * relationships, and projection evaluations.
 */

import { SeededRandom } from '../core/random/SeededRandom';
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
  readonly category: LandscapeFeatureCategory;
  readonly position4D: Vector4D;
  readonly scale4D: Vector4D;
  readonly wRange: [number, number];
  readonly topologyRelations: TopologyRelation[];
  readonly baseEmbedding: number;

  evaluate(w: number, surface: SurfaceResolution): LandscapeFeatureState;
}

/**
 * 4D Rock Feature: Represents geological rock outcrops and boulders
 * participating in the evolving 4D world M^4.
 */
export class Rock4DFeature implements ILandscapeFeature {
  public readonly id: string;
  public readonly name: string;
  public readonly category: LandscapeFeatureCategory = 'rock';
  public readonly position4D: Vector4D;
  public readonly scale4D: Vector4D;
  public readonly wRange: [number, number];
  public readonly topologyRelations: TopologyRelation[];
  public readonly baseEmbedding: number;

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
    topologyRelations?: TopologyRelation[];
    baseEmbedding?: number;
  }) {
    this.id = config.id;
    this.name = config.name;
    this.position4D = { ...config.position4D };
    this.scale4D = { ...config.scale4D };
    this.wRange = [...config.wRange];
    this.baseEmbedding = config.baseEmbedding ?? 0.22;
    this.topologyRelations = config.topologyRelations ?? [
      { targetId: 'TERRAIN', relation: 'supported_by' },
    ];

    this.random = new SeededRandom(config.seed);
    this.baseRotation = {
      x: this.random.next() * Math.PI,
      y: this.random.next() * Math.PI * 2,
      z: (this.random.next() - 0.5) * 0.4,
    };
    this.rotationDriftSpeed = (this.random.next() - 0.5) * 0.08;
  }

  public evaluate(w: number, surface: SurfaceResolution): LandscapeFeatureState {
    const [wMin, wMax] = this.wRange;
    const wSpan = Math.max(0.001, wMax - wMin);

    // Check if current 4D slice intersects feature's temporal support
    const inRange = w >= wMin && w <= wMax;
    const sliceProgress = inRange ? (w - wMin) / wSpan : w < wMin ? 0 : 1;

    // Emergence & Submersion smooth window function: smoothstep at boundaries
    // Transitions occur in the first and last 18% of the w-domain
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
    // As the rock emerges or submerges, its scale smoothly rises from the sediment
    const baseScaleY = this.scale4D.y * Math.max(0.001, visibilityFactor);

    // Curvature influences local scale & micro-settling
    const curvatureScaleFactor =
      1.0 + Math.max(-0.25, Math.min(0.25, surface.curvature * 1.5));

    // 4D breathing and modal expansion as w traverses
    const breath4D =
      1.0 + Math.sin(w * 0.1 + this.position4D.x * 0.15 + this.position4D.z * 0.2) * 0.08;

    // Dynamic 4D scale evolution
    const scaleX =
      this.scale4D.x * visibilityFactor * curvatureScaleFactor * breath4D;
    const scaleY = baseScaleY * curvatureScaleFactor * breath4D;
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

    return {
      id: this.id,
      name: this.name,
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
      sliceProgress,
      surfaceElevation: surface.elevation,
      embeddingDepth: this.baseEmbedding * visibilityFactor,
    };
  }
}

/**
 * 4D Reef Structural Formation Feature: Represents prominent reef holdfasts,
 * mounds, and large coral head substrates.
 */
export class ReefStructure4DFeature implements ILandscapeFeature {
  public readonly id: string;
  public readonly name: string;
  public readonly category: LandscapeFeatureCategory = 'reef_structure';
  public readonly position4D: Vector4D;
  public readonly scale4D: Vector4D;
  public readonly wRange: [number, number];
  public readonly topologyRelations: TopologyRelation[];
  public readonly baseEmbedding: number;

  constructor(config: {
    id: string;
    name: string;
    position4D: Vector4D;
    scale4D: Vector4D;
    wRange: [number, number];
    topologyRelations?: TopologyRelation[];
    baseEmbedding?: number;
  }) {
    this.id = config.id;
    this.name = config.name;
    this.position4D = { ...config.position4D };
    this.scale4D = { ...config.scale4D };
    this.wRange = [...config.wRange];
    this.baseEmbedding = config.baseEmbedding ?? 0.35;
    this.topologyRelations = config.topologyRelations ?? [
      { targetId: 'TERRAIN', relation: 'supported_by' },
      { targetId: 'STRUCTURE_001', relation: 'attached_to' },
    ];
  }

  public evaluate(w: number, surface: SurfaceResolution): LandscapeFeatureState {
    const [wMin, wMax] = this.wRange;
    const inRange = w >= wMin && w <= wMax;
    const sliceProgress = inRange
      ? (w - wMin) / Math.max(0.001, wMax - wMin)
      : 0;

    const posX = this.position4D.x + surface.flowDelta.x;
    const posZ = this.position4D.z + surface.flowDelta.z;
    const posY = surface.elevation - this.baseEmbedding + this.scale4D.y * 0.45;

    // Bounded breathing expansion with 4D traversal
    const breath = 1.0 + Math.sin(w * 0.08) * 0.06;

    return {
      id: this.id,
      name: this.name,
      category: this.category,
      position4D: { ...this.position4D },
      scale4D: { ...this.scale4D },
      wRange: [wMin, wMax],
      visible: inRange,
      projectedPosition: { x: posX, y: posY, z: posZ },
      projectedScale: {
        x: this.scale4D.x * breath,
        y: this.scale4D.y * breath,
        z: this.scale4D.z * breath,
      },
      projectedRotation: { x: 0, y: Math.sin(w * 0.03) * 0.08, z: 0 },
      curvature: surface.curvature,
      deformation: { ...surface.flowDelta },
      topologyRelations: [...this.topologyRelations],
      sliceProgress,
      surfaceElevation: surface.elevation,
      embeddingDepth: this.baseEmbedding,
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
  public readonly category: LandscapeFeatureCategory = 'flora_anchor';
  public readonly position4D: Vector4D;
  public readonly scale4D: Vector4D;
  public readonly wRange: [number, number];
  public readonly topologyRelations: TopologyRelation[];
  public readonly baseEmbedding: number;
  public readonly initialSurfaceY: number;

  constructor(config: {
    id: string;
    name: string;
    position4D: Vector4D;
    wRange?: [number, number];
    topologyRelations?: TopologyRelation[];
    baseEmbedding?: number;
    initialSurfaceY?: number;
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
  }

  public evaluate(w: number, surface: SurfaceResolution): LandscapeFeatureState {
    const inRange = w >= this.wRange[0] && w <= this.wRange[1];

    // Compute live offset relative to plant's initial static origin
    const currentSurfaceY = surface.elevation - this.baseEmbedding;
    const deltaY = currentSurfaceY - this.initialSurfaceY;

    // Apply horizontal conformal flow displacement
    const posX = this.position4D.x + surface.flowDelta.x;
    const posZ = this.position4D.z + surface.flowDelta.z;
    const posY = currentSurfaceY;

    // Alignment with terrain surface normal
    const tiltX = -surface.normal.z * 0.45;
    const tiltZ = surface.normal.x * 0.45;

    return {
      id: this.id,
      name: this.name,
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
  public readonly category: LandscapeFeatureCategory = 'formation';
  public readonly position4D: Vector4D;
  public readonly scale4D: Vector4D;
  public readonly wRange: [number, number];
  public readonly topologyRelations: TopologyRelation[];
  public readonly baseEmbedding: number;

  constructor(config: {
    id: string;
    name: string;
    position4D: Vector4D;
    scale4D: Vector4D;
    wRange: [number, number];
    topologyRelations?: TopologyRelation[];
    baseEmbedding?: number;
  }) {
    this.id = config.id;
    this.name = config.name;
    this.position4D = { ...config.position4D };
    this.scale4D = { ...config.scale4D };
    this.wRange = [...config.wRange];
    this.baseEmbedding = config.baseEmbedding ?? 0.0;
    this.topologyRelations = config.topologyRelations ?? [
      { targetId: 'TERRAIN', relation: 'adjacent_to' },
    ];
  }

  public evaluate(w: number, surface: SurfaceResolution): LandscapeFeatureState {
    const [wMin, wMax] = this.wRange;
    const inRange = w >= wMin && w <= wMax;
    const sliceProgress = inRange
      ? (w - wMin) / Math.max(0.001, wMax - wMin)
      : 0;

    const posX = this.position4D.x + surface.flowDelta.x;
    const posZ = this.position4D.z + surface.flowDelta.z;
    const posY = surface.elevation;

    return {
      id: this.id,
      name: this.name,
      category: this.category,
      position4D: { ...this.position4D },
      scale4D: { ...this.scale4D },
      wRange: [wMin, wMax],
      visible: inRange,
      projectedPosition: { x: posX, y: posY, z: posZ },
      projectedScale: { ...this.scale4D },
      projectedRotation: { x: 0, y: 0, z: 0 },
      curvature: surface.curvature,
      deformation: { ...surface.flowDelta },
      topologyRelations: [...this.topologyRelations],
      sliceProgress,
      surfaceElevation: surface.elevation,
      embeddingDepth: this.baseEmbedding,
    };
  }
}

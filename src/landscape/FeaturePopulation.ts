/**
 * Task 001 (v0.0.3) — Feature Registry v2: Rich Procedural Environment Architecture
 * FeaturePopulation: Parameterized deterministic populations producing varied feature instances.
 */

import { SeededRandom } from '../core/random/SeededRandom';
import { FeatureDomain, FeatureKind, MorphologyArchetype } from './taxonomy';
import {
  EnvironmentalConditions,
  EnvironmentalPreferences,
  evaluateSuitability,
  MorphologyDescriptor,
  NumberRange,
} from './environmentalTypes';
import { Vector3D, Vector4D } from './types';

export interface FeaturePopulationConfig {
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
  environmentalPreferences?: EnvironmentalPreferences;
  parentId?: string;
  baseEmbedding?: number;
}

export interface GeneratedInstanceConfig {
  id: string;
  name: string;
  domain: FeatureDomain;
  kind: FeatureKind;
  position4D: Vector4D;
  scale4D: Vector4D;
  wRange: [number, number];
  morphology: MorphologyDescriptor;
  baseEmbedding: number;
  parentId?: string;
  environmentalPreferences?: EnvironmentalPreferences;
  seed: number;
}

export class FeaturePopulation {
  public readonly config: FeaturePopulationConfig;
  private random: SeededRandom;

  constructor(config: FeaturePopulationConfig) {
    this.config = { ...config };
    this.random = new SeededRandom(config.seed);
  }

  /**
   * Generates deterministic instance configurations from population parameters.
   */
  public generateInstances(
    sampleConditions?: (x: number, z: number) => EnvironmentalConditions
  ): GeneratedInstanceConfig[] {
    const instances: GeneratedInstanceConfig[] = [];
    const count = Math.max(0, Math.floor(this.config.count));
    if (count === 0) return instances;

    // Reset PRNG to ensure reproducible output
    this.random.reset(this.config.seed);

    // Determine cluster centers if clustering is enabled
    const clusterCount = Math.max(1, this.config.clusterCount ?? 1);
    const clusterCenters: Array<{ x: number; z: number }> = [];

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    const { minX, maxX, minZ, maxZ } = this.config.spatialBounds;
    for (let c = 0; c < clusterCount; c++) {
      clusterCenters.push({
        x: lerp(minX, maxX, this.random.nextFloat(0.2, 0.8)),
        z: lerp(minZ, maxZ, this.random.nextFloat(0.2, 0.8)),
      });
    }

    const clusterRadius = this.config.clusterRadius ?? Math.min(maxX - minX, maxZ - minZ) * 0.35;
    let attempts = 0;
    const maxAttempts = count * 4;

    while (instances.length < count && attempts < maxAttempts) {
      attempts++;

      // Pick cluster center
      const clusterIdx = this.random.nextInt(0, clusterCenters.length - 1);
      const center = clusterCenters[clusterIdx];

      // Offset within cluster using gaussian-like sampling (sum of two uniforms)
      const u1 = (this.random.next() + this.random.next() - 1.0) * clusterRadius;
      const u2 = (this.random.next() + this.random.next() - 1.0) * clusterRadius;

      const posX = Math.max(minX, Math.min(maxX, center.x + u1));
      const posZ = Math.max(minZ, Math.min(maxZ, center.z + u2));

      // Environmental suitability check
      if (sampleConditions && this.config.environmentalPreferences) {
        const cond = sampleConditions(posX, posZ);
        const suitability = evaluateSuitability(cond, this.config.environmentalPreferences);
        if (this.random.next() > suitability) {
          continue; // Discard point in unfavorable environment
        }
      }

      // Pick archetype
      const archetypes = this.config.archetypes;
      const archetype = archetypes.length > 0
        ? archetypes[this.random.nextInt(0, archetypes.length - 1)]
        : 'rounded';

      // Scale sampling
      const minS = this.config.sizeDistribution.minScale;
      const maxS = this.config.sizeDistribution.maxScale;
      const scaleX = this.random.nextFloat(minS.x, maxS.x);
      const scaleY = this.random.nextFloat(minS.y, maxS.y);
      const scaleZ = this.random.nextFloat(minS.z, maxS.z);

      // Morphology
      const morphDist = this.config.morphologyDistribution;
      const morphology: MorphologyDescriptor = {
        archetype,
        elongation: morphDist?.elongation
          ? this.random.nextFloat(morphDist.elongation.min, morphDist.elongation.max)
          : 1.0,
        flattening: morphDist?.flattening
          ? this.random.nextFloat(morphDist.flattening.min, morphDist.flattening.max)
          : 1.0,
        roughness: morphDist?.roughness
          ? this.random.nextFloat(morphDist.roughness.min, morphDist.roughness.max)
          : 0.5,
        asymmetry: morphDist?.asymmetry
          ? this.random.nextFloat(morphDist.asymmetry.min, morphDist.asymmetry.max)
          : 0.2,
      };

      const index = instances.length + 1;
      const instanceId = `${this.config.id}_${String(index).padStart(3, '0')}`;
      const instanceSeed = this.config.seed + index * 31;

      instances.push({
        id: instanceId,
        name: `${this.config.name} #${index}`,
        domain: this.config.domain,
        kind: this.config.kind,
        position4D: {
          x: posX,
          y: -6.5, // Will be anchored to seabed on evaluation
          z: posZ,
          w: (this.config.wRange[0] + this.config.wRange[1]) * 0.5,
        },
        scale4D: {
          x: scaleX,
          y: scaleY,
          z: scaleZ,
          w: 1.0,
        },
        wRange: [...this.config.wRange],
        morphology,
        baseEmbedding: this.config.baseEmbedding ?? 0.2,
        parentId: this.config.parentId,
        environmentalPreferences: this.config.environmentalPreferences,
        seed: instanceSeed,
      });
    }

    return instances;
  }
}

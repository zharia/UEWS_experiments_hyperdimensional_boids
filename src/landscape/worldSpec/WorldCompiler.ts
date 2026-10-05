/**
 * Task 001 (v0.0.3) — Feature Registry v2: Rich Procedural Environment Architecture
 * WorldCompiler: Deterministic compiler transforming validated WorldSpecifications
 * into fully instantiated LandscapeFeatureRegistry environments.
 */

import { FeaturePopulation } from '../FeaturePopulation';
import {
  BiologicalColony4DFeature,
  GeologicalFormation4DFeature,
  HabitatRegion4DFeature,
  ILandscapeFeature,
  ReefStructure4DFeature,
  Rock4DFeature,
  SemanticEnvironmentFeature,
} from '../LandscapeFeature';
import { LandscapeFeatureRegistry } from '../LandscapeFeatureRegistry';
import { WorldSpecificationValidator } from './WorldSpecificationValidator';
import {
  FeatureSpecification,
  WorldSpecification,
  WorldValidationResult,
} from './worldSpecTypes';

export class WorldCompiler {
  /**
   * Compiles a WorldSpecification into a LandscapeFeatureRegistry.
   * If validation fails, throws a descriptive error.
   */
  public static compile(
    spec: WorldSpecification,
    targetRegistry?: LandscapeFeatureRegistry
  ): { registry: LandscapeFeatureRegistry; validation: WorldValidationResult } {
    const validation = WorldSpecificationValidator.validate(spec);
    if (!validation.isValid) {
      throw new Error(`Failed to compile WorldSpecification: \n${validation.errors.join('\n')}`);
    }

    const registry = targetRegistry ?? new LandscapeFeatureRegistry();
    registry.clear();

    // 1. Register Spatial Regions & Zones
    for (const reg of spec.regions) {
      registry.registerRegion({
        id: reg.id,
        name: reg.name,
        bounds: { ...reg.bounds },
        depthRange: [...reg.depthRange],
        theme: reg.theme,
        zoneIds: (reg.zones || []).map(z => z.id),
      });

      if (reg.zones) {
        for (const zone of reg.zones) {
          registry.registerZone({
            id: zone.id,
            name: zone.name,
            parentId: reg.id,
            bounds: { ...zone.bounds },
            dominantSubstrate: zone.dominantSubstrate,
            clusterIds: [],
          });
        }
      }
    }

    // 2. Expand and register Populations
    if (spec.populations) {
      for (const popSpec of spec.populations) {
        const population = new FeaturePopulation({
          id: popSpec.id,
          name: popSpec.name,
          domain: popSpec.domain,
          kind: popSpec.kind,
          archetypes: popSpec.archetypes,
          count: popSpec.count,
          spatialBounds: { ...popSpec.spatialBounds },
          sizeDistribution: {
            minScale: { ...popSpec.sizeDistribution.minScale },
            maxScale: { ...popSpec.sizeDistribution.maxScale },
          },
          morphologyDistribution: popSpec.morphologyDistribution
            ? { ...popSpec.morphologyDistribution }
            : undefined,
          seed: popSpec.seed || (spec.seed + 500),
          wRange: [...popSpec.wRange],
          clusterCount: popSpec.clusterCount,
          clusterRadius: popSpec.clusterRadius,
          parentId: popSpec.parentId,
          baseEmbedding: popSpec.baseEmbedding,
          environmentalPreferences: popSpec.environmentalPreferences,
        });

        const instances = population.generateInstances();
        for (const inst of instances) {
          const feature = this.instantiateFeature({
            id: inst.id,
            name: inst.name,
            domain: inst.domain,
            kind: inst.kind,
            position4D: inst.position4D,
            scale4D: inst.scale4D,
            wRange: inst.wRange,
            morphology: inst.morphology,
            baseEmbedding: inst.baseEmbedding,
            parentId: inst.parentId,
            environmentalPreferences: inst.environmentalPreferences,
          }, inst.seed);
          registry.register(feature);
        }
      }
    }

    // 3. Register Custom Features & Relationships
    if (spec.customFeatures) {
      for (const featSpec of spec.customFeatures) {
        const feature = this.instantiateFeature(featSpec, spec.seed);
        registry.register(feature);

        // Register declared relationships
        if (featSpec.relationships) {
          for (const rel of featSpec.relationships) {
            registry.relationshipGraph.addRelationship({
              sourceId: featSpec.id,
              targetId: rel.targetId,
              type: rel.type,
              strength: rel.strength ?? 1.0,
            });
          }
        }
      }
    }

    return { registry, validation };
  }

  /**
   * Instantiates an appropriate typed ILandscapeFeature from specification.
   */
  private static instantiateFeature(feat: FeatureSpecification, seed: number): ILandscapeFeature {
    if (feat.domain === 'geology' || feat.domain === 'geomorphology') {
      return new GeologicalFormation4DFeature({
        id: feat.id,
        name: feat.name,
        kind: feat.kind,
        position4D: feat.position4D,
        scale4D: feat.scale4D,
        wRange: feat.wRange,
        baseEmbedding: feat.baseEmbedding,
        morphology: feat.morphology,
        material: feat.material,
        spatialInfluence: feat.spatialInfluence,
        temporalInfluence: feat.temporalInfluence,
        environmentalPreferences: feat.environmentalPreferences,
        parentId: feat.parentId,
      });
    }

    if (feat.domain === 'structure') {
      if (feat.kind === 'reef' || feat.kind === 'reef_mound' || feat.kind === 'reef_wall') {
        return new ReefStructure4DFeature({
          id: feat.id,
          name: feat.name,
          kind: feat.kind,
          position4D: feat.position4D,
          scale4D: feat.scale4D,
          wRange: feat.wRange,
          baseEmbedding: feat.baseEmbedding,
          morphology: feat.morphology,
          material: feat.material,
          spatialInfluence: feat.spatialInfluence,
          temporalInfluence: feat.temporalInfluence,
          environmentalPreferences: feat.environmentalPreferences,
          parentId: feat.parentId,
        });
      }
      return new Rock4DFeature({
        id: feat.id,
        name: feat.name,
        seed: seed + 31,
        kind: feat.kind,
        position4D: feat.position4D,
        scale4D: feat.scale4D,
        wRange: feat.wRange,
        baseEmbedding: feat.baseEmbedding,
        morphology: feat.morphology,
        material: feat.material,
        spatialInfluence: feat.spatialInfluence,
        temporalInfluence: feat.temporalInfluence,
        environmentalPreferences: feat.environmentalPreferences,
        parentId: feat.parentId,
      });
    }

    if (feat.domain === 'colony') {
      return new BiologicalColony4DFeature({
        id: feat.id,
        name: feat.name,
        domain: feat.domain,
        kind: feat.kind,
        speciesType: feat.speciesType ?? 'Benthic Invertebrate',
        position4D: feat.position4D,
        scale4D: feat.scale4D,
        wRange: feat.wRange,
        baseEmbedding: feat.baseEmbedding,
        morphology: feat.morphology,
        material: feat.material,
        environmentalPreferences: feat.environmentalPreferences,
        parentId: feat.parentId,
      });
    }

    if (feat.domain === 'habitat' || feat.domain === 'ecological') {
      return new HabitatRegion4DFeature({
        id: feat.id,
        name: feat.name,
        kind: feat.kind,
        position4D: feat.position4D,
        scale4D: feat.scale4D,
        wRange: feat.wRange,
        spatialInfluence: feat.spatialInfluence,
        parentId: feat.parentId,
      });
    }

    // General fallback
    return new SemanticEnvironmentFeature({
      id: feat.id,
      name: feat.name,
      domain: feat.domain,
      kind: feat.kind,
      position4D: feat.position4D,
      scale4D: feat.scale4D,
      wRange: feat.wRange,
      baseEmbedding: feat.baseEmbedding,
      morphology: feat.morphology,
      material: feat.material,
      spatialInfluence: feat.spatialInfluence,
      temporalInfluence: feat.temporalInfluence,
      environmentalPreferences: feat.environmentalPreferences,
      parentId: feat.parentId,
    });
  }

  /**
   * Serializes a registry's current state into a JSON-compatible WorldSpecification.
   */
  public static serialize(
    registry: LandscapeFeatureRegistry,
    seed: number = 1337,
    name: string = 'Exported Aquarium Environment'
  ): WorldSpecification {
    const regions = registry.getRegions().map(r => ({
      id: r.id,
      name: r.name,
      bounds: { ...r.bounds },
      depthRange: [...r.depthRange] as [number, number],
      theme: r.theme,
      zones: registry.getZonesByRegion(r.id).map(z => ({
        id: z.id,
        name: z.name,
        parentId: z.parentId,
        bounds: { ...z.bounds },
        dominantSubstrate: z.dominantSubstrate,
      })),
    }));

    const customFeatures: FeatureSpecification[] = registry.list().map(f => {
      const rels = registry.relationshipGraph.getOutgoing(f.id).map(r => ({
        targetId: r.targetId,
        type: r.type,
        strength: r.strength,
      }));

      return {
        id: f.id,
        name: f.name,
        domain: f.domain,
        kind: f.kind,
        position4D: { ...f.position4D },
        scale4D: { ...f.scale4D },
        wRange: [...f.wRange] as [number, number],
        baseEmbedding: f.baseEmbedding,
        morphology: f.morphology ? { ...f.morphology } : undefined,
        material: f.material ? { ...f.material } : undefined,
        parentId: f.parentId,
        relationships: rels.length > 0 ? rels : undefined,
      };
    });

    return {
      schemaVersion: '2.0.0',
      seed,
      metadata: {
        name,
        description: `Exported at ${new Date().toISOString()}`,
      },
      regions,
      customFeatures,
    };
  }
}

/**
 * Task 001 (v0.0.3) — Feature Registry v2: Rich Procedural Environment Architecture
 * RockFieldGenerator: Generates varied rock populations, boulders, slabs, pillars,
 * and rubble fields with parameterized morphology descriptors.
 */

import { SeededRandom } from '../../core/random/SeededRandom';
import { FeaturePopulation } from '../FeaturePopulation';
import { ILandscapeFeature, Rock4DFeature, SemanticEnvironmentFeature } from '../LandscapeFeature';
import { FeatureGenerator, GenerationContext } from './FeatureGenerator';

export class RockFieldGenerator implements FeatureGenerator<ILandscapeFeature> {
  public readonly id = 'GENERATOR_ROCK_FIELD';
  public readonly name = 'Rock Population & Morphological Boulders Generator';

  public generate(context: GenerationContext): ILandscapeFeature[] {
    const seed = context.seed;
    const features: ILandscapeFeature[] = [];

    // =========================================================================
    // 1. PRESERVED LEGACY ROCKS (ROCK_001 to ROCK_005 for 007A / 007B compatibility)
    // =========================================================================

    // ROCK_001: Western shelf boulder (active, continuous settling and deformation)
    features.push(
      new Rock4DFeature({
        id: 'ROCK_001',
        name: 'Western Shelf Boulder',
        seed: seed + 101,
        kind: 'boulder',
        position4D: { x: -9.5, y: -5.8, z: -2.0, w: 30.0 },
        scale4D: { x: 1.8, y: 1.4, z: 1.6, w: 1.0 },
        wRange: [-20.0, 85.0],
        baseEmbedding: 0.25,
        morphology: {
          archetype: 'rounded',
          elongation: 1.1,
          flattening: 0.9,
          roughness: 0.35,
        },
        topologyRelations: [
          { targetId: 'TERRAIN', relation: 'supported_by' },
          { targetId: 'RIDGE_001', relation: 'adjacent_to' },
        ],
        relationships: [
          { sourceId: 'ROCK_001', targetId: 'FORMATION_WEST_SHELF', type: 'embedded-in' },
        ],
        parentId: 'ZONE_WEST_SHELF',
      })
    );

    // ROCK_002: Southwestern emerging outcrop
    features.push(
      new Rock4DFeature({
        id: 'ROCK_002',
        name: 'Southwestern Emerging Outcrop',
        seed: seed + 102,
        kind: 'outcrop',
        position4D: { x: -7.0, y: -6.0, z: 1.5, w: 37.5 },
        scale4D: { x: 1.4, y: 1.2, z: 1.3, w: 1.0 },
        wRange: [10.0, 65.0],
        baseEmbedding: 0.2,
        morphology: {
          archetype: 'angular',
          elongation: 1.3,
          flattening: 1.0,
          roughness: 0.65,
        },
        topologyRelations: [
          { targetId: 'TERRAIN', relation: 'supported_by' },
          { targetId: 'BASIN_001', relation: 'adjacent_to' },
        ],
        relationships: [
          { sourceId: 'ROCK_002', targetId: 'TERRAIN', type: 'supported-by' },
        ],
        parentId: 'ZONE_WEST_SHELF',
      })
    );

    // ROCK_003: Eastern shelf sentinel rock
    features.push(
      new Rock4DFeature({
        id: 'ROCK_003',
        name: 'Eastern Shelf Sentinel Rock',
        seed: seed + 103,
        kind: 'pillar',
        position4D: { x: 8.5, y: -5.7, z: -1.2, w: 20.0 },
        scale4D: { x: 1.5, y: 1.7, z: 1.4, w: 1.0 },
        wRange: [-10.0, 48.0],
        baseEmbedding: 0.28,
        morphology: {
          archetype: 'pillar',
          elongation: 0.9,
          flattening: 1.4,
          roughness: 0.5,
        },
        topologyRelations: [
          { targetId: 'TERRAIN', relation: 'supported_by' },
          { targetId: 'PLATEAU_001', relation: 'adjacent_to' },
        ],
        relationships: [
          { sourceId: 'ROCK_003', targetId: 'FORMATION_EAST_BANK', type: 'embedded-in' },
        ],
        parentId: 'ZONE_EAST_PLATEAU',
      })
    );

    // ROCK_004: Northeastern deep plateau rock
    features.push(
      new Rock4DFeature({
        id: 'ROCK_004',
        name: 'Northeastern Deep Plateau Rock',
        seed: seed + 104,
        kind: 'slab',
        position4D: { x: 5.5, y: -5.9, z: 2.2, w: 55.0 },
        scale4D: { x: 1.6, y: 1.3, z: 1.5, w: 1.0 },
        wRange: [-30.0, 95.0],
        baseEmbedding: 0.24,
        morphology: {
          archetype: 'slab',
          elongation: 1.6,
          flattening: 0.6,
          roughness: 0.45,
        },
        topologyRelations: [
          { targetId: 'TERRAIN', relation: 'supported_by' },
          { targetId: 'PLATEAU_001', relation: 'adjacent_to' },
        ],
        relationships: [
          { sourceId: 'ROCK_004', targetId: 'FORMATION_SEABED_PLATEAU', type: 'embedded-in' },
        ],
        parentId: 'ZONE_EAST_PLATEAU',
      })
    );

    // ROCK_005: Central benthic nexus rock
    features.push(
      new Rock4DFeature({
        id: 'ROCK_005',
        name: 'Central Benthic Nexus Rock',
        seed: seed + 105,
        kind: 'boulder',
        position4D: { x: -0.5, y: -6.2, z: -2.8, w: 0.0 },
        scale4D: { x: 2.2, y: 1.1, z: 1.5, w: 1.0 },
        wRange: [-100.0, 100.0],
        baseEmbedding: 0.32,
        morphology: {
          archetype: 'boulder',
          elongation: 1.4,
          flattening: 0.8,
          roughness: 0.4,
        },
        topologyRelations: [
          { targetId: 'TERRAIN', relation: 'supported_by' },
          { targetId: 'STRUCTURE_001', relation: 'adjacent_to' },
        ],
        relationships: [
          { sourceId: 'ROCK_005', targetId: 'STRUCTURE_001', type: 'adjacent_to' },
        ],
        parentId: 'ZONE_CENTRAL_REEF',
      })
    );

    // =========================================================================
    // 2. PROCEDURAL ROCK POPULATIONS (Section 9, 30)
    // =========================================================================

    // Population A: Western Angular Slabs
    const slabPopulation = new FeaturePopulation({
      id: 'POP_SLABS_WEST',
      name: 'Western Escarpment Slabs',
      domain: 'structure',
      kind: 'slab',
      archetypes: ['slab', 'angular'],
      count: 4,
      spatialBounds: { minX: -11.0, maxX: -4.0, minZ: -3.5, maxZ: 1.5 },
      sizeDistribution: {
        minScale: { x: 0.8, y: 0.4, z: 0.7 },
        maxScale: { x: 1.5, y: 0.8, z: 1.3 },
      },
      morphologyDistribution: {
        flattening: { min: 0.4, max: 0.7 },
        roughness: { min: 0.5, max: 0.8 },
      },
      seed: seed + 201,
      wRange: [-40, 80],
      clusterCount: 2,
      clusterRadius: 2.5,
      parentId: 'ZONE_WEST_SHELF',
      baseEmbedding: 0.18,
    });

    for (const inst of slabPopulation.generateInstances(context.sampleConditions)) {
      features.push(
        new Rock4DFeature({
          ...inst,
          topologyRelations: [{ targetId: 'TERRAIN', relation: 'supported_by' }],
          relationships: [
            { sourceId: inst.id, targetId: 'FORMATION_WEST_SHELF', type: 'embedded-in' },
          ],
        })
      );
    }

    // Population B: Eastern Rounded Boulder Cluster
    const boulderPopulation = new FeaturePopulation({
      id: 'POP_BOULDERS_EAST',
      name: 'Eastern Shelf Rounded Boulders',
      domain: 'structure',
      kind: 'boulder',
      archetypes: ['rounded', 'boulder'],
      count: 4,
      spatialBounds: { minX: 4.0, maxX: 11.0, minZ: -2.0, maxZ: 3.5 },
      sizeDistribution: {
        minScale: { x: 0.7, y: 0.6, z: 0.7 },
        maxScale: { x: 1.4, y: 1.2, z: 1.3 },
      },
      morphologyDistribution: {
        flattening: { min: 0.8, max: 1.1 },
        roughness: { min: 0.2, max: 0.45 },
      },
      seed: seed + 202,
      wRange: [-20, 90],
      clusterCount: 2,
      clusterRadius: 2.0,
      parentId: 'ZONE_EAST_PLATEAU',
      baseEmbedding: 0.2,
    });

    for (const inst of boulderPopulation.generateInstances(context.sampleConditions)) {
      features.push(
        new Rock4DFeature({
          ...inst,
          topologyRelations: [{ targetId: 'TERRAIN', relation: 'supported_by' }],
          relationships: [
            { sourceId: inst.id, targetId: 'FORMATION_EAST_BANK', type: 'embedded-in' },
          ],
        })
      );
    }

    // Population C: Southern Trench Rubble Field (Mesoscale feature)
    features.push(
      new SemanticEnvironmentFeature({
        id: 'RUBBLE_FIELD_SOUTH_01',
        name: 'Southern Trench Basal Rubble Field',
        domain: 'structure',
        kind: 'rubble_field',
        position4D: { x: 0.0, y: -6.9, z: -3.8, w: 50.0 },
        scale4D: { x: 3.5, y: 0.4, z: 2.0, w: 40.0 },
        wRange: [-100, 100],
        baseEmbedding: 0.12,
        morphology: {
          archetype: 'rubble',
          roughness: 0.9,
          surfaceComplexity: 0.8,
        },
        relationships: [
          { sourceId: 'RUBBLE_FIELD_SOUTH_01', targetId: 'FORMATION_CENTRAL_TRENCH', type: 'inside' },
        ],
        parentId: 'ZONE_TRENCH_DEPTHS',
      })
    );

    return features;
  }
}

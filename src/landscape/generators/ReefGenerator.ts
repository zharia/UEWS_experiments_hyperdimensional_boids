/**
 * Task 001 (v0.0.3) — Feature Registry v2: Rich Procedural Environment Architecture
 * ReefGenerator: Generates reef holdfast mounds, walls, pillars, arches, and caverns
 * with environmental shelter and attachment surface metadata.
 */

import { ILandscapeFeature, ReefStructure4DFeature, SemanticEnvironmentFeature } from '../LandscapeFeature';
import { FeatureGenerator, GenerationContext } from './FeatureGenerator';

export class ReefGenerator implements FeatureGenerator<ILandscapeFeature> {
  public readonly id = 'GENERATOR_REEF';
  public readonly name = 'Reef Structures & Structural Complexity Generator';

  public generate(context: GenerationContext): ILandscapeFeature[] {
    const features: ILandscapeFeature[] = [];

    // =========================================================================
    // 1. PRESERVED LEGACY REEF STRUCTURES (007A / 007B compatibility)
    // =========================================================================

    // STRUCTURE_001: Central reef holdfast mound
    features.push(
      new ReefStructure4DFeature({
        id: 'STRUCTURE_001',
        name: 'Central Reef Mound Holdfast',
        kind: 'reef_mound',
        position4D: { x: 0.0, y: -6.2, z: -1.0, w: 0.0 },
        scale4D: { x: 2.5, y: 1.2, z: 2.0, w: 1.0 },
        wRange: [-100.0, 100.0],
        baseEmbedding: 0.35,
        morphology: {
          archetype: 'mound',
          elongation: 1.2,
          flattening: 0.8,
          roughness: 0.5,
        },
        topologyRelations: [{ targetId: 'TERRAIN', relation: 'supported_by' }],
        relationships: [
          { sourceId: 'STRUCTURE_001', targetId: 'TERRAIN', type: 'supported-by' },
        ],
        parentId: 'ZONE_CENTRAL_REEF',
      })
    );

    // REEF_001: Western brain coral substrate base
    features.push(
      new ReefStructure4DFeature({
        id: 'REEF_001',
        name: 'Western Brain Coral Substrate',
        kind: 'reef_mound',
        position4D: { x: -6.5, y: -4.6, z: 0.5, w: 0.0 },
        scale4D: { x: 1.1, y: 0.9, z: 1.0, w: 1.0 },
        wRange: [-80.0, 100.0],
        baseEmbedding: 0.28,
        morphology: {
          archetype: 'mound',
          roughness: 0.6,
        },
        topologyRelations: [
          { targetId: 'TERRAIN', relation: 'supported_by' },
          { targetId: 'RIDGE_001', relation: 'adjacent_to' },
        ],
        relationships: [
          { sourceId: 'REEF_001', targetId: 'FORMATION_WEST_SHELF', type: 'embedded-in' },
        ],
        parentId: 'ZONE_WEST_SHELF',
      })
    );

    // REEF_002: Eastern brain coral substrate base
    features.push(
      new ReefStructure4DFeature({
        id: 'REEF_002',
        name: 'Eastern Brain Coral Substrate',
        kind: 'reef_mound',
        position4D: { x: 6.2, y: -4.8, z: -1.0, w: 0.0 },
        scale4D: { x: 0.9, y: 0.8, z: 0.85, w: 1.0 },
        wRange: [-80.0, 100.0],
        baseEmbedding: 0.26,
        morphology: {
          archetype: 'mound',
          roughness: 0.55,
        },
        topologyRelations: [
          { targetId: 'TERRAIN', relation: 'supported_by' },
          { targetId: 'PLATEAU_001', relation: 'adjacent_to' },
        ],
        relationships: [
          { sourceId: 'REEF_002', targetId: 'FORMATION_EAST_BANK', type: 'embedded-in' },
        ],
        parentId: 'ZONE_EAST_PLATEAU',
      })
    );

    // =========================================================================
    // 2. EXTENDED MORPHOLOGICAL REEF STRUCTURES (Section 17 & 30)
    // =========================================================================

    // Western Reef Wall
    features.push(
      new ReefStructure4DFeature({
        id: 'REEF_WALL_WEST_01',
        name: 'Western Outer Reef Wall',
        kind: 'reef_wall',
        position4D: { x: -8.0, y: -5.4, z: 1.2, w: 25.0 },
        scale4D: { x: 3.2, y: 1.6, z: 1.1, w: 60.0 },
        wRange: [-30.0, 85.0],
        baseEmbedding: 0.3,
        morphology: {
          archetype: 'wall',
          elongation: 2.5,
          flattening: 1.2,
          roughness: 0.75,
        },
        relationships: [
          { sourceId: 'REEF_WALL_WEST_01', targetId: 'FORMATION_WEST_SHELF', type: 'supported-by' },
        ],
        parentId: 'ZONE_WEST_SHELF',
      })
    );

    // Benthic Substrate Arch
    features.push(
      new SemanticEnvironmentFeature({
        id: 'ARCH_BENTHIC_01',
        name: 'Central Substrate Coral Arch',
        domain: 'structure',
        kind: 'arch',
        position4D: { x: 2.2, y: -6.0, z: -0.8, w: 15.0 },
        scale4D: { x: 1.8, y: 1.3, z: 1.2, w: 50.0 },
        wRange: [-40, 90],
        baseEmbedding: 0.25,
        morphology: {
          archetype: 'arch',
          roughness: 0.6,
          surfaceComplexity: 0.7,
        },
        spatialInfluence: {
          radius: 2.0,
          decay: 'gaussian',
          shelterCapacity: 6,
          affectsBoids: true,
        },
        relationships: [
          { sourceId: 'ARCH_BENTHIC_01', targetId: 'STRUCTURE_001', type: 'adjacent_to' },
        ],
        parentId: 'ZONE_CENTRAL_REEF',
      })
    );

    // Overhang / Cavern Shelter Feature
    features.push(
      new SemanticEnvironmentFeature({
        id: 'CAVERN_SHELTER_01',
        name: 'Deep Ridge Overhang Cavern',
        domain: 'structure',
        kind: 'overhang',
        position4D: { x: -3.5, y: -6.3, z: -2.5, w: 45.0 },
        scale4D: { x: 2.2, y: 1.1, z: 1.6, w: 40.0 },
        wRange: [-50, 90],
        baseEmbedding: 0.2,
        morphology: {
          archetype: 'overhang',
          roughness: 0.7,
          surfaceComplexity: 0.85,
        },
        spatialInfluence: {
          radius: 2.5,
          decay: 'gaussian',
          shelterCapacity: 8,
          affectsBoids: true,
        },
        relationships: [
          { sourceId: 'CAVERN_SHELTER_01', targetId: 'STRUCTURE_001', type: 'near' },
        ],
        parentId: 'ZONE_CENTRAL_REEF',
      })
    );

    return features;
  }
}

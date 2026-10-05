/**
 * Task 001 (v0.0.3) — Feature Registry v2: Rich Procedural Environment Architecture
 * GeologyGenerator: Generates large-scale geological macro-formations, shelves,
 * ridges, trenches, escarpments, channels, and sediment fans.
 */

import { SeededRandom } from '../../core/random/SeededRandom';
import { GeologicalFormation4DFeature, ILandscapeFeature, SemanticEnvironmentFeature } from '../LandscapeFeature';
import { FeatureGenerator, GenerationContext } from './FeatureGenerator';

export class GeologyGenerator implements FeatureGenerator<ILandscapeFeature> {
  public readonly id = 'GENERATOR_GEOLOGY';
  public readonly name = 'Geological & Geomorphological Macro Generator';

  public generate(context: GenerationContext): ILandscapeFeature[] {
    const random = new SeededRandom(context.seed + 100);
    const features: ILandscapeFeature[] = [];

    // =========================================================================
    // 1. CANONICAL MACRO-FORMATIONS (Preserved for Task 007 / 007A / 007B compatibility)
    // =========================================================================

    // Formation 1: West shelf migratory dune
    features.push(
      new GeologicalFormation4DFeature({
        id: 'FORMATION_WEST_SHELF',
        name: 'West Shelf Migratory Dune',
        position4D: { x: -6.5, y: -6.4, z: -1.5, w: 10.0 },
        scale4D: { x: 5.5, y: 0.38, z: 3.8, w: 14.0 },
        radiusX: 5.5,
        peakHeight: 0.38,
        radiusZ: 3.8,
        radiusW: 14.0,
        wRange: [-4.0, 24.0],
        topologyRelations: [
          { targetId: 'TERRAIN', relation: 'adjacent_to' },
          { targetId: 'ROCK_001', relation: 'supports' },
        ],
        relationships: [
          { sourceId: 'FORMATION_WEST_SHELF', targetId: 'TERRAIN', type: 'supported-by' },
        ],
        parentId: 'ZONE_WEST_SHELF',
      })
    );

    // Formation 2: East sand bank swell
    features.push(
      new GeologicalFormation4DFeature({
        id: 'FORMATION_EAST_BANK',
        name: 'East Sand Bank Swell',
        position4D: { x: 6.8, y: -6.35, z: 0.8, w: 35.0 },
        scale4D: { x: 6.0, y: 0.42, z: 4.2, w: 16.0 },
        radiusX: 6.0,
        peakHeight: 0.42,
        radiusZ: 4.2,
        radiusW: 16.0,
        wRange: [19.0, 51.0],
        topologyRelations: [
          { targetId: 'TERRAIN', relation: 'adjacent_to' },
          { targetId: 'PLATEAU_001', relation: 'adjacent_to' },
        ],
        relationships: [
          { sourceId: 'FORMATION_EAST_BANK', targetId: 'TERRAIN', type: 'supported-by' },
        ],
        parentId: 'ZONE_EAST_PLATEAU',
      })
    );

    // Formation 3: Central Trench depression
    features.push(
      new GeologicalFormation4DFeature({
        id: 'FORMATION_CENTRAL_TRENCH',
        name: 'Central Trench Depression',
        position4D: { x: 0.5, y: -6.85, z: -2.2, w: 60.0 },
        scale4D: { x: 4.8, y: -0.35, z: 3.2, w: 18.0 },
        radiusX: 4.8,
        peakHeight: -0.35,
        radiusZ: 3.2,
        radiusW: 18.0,
        wRange: [42.0, 78.0],
        topologyRelations: [
          { targetId: 'TERRAIN', relation: 'adjacent_to' },
          { targetId: 'FORMATION_SEABED_PLATEAU', relation: 'adjacent_to' },
        ],
        relationships: [
          { sourceId: 'FORMATION_CENTRAL_TRENCH', targetId: 'TERRAIN', type: 'supported-by' },
        ],
        parentId: 'ZONE_TRENCH_DEPTHS',
      })
    );

    // Formation 4: Seabed elevated plateau
    features.push(
      new GeologicalFormation4DFeature({
        id: 'FORMATION_SEABED_PLATEAU',
        name: 'Seabed Elevated Plateau',
        position4D: { x: -2.0, y: -6.35, z: 2.4, w: 85.0 },
        scale4D: { x: 5.2, y: 0.36, z: 3.6, w: 15.0 },
        radiusX: 5.2,
        peakHeight: 0.36,
        radiusZ: 3.6,
        radiusW: 15.0,
        wRange: [70.0, 100.0],
        topologyRelations: [
          { targetId: 'TERRAIN', relation: 'adjacent_to' },
          { targetId: 'FORMATION_CENTRAL_TRENCH', relation: 'adjacent_to' },
        ],
        relationships: [
          { sourceId: 'FORMATION_SEABED_PLATEAU', targetId: 'TERRAIN', type: 'supported-by' },
        ],
        parentId: 'ZONE_EAST_PLATEAU',
      })
    );

    // =========================================================================
    // 2. GEOMORPHOLOGICAL MESOSTRUCTURES (Section 30 Requirements)
    // =========================================================================

    // Western Escarpment shelf edge
    features.push(
      new SemanticEnvironmentFeature({
        id: 'ESCARPMENT_WEST_01',
        name: 'Western Bathymetric Escarpment',
        domain: 'geomorphology',
        kind: 'escarpment',
        position4D: { x: -4.8, y: -6.5, z: -0.5, w: 20.0 },
        scale4D: { x: 3.2, y: 0.8, z: 1.2, w: 25.0 },
        wRange: [-50, 100],
        baseEmbedding: 0.15,
        morphology: {
          archetype: 'angular',
          elongation: 2.4,
          roughness: 0.82,
          flattening: 0.6,
        },
        relationships: [
          { sourceId: 'ESCARPMENT_WEST_01', targetId: 'FORMATION_WEST_SHELF', type: 'adjacent_to' },
        ],
        parentId: 'ZONE_WEST_SHELF',
      })
    );

    // Channel: Substrate scour channel
    features.push(
      new SemanticEnvironmentFeature({
        id: 'CHANNEL_SOUTH_01',
        name: 'Southern Benthic Scour Channel',
        domain: 'geomorphology',
        kind: 'channel',
        position4D: { x: -1.2, y: -6.8, z: -3.5, w: 40.0 },
        scale4D: { x: 4.5, y: 0.3, z: 1.6, w: 30.0 },
        wRange: [-100, 100],
        baseEmbedding: 0.05,
        morphology: {
          archetype: 'rubble',
          elongation: 3.0,
          roughness: 0.35,
          flattening: 0.3,
        },
        relationships: [
          { sourceId: 'CHANNEL_SOUTH_01', targetId: 'FORMATION_CENTRAL_TRENCH', type: 'connects-to' },
        ],
        parentId: 'ZONE_TRENCH_DEPTHS',
      })
    );

    // Sediment Fan Deposit
    features.push(
      new SemanticEnvironmentFeature({
        id: 'DEPOSIT_SAND_FAN_01',
        name: 'Eastern Deltaic Sand Fan',
        domain: 'substrate',
        kind: 'sand',
        position4D: { x: 3.8, y: -6.7, z: 2.2, w: 50.0 },
        scale4D: { x: 4.0, y: 0.2, z: 3.5, w: 25.0 },
        wRange: [-100, 100],
        baseEmbedding: 0.02,
        morphology: {
          archetype: 'plate',
          elongation: 1.2,
          roughness: 0.15,
          flattening: 0.1,
        },
        relationships: [
          { sourceId: 'DEPOSIT_SAND_FAN_01', targetId: 'FORMATION_EAST_BANK', type: 'derived-from' },
        ],
        parentId: 'ZONE_EAST_PLATEAU',
      })
    );

    // Silt Hollow Deposit
    features.push(
      new SemanticEnvironmentFeature({
        id: 'DEPOSIT_SILT_HOLLOW_01',
        name: 'Trench Silt Sediment Deposit',
        domain: 'substrate',
        kind: 'silt',
        position4D: { x: 0.8, y: -7.1, z: -2.8, w: 60.0 },
        scale4D: { x: 3.0, y: 0.15, z: 2.2, w: 30.0 },
        wRange: [-100, 100],
        baseEmbedding: 0.01,
        morphology: {
          archetype: 'rounded',
          elongation: 1.4,
          roughness: 0.05,
          flattening: 0.05,
        },
        relationships: [
          { sourceId: 'DEPOSIT_SILT_HOLLOW_01', targetId: 'FORMATION_CENTRAL_TRENCH', type: 'inside' },
        ],
        parentId: 'ZONE_TRENCH_DEPTHS',
      })
    );

    return features;
  }
}

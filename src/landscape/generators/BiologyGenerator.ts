/**
 * Task 001 (v0.0.3) — Feature Registry v2: Rich Procedural Environment Architecture
 * BiologyGenerator: Generates biological coral colonies, kelp forests, seagrass meadows,
 * algae beds, sponge gardens, and flora substrate anchors.
 */

import { BiologicalColony4DFeature, FloraAnchor4DFeature, ILandscapeFeature } from '../LandscapeFeature';
import { FeatureGenerator, GenerationContext } from './FeatureGenerator';

export class BiologyGenerator implements FeatureGenerator<ILandscapeFeature> {
  public readonly id = 'GENERATOR_BIOLOGY';
  public readonly name = 'Biological Colonies & Vegetation Generator';

  public generate(context: GenerationContext): ILandscapeFeature[] {
    const features: ILandscapeFeature[] = [];

    // =========================================================================
    // 1. PRESERVED FLORA ANCHORS (007A / 007B compatibility)
    // =========================================================================

    const legacyPlantOrigins = [
      { id: 'FLORA_ANCHOR_acropora_amethyst', name: 'Amethyst Staghorn Holdfast', x: -9.2, y: -6.6, z: -1.8, parentId: 'ZONE_WEST_SHELF' },
      { id: 'FLORA_ANCHOR_giant_kelp_emerald', name: 'Emerald Kelp Holdfast', x: -6.8, y: -6.7, z: -2.2, parentId: 'ZONE_WEST_SHELF' },
      { id: 'FLORA_ANCHOR_cabomba_mint', name: 'Mint Cabomba Root Anchor', x: -3.2, y: -6.8, z: 2.0, parentId: 'ZONE_CENTRAL_REEF' },
      { id: 'FLORA_ANCHOR_amazon_sword_crimson', name: 'Crimson Sword Root Mound', x: 2.8, y: -6.8, z: 1.8, parentId: 'ZONE_EAST_PLATEAU' },
      { id: 'FLORA_ANCHOR_acropora_coral_pink', name: 'Pink Staghorn Holdfast', x: 7.2, y: -6.7, z: -1.6, parentId: 'ZONE_EAST_PLATEAU' },
      { id: 'FLORA_ANCHOR_giant_kelp_golden', name: 'Golden Kelp Holdfast', x: 9.5, y: -6.6, z: -2.0, parentId: 'ZONE_EAST_PLATEAU' },
    ];

    for (const p of legacyPlantOrigins) {
      features.push(
        new FloraAnchor4DFeature({
          id: p.id,
          name: p.name,
          position4D: { x: p.x, y: p.y, z: p.z, w: 0.0 },
          initialSurfaceY: p.y,
          baseEmbedding: 0.05,
          topologyRelations: [{ targetId: 'TERRAIN', relation: 'rooted_on' }],
          relationships: [
            { sourceId: p.id, targetId: 'TERRAIN', type: 'rooted-in' },
          ],
          parentId: p.parentId,
        })
      );
    }

    // =========================================================================
    // 2. BIOLOGICAL COLONIES & VEGETATION PATCHES (Section 18, 19 & 30)
    // =========================================================================

    // Coral Colony: Branching Staghorn Coral Colony (West Shelf)
    features.push(
      new BiologicalColony4DFeature({
        id: 'CORAL_COLONY_BRANCHING_01',
        name: 'Western Branching Acropora Colony',
        domain: 'colony',
        kind: 'coral_colony',
        speciesType: 'Acropora cervicornis',
        position4D: { x: -7.5, y: -6.0, z: -0.5, w: 20.0 },
        scale4D: { x: 1.8, y: 0.9, z: 1.5, w: 50.0 },
        colonyDensity: 0.85,
        morphology: {
          archetype: 'branching',
          surfaceComplexity: 0.8,
          roughness: 0.6,
        },
        environmentalPreferences: {
          depth: { min: -7.2, max: -5.5, optimum: -6.2 },
          substrateAffinity: { exposed_rock: 0.95, sand: 0.2 },
        },
        relationships: [
          { sourceId: 'CORAL_COLONY_BRANCHING_01', targetId: 'ROCK_001', type: 'grows-on' },
        ],
        parentId: 'ZONE_WEST_SHELF',
      })
    );

    // Coral Colony: Massive Brain Coral Colony (Central Nexus)
    features.push(
      new BiologicalColony4DFeature({
        id: 'CORAL_COLONY_BRAIN_01',
        name: 'Central Massive Diploria Colony',
        domain: 'colony',
        kind: 'coral_colony',
        speciesType: 'Diploria labyrinthiformis',
        position4D: { x: -0.2, y: -6.1, z: -1.2, w: 10.0 },
        scale4D: { x: 1.6, y: 1.1, z: 1.4, w: 80.0 },
        colonyDensity: 0.9,
        morphology: {
          archetype: 'brain',
          surfaceComplexity: 0.9,
          roughness: 0.4,
        },
        relationships: [
          { sourceId: 'CORAL_COLONY_BRAIN_01', targetId: 'STRUCTURE_001', type: 'attached-to' },
        ],
        parentId: 'ZONE_CENTRAL_REEF',
      })
    );

    // Coral Colony: Table Coral Colony (East Shelf)
    features.push(
      new BiologicalColony4DFeature({
        id: 'CORAL_COLONY_TABLE_01',
        name: 'Eastern Horizontal Table Coral Colony',
        domain: 'colony',
        kind: 'coral_colony',
        speciesType: 'Acropora hyacinthus',
        position4D: { x: 5.8, y: -5.6, z: 0.2, w: 35.0 },
        scale4D: { x: 2.0, y: 0.5, z: 1.8, w: 45.0 },
        colonyDensity: 0.8,
        morphology: {
          archetype: 'table',
          flattening: 0.35,
          elongation: 1.2,
        },
        relationships: [
          { sourceId: 'CORAL_COLONY_TABLE_01', targetId: 'ROCK_004', type: 'grows-on' },
        ],
        parentId: 'ZONE_EAST_PLATEAU',
      })
    );

    // Kelp Forest: Giant Benthic Kelp Forest Patch
    features.push(
      new BiologicalColony4DFeature({
        id: 'KELP_FOREST_WEST_01',
        name: 'Western Benthic Kelp Canopy Forest',
        domain: 'vegetation',
        kind: 'kelp_forest',
        speciesType: 'Macrocystis pyrifera',
        position4D: { x: -8.8, y: -6.4, z: -2.5, w: 30.0 },
        scale4D: { x: 3.0, y: 2.8, z: 2.2, w: 60.0 },
        colonyDensity: 0.9,
        morphology: {
          archetype: 'kelp_blade',
          elongation: 2.8,
        },
        relationships: [
          { sourceId: 'KELP_FOREST_WEST_01', targetId: 'FORMATION_WEST_SHELF', type: 'rooted-in' },
        ],
        parentId: 'ZONE_WEST_SHELF',
      })
    );

    // Seagrass Meadow: Central Benthic Sandy Meadow
    features.push(
      new BiologicalColony4DFeature({
        id: 'SEAGRASS_MEADOW_CENTRAL_01',
        name: 'Central Shallow Halophila Seagrass Meadow',
        domain: 'vegetation',
        kind: 'seagrass_meadow',
        speciesType: 'Halophila decipiens',
        position4D: { x: 1.5, y: -6.8, z: 1.5, w: 40.0 },
        scale4D: { x: 3.5, y: 0.6, z: 2.8, w: 70.0 },
        colonyDensity: 0.75,
        morphology: {
          archetype: 'seagrass_shoot',
        },
        relationships: [
          { sourceId: 'SEAGRASS_MEADOW_CENTRAL_01', targetId: 'TERRAIN', type: 'rooted-in' },
        ],
        parentId: 'ZONE_CENTRAL_REEF',
      })
    );

    // Algae Bed: Turf Algae Bed on Escarpment
    features.push(
      new BiologicalColony4DFeature({
        id: 'ALGAE_BED_WEST_01',
        name: 'Western Escarpment Coralline Algae Turf',
        domain: 'vegetation',
        kind: 'algae_bed',
        speciesType: 'Lithothamnion',
        position4D: { x: -4.5, y: -6.5, z: 0.8, w: 25.0 },
        scale4D: { x: 2.5, y: 0.3, z: 2.0, w: 80.0 },
        colonyDensity: 0.8,
        morphology: {
          archetype: 'turf_mat',
        },
        relationships: [
          { sourceId: 'ALGAE_BED_WEST_01', targetId: 'ESCARPMENT_WEST_01', type: 'grows-on' },
        ],
        parentId: 'ZONE_WEST_SHELF',
      })
    );

    // Sponge Garden: Eastern Deep Shelf Sponge Garden
    features.push(
      new BiologicalColony4DFeature({
        id: 'SPONGE_GARDEN_EAST_01',
        name: 'Eastern Benthic Siliceous Sponge Garden',
        domain: 'colony',
        kind: 'sponge_colony',
        speciesType: 'Aplysina fistularis',
        position4D: { x: 7.5, y: -6.2, z: 1.8, w: 50.0 },
        scale4D: { x: 2.2, y: 1.0, z: 1.8, w: 55.0 },
        colonyDensity: 0.7,
        morphology: {
          archetype: 'tube',
        },
        relationships: [
          { sourceId: 'SPONGE_GARDEN_EAST_01', targetId: 'FORMATION_EAST_BANK', type: 'attached-to' },
        ],
        parentId: 'ZONE_EAST_PLATEAU',
      })
    );

    // Anemone Field: South Sand Basin Anemone Field
    features.push(
      new BiologicalColony4DFeature({
        id: 'ANEMONE_FIELD_SOUTH_01',
        name: 'Southern Basin Carpet Anemone Cluster',
        domain: 'colony',
        kind: 'anemone_field',
        speciesType: 'Stichodactyla haddoni',
        position4D: { x: -2.0, y: -6.8, z: -2.0, w: 35.0 },
        scale4D: { x: 2.0, y: 0.4, z: 1.8, w: 60.0 },
        colonyDensity: 0.65,
        morphology: {
          archetype: 'anemone_tentacle',
        },
        relationships: [
          { sourceId: 'ANEMONE_FIELD_SOUTH_01', targetId: 'FORMATION_CENTRAL_TRENCH', type: 'embedded-in' },
        ],
        parentId: 'ZONE_TRENCH_DEPTHS',
      })
    );

    return features;
  }
}

/**
 * Task 007A — 4D Landscape Feature Integration
 * LandscapeFeatureRegistry: Deterministic feature registry managing persistent
 * 4D landscape feature identities, lookups, evaluations, and state projection.
 */

import {
  FloraAnchor4DFeature,
  GeologicalFormation4DFeature,
  ILandscapeFeature,
  ReefStructure4DFeature,
  Rock4DFeature,
} from './LandscapeFeature';
import { LandscapeFeatureState, SurfaceResolution } from './types';

export class LandscapeFeatureRegistry {
  private features: Map<string, ILandscapeFeature> = new Map();
  private cachedStates: Map<string, LandscapeFeatureState> = new Map();

  constructor(seed?: number) {
    if (seed !== undefined) {
      this.initializeDefaultFeatures(seed);
    }
  }

  /**
   * Registers a 4D landscape feature.
   * Enforces stable, explicit string identities.
   */
  public register(feature: ILandscapeFeature): void {
    if (!feature || !feature.id) {
      throw new Error('Landscape feature must possess a valid, non-empty id.');
    }
    this.features.set(feature.id, feature);
  }

  /**
   * Retrieves a feature by its stable ID.
   */
  public get(featureId: string): ILandscapeFeature | undefined {
    return this.features.get(featureId);
  }

  /**
   * Checks if a feature exists in the registry.
   */
  public has(featureId: string): boolean {
    return this.features.has(featureId);
  }

  /**
   * Removes a feature by its stable ID.
   */
  public remove(featureId: string): boolean {
    this.cachedStates.delete(featureId);
    return this.features.delete(featureId);
  }

  /**
   * Returns an array of all registered features.
   */
  public list(): ILandscapeFeature[] {
    return Array.from(this.features.values());
  }

  /**
   * Returns the count of registered features.
   */
  public count(): number {
    return this.features.size;
  }

  /**
   * Clears all registered features.
   */
  public clear(): void {
    this.features.clear();
    this.cachedStates.clear();
  }

  /**
   * Evaluates all features at slice parameter w against the local landscape surface.
   * Returns a map of stable feature IDs to evaluated LandscapeFeatureState.
   */
  public evaluateAll(
    w: number,
    resolveSurface: (x: number, z: number) => SurfaceResolution
  ): Map<string, LandscapeFeatureState> {
    const states = new Map<string, LandscapeFeatureState>();

    for (const [id, feature] of this.features.entries()) {
      const surface = resolveSurface(feature.position4D.x, feature.position4D.z);
      const state = feature.evaluate(w, surface);
      states.set(id, state);
      this.cachedStates.set(id, state);
    }

    return states;
  }

  /**
   * Retrieves the last evaluated state for a given feature ID.
   */
  public getCachedState(featureId: string): LandscapeFeatureState | undefined {
    return this.cachedStates.get(featureId);
  }

  /**
   * Retrieves all cached feature states.
   */
  public getAllCachedStates(): Map<string, LandscapeFeatureState> {
    return new Map(this.cachedStates);
  }

  /**
   * Populates standard geological, structural, and flora anchor features
   * deterministically from a given seed.
   */
  public initializeDefaultFeatures(seed: number): void {
    this.clear();

    // =========================================================================
    // 1. GEOLOGICAL ROCKS (5 Migrated Rocks from coralGeometries.ts)
    // =========================================================================

    // ROCK_001: Western shelf boulder (active, continuous settling and deformation)
    this.register(
      new Rock4DFeature({
        id: 'ROCK_001',
        name: 'Western Shelf Boulder',
        seed: seed + 101,
        position4D: { x: -9.5, y: -5.8, z: -2.0, w: 30.0 },
        scale4D: { x: 1.8, y: 1.4, z: 1.6, w: 1.0 },
        wRange: [-20.0, 85.0],
        baseEmbedding: 0.25,
        topologyRelations: [
          { targetId: 'TERRAIN', relation: 'supported_by' },
          { targetId: 'RIDGE_001', relation: 'adjacent_to' },
        ],
      })
    );

    // ROCK_002: Southwestern emerging outcrop
    // Invisible at w < 10, emerges smoothly between w=10 and w=20, flourishes, subsides at w=65
    this.register(
      new Rock4DFeature({
        id: 'ROCK_002',
        name: 'Southwestern Emerging Outcrop',
        seed: seed + 102,
        position4D: { x: -7.0, y: -6.0, z: 1.5, w: 37.5 },
        scale4D: { x: 1.4, y: 1.2, z: 1.3, w: 1.0 },
        wRange: [10.0, 65.0],
        baseEmbedding: 0.2,
        topologyRelations: [
          { targetId: 'TERRAIN', relation: 'supported_by' },
          { targetId: 'BASIN_001', relation: 'adjacent_to' },
        ],
      })
    );

    // ROCK_003: Eastern monolith (sinking / disappearing rock)
    // Prominent at low w, gradually submerges beneath shifting sediment, disappears past w=45
    this.register(
      new Rock4DFeature({
        id: 'ROCK_003',
        name: 'Eastern Submerging Monolith',
        seed: seed + 103,
        position4D: { x: 7.5, y: -5.9, z: -1.5, w: 0.0 },
        scale4D: { x: 2.0, y: 1.5, z: 1.7, w: 1.0 },
        wRange: [-50.0, 45.0],
        baseEmbedding: 0.3,
        topologyRelations: [
          { targetId: 'TERRAIN', relation: 'supported_by' },
          { targetId: 'VALLEY_001', relation: 'adjacent_to' },
        ],
      })
    );

    // ROCK_004: Far-eastern terrace rock (changing geometry & scale)
    // Strong response to conformal wave modes & curvature flow
    this.register(
      new Rock4DFeature({
        id: 'ROCK_004',
        name: 'Eastern Terrace Deforming Rock',
        seed: seed + 104,
        position4D: { x: 9.8, y: -5.6, z: 1.2, w: 25.0 },
        scale4D: { x: 1.6, y: 1.3, z: 1.4, w: 1.0 },
        wRange: [-40.0, 90.0],
        baseEmbedding: 0.22,
        topologyRelations: [
          { targetId: 'TERRAIN', relation: 'supported_by' },
          { targetId: 'PLATEAU_001', relation: 'adjacent_to' },
        ],
      })
    );

    // ROCK_005: Central benthic holdfast rock (coherent terrain relationship)
    // Sits in central basin/ridge nexus, adjusting elevation, pitch, and embedding with substrate
    this.register(
      new Rock4DFeature({
        id: 'ROCK_005',
        name: 'Central Benthic Nexus Rock',
        seed: seed + 105,
        position4D: { x: -0.5, y: -6.2, z: -2.8, w: 0.0 },
        scale4D: { x: 2.2, y: 1.1, z: 1.5, w: 1.0 },
        wRange: [-100.0, 100.0],
        baseEmbedding: 0.32,
        topologyRelations: [
          { targetId: 'TERRAIN', relation: 'supported_by' },
          { targetId: 'STRUCTURE_001', relation: 'adjacent_to' },
        ],
      })
    );

    // =========================================================================
    // 2. REEF STRUCTURAL FORMATIONS
    // =========================================================================

    // STRUCTURE_001: Central reef holdfast mound
    this.register(
      new ReefStructure4DFeature({
        id: 'STRUCTURE_001',
        name: 'Central Reef Mound Holdfast',
        position4D: { x: 0.0, y: -6.2, z: -1.0, w: 0.0 },
        scale4D: { x: 2.5, y: 1.2, z: 2.0, w: 1.0 },
        wRange: [-100.0, 100.0],
        baseEmbedding: 0.35,
        topologyRelations: [{ targetId: 'TERRAIN', relation: 'supported_by' }],
      })
    );

    // REEF_001: Western brain coral substrate base
    this.register(
      new ReefStructure4DFeature({
        id: 'REEF_001',
        name: 'Western Brain Coral Substrate',
        position4D: { x: -6.5, y: -4.6, z: 0.5, w: 0.0 },
        scale4D: { x: 1.1, y: 0.9, z: 1.0, w: 1.0 },
        wRange: [-80.0, 100.0],
        baseEmbedding: 0.28,
        topologyRelations: [
          { targetId: 'TERRAIN', relation: 'supported_by' },
          { targetId: 'RIDGE_001', relation: 'adjacent_to' },
        ],
      })
    );

    // REEF_002: Eastern brain coral substrate base
    this.register(
      new ReefStructure4DFeature({
        id: 'REEF_002',
        name: 'Eastern Brain Coral Substrate',
        position4D: { x: 6.2, y: -4.8, z: -1.0, w: 0.0 },
        scale4D: { x: 0.9, y: 0.8, z: 0.85, w: 1.0 },
        wRange: [-80.0, 100.0],
        baseEmbedding: 0.26,
        topologyRelations: [
          { targetId: 'TERRAIN', relation: 'supported_by' },
          { targetId: 'PLATEAU_001', relation: 'adjacent_to' },
        ],
      })
    );

    // =========================================================================
    // 3. FLORA ANCHORS (Botanical Organism Substrate Anchors)
    // Keeps biological organisms rooted to the dynamic seabed
    // =========================================================================

    const plantOrigins = [
      { id: 'FLORA_ANCHOR_acropora_amethyst', name: 'Amethyst Staghorn Holdfast', x: -9.2, y: -6.6, z: -1.8 },
      { id: 'FLORA_ANCHOR_giant_kelp_emerald', name: 'Emerald Kelp Holdfast', x: -6.8, y: -6.7, z: -2.2 },
      { id: 'FLORA_ANCHOR_cabomba_mint', name: 'Mint Cabomba Root Anchor', x: -3.2, y: -6.8, z: 2.0 },
      { id: 'FLORA_ANCHOR_amazon_sword_crimson', name: 'Crimson Sword Root Mound', x: 2.8, y: -6.8, z: 1.8 },
      { id: 'FLORA_ANCHOR_acropora_coral_pink', name: 'Pink Staghorn Holdfast', x: 7.2, y: -6.7, z: -1.6 },
      { id: 'FLORA_ANCHOR_giant_kelp_golden', name: 'Golden Kelp Holdfast', x: 9.5, y: -6.6, z: -2.0 },
    ];

    for (const p of plantOrigins) {
      this.register(
        new FloraAnchor4DFeature({
          id: p.id,
          name: p.name,
          position4D: { x: p.x, y: p.y, z: p.z, w: 0.0 },
          initialSurfaceY: p.y,
          baseEmbedding: 0.05,
          topologyRelations: [{ targetId: 'TERRAIN', relation: 'rooted_on' }],
        })
      );
    }

    // =========================================================================
    // 4. GEOLOGICAL MACRO FORMATIONS (Authoritative Hyper-Ellipsoidal Formations in M^4)
    // =========================================================================

    this.register(
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
      })
    );

    this.register(
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
      })
    );

    this.register(
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
      })
    );

    this.register(
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
      })
    );
  }
}

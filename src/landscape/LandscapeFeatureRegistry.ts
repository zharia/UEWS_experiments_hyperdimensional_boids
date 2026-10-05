/**
 * Task 007A / Task 001 (v0.0.3) — Feature Registry v2: Rich Procedural Environment Architecture
 * LandscapeFeatureRegistry: Deterministic environment registry managing persistent
 * 4D landscape features, spatial hierarchy (regions, zones, clusters), relationship graphs,
 * procedural generator execution, and explicit-w state projection.
 */

import { FeatureRelationshipGraph } from './FeatureRelationshipGraph';
import {
  BiologyGenerator,
  GeologyGenerator,
  HabitatGenerator,
  PhenomenonGenerator,
  ReefGenerator,
  RockFieldGenerator,
} from './generators';
import { ILandscapeFeature } from './LandscapeFeature';
import { FeatureDomain, FeatureKind, FeatureRelationshipType } from './taxonomy';
import {
  FeatureEvaluationContext,
  SpatialCluster,
  SpatialRegion,
  SpatialZone,
} from './environmentalTypes';
import { LandscapeFeatureState, SurfaceResolution } from './types';
import { WorldCompiler } from './worldSpec/WorldCompiler';
import { WorldSpecification } from './worldSpec/worldSpecTypes';

export class LandscapeFeatureRegistry {
  private features: Map<string, ILandscapeFeature> = new Map();
  private cachedStates: Map<string, LandscapeFeatureState> = new Map();

  // Feature Relationship Graph
  public readonly relationshipGraph: FeatureRelationshipGraph = new FeatureRelationshipGraph();

  // Spatial Hierarchy
  private regions: Map<string, SpatialRegion> = new Map();
  private zones: Map<string, SpatialZone> = new Map();
  private clusters: Map<string, SpatialCluster> = new Map();

  constructor(seed?: number) {
    if (seed !== undefined) {
      this.initializeDefaultFeatures(seed);
    }
  }

  // =========================================================================
  // Feature Registration & Lookup
  // =========================================================================

  /**
   * Registers a 4D landscape feature.
   * Enforces stable, explicit string identities.
   */
  public register(feature: ILandscapeFeature): void {
    if (!feature || !feature.id) {
      throw new Error('Landscape feature must possess a valid, non-empty id.');
    }
    this.features.set(feature.id, feature);

    // Register embedded relationships if feature carries any
    if (feature.relationships) {
      for (const rel of feature.relationships) {
        this.relationshipGraph.addRelationship(rel);
      }
    }
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
    this.relationshipGraph.removeFeature(featureId);
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
   * Clears all registered features, cached states, hierarchy, and relationships.
   */
  public clear(): void {
    this.features.clear();
    this.cachedStates.clear();
    this.relationshipGraph.clear();
    this.regions.clear();
    this.zones.clear();
    this.clusters.clear();
  }

  // =========================================================================
  // Spatial Hierarchy Management (Section 12)
  // =========================================================================

  public registerRegion(region: SpatialRegion): void {
    this.regions.set(region.id, { ...region });
  }

  public getRegion(regionId: string): SpatialRegion | undefined {
    return this.regions.get(regionId);
  }

  public getRegions(): SpatialRegion[] {
    return Array.from(this.regions.values());
  }

  public registerZone(zone: SpatialZone): void {
    this.zones.set(zone.id, { ...zone });
    const reg = this.regions.get(zone.parentId);
    if (reg && !reg.zoneIds.includes(zone.id)) {
      reg.zoneIds.push(zone.id);
    }
  }

  public getZone(zoneId: string): SpatialZone | undefined {
    return this.zones.get(zoneId);
  }

  public getZones(): SpatialZone[] {
    return Array.from(this.zones.values());
  }

  public getZonesByRegion(regionId: string): SpatialZone[] {
    return Array.from(this.zones.values()).filter(z => z.parentId === regionId);
  }

  public registerCluster(cluster: SpatialCluster): void {
    this.clusters.set(cluster.id, { ...cluster });
    const zone = this.zones.get(cluster.parentId);
    if (zone && !zone.clusterIds.includes(cluster.id)) {
      zone.clusterIds.push(cluster.id);
    }
  }

  public getCluster(clusterId: string): SpatialCluster | undefined {
    return this.clusters.get(clusterId);
  }

  public getClusters(): SpatialCluster[] {
    return Array.from(this.clusters.values());
  }

  // =========================================================================
  // Query Methods (Taxonomy & Hierarchy)
  // =========================================================================

  public getByDomain(domain: FeatureDomain): ILandscapeFeature[] {
    return Array.from(this.features.values()).filter(f => f.domain === domain);
  }

  public getByKind(kind: FeatureKind): ILandscapeFeature[] {
    return Array.from(this.features.values()).filter(f => f.kind === kind);
  }

  public getByZone(zoneId: string): ILandscapeFeature[] {
    return Array.from(this.features.values()).filter(f => f.parentId === zoneId);
  }

  public getByRegion(regionId: string): ILandscapeFeature[] {
    const zones = new Set(this.getZonesByRegion(regionId).map(z => z.id));
    return Array.from(this.features.values()).filter(
      f => f.parentId === regionId || (f.parentId && zones.has(f.parentId))
    );
  }

  public getRelatedFeatures(featureId: string, type?: FeatureRelationshipType): ILandscapeFeature[] {
    const relatedIds = this.relationshipGraph.getRelatedIds(featureId, type);
    return relatedIds.map(id => this.get(id)).filter((f): f is ILandscapeFeature => f !== undefined);
  }

  // =========================================================================
  // Evaluation & Projection
  // =========================================================================

  /**
   * Evaluates all features at slice parameter w against the local landscape surface.
   * Returns a map of stable feature IDs to evaluated LandscapeFeatureState.
   */
  public evaluateAll(
    w: number,
    resolveSurface: (x: number, z: number, w?: number) => SurfaceResolution,
    context?: FeatureEvaluationContext
  ): Map<string, LandscapeFeatureState> {
    const states = new Map<string, LandscapeFeatureState>();

    for (const [id, feature] of this.features.entries()) {
      const surface = resolveSurface(feature.position4D.x, feature.position4D.z, w);
      const state = feature.evaluate(w, surface, context);
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

  // =========================================================================
  // Deterministic Procedural Generation
  // =========================================================================

  /**
   * Compiles and populates the registry from a structured WorldSpecification.
   */
  public generateFromSpecification(spec: WorldSpecification): void {
    WorldCompiler.compile(spec, this);
  }

  /**
   * Populates a complete, rich, deterministic procedural environment.
   * Satisfies Section 30 requirements while strictly preserving all 007A/007B features.
   */
  public initializeDefaultFeatures(seed: number): void {
    this.clear();

    // 1. Establish Spatial Hierarchy (Regions & Zones)
    this.registerRegion({
      id: 'REGION_WEST',
      name: 'Western Continental Shelf Region',
      bounds: { minX: -14.0, maxX: -4.0, minZ: -6.0, maxZ: 6.0 },
      depthRange: [-7.2, -5.8],
      theme: 'Rocky shelf with dense kelp canopy and migratory sand dunes',
      zoneIds: ['ZONE_WEST_SHELF'],
    });

    this.registerRegion({
      id: 'REGION_CENTRAL',
      name: 'Central Trench & Reef Nexus Region',
      bounds: { minX: -4.0, maxX: 4.0, minZ: -6.0, maxZ: 6.0 },
      depthRange: [-7.8, -6.0],
      theme: 'Deep central depression, arch caverns, and coral holdfast mound',
      zoneIds: ['ZONE_CENTRAL_REEF', 'ZONE_TRENCH_DEPTHS'],
    });

    this.registerRegion({
      id: 'REGION_EAST',
      name: 'Eastern Substrate Plateau Region',
      bounds: { minX: 4.0, maxX: 14.0, minZ: -6.0, maxZ: 6.0 },
      depthRange: [-6.8, -5.5],
      theme: 'Sandy rise shelf with sponge gardens and deltaic fan',
      zoneIds: ['ZONE_EAST_PLATEAU'],
    });

    this.registerZone({
      id: 'ZONE_WEST_SHELF',
      name: 'Western Escarpment & Dune Shelf',
      parentId: 'REGION_WEST',
      bounds: { minX: -12.0, maxX: -5.0, minZ: -4.5, maxZ: 4.5 },
      dominantSubstrate: 'exposed_rock',
      clusterIds: [],
    });

    this.registerZone({
      id: 'ZONE_CENTRAL_REEF',
      name: 'Central Reef Mound Sanctuary',
      parentId: 'REGION_CENTRAL',
      bounds: { minX: -3.0, maxX: 3.0, minZ: -2.5, maxZ: 2.5 },
      dominantSubstrate: 'coral_rubble',
      clusterIds: [],
    });

    this.registerZone({
      id: 'ZONE_TRENCH_DEPTHS',
      name: 'Deep Benthic Sediment Trench',
      parentId: 'REGION_CENTRAL',
      bounds: { minX: -2.0, maxX: 2.0, minZ: -5.5, maxZ: -1.0 },
      dominantSubstrate: 'silt',
      clusterIds: [],
    });

    this.registerZone({
      id: 'ZONE_EAST_PLATEAU',
      name: 'Eastern Benthic Sand Shelf & Sponge Garden',
      parentId: 'REGION_EAST',
      bounds: { minX: 5.0, maxX: 12.0, minZ: -4.0, maxZ: 4.0 },
      dominantSubstrate: 'sand',
      clusterIds: [],
    });

    // 2. Execute Deterministic Generators in Causal Order
    const genContext = { seed, w: 0 };

    const geologyGen = new GeologyGenerator();
    for (const f of geologyGen.generate(genContext)) {
      this.register(f);
    }

    const rockGen = new RockFieldGenerator();
    for (const f of rockGen.generate(genContext)) {
      this.register(f);
    }

    const reefGen = new ReefGenerator();
    for (const f of reefGen.generate(genContext)) {
      this.register(f);
    }

    const biologyGen = new BiologyGenerator();
    for (const f of biologyGen.generate(genContext)) {
      this.register(f);
    }

    const habitatGen = new HabitatGenerator();
    for (const f of habitatGen.generate(genContext)) {
      this.register(f);
    }

    const phenomenonGen = new PhenomenonGenerator();
    for (const f of phenomenonGen.generate(genContext)) {
      this.register(f);
    }
  }
}

/**
 * Task 007 — Dynamic 4D Landscape Evolution, Geometry & Topology
 * LandscapeTopology: Explicit topology graph, persistent feature identities, and invariance checks.
 */

import { LandscapeFeature, LandscapeTopology as ILandscapeTopology } from './types';
import { LandscapeGeometryEvaluator } from './LandscapeGeometry';

export class LandscapeTopologyManager implements ILandscapeTopology {
  public features: LandscapeFeature[] = [];
  public adjacency: Record<string, string[]> = {};
  public connectedComponents: number = 1;
  public isInvariant: boolean = true;
  public lastTopologyCheck: number = 0;
  public mutationHistory: Array<{ timestamp: number; description: string }> = [];

  constructor() {
    this.initializeTopology();
  }

  /**
   * Initializes the persistent topological feature graph of the aquarium substrate.
   * Identities are conceptual and decoupled from mesh vertex indices.
   */
  private initializeTopology(): void {
    // 1. RIDGE_001: Western shelf migratory sand dune ridge
    const ridge001: LandscapeFeature = {
      id: 'RIDGE_001',
      name: 'Western Dune Ridge',
      type: 'ridge',
      centroid: { x: -8.5, y: -6.4, z: -1.0 },
      bounds: { minX: -13.0, maxX: -4.0, minZ: -4.5, maxZ: 2.5, minY: -6.8, maxY: -6.0 },
      neighbors: ['BASIN_001', 'STRUCTURE_001'],
      meanHeight: -6.4,
      meanCurvature: -0.06,
      dominantCurvatureAxis: { x: 0.8, z: 0.2 },
    };

    // 2. BASIN_001: Central benthic hollow / feeding basin
    const basin001: LandscapeFeature = {
      id: 'BASIN_001',
      name: 'Central Sand Basin',
      type: 'basin',
      centroid: { x: -1.5, y: -6.8, z: 1.0 },
      bounds: { minX: -5.5, maxX: 2.5, minZ: -2.0, maxZ: 4.5, minY: -7.0, maxY: -6.6 },
      neighbors: ['RIDGE_001', 'VALLEY_001', 'STRUCTURE_001'],
      meanHeight: -6.8,
      meanCurvature: 0.08,
      dominantCurvatureAxis: { x: 0.0, z: 1.0 },
    };

    // 3. VALLEY_001: Eastern current trench
    const valley001: LandscapeFeature = {
      id: 'VALLEY_001',
      name: 'Eastern Substrate Trench',
      type: 'valley',
      centroid: { x: 3.5, y: -6.85, z: -2.5 },
      bounds: { minX: 0.5, maxX: 6.5, minZ: -5.0, maxZ: 0.0, minY: -7.0, maxY: -6.6 },
      neighbors: ['BASIN_001', 'PLATEAU_001', 'STRUCTURE_001'],
      meanHeight: -6.85,
      meanCurvature: 0.07,
      dominantCurvatureAxis: { x: 0.6, z: -0.8 },
    };

    // 4. PLATEAU_001: Eastern sandy rise shelf
    const plateau001: LandscapeFeature = {
      id: 'PLATEAU_001',
      name: 'Eastern Benthic Shelf',
      type: 'peak',
      centroid: { x: 9.0, y: -6.35, z: 0.5 },
      bounds: { minX: 5.0, maxX: 13.0, minZ: -3.0, maxZ: 4.0, minY: -6.7, maxY: -6.1 },
      neighbors: ['VALLEY_001', 'STRUCTURE_001'],
      meanHeight: -6.35,
      meanCurvature: -0.05,
      dominantCurvatureAxis: { x: 0.3, z: 0.9 },
    };

    // 5. STRUCTURE_001: Central reef holdfast substrate mound
    const structure001: LandscapeFeature = {
      id: 'STRUCTURE_001',
      name: 'Reef Anchor Mound',
      type: 'ridge',
      centroid: { x: 0.0, y: -6.2, z: -1.0 },
      bounds: { minX: -3.0, maxX: 3.0, minZ: -3.5, maxZ: 1.5, minY: -6.6, maxY: -5.9 },
      neighbors: ['RIDGE_001', 'BASIN_001', 'VALLEY_001', 'PLATEAU_001'],
      meanHeight: -6.2,
      meanCurvature: -0.09,
      dominantCurvatureAxis: { x: 0.0, z: 0.0 },
    };

    this.features = [ridge001, basin001, valley001, plateau001, structure001];

    this.adjacency = {
      RIDGE_001: ['BASIN_001', 'STRUCTURE_001'],
      BASIN_001: ['RIDGE_001', 'VALLEY_001', 'STRUCTURE_001'],
      VALLEY_001: ['BASIN_001', 'PLATEAU_001', 'STRUCTURE_001'],
      PLATEAU_001: ['VALLEY_001', 'STRUCTURE_001'],
      STRUCTURE_001: ['RIDGE_001', 'BASIN_001', 'VALLEY_001', 'PLATEAU_001'],
    };

    this.computeConnectedComponents();
  }

  /**
   * Computes the number of connected components in the topology graph via BFS.
   */
  private computeConnectedComponents(): void {
    const visited = new Set<string>();
    let count = 0;

    for (const f of this.features) {
      if (!visited.has(f.id)) {
        count++;
        // BFS traverse
        const queue: string[] = [f.id];
        visited.add(f.id);

        while (queue.length > 0) {
          const curr = queue.shift()!;
          const neighbors = this.adjacency[curr] || [];
          for (const n of neighbors) {
            if (!visited.has(n)) {
              visited.add(n);
              queue.push(n);
            }
          }
        }
      }
    }

    this.connectedComponents = count;
  }

  /**
   * Updates feature geometric centroids, bounds, and mean curvature based on the current
   * geometry slice while keeping topological identities and graph connectivity strictly invariant.
   */
  public updateFeatureGeometry(
    geometry: LandscapeGeometryEvaluator,
    sampleHeight?: (x: number, z: number) => number
  ): void {
    for (let i = 0; i < this.features.length; i++) {
      const f = this.features[i];

      // Sample geometry at feature centroid
      const m = geometry.evaluateMetrics(f.centroid.x, f.centroid.z);
      const h = sampleHeight ? sampleHeight(f.centroid.x, f.centroid.z) : m.height;
      f.centroid.y = h;
      f.meanHeight = h;
      f.meanCurvature = m.meanCurvature;

      // Update bounds elevation
      f.bounds.minY = h - 0.35;
      f.bounds.maxY = h + 0.35;
    }

    this.validateInvariants();
  }

  /**
   * Verifies that the topology invariants (connectivity, component count, adjacency reciprocity)
   * are maintained under smooth geometric evolution.
   */
  public validateInvariants(): boolean {
    // 1. Verify component count is strictly 1 (single continuous substrate manifold)
    this.computeConnectedComponents();
    if (this.connectedComponents !== 1) {
      this.isInvariant = false;
      return false;
    }

    // 2. Verify symmetry / reciprocity of adjacency: if A in adj[B], B in adj[A]
    for (const [node, neighbors] of Object.entries(this.adjacency)) {
      for (const n of neighbors) {
        const reciprocal = this.adjacency[n];
        if (!reciprocal || !reciprocal.includes(node)) {
          this.isInvariant = false;
          return false;
        }
      }
    }

    // 3. Verify all features exist
    if (this.features.length !== 5) {
      this.isInvariant = false;
      return false;
    }

    this.isInvariant = true;
    this.lastTopologyCheck = performance.now();
    return true;
  }

  /**
   * Extension point for future controlled, event-driven topological mutations.
   * In normal smooth evolution, topology remains strictly invariant.
   */
  public recordMutation(description: string): void {
    this.mutationHistory.push({
      timestamp: performance.now(),
      description,
    });
  }
}

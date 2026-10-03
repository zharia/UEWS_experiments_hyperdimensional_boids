/**
 * Task 007 & Task 007A — Dynamic 4D Landscape Evolution, Geometry & Topology
 * LandscapeTopology: Explicit topology manager, persistent feature identities,
 * semantic topology graph, and geometric topology validation.
 *
 * CRITICAL ARCHITECTURAL DISTINCTIONS (Section 16):
 * 1. Semantic Topology: The abstract relational graph of geological features, structural
 *    anchor points, and biological holdfasts (e.g. 'ROCK_001 supported_by TERRAIN',
 *    'ROCK_002 adjacent_to RIDGE_001'). Connects logical identities independently of meshes.
 * 2. Geometric Topology: The spatial manifold properties of the projected shapes in R^3,
 *    including non-penetration, surface attachment, bounded distortion, and lack of degenerate
 *    or floating geometries.
 * 3. Render Mesh Topology: The index and vertex buffer connectivity of the Three.js
 *    geometry instances (e.g. 65x33 plane quad grid manifold on the GPU).
 */

import {
  GeometricValidationIssue,
  GeometricValidationReport,
  LandscapeFeature,
  LandscapeFeatureState,
  LandscapeTopology as ILandscapeTopology,
} from './types';
import { LandscapeGeometryEvaluator } from './LandscapeGeometry';

export class LandscapeTopologyManager implements ILandscapeTopology {
  // Semantic Topology
  public features: LandscapeFeature[] = [];
  public adjacency: Record<string, string[]> = {};
  public connectedComponents: number = 1;
  public isInvariant: boolean = true;
  public lastTopologyCheck: number = 0;
  public mutationHistory: Array<{ timestamp: number; description: string }> = [];

  // Geometric Validation Telemetry
  public lastGeometricReport: GeometricValidationReport = {
    isValid: true,
    issues: [],
    timestamp: 0,
  };

  constructor() {
    this.initializeTopology();
  }

  /**
   * Initializes the persistent semantic topological feature graph of the aquarium substrate.
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
   * Computes the number of connected components in the semantic topology graph via BFS.
   */
  private computeConnectedComponents(): void {
    const visited = new Set<string>();
    let count = 0;

    for (const f of this.features) {
      if (!visited.has(f.id)) {
        count++;
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

      const m = geometry.evaluateMetrics(f.centroid.x, f.centroid.z);
      const h = sampleHeight ? sampleHeight(f.centroid.x, f.centroid.z) : m.height;
      f.centroid.y = h;
      f.meanHeight = h;
      f.meanCurvature = m.meanCurvature;

      f.bounds.minY = h - 0.35;
      f.bounds.maxY = h + 0.35;
    }

    this.validateInvariants();
  }

  /**
   * Verifies that semantic topology invariants (connectivity, component count, adjacency reciprocity)
   * are maintained under smooth geometric evolution.
   */
  public validateInvariants(): boolean {
    this.computeConnectedComponents();
    if (this.connectedComponents !== 1) {
      this.isInvariant = false;
      return false;
    }

    for (const [node, neighbors] of Object.entries(this.adjacency)) {
      for (const n of neighbors) {
        const reciprocal = this.adjacency[n];
        if (!reciprocal || !reciprocal.includes(node)) {
          this.isInvariant = false;
          return false;
        }
      }
    }

    if (this.features.length !== 5) {
      this.isInvariant = false;
      return false;
    }

    this.isInvariant = true;
    this.lastTopologyCheck = performance.now();
    return true;
  }

  /**
   * Validates Geometric Topology (Section 17):
   * Audits projected 3D feature states for:
   * - NaN / infinite coordinates
   * - Degenerate scale (<= 0)
   * - Out-of-bounds positioning beyond aquarium tank limits
   * - Unsupported floating features
   * - Excessive subsurface penetration
   */
  public validateGeometricTopology(
    featureStates: Map<string, LandscapeFeatureState>
  ): GeometricValidationReport {
    const issues: GeometricValidationIssue[] = [];

    const tankBounds = {
      minX: -16.0,
      maxX: 16.0,
      minZ: -10.0,
      maxZ: 10.0,
      minY: -8.0,
      maxY: 8.0,
    };

    for (const [id, state] of featureStates.entries()) {
      if (!state.visible) continue;

      const pos = state.projectedPosition;
      const sc = state.projectedScale;

      // 1. NaN or Infinity checks
      if (
        !Number.isFinite(pos.x) ||
        !Number.isFinite(pos.y) ||
        !Number.isFinite(pos.z) ||
        !Number.isFinite(sc.x) ||
        !Number.isFinite(sc.y) ||
        !Number.isFinite(sc.z)
      ) {
        issues.push({
          featureId: id,
          type: 'nan_or_infinite',
          message: `Feature ${id} contains non-finite numeric coordinates or scales.`,
        });
        continue;
      }

      // 2. Degenerate scale
      if (sc.x <= 0 || sc.y <= 0 || sc.z <= 0) {
        issues.push({
          featureId: id,
          type: 'degenerate_scale',
          message: `Feature ${id} has degenerate scale (<= 0): (${sc.x}, ${sc.y}, ${sc.z}).`,
        });
      }

      // 3. Out-of-bounds positioning
      if (
        pos.x < tankBounds.minX ||
        pos.x > tankBounds.maxX ||
        pos.z < tankBounds.minZ ||
        pos.z > tankBounds.maxZ ||
        pos.y < tankBounds.minY ||
        pos.y > tankBounds.maxY
      ) {
        issues.push({
          featureId: id,
          type: 'out_of_bounds',
          message: `Feature ${id} is placed outside tank boundaries: (${pos.x.toFixed(2)}, ${pos.y.toFixed(2)}, ${pos.z.toFixed(2)}).`,
        });
      }

      // 4. Ground support consistency for supported/rooted features
      const isSupported = state.topologyRelations.some(
        (r) =>
          r.targetId === 'TERRAIN' &&
          (r.relation === 'supported_by' || r.relation === 'rooted_on')
      );

      if (isSupported) {
        // Feature base elevation: pos.y - (sc.y * 0.5)
        // Expected base surface elevation: state.surfaceElevation - state.embeddingDepth
        // Tolerance: floating > 0.4 units above surface or buried > 1.2 units below surface
        const featureBase = pos.y - sc.y * 0.5;
        const groundSurface = state.surfaceElevation - state.embeddingDepth;
        const elevationDiff = featureBase - groundSurface;

        if (elevationDiff > 0.45) {
          issues.push({
            featureId: id,
            type: 'unsupported_floating',
            message: `Feature ${id} floats unsupported ${elevationDiff.toFixed(2)}m above terrain.`,
          });
        } else if (elevationDiff < -1.4) {
          issues.push({
            featureId: id,
            type: 'terrain_penetration',
            message: `Feature ${id} penetrates ${Math.abs(elevationDiff).toFixed(2)}m below substrate.`,
          });
        }
      }
    }

    const report: GeometricValidationReport = {
      isValid: issues.length === 0,
      issues,
      timestamp: performance.now(),
    };

    this.lastGeometricReport = report;
    return report;
  }

  public recordMutation(description: string): void {
    this.mutationHistory.push({
      timestamp: performance.now(),
      description,
    });
  }
}

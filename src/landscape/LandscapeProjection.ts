/**
 * Task 007 & Task 007A — Dynamic 4D Landscape Evolution, Geometry & Topology
 * LandscapeProjection: Projects authoritative simulation state into renderer-friendly
 * geometry, rocks, reef formations, and ecological flora anchors.
 *
 * CRITICAL ARCHITECTURAL PRINCIPLE (Section 37):
 * "The renderer is a projection of the world, not the world itself."
 * 4D semantic landscape -> authoritative landscape state -> 3D slice/projection -> render representation.
 */

import * as THREE from 'three';
import { LandscapeEvolutionSystem } from './LandscapeEvolutionSystem';
import { LandscapeFeatureState, SurfaceResolution } from './types';

export interface PlantAnchorTarget {
  id: string;
  origin: { x: number; y: number; z: number };
  group: THREE.Group;
}

export class LandscapeProjection {
  public readonly evolutionSystem: LandscapeEvolutionSystem;
  private cachedHeightGrid: Float32Array;
  private baseVertexPositions: Float32Array | null = null;
  private totalVertices: number = 65 * 33;
  private lastProjectionTime: number = 0;

  // Active projection instance for global queries (e.g. getSandBedHeight)
  private static activeInstance: LandscapeProjection | null = null;

  constructor(evolutionSystem: LandscapeEvolutionSystem) {
    this.evolutionSystem = evolutionSystem;
    this.cachedHeightGrid = new Float32Array(this.totalVertices);
    LandscapeProjection.activeInstance = this;
  }

  public static getActive(): LandscapeProjection | null {
    return LandscapeProjection.activeInstance;
  }

  /**
   * Projects the authoritative 4D landscape state onto the Three.js sandMesh geometry.
   * Unified Spatial Transformation (GAP-003, Sections 7 & 8):
   * Applies horizontal flow deformation (dx, dz) and vertical elevation displacement (dy)
   * to vertex positions, ensuring terrain and features evaluated at logical (x, z, w)
   * share the identical spatial deformation Phi_w(x, z).
   */
  public projectOntoMesh(mesh: THREE.Mesh): void {
    if (!mesh) return;
    const geo = mesh.geometry as THREE.BufferGeometry;
    if (!geo || !geo.attributes.position) return;

    const posAttr = geo.attributes.position;
    const vertexCount = posAttr.count;

    if (this.cachedHeightGrid.length !== vertexCount) {
      this.cachedHeightGrid = new Float32Array(vertexCount);
    }

    // Preserve baseline undeformed logical vertex coordinates
    if (!this.baseVertexPositions || this.baseVertexPositions.length !== vertexCount * 3) {
      this.baseVertexPositions = new Float32Array(posAttr.array);
    }

    const basePosY = mesh.position.y; // Typically -6.8

    for (let i = 0; i < vertexCount; i++) {
      const baseLocalX = this.baseVertexPositions[i * 3 + 0];
      const baseLocalY = this.baseVertexPositions[i * 3 + 1];

      // Mapping from PlaneGeometry local coordinates (rotation.x = -PI/2) to logical world coordinates:
      const worldX = baseLocalX;
      const worldZ = -baseLocalY;

      // Sample authoritative 4D surface resolution including elevation and 3D flow displacement
      const surf = this.evolutionSystem.resolveSurface(worldX, worldZ);
      this.cachedHeightGrid[i] = surf.elevation;

      // Unified spatial deformation Phi_w(x, z):
      // In local coordinates: local +X -> world +X, local -Y -> world +Z
      // So localX = baseLocalX + surf.flowDelta.x, localY = baseLocalY - surf.flowDelta.z
      const localX = baseLocalX + surf.flowDelta.x;
      const localY = baseLocalY - surf.flowDelta.z;
      const localZ = surf.elevation - basePosY;

      posAttr.setXYZ(i, localX, localY, localZ);
    }

    posAttr.needsUpdate = true;
    geo.computeVertexNormals();

    // Record displacement metrics for diagnostics
    this.evolutionSystem.recordDisplacement(this.cachedHeightGrid);
    this.lastProjectionTime = performance.now();
  }

  /**
   * Evaluates the unified spatial projection at logical coordinates (x, z, w).
   * Satisfies Section 9 coordinate-system invariant.
   */
  public projectSurface(x: number, z: number, w?: number) {
    return this.evolutionSystem.projectSurface(x, z, w);
  }

  /**
   * Projects an individual feature state at slice w.
   */
  public projectFeature(featureId: string, w?: number) {
    return this.evolutionSystem.projectFeature(featureId, w);
  }

  /**
   * Projects authoritative 4D geological formation states (GAP-001, Sections 4 & 5).
   * In addition to terrain field integration, allows optional renderer manifestation.
   */
  public projectFormations(
    formationMap?: Map<string, THREE.Object3D> | Record<string, THREE.Object3D>
  ): void {
    if (!formationMap) return;

    const entries =
      formationMap instanceof Map ? formationMap.entries() : Object.entries(formationMap);

    for (const [id, obj] of entries) {
      if (!obj) continue;
      const state = this.evolutionSystem.getFeatureState(id);
      if (!state) continue;

      obj.visible = state.visible;
      if (state.visible) {
        obj.position.set(
          state.projectedPosition.x,
          state.projectedPosition.y,
          state.projectedPosition.z
        );
        obj.scale.set(
          state.projectedScale.x,
          state.projectedScale.y,
          state.projectedScale.z
        );
      }
    }
  }

  /**
   * Projects authoritative 4D rock feature states onto renderer rock meshes (Section 13).
   * Drives position, scale, rotation, and visibility from M^4.
   */
  public projectRocks(
    rockMap: Map<string, THREE.Mesh> | Record<string, THREE.Mesh>
  ): void {
    if (!rockMap) return;

    const entries =
      rockMap instanceof Map ? rockMap.entries() : Object.entries(rockMap);

    for (const [id, mesh] of entries) {
      if (!mesh) continue;

      const state: LandscapeFeatureState | undefined =
        this.evolutionSystem.getFeatureState(id);
      if (!state) continue;

      mesh.visible = state.visible;

      if (state.visible) {
        mesh.position.set(
          state.projectedPosition.x,
          state.projectedPosition.y,
          state.projectedPosition.z
        );
        mesh.scale.set(
          state.projectedScale.x,
          state.projectedScale.y,
          state.projectedScale.z
        );
        mesh.rotation.set(
          state.projectedRotation.x,
          state.projectedRotation.y,
          state.projectedRotation.z
        );
      }
    }
  }

  /**
   * Projects authoritative 4D reef structure states onto renderer meshes (Section 14).
   */
  public projectReefStructures(
    reefMap: Map<string, THREE.Mesh> | Record<string, THREE.Mesh>
  ): void {
    if (!reefMap) return;

    const entries =
      reefMap instanceof Map ? reefMap.entries() : Object.entries(reefMap);

    for (const [id, mesh] of entries) {
      if (!mesh) continue;

      const state: LandscapeFeatureState | undefined =
        this.evolutionSystem.getFeatureState(id);
      if (!state) continue;

      mesh.visible = state.visible;

      if (state.visible) {
        mesh.position.set(
          state.projectedPosition.x,
          state.projectedPosition.y,
          state.projectedPosition.z
        );
        mesh.scale.set(
          state.projectedScale.x,
          state.projectedScale.y,
          state.projectedScale.z
        );
        mesh.rotation.set(
          state.projectedRotation.x,
          state.projectedRotation.y,
          state.projectedRotation.z
        );
      }
    }
  }

  /**
   * Projects ecological flora anchors to keep botanical plants rooted to the evolving seabed (Section 15).
   * Prevents biological organisms from ever hovering or being engulfed by shifting substrate dunes.
   */
  public projectFloraAnchors(plants: PlantAnchorTarget[]): void {
    if (!plants || !Array.isArray(plants)) return;

    for (let i = 0; i < plants.length; i++) {
      const p = plants[i];
      if (!p || !p.group) continue;

      const anchorId = `FLORA_ANCHOR_${p.id}`;
      const anchorState = this.evolutionSystem.getFeatureState(anchorId);

      if (anchorState && anchorState.visible) {
        // Apply delta from plant's original baseline origin
        p.group.position.set(
          anchorState.projectedPosition.x - p.origin.x,
          anchorState.projectedPosition.y - p.origin.y,
          anchorState.projectedPosition.z - p.origin.z
        );
        p.group.rotation.set(
          anchorState.projectedRotation.x,
          anchorState.projectedRotation.y,
          anchorState.projectedRotation.z
        );
      } else {
        // Fallback: direct surface query at plant origin
        const surf = this.evolutionSystem.resolveSurface(p.origin.x, p.origin.z);
        const targetY = surf.elevation - 0.05;
        p.group.position.set(
          surf.flowDelta.x,
          targetY - p.origin.y,
          surf.flowDelta.z
        );
        p.group.rotation.set(
          -surf.normal.z * 0.45,
          0,
          surf.normal.x * 0.45
        );
      }
    }
  }

  /**
   * Resolves the authoritative surface elevation, normal, curvature, gradient,
   * and 3D spatial flow displacement (dx, dy, dz) at coordinates (x, z).
   */
  public resolveSurface(x: number, z: number): SurfaceResolution {
    return this.evolutionSystem.resolveSurface(x, z);
  }

  /**
   * Fast spatial query for world seabed elevation at (x, z).
   * Used by microfauna, crabs, and benthic feeders.
   */
  public getHeightAt(x: number, z: number): number {
    return this.evolutionSystem.sampleHeight(x, z);
  }
}

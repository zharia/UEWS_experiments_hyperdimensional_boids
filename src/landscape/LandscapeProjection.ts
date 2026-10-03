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
   * Projects the authoritative 4D landscape heightfield onto the Three.js sandMesh geometry.
   * Modifies vertex buffer Z attribute and recomputes normals for accurate caustic shading.
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

    const basePosY = mesh.position.y; // Typically -6.8

    for (let i = 0; i < vertexCount; i++) {
      const localX = posAttr.getX(i);
      const localY = posAttr.getY(i);

      // Mapping from PlaneGeometry local coordinates (rotation.x = -PI/2) to world coordinates:
      const worldX = localX;
      const worldZ = -localY;

      // Sample authoritative 4D landscape elevation
      const worldH = this.evolutionSystem.sampleHeight(worldX, worldZ);
      this.cachedHeightGrid[i] = worldH;

      // Local displacement along plane normal (+localZ corresponds to +worldY)
      const localZ = worldH - basePosY;
      posAttr.setZ(i, localZ);
    }

    posAttr.needsUpdate = true;
    geo.computeVertexNormals();

    // Record displacement metrics for diagnostics
    this.evolutionSystem.recordDisplacement(this.cachedHeightGrid);
    this.lastProjectionTime = performance.now();
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

/**
 * Task 007 — Dynamic 4D Landscape Evolution, Geometry & Topology
 * LandscapeProjection: Projects authoritative simulation state into renderer-friendly
 * geometry and world spatial queries.
 */

import * as THREE from 'three';
import { LandscapeEvolutionSystem } from './LandscapeEvolutionSystem';

export class LandscapeProjection {
  public readonly evolutionSystem: LandscapeEvolutionSystem;
  private cachedHeightGrid: Float32Array;
  private gridCols: number = 65; // 64 segments + 1
  private gridRows: number = 33; // 32 segments + 1
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
    const geo = mesh.geometry as THREE.BufferGeometry;
    if (!geo || !geo.attributes.position) return;

    const posAttr = geo.attributes.position;
    const vertexCount = posAttr.count;

    // Allocate or verify cache size
    if (this.cachedHeightGrid.length !== vertexCount) {
      this.cachedHeightGrid = new Float32Array(vertexCount);
    }

    const basePosY = mesh.position.y; // Typically -6.8

    for (let i = 0; i < vertexCount; i++) {
      const localX = posAttr.getX(i);
      const localY = posAttr.getY(i);

      // Mapping from PlaneGeometry local coordinates (with rotation.x = -PI/2) to world coordinates:
      // worldX = localX
      // worldZ = -localY
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
   * Fast spatial query for world seabed elevation at (x, z).
   * Used by microfauna, crabs, and sunken food pellets.
   */
  public getHeightAt(x: number, z: number): number {
    return this.evolutionSystem.sampleHeight(x, z);
  }
}

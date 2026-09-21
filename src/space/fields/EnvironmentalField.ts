/**
 * Spatially addressable environmental fields.
 * Supports:
 *  - temperature
 *  - illumination
 *  - oxygen
 *  - nutrients
 *  - food
 *  - current (vector field)
 *  - turbidity
 *
 * Implements ISpatialFieldProvider so future implementations (such as OpenVDB or octree grids)
 * can plug in seamlessly without breaking simulation semantics.
 */

import { Vector3D } from '../physical/Vector3D';

export type EnvironmentalFieldType =
  | 'temperature'
  | 'illumination'
  | 'oxygen'
  | 'nutrients'
  | 'food'
  | 'turbidity';

export interface ISpatialFieldProvider {
  sample(x: number, y: number, z: number, field: EnvironmentalFieldType): number;
  sampleCurrent(x: number, y: number, z: number): Vector3D;
  set(x: number, y: number, z: number, field: EnvironmentalFieldType, value: number): void;
  add(x: number, y: number, z: number, field: EnvironmentalFieldType, delta: number): void;
  update(simDt: number, simTime: number): void;
  toJSON(): any;
  fromJSON(data: any): void;
}

export interface DiscreteGridConfig {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  minZ: number;
  maxZ: number;
  resolutionX?: number; // voxels in X
  resolutionY?: number;
  resolutionZ?: number;
}

export class DiscreteEnvironmentalFieldGrid implements ISpatialFieldProvider {
  public readonly minX: number;
  public readonly maxX: number;
  public readonly minY: number;
  public readonly maxY: number;
  public readonly minZ: number;
  public readonly maxZ: number;

  public readonly resX: number;
  public readonly resY: number;
  public readonly resZ: number;
  public readonly totalCells: number;

  // Discrete scalar field buffers (Float32Array for memory efficiency)
  private _temperature: Float32Array;
  private _illumination: Float32Array;
  private _oxygen: Float32Array;
  private _nutrients: Float32Array;
  private _food: Float32Array;
  private _turbidity: Float32Array;

  // Discrete vector current field (currentX, currentY, currentZ)
  private _currentX: Float32Array;
  private _currentY: Float32Array;
  private _currentZ: Float32Array;

  constructor(config: DiscreteGridConfig = {
    minX: -14.0, maxX: 14.0,
    minY: -7.0, maxY: 7.0,
    minZ: -6.0, maxZ: 6.0,
    resolutionX: 14,
    resolutionY: 8,
    resolutionZ: 6,
  }) {
    this.minX = config.minX;
    this.maxX = config.maxX;
    this.minY = config.minY;
    this.maxY = config.maxY;
    this.minZ = config.minZ;
    this.maxZ = config.maxZ;

    this.resX = config.resolutionX ?? 14;
    this.resY = config.resolutionY ?? 8;
    this.resZ = config.resolutionZ ?? 6;
    this.totalCells = this.resX * this.resY * this.resZ;

    this._temperature = new Float32Array(this.totalCells);
    this._illumination = new Float32Array(this.totalCells);
    this._oxygen = new Float32Array(this.totalCells);
    this._nutrients = new Float32Array(this.totalCells);
    this._food = new Float32Array(this.totalCells);
    this._turbidity = new Float32Array(this.totalCells);

    this._currentX = new Float32Array(this.totalCells);
    this._currentY = new Float32Array(this.totalCells);
    this._currentZ = new Float32Array(this.totalCells);

    this.initializeBaseline();
  }

  private initializeBaseline() {
    for (let x = 0; x < this.resX; x++) {
      for (let y = 0; y < this.resY; y++) {
        for (let z = 0; z < this.resZ; z++) {
          const idx = this.getIndex(x, y, z);
          const yNorm = y / Math.max(1, this.resY - 1); // 0 at bottom, 1 at top

          // Natural vertical stratification: warmer & brighter at surface, cooler & richer at benthic floor
          this._temperature[idx] = 23.5 + yNorm * 2.0; // 23.5 - 25.5 deg C
          this._illumination[idx] = 0.2 + yNorm * 0.8; // higher near top lights
          this._oxygen[idx] = 6.5 + yNorm * 1.5;       // 6.5 - 8.0 mg/L
          this._nutrients[idx] = 0.5 - yNorm * 0.3;    // settled organic nutrients near substrate
          this._food[idx] = 0.0;
          this._turbidity[idx] = 0.08;

          // Gentle convective laminar current
          const xNorm = (x / Math.max(1, this.resX - 1)) * 2.0 - 1.0;
          this._currentX[idx] = Math.sin(yNorm * Math.PI) * 0.15;
          this._currentY[idx] = -0.02 + Math.cos(xNorm * Math.PI) * 0.04;
          this._currentZ[idx] = 0.0;
        }
      }
    }
  }

  private getIndex(ix: number, iy: number, iz: number): number {
    return (ix * this.resY + iy) * this.resZ + iz;
  }

  private worldToGrid(x: number, y: number, z: number): { gx: number; gy: number; gz: number } {
    const u = Math.max(0, Math.min(1, (x - this.minX) / (this.maxX - this.minX)));
    const v = Math.max(0, Math.min(1, (y - this.minY) / (this.maxY - this.minY)));
    const w = Math.max(0, Math.min(1, (z - this.minZ) / (this.maxZ - this.minZ)));

    const gx = Math.min(this.resX - 1, Math.floor(u * this.resX));
    const gy = Math.min(this.resY - 1, Math.floor(v * this.resY));
    const gz = Math.min(this.resZ - 1, Math.floor(w * this.resZ));
    return { gx, gy, gz };
  }

  private getBuffer(field: EnvironmentalFieldType): Float32Array {
    switch (field) {
      case 'temperature': return this._temperature;
      case 'illumination': return this._illumination;
      case 'oxygen': return this._oxygen;
      case 'nutrients': return this._nutrients;
      case 'food': return this._food;
      case 'turbidity': return this._turbidity;
    }
  }

  public sample(x: number, y: number, z: number, field: EnvironmentalFieldType): number {
    const { gx, gy, gz } = this.worldToGrid(x, y, z);
    const buf = this.getBuffer(field);
    return buf[this.getIndex(gx, gy, gz)];
  }

  public sampleCurrent(x: number, y: number, z: number): Vector3D {
    const { gx, gy, gz } = this.worldToGrid(x, y, z);
    const idx = this.getIndex(gx, gy, gz);
    return new Vector3D(this._currentX[idx], this._currentY[idx], this._currentZ[idx]);
  }

  public set(x: number, y: number, z: number, field: EnvironmentalFieldType, value: number): void {
    const { gx, gy, gz } = this.worldToGrid(x, y, z);
    const buf = this.getBuffer(field);
    buf[this.getIndex(gx, gy, gz)] = value;
  }

  public add(x: number, y: number, z: number, field: EnvironmentalFieldType, delta: number): void {
    const { gx, gy, gz } = this.worldToGrid(x, y, z);
    const buf = this.getBuffer(field);
    const idx = this.getIndex(gx, gy, gz);
    buf[idx] = Math.max(0, buf[idx] + delta);
  }

  /**
   * Environmental field diffusion, natural decay, and circadian illumination cycling
   */
  public update(simDt: number, simTime: number): void {
    const diffusionRate = 0.05 * simDt;
    const decayRate = 0.02 * simDt;

    // Simple 6-neighbor discrete Laplacian diffusion for nutrients and food
    const nutrientCopy = new Float32Array(this._nutrients);
    const foodCopy = new Float32Array(this._food);

    for (let x = 1; x < this.resX - 1; x++) {
      for (let y = 1; y < this.resY - 1; y++) {
        for (let z = 1; z < this.resZ - 1; z++) {
          const idx = this.getIndex(x, y, z);
          
          // Nutrients diffusion
          const nNeighbors = (
            nutrientCopy[this.getIndex(x + 1, y, z)] +
            nutrientCopy[this.getIndex(x - 1, y, z)] +
            nutrientCopy[this.getIndex(x, y + 1, z)] +
            nutrientCopy[this.getIndex(x, y - 1, z)] +
            nutrientCopy[this.getIndex(x, y, z + 1)] +
            nutrientCopy[this.getIndex(x, y, z - 1)]
          ) / 6.0;

          this._nutrients[idx] += (nNeighbors - nutrientCopy[idx]) * diffusionRate;
          // Nutrients settle slightly toward benthic floor
          if (y > 0 && Math.random() < 0.05) {
            this._nutrients[idx] *= 0.998;
          }

          // Dissolved food diffusion & bacterial consumption
          if (foodCopy[idx] > 0.001) {
            this._food[idx] = Math.max(0, this._food[idx] - decayRate * 0.1);
          }
        }
      }
    }

    // Circadian illumination fluctuation based on simulation time
    const dayCycle = (Math.sin(simTime * 0.05) + 1.0) * 0.5; // 0 to 1
    for (let i = 0; i < this.totalCells; i++) {
      const yNorm = (Math.floor(i / this.resZ) % this.resY) / Math.max(1, this.resY - 1);
      this._illumination[i] = 0.05 + dayCycle * (0.2 + yNorm * 0.75);
    }
  }

  public toJSON(): any {
    return {
      minX: this.minX, maxX: this.maxX,
      minY: this.minY, maxY: this.maxY,
      minZ: this.minZ, maxZ: this.maxZ,
      resX: this.resX, resY: this.resY, resZ: this.resZ,
      temperature: Array.from(this._temperature),
      illumination: Array.from(this._illumination),
      oxygen: Array.from(this._oxygen),
      nutrients: Array.from(this._nutrients),
      food: Array.from(this._food),
      turbidity: Array.from(this._turbidity),
    };
  }

  public fromJSON(data: any): void {
    if (!data) return;
    if (data.temperature && data.temperature.length === this.totalCells) {
      this._temperature.set(data.temperature);
    }
    if (data.illumination && data.illumination.length === this.totalCells) {
      this._illumination.set(data.illumination);
    }
    if (data.oxygen && data.oxygen.length === this.totalCells) {
      this._oxygen.set(data.oxygen);
    }
    if (data.nutrients && data.nutrients.length === this.totalCells) {
      this._nutrients.set(data.nutrients);
    }
    if (data.food && data.food.length === this.totalCells) {
      this._food.set(data.food);
    }
    if (data.turbidity && data.turbidity.length === this.totalCells) {
      this._turbidity.set(data.turbidity);
    }
  }
}

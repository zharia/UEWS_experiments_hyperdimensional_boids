/**
 * Hyperdimensional & Latent State Abstraction.
 *
 * Distinguishes:
 *  - Physical State (x, y, z)
 *  - Latent State (h_0, h_1, ... h_n)
 *
 * Invariant Preservation:
 *  - The existing 4th dimension (temporal hyperplane coordinate w) is mapped to index 0 (DIM_TEMPORAL_W).
 *  - Additional semantic channels (curiosity, hunger, fear, affinity, territoriality, etc.) are addressable
 *    via semantic channel descriptors without hard-coding dimensional limits.
 */

export interface ILatentStateJSON {
  dimensions: number[];
  channelLabels?: string[];
}

export class LatentState {
  // Configurable channel indices
  public static readonly DIM_TEMPORAL_W = 0; // Existing 4D boids temporal coordinate w
  public static readonly DIM_CURIOSITY = 1;
  public static readonly DIM_HUNGER = 2;
  public static readonly DIM_FEAR = 3;
  public static readonly DIM_SOCIAL_AFFINITY = 4;
  public static readonly DIM_TERRITORIALITY = 5;
  public static readonly DIM_AROUSAL = 6;
  public static readonly DIM_FAMILIARITY = 7;

  public dimensions: Float64Array;
  private _labels: string[];

  constructor(size: number = 8, initialValues?: number[] | Float64Array, labels?: string[]) {
    this.dimensions = new Float64Array(Math.max(1, size));
    this._labels = labels || [
      'temporal_w',
      'curiosity',
      'hunger',
      'fear',
      'social_affinity',
      'territoriality',
      'arousal',
      'familiarity',
    ];

    if (initialValues) {
      const len = Math.min(this.dimensions.length, initialValues.length);
      for (let i = 0; i < len; i++) {
        this.dimensions[i] = initialValues[i];
      }
    }
  }

  public get size(): number {
    return this.dimensions.length;
  }

  public get temporalW(): number {
    return this.dimensions[LatentState.DIM_TEMPORAL_W] ?? 0;
  }

  public set temporalW(val: number) {
    this.dimensions[LatentState.DIM_TEMPORAL_W] = val;
  }

  public get(index: number): number {
    return this.dimensions[index] ?? 0;
  }

  public set(index: number, value: number): void {
    if (index >= 0 && index < this.dimensions.length) {
      this.dimensions[index] = value;
    }
  }

  public getByName(name: string): number {
    const idx = this._labels.indexOf(name);
    return idx !== -1 ? this.get(idx) : 0;
  }

  public setByName(name: string, value: number): void {
    const idx = this._labels.indexOf(name);
    if (idx !== -1) {
      this.set(idx, value);
    }
  }

  /**
   * Calculates weighted Euclidean distance in latent space.
   * Can include or exclude the temporal w dimension.
   */
  public distanceTo(other: LatentState, weights?: Float64Array | number[]): number {
    const len = Math.min(this.dimensions.length, other.dimensions.length);
    let sum = 0;
    for (let i = 0; i < len; i++) {
      const diff = this.dimensions[i] - other.dimensions[i];
      const w = weights ? (weights[i] ?? 1.0) : 1.0;
      sum += diff * diff * w;
    }
    return Math.sqrt(sum);
  }

  /**
   * Blends toward target latent state by factor alpha in [0, 1]
   */
  public lerp(target: LatentState, alpha: number): this {
    const clampedAlpha = Math.max(0, Math.min(1, alpha));
    const len = Math.min(this.dimensions.length, target.dimensions.length);
    for (let i = 0; i < len; i++) {
      this.dimensions[i] += (target.dimensions[i] - this.dimensions[i]) * clampedAlpha;
    }
    return this;
  }

  public clone(): LatentState {
    const copy = new LatentState(this.dimensions.length, this.dimensions, [...this._labels]);
    return copy;
  }

  public toJSON(): ILatentStateJSON {
    return {
      dimensions: Array.from(this.dimensions),
      channelLabels: [...this._labels],
    };
  }

  public static fromJSON(json: ILatentStateJSON): LatentState {
    const dims = json.dimensions || [0];
    return new LatentState(dims.length, dims, json.channelLabels);
  }
}

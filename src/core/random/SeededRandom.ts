/**
 * Deterministic pseudo-random number generator for reproducible simulations.
 * Uses Mulberry32 algorithm with seed support and optional non-deterministic mode.
 */

export class SeededRandom {
  private _seed: number;
  private _state: number;
  public readonly isDeterministic: boolean;

  constructor(seed?: number) {
    if (seed !== undefined) {
      this._seed = seed;
      this._state = seed >>> 0;
      this.isDeterministic = true;
    } else {
      this._seed = Math.floor(Math.random() * 0xffffffff);
      this._state = this._seed;
      this.isDeterministic = false;
    }
  }

  public get seed(): number {
    return this._seed;
  }

  public reset(seed?: number): void {
    if (seed !== undefined) {
      this._seed = seed;
    }
    this._state = this._seed >>> 0;
  }

  /**
   * Generates a pseudo-random float in [0, 1)
   */
  public next(): number {
    if (!this.isDeterministic) {
      return Math.random();
    }
    // Mulberry32
    let t = (this._state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /**
   * Returns a float in [min, max)
   */
  public nextFloat(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  /**
   * Returns an integer in [min, max]
   */
  public nextInt(min: number, max: number): number {
    return Math.floor(this.nextFloat(min, max + 1));
  }

  /**
   * Returns a boolean with given probability of true
   */
  public nextBool(probability: number = 0.5): boolean {
    return this.next() < probability;
  }

  /**
   * Returns a Gaussian (normal) distributed float with mean and standard deviation
   * Uses Box-Muller transform
   */
  public nextGaussian(mean: number = 0, stdDev: number = 1): number {
    const u1 = Math.max(1e-12, this.next());
    const u2 = this.next();
    const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    return mean + z * stdDev;
  }

  /**
   * Picks a random element from an array
   */
  public choice<T>(array: T[]): T | undefined {
    if (array.length === 0) return undefined;
    const index = Math.floor(this.next() * array.length);
    return array[index];
  }
}

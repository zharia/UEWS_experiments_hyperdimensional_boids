/**
 * 3D Physical Vector primitive for agent physical state, velocities, and targets.
 */

export interface IVector3D {
  x: number;
  y: number;
  z: number;
}

export class Vector3D implements IVector3D {
  constructor(public x: number = 0, public y: number = 0, public z: number = 0) {}

  public set(x: number, y: number, z: number): this {
    this.x = x;
    this.y = y;
    this.z = z;
    return this;
  }

  public copy(v: IVector3D): this {
    this.x = v.x;
    this.y = v.y;
    this.z = v.z;
    return this;
  }

  public clone(): Vector3D {
    return new Vector3D(this.x, this.y, this.z);
  }

  public add(v: IVector3D): this {
    this.x += v.x;
    this.y += v.y;
    this.z += v.z;
    return this;
  }

  public addScaled(v: IVector3D, scale: number): this {
    this.x += v.x * scale;
    this.y += v.y * scale;
    this.z += v.z * scale;
    return this;
  }

  public sub(v: IVector3D): this {
    this.x -= v.x;
    this.y -= v.y;
    this.z -= v.z;
    return this;
  }

  public multiplyScalar(scalar: number): this {
    this.x *= scalar;
    this.y *= scalar;
    this.z *= scalar;
    return this;
  }

  public lengthSq(): number {
    return this.x * this.x + this.y * this.y + this.z * this.z;
  }

  public length(): number {
    return Math.sqrt(this.lengthSq());
  }

  public normalize(): this {
    const len = this.length();
    if (len > 1e-6) {
      this.multiplyScalar(1.0 / len);
    } else {
      this.set(0, 0, 0);
    }
    return this;
  }

  public clampLength(max: number): this {
    const lenSq = this.lengthSq();
    if (lenSq > max * max && lenSq > 1e-6) {
      this.multiplyScalar(max / Math.sqrt(lenSq));
    }
    return this;
  }

  public distanceToSq(v: IVector3D): number {
    const dx = this.x - v.x;
    const dy = this.y - v.y;
    const dz = this.z - v.z;
    return dx * dx + dy * dy + dz * dz;
  }

  public distanceTo(v: IVector3D): number {
    return Math.sqrt(this.distanceToSq(v));
  }

  public dot(v: IVector3D): number {
    return this.x * v.x + this.y * v.y + this.z * v.z;
  }

  public toJSON(): IVector3D {
    return { x: this.x, y: this.y, z: this.z };
  }

  public static fromJSON(json: IVector3D): Vector3D {
    return new Vector3D(json.x ?? 0, json.y ?? 0, json.z ?? 0);
  }
}

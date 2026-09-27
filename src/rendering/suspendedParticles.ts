/**
 * Suspended Particle Ecology System (Program Increment v0.0.1 - Task 003).
 *
 * Implements the particle ecology layer:
 *  - Sparse suspended marine snow, micro-detritus, and phytoplankton
 *  - Correlated motion driven by authoritative environmental flow and micro-turbulence
 *  - Zero per-frame GC allocations
 */

import * as THREE from 'three';
import { Vector3D } from '../space/physical/Vector3D';

export class SuspendedParticleSystem {
  public mesh: THREE.Points;
  private _geometry: THREE.BufferGeometry;
  private _material: THREE.PointsMaterial;
  private _positions: Float32Array;
  private _baseSizes: Float32Array;
  private _phases: Float32Array;
  private _maxParticles: number = 300;
  private _texture: THREE.CanvasTexture;

  // Tank volume bounds
  private readonly minX = -13.5;
  private readonly maxX = 13.5;
  private readonly minY = -6.4;
  private readonly maxY = 6.4;
  private readonly minZ = -5.5;
  private readonly maxZ = 5.5;

  constructor(scene: THREE.Scene, maxParticles: number = 300) {
    this._maxParticles = maxParticles;
    this._geometry = new THREE.BufferGeometry();
    this._positions = new Float32Array(this._maxParticles * 3);
    this._baseSizes = new Float32Array(this._maxParticles);
    this._phases = new Float32Array(this._maxParticles);

    // Generate soft circular Gaussian particulate sprite texture
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d')!;
    const grad = ctx.createRadialGradient(16, 16, 2, 16, 16, 16);
    grad.addColorStop(0.0, 'rgba(255, 255, 255, 0.95)');
    grad.addColorStop(0.4, 'rgba(210, 240, 255, 0.6)');
    grad.addColorStop(0.8, 'rgba(180, 220, 240, 0.15)');
    grad.addColorStop(1.0, 'rgba(180, 220, 240, 0.0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(16, 16, 16, 0, Math.PI * 2);
    ctx.fill();

    this._texture = new THREE.CanvasTexture(canvas);

    // Distribute particles uniformly through water column
    for (let i = 0; i < this._maxParticles; i++) {
      this._positions[i * 3 + 0] = this.minX + Math.random() * (this.maxX - this.minX);
      this._positions[i * 3 + 1] = this.minY + Math.random() * (this.maxY - this.minY);
      this._positions[i * 3 + 2] = this.minZ + Math.random() * (this.maxZ - this.minZ);
      this._baseSizes[i] = 0.18 + Math.random() * 0.22;
      this._phases[i] = Math.random() * Math.PI * 2;
    }

    this._geometry.setAttribute('position', new THREE.BufferAttribute(this._positions, 3));

    this._material = new THREE.PointsMaterial({
      map: this._texture,
      size: 0.32,
      transparent: true,
      opacity: 0.45,
      depthWrite: false,
      blending: THREE.NormalBlending,
    });

    this.mesh = new THREE.Points(this._geometry, this._material);
    this.mesh.frustumCulled = false;
    scene.add(this.mesh);
  }

  /**
   * Updates particle positions based on authoritative environmental flow vector and micro-turbulence.
   */
  public update(
    dt: number,
    simTime: number,
    flowVelocity: Vector3D,
    turbulence: number,
    targetCount: number,
    opacity: number,
    sizeScale: number
  ): void {
    const posAttr = this._geometry.attributes.position as THREE.BufferAttribute;
    const pos = posAttr.array as Float32Array;

    const count = Math.min(this._maxParticles, Math.max(20, targetCount));
    const turbMag = turbulence * 0.45;

    for (let i = 0; i < this._maxParticles; i++) {
      if (i >= count) {
        // Hide inactive particles by parking them below substrate
        pos[i * 3 + 1] = -100;
        continue;
      }

      const phase = this._phases[i];

      // Subtle 3D harmonic micro-eddy curl
      const eddyX = Math.sin(simTime * 1.2 + phase) * turbMag;
      const eddyY = Math.cos(simTime * 0.9 + phase * 1.3) * (turbMag * 0.6) - 0.012; // Slow gentle settling
      const eddyZ = Math.cos(simTime * 1.1 + phase * 0.7) * turbMag;

      pos[i * 3 + 0] += (flowVelocity.x + eddyX) * dt;
      pos[i * 3 + 1] += (flowVelocity.y + eddyY) * dt;
      pos[i * 3 + 2] += (flowVelocity.z + eddyZ) * dt;

      // Wrap boundaries smoothly with random lateral offset
      if (pos[i * 3 + 0] > this.maxX) {
        pos[i * 3 + 0] = this.minX + 0.1;
        pos[i * 3 + 1] = this.minY + Math.random() * (this.maxY - this.minY);
      } else if (pos[i * 3 + 0] < this.minX) {
        pos[i * 3 + 0] = this.maxX - 0.1;
        pos[i * 3 + 1] = this.minY + Math.random() * (this.maxY - this.minY);
      }

      if (pos[i * 3 + 1] < this.minY) {
        // Settled to substrate -> respawn at surface with random x, z
        pos[i * 3 + 1] = this.maxY - 0.2;
        pos[i * 3 + 0] = this.minX + Math.random() * (this.maxX - this.minX);
        pos[i * 3 + 2] = this.minZ + Math.random() * (this.maxZ - this.minZ);
      } else if (pos[i * 3 + 1] > this.maxY) {
        pos[i * 3 + 1] = this.minY + 0.2;
      }

      if (pos[i * 3 + 2] > this.maxZ) {
        pos[i * 3 + 2] = this.minZ + 0.1;
      } else if (pos[i * 3 + 2] < this.minZ) {
        pos[i * 3 + 2] = this.maxZ - 0.1;
      }
    }

    posAttr.needsUpdate = true;

    this._material.opacity = Math.max(0.15, Math.min(0.85, opacity));
    this._material.size = 0.32 * Math.max(0.7, Math.min(1.8, sizeScale));
  }

  public destroy(scene: THREE.Scene): void {
    scene.remove(this.mesh);
    this._geometry.dispose();
    this._material.dispose();
    this._texture.dispose();
  }
}

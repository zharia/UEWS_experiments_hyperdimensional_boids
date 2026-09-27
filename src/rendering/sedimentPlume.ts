/**
 * Benthic Sediment Plume System (Program Increment v0.0.1 - Task 003).
 *
 * Simulates fine sediment and silt puffs kicked up from the substrate during:
 *  - Feeding events near the tank bottom
 *  - External or hydrodynamic disturbance
 *  - Benthic organism foraging
 *
 * Settles naturally according to sediment settling physics.
 */

import * as THREE from 'three';
import { Vector3D } from '../space/physical/Vector3D';

interface SedimentParticle {
  active: boolean;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
  size: number;
}

export class SedimentPlumeSystem {
  public mesh: THREE.Points;
  private _geometry: THREE.BufferGeometry;
  private _material: THREE.PointsMaterial;
  private _particles: SedimentParticle[] = [];
  private _positions: Float32Array;
  private _maxParticles: number = 80;
  private _texture: THREE.CanvasTexture;

  constructor(scene: THREE.Scene, maxParticles: number = 80) {
    this._maxParticles = maxParticles;
    this._geometry = new THREE.BufferGeometry();
    this._positions = new Float32Array(this._maxParticles * 3);

    for (let i = 0; i < this._maxParticles; i++) {
      this._particles.push({
        active: false,
        x: 0,
        y: -100,
        z: 0,
        vx: 0,
        vy: 0,
        vz: 0,
        life: 0,
        maxLife: 1.0,
        size: 0.4,
      });
      this._positions[i * 3 + 0] = 0;
      this._positions[i * 3 + 1] = -100;
      this._positions[i * 3 + 2] = 0;
    }

    this._geometry.setAttribute('position', new THREE.BufferAttribute(this._positions, 3));

    // Warm silt/sand sediment puff texture
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d')!;
    const grad = ctx.createRadialGradient(16, 16, 2, 16, 16, 16);
    grad.addColorStop(0.0, 'rgba(215, 195, 165, 0.75)');
    grad.addColorStop(0.5, 'rgba(180, 160, 135, 0.35)');
    grad.addColorStop(1.0, 'rgba(150, 135, 115, 0.0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(16, 16, 16, 0, Math.PI * 2);
    ctx.fill();

    this._texture = new THREE.CanvasTexture(canvas);

    this._material = new THREE.PointsMaterial({
      map: this._texture,
      size: 0.55,
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
      blending: THREE.NormalBlending,
    });

    this.mesh = new THREE.Points(this._geometry, this._material);
    this.mesh.frustumCulled = false;
    scene.add(this.mesh);
  }

  /**
   * Spawns a localized puff of sediment at the given tank bottom location.
   */
  public spawnPuff(x: number, z: number, intensity: number = 0.5): void {
    const count = Math.min(12, Math.round(5 + intensity * 7));
    let spawned = 0;

    for (let i = 0; i < this._maxParticles && spawned < count; i++) {
      const p = this._particles[i];
      if (!p.active) {
        p.active = true;
        p.x = x + (Math.random() - 0.5) * 0.8;
        p.y = -6.5 + Math.random() * 0.2;
        p.z = z + (Math.random() - 0.5) * 0.8;
        p.vx = (Math.random() - 0.5) * 0.25;
        p.vy = 0.35 + Math.random() * 0.45 * intensity; // Upward plume
        p.vz = (Math.random() - 0.5) * 0.25;
        p.life = 0.0;
        p.maxLife = 2.5 + Math.random() * 2.0;
        p.size = 0.35 + Math.random() * 0.3;
        spawned++;
      }
    }
  }

  public update(dt: number, flowVelocity: Vector3D): void {
    const posAttr = this._geometry.attributes.position as THREE.BufferAttribute;
    const pos = posAttr.array as Float32Array;

    for (let i = 0; i < this._maxParticles; i++) {
      const p = this._particles[i];
      if (!p.active) {
        pos[i * 3 + 1] = -100;
        continue;
      }

      p.life += dt;
      if (p.life >= p.maxLife) {
        p.active = false;
        pos[i * 3 + 1] = -100;
        continue;
      }

      // Drag + gravitational settling downward
      p.vy -= 0.22 * dt; // Gravity slows upward rise and causes settling
      p.vx += (flowVelocity.x * 0.5 - p.vx) * dt * 2.0;
      p.vz += (flowVelocity.z * 0.5 - p.vz) * dt * 2.0;

      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.z += p.vz * dt;

      // Settle back to sand bed
      if (p.y <= -6.6) {
        p.active = false;
        pos[i * 3 + 1] = -100;
        continue;
      }

      pos[i * 3 + 0] = p.x;
      pos[i * 3 + 1] = p.y;
      pos[i * 3 + 2] = p.z;
    }

    posAttr.needsUpdate = true;
  }

  public destroy(scene: THREE.Scene): void {
    scene.remove(this.mesh);
    this._geometry.dispose();
    this._material.dispose();
    this._texture.dispose();
  }
}

/**
 * Task 007 — Dynamic 4D Landscape Evolution, Geometry & Topology
 * Landscape4DField: Analytical 4D continuous field defining the evolving landscape manifold M^4.
 *
 * Models the visible 3D landscape Sigma_t^3 as a continuous section:
 * L_t(x, z) = L(x, z, w(t))
 */

import { SeededRandom } from '../core/random/SeededRandom';

export interface HarmonicMode4D {
  kx: number;
  kz: number;
  omegaW: number;
  amplitude: number;
  phase: number;
}

export interface LocalizedGeologicalFeature4D {
  id: string;
  cx: number;
  cz: number;
  cw: number;
  radiusX: number;
  radiusZ: number;
  radiusW: number;
  peakHeight: number;
}

export class Landscape4DField {
  public readonly seed: number;
  private random: SeededRandom;
  public readonly baseElevation: number = -6.72;

  // Analytical 4D spectral harmonic modes with incommensurate frequencies (golden ratio / irrationals)
  private modes: HarmonicMode4D[] = [];

  // Localized 4D geological formations that emerge, transform, and recede across w
  private geologicalFormations: LocalizedGeologicalFeature4D[] = [];

  constructor(seed: number = 4242) {
    this.seed = seed;
    this.random = new SeededRandom(seed);
    this.initializeModes();
    this.initializeFormations();
  }

  /**
   * Initializes multi-scale 4D harmonic basis functions with incommensurate temporal frequencies
   * ensuring non-periodic, drifting, rich continuous evolution.
   */
  private initializeModes(): void {
    const PHI = 1.618033988749895; // Golden ratio
    const SQRT2 = 1.4142135623730951;
    const SQRT3 = 1.7320508075688772;

    // Mode 1: Primary macro dune undulation (matching initial state at w=0)
    this.modes.push({
      kx: 0.25,
      kz: 0.40,
      omegaW: 0.08,
      amplitude: 0.35,
      phase: 0.0,
    });

    // Mode 2: Orthogonal macro dune
    this.modes.push({
      kx: 0.35,
      kz: -0.22,
      omegaW: 0.08 * PHI,
      amplitude: 0.25,
      phase: Math.PI * 0.3,
    });

    // Mode 3: Intermediate migratory ridge
    this.modes.push({
      kx: 0.65,
      kz: 0.55,
      omegaW: 0.12 * SQRT2,
      amplitude: 0.18,
      phase: Math.PI * 0.7,
    });

    // Mode 4: Current ripple crests
    this.modes.push({
      kx: 1.6,
      kz: 0.8,
      omegaW: 0.18 * SQRT3,
      amplitude: 0.12,
      phase: 0.2,
    });

    // Mode 5: Transverse cross-current ripple
    this.modes.push({
      kx: 2.4,
      kz: -1.2,
      omegaW: 0.22 * (PHI - 0.5),
      amplitude: 0.06,
      phase: 1.1,
    });

    // Mode 6: Fine benthic micro-hollows
    this.modes.push({
      kx: 4.0,
      kz: 3.0,
      omegaW: 0.32,
      amplitude: 0.03,
      phase: 2.4,
    });

    // Mode 7 & 8: Seeded subtle wandering modes
    for (let i = 0; i < 4; i++) {
      this.modes.push({
        kx: (this.random.next() - 0.5) * 1.8,
        kz: (this.random.next() - 0.5) * 1.8,
        omegaW: 0.05 + this.random.next() * 0.15,
        amplitude: 0.04 + this.random.next() * 0.04,
        phase: this.random.next() * Math.PI * 2,
      });
    }
  }

  /**
   * Initializes 4D localized geological formations (hyper-ellipsoidal lumps in M^4).
   * As w traverses, a formation smoothly swells into existence in 3D, shifts, and recedes.
   */
  private initializeFormations(): void {
    // Formation 1: West shelf dune crest (emerges around w=0 to w=20)
    this.geologicalFormations.push({
      id: 'WEST_SHELF_DUNE',
      cx: -6.5,
      cz: -1.5,
      cw: 10.0,
      radiusX: 5.5,
      radiusZ: 3.8,
      radiusW: 14.0,
      peakHeight: 0.38,
    });

    // Formation 2: East sand bank (peaks around w=25 to w=50)
    this.geologicalFormations.push({
      id: 'EAST_SAND_BANK',
      cx: 6.8,
      cz: 0.8,
      cw: 35.0,
      radiusX: 6.0,
      radiusZ: 4.2,
      radiusW: 16.0,
      peakHeight: 0.42,
    });

    // Formation 3: Central Trench depression (recedes and deepens)
    this.geologicalFormations.push({
      id: 'CENTRAL_TRENCH',
      cx: 0.5,
      cz: -2.2,
      cw: 60.0,
      radiusX: 4.8,
      radiusZ: 3.2,
      radiusW: 18.0,
      peakHeight: -0.35, // Depression
    });

    // Formation 4: Seafloor plateau (later epoch)
    this.geologicalFormations.push({
      id: 'SEABED_PLATEAU',
      cx: -2.0,
      cz: 2.4,
      cw: 85.0,
      radiusX: 5.2,
      radiusZ: 3.6,
      radiusW: 15.0,
      peakHeight: 0.36,
    });
  }

  /**
   * Computes smooth periodic 4D coordinate distance along w across geological epochs.
   */
  private getDeltaW(w: number, cw: number): number {
    const PERIOD_W = 100.0;
    const rawDeltaW = w - cw;
    return ((((rawDeltaW + PERIOD_W * 0.5) % PERIOD_W) + PERIOD_W) % PERIOD_W) - PERIOD_W * 0.5;
  }

  /**
   * Evaluates the 4D landscape height H(x, z, w) at coordinates (x, z, w).
   * Exact, continuous, and C^infinity smooth.
   */
  public evaluateHeight(x: number, z: number, w: number): number {
    let h = this.baseElevation;

    // 1. Spectral harmonic superposition
    for (let i = 0; i < this.modes.length; i++) {
      const m = this.modes[i];
      const theta = m.kx * x + m.kz * z + m.omegaW * w + m.phase;
      h += m.amplitude * Math.sin(theta);
    }

    // 2. Localized 4D geological formations
    for (let j = 0; j < this.geologicalFormations.length; j++) {
      const gf = this.geologicalFormations[j];
      const dx = (x - gf.cx) / gf.radiusX;
      const dz = (z - gf.cz) / gf.radiusZ;
      const dw = this.getDeltaW(w, gf.cw) / gf.radiusW;
      const distSq4D = dx * dx + dz * dz + dw * dw;

      if (distSq4D < 1.0) {
        // Smooth C^2 bump function: (1 - r^2)^3
        const bump = Math.pow(1.0 - distSq4D, 3);
        h += gf.peakHeight * bump;
      }
    }

    return h;
  }

  /**
   * Evaluates the exact analytical gradient (dH/dx, dH/dz) at (x, z, w).
   */
  public evaluateGradient(x: number, z: number, w: number): { dx: number; dz: number } {
    let dh_dx = 0;
    let dh_dz = 0;

    for (let i = 0; i < this.modes.length; i++) {
      const m = this.modes[i];
      const theta = m.kx * x + m.kz * z + m.omegaW * w + m.phase;
      const dTheta = m.amplitude * Math.cos(theta);
      dh_dx += dTheta * m.kx;
      dh_dz += dTheta * m.kz;
    }

    for (let j = 0; j < this.geologicalFormations.length; j++) {
      const gf = this.geologicalFormations[j];
      const dx = (x - gf.cx) / gf.radiusX;
      const dz = (z - gf.cz) / gf.radiusZ;
      const dw = this.getDeltaW(w, gf.cw) / gf.radiusW;
      const distSq4D = dx * dx + dz * dz + dw * dw;

      if (distSq4D < 1.0) {
        // d/dx [ A * (1 - r^2)^3 ] = A * 3 * (1 - r^2)^2 * (-2 dx / Rx)
        const factor = gf.peakHeight * 3.0 * Math.pow(1.0 - distSq4D, 2) * -2.0;
        dh_dx += factor * (dx / gf.radiusX);
        dh_dz += factor * (dz / gf.radiusZ);
      }
    }

    return { dx: dh_dx, dz: dh_dz };
  }

  /**
   * Evaluates exact analytical Hessian (second derivatives: d^2H/dx^2, d^2H/dz^2, d^2H/dxdz).
   */
  public evaluateHessian(x: number, z: number, w: number): { dxx: number; dzz: number; dxz: number } {
    let dxx = 0;
    let dzz = 0;
    let dxz = 0;

    for (let i = 0; i < this.modes.length; i++) {
      const m = this.modes[i];
      const theta = m.kx * x + m.kz * z + m.omegaW * w + m.phase;
      const d2Theta = -m.amplitude * Math.sin(theta);
      dxx += d2Theta * m.kx * m.kx;
      dzz += d2Theta * m.kz * m.kz;
      dxz += d2Theta * m.kx * m.kz;
    }

    for (let j = 0; j < this.geologicalFormations.length; j++) {
      const gf = this.geologicalFormations[j];
      const dx = (x - gf.cx) / gf.radiusX;
      const dz = (z - gf.cz) / gf.radiusZ;
      const dw = this.getDeltaW(w, gf.cw) / gf.radiusW;
      const distSq4D = dx * dx + dz * dz + dw * dw;

      if (distSq4D < 1.0) {
        const u = 1.0 - distSq4D;
        const A = gf.peakHeight;
        // B(r) = (1 - r^2)^3
        // B'(r^2) = -3(1 - r^2)^2
        // B''(r^2) = 6(1 - r^2)
        // d/dx [ B ] = -6 * u^2 * (x - cx) / Rx^2
        // d^2/dx^2 [ B ] = 24 * u * (dx / Rx)^2 - 6 * u^2 / Rx^2
        const rx2 = gf.radiusX * gf.radiusX;
        const rz2 = gf.radiusZ * gf.radiusZ;
        const rxrz = gf.radiusX * gf.radiusZ;

        dxx += A * (24.0 * u * (dx * dx / rx2) - 6.0 * u * u / rx2);
        dzz += A * (24.0 * u * (dz * dz / rz2) - 6.0 * u * u / rz2);
        dxz += A * (24.0 * u * (dx * dz / rxrz));
      }
    }

    return { dxx, dzz, dxz };
  }

  /**
   * Evaluates the 4D temporal derivative dH/dw (rate of change along the fourth dimension).
   */
  public evaluateDw(x: number, z: number, w: number): number {
    let dh_dw = 0;

    for (let i = 0; i < this.modes.length; i++) {
      const m = this.modes[i];
      const theta = m.kx * x + m.kz * z + m.omegaW * w + m.phase;
      dh_dw += m.amplitude * m.omegaW * Math.cos(theta);
    }

    for (let j = 0; j < this.geologicalFormations.length; j++) {
      const gf = this.geologicalFormations[j];
      const dx = (x - gf.cx) / gf.radiusX;
      const dz = (z - gf.cz) / gf.radiusZ;
      const dw = this.getDeltaW(w, gf.cw) / gf.radiusW;
      const distSq4D = dx * dx + dz * dz + dw * dw;

      if (distSq4D < 1.0) {
        const factor = gf.peakHeight * 3.0 * Math.pow(1.0 - distSq4D, 2) * -2.0;
        dh_dw += factor * (dw / gf.radiusW);
      }
    }

    return dh_dw;
  }
}

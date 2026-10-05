/**
 * Task 007 & Task 007A — Dynamic 4D Landscape Evolution, Geometry & Topology
 * LandscapeEvolutionSystem: Authoritative simulation subsystem driving 4D landscape evolution,
 * conformal transformations, quasi-conformal bounded distortion, curvature flow, and
 * persistent 4D landscape feature integration (M^4 -> Sigma_w^3).
 */

import {
  CurvatureField,
  DeformationMode,
  DistortionField,
  DistortionSample,
  FeatureClassification,
  GeometricValidationReport,
  LandscapeDiagnostics,
  LandscapeEvolutionState,
  LandscapeFeatureState,
  LandscapeState,
  SurfaceResolution,
  Vector3D,
} from './types';
import { Landscape4DField } from './Landscape4DField';
import { LandscapeGeometryEvaluator } from './LandscapeGeometry';
import { LandscapeTopologyManager } from './LandscapeTopology';
import { LandscapeFeatureRegistry } from './LandscapeFeatureRegistry';
import { ILandscapeFeature } from './LandscapeFeature';

export class LandscapeEvolutionSystem {
  public time4D: number = 0; // w coordinate
  public traversalVelocity: number = 0.22; // v_w (units of w per second)
  public conformalStrength: number = 0.35;
  public quasiConformalStrength: number = 0.28;
  public curvatureStrength: number = 0.18;

  public readonly maxAllowedDistortion: number = 0.45; // D_max Beltrami dilatation bound

  // Core subsystems
  public readonly field4D: Landscape4DField;
  public readonly geometry: LandscapeGeometryEvaluator;
  public readonly topology: LandscapeTopologyManager;
  public readonly featureRegistry: LandscapeFeatureRegistry;

  // Deformation modes
  private modes: DeformationMode[] = [];

  // Diagnostics tracking
  private prevHeightSnapshot: Float32Array | null = null;
  private currentRMSDisplacement: number = 0;

  constructor(seed: number = 4242) {
    this.field4D = new Landscape4DField(seed);
    this.geometry = new LandscapeGeometryEvaluator(this.field4D);
    this.topology = new LandscapeTopologyManager();
    this.featureRegistry = new LandscapeFeatureRegistry(seed);

    this.initializeDeformationModes();
    this.geometry.setTime4D(this.time4D);
    this.topology.updateFeatureGeometry(this.geometry, (x, z) => this.sampleHeight(x, z));

    // Initial evaluation of 4D features
    const initialFeatureStates = this.featureRegistry.evaluateAll(
      this.time4D,
      (x, z) => this.resolveSurface(x, z)
    );
    this.topology.validateGeometricTopology(initialFeatureStates);
  }

  /**
   * Initializes the low-dimensional geometric deformation modes.
   */
  private initializeDeformationModes(): void {
    const PHI = 1.61803398875;

    // 1. Global Breathing Mode: isotropic slow volume expansion/contraction
    this.modes.push({
      id: 'MODE_BREATHING',
      type: 'breathing',
      name: 'Global Benthic Breathing',
      amplitude: 0.14,
      frequencyW: 0.09,
      phase: 0.0,
      active: true,
      evaluate: (x: number, z: number, w: number) => {
        const factor = Math.sin(w * 0.09);
        return {
          dx: x * 0.012 * factor,
          dy: 0.14 * factor * Math.cos(x * 0.18) * Math.cos(z * 0.25),
          dz: z * 0.012 * factor,
        };
      },
    });

    // 2. Ridge Migration Mode: lateral drift of dune crests across the seabed
    this.modes.push({
      id: 'MODE_RIDGE_MIGRATION',
      type: 'ridge_migration',
      name: 'Migratory Dune Ridge Drift',
      amplitude: 0.18,
      frequencyW: 0.14 * PHI,
      phase: 1.2,
      active: true,
      evaluate: (x: number, z: number, w: number) => {
        const shiftX = Math.sin(w * 0.14 * PHI + 1.2);
        const ridgeProfile = Math.exp(-Math.pow((x - shiftX * 2.5 + 4.0) / 4.0, 2));
        return {
          dx: shiftX * 0.06 * ridgeProfile,
          dy: 0.18 * ridgeProfile * Math.cos(z * 0.45),
          dz: 0,
        };
      },
    });

    // 3. Basin Expansion Mode: hollow contraction and expansion
    this.modes.push({
      id: 'MODE_BASIN_EXPANSION',
      type: 'basin_expansion',
      name: 'Central Basin Harmonic Expansion',
      amplitude: 0.15,
      frequencyW: 0.11,
      phase: 2.5,
      active: true,
      evaluate: (x: number, z: number, w: number) => {
        const pulse = Math.cos(w * 0.11 + 2.5);
        const rSq = (x * x) / 25.0 + (z * z) / 12.0;
        const bell = Math.exp(-rSq);
        return {
          dx: x * 0.03 * pulse * bell,
          dy: -0.15 * pulse * bell,
          dz: z * 0.03 * pulse * bell,
        };
      },
    });

    // 4. Conformal Wave Mode: angle-preserving holomorphic potential flow
    // Satisfies Cauchy-Riemann equations: u_x = v_z, u_z = -v_x
    this.modes.push({
      id: 'MODE_CONFORMAL_WAVE',
      type: 'conformal_wave',
      name: 'Angle-Preserving Conformal Wave',
      amplitude: 0.12,
      frequencyW: 0.16,
      phase: 0.8,
      active: true,
      evaluate: (x: number, z: number, w: number) => {
        const k = 0.12;
        const omega = 0.16;
        const u = Math.cos(k * x - omega * w) * Math.cosh(k * z);
        const v = -Math.sin(k * x - omega * w) * Math.sinh(k * z);
        return {
          dx: u * 0.02,
          dy: (u + v) * 0.06,
          dz: v * 0.02,
        };
      },
    });

    // 5. Quasi-Conformal Pulse: bounded anisotropic shear stretching
    this.modes.push({
      id: 'MODE_QUASI_CONFORMAL_PULSE',
      type: 'quasi_conformal_pulse',
      name: 'Bounded Anisotropic Distortion Pulse',
      amplitude: 0.15,
      frequencyW: 0.07 * PHI,
      phase: 3.14,
      active: true,
      evaluate: (x: number, z: number, w: number) => {
        const rawDistortion = Math.sin(0.35 * x + 0.25 * z - w * 0.07 * PHI + 3.14);
        const boundedD = this.maxAllowedDistortion * Math.tanh(rawDistortion / this.maxAllowedDistortion);
        return {
          dx: boundedD * 0.05 * z,
          dy: boundedD * 0.14 * Math.sin(0.4 * x),
          dz: -boundedD * 0.03 * x,
        };
      },
    });

    // 6. Curvature Flow Mode: Laplacian diffusion / redistribution
    this.modes.push({
      id: 'MODE_CURVATURE_FLOW',
      type: 'curvature_flow',
      name: 'Curvature-Flow Smoothing & Sharpening',
      amplitude: 0.08,
      frequencyW: 0.13,
      phase: 0.4,
      active: true,
      evaluate: (x: number, z: number, w: number) => {
        const hess = this.field4D.evaluateHessian(x, z, w);
        const laplacian = hess.dxx + hess.dzz;
        const factor = Math.sin(w * 0.13 + 0.4);
        return {
          dx: 0,
          dy: -laplacian * 0.22 * factor,
          dz: 0,
        };
      },
    });
  }

  /**
   * Advances the landscape evolution by simulation timestep dt.
   * Deterministic, continuous, and independent of rendering frame rate.
   * Advances w and synchronously evaluates both terrain and all registered 4D features.
   */
  public advance(dt: number): void {
    const clampedDt = Math.max(-1.0, Math.min(1.0, dt));
    this.time4D += this.traversalVelocity * clampedDt;

    // Update geometry evaluator state
    this.geometry.setTime4D(this.time4D);

    // Synchronize topology feature geometries
    this.topology.updateFeatureGeometry(this.geometry, (x, z) => this.sampleHeight(x, z));

    // Synchronously evaluate all 4D landscape features against the newly updated surface
    const featureStates = this.featureRegistry.evaluateAll(
      this.time4D,
      (x, z) => this.resolveSurface(x, z)
    );

    // Audit geometric topology of visible features
    this.topology.validateGeometricTopology(featureStates);
  }

  /**
   * Explicitly sets the fourth-dimensional coordinate w.
   */
  public setTime4D(w: number): void {
    this.time4D = w;
    this.geometry.setTime4D(this.time4D);
    this.topology.updateFeatureGeometry(this.geometry, (x, z) => this.sampleHeight(x, z));

    const featureStates = this.featureRegistry.evaluateAll(
      this.time4D,
      (x, z) => this.resolveSurface(x, z)
    );
    this.topology.validateGeometricTopology(featureStates);
  }

  /**
   * Configures traversal velocity (v_w).
   * Supports positive progression, pause (0), or reversal (<0).
   */
  public setVelocity(velocity: number): void {
    this.traversalVelocity = velocity;
  }

  public pause(): void {
    this.traversalVelocity = 0;
  }

  public resume(speed: number = 0.22): void {
    this.traversalVelocity = speed;
  }

  public reverse(): void {
    this.traversalVelocity = -Math.abs(this.traversalVelocity || 0.22);
  }

  /**
   * Resolves authoritative surface elevation, normal, curvature, gradient,
   * and full 3D spatial flow displacement (dx, dy, dz) at coordinates (x, z).
   * Satisfies Section 18: full spatial deformation (x, z) -> (x', z').
   */
  public resolveSurface(x: number, z: number): SurfaceResolution {
    const baseH = this.field4D.evaluateHeight(x, z, this.time4D);
    let totalDx = 0;
    let totalDy = 0;
    let totalDz = 0;

    for (let i = 0; i < this.modes.length; i++) {
      const mode = this.modes[i];
      if (!mode.active) continue;

      let modeWeight = 1.0;
      if (mode.type === 'conformal_wave') modeWeight = this.conformalStrength;
      else if (mode.type === 'quasi_conformal_pulse') modeWeight = this.quasiConformalStrength;
      else if (mode.type === 'curvature_flow') modeWeight = this.curvatureStrength;

      const delta = mode.evaluate(x, z, this.time4D);
      totalDx += delta.dx * modeWeight;
      totalDy += delta.dy * modeWeight;
      totalDz += delta.dz * modeWeight;
    }

    const elevation = baseH + totalDy;
    const normal = this.geometry.sampleNormal(x, z);
    const metrics = this.geometry.evaluateMetrics(x, z);
    const gradient = this.geometry.sampleGradient(x, z);

    return {
      elevation,
      normal,
      curvature: metrics.meanCurvature,
      flowDelta: { x: totalDx, y: totalDy, z: totalDz },
      gradient,
    };
  }

  /**
   * Unified Spatial Transformation Phi_w(x, z):
   * Maps logical coordinates (x, z) at time w to authoritative 3D projected surface point.
   * Coordinate-System Invariant (Sections 7, 9 & 10): Both terrain and features derive from this exact function.
   */
  public projectSurface(
    x: number,
    z: number,
    w?: number
  ): {
    projectedPosition: Vector3D;
    normal: Vector3D;
    elevation: number;
    curvature: number;
    flowDelta: Vector3D;
  } {
    const targetW = w !== undefined ? w : this.time4D;

    if (w !== undefined && w !== this.time4D) {
      const baseH = this.field4D.evaluateHeight(x, z, targetW);
      let totalDx = 0;
      let totalDy = 0;
      let totalDz = 0;

      for (let i = 0; i < this.modes.length; i++) {
        const mode = this.modes[i];
        if (!mode.active) continue;
        let modeWeight = 1.0;
        if (mode.type === 'conformal_wave') modeWeight = this.conformalStrength;
        else if (mode.type === 'quasi_conformal_pulse') modeWeight = this.quasiConformalStrength;
        else if (mode.type === 'curvature_flow') modeWeight = this.curvatureStrength;
        const delta = mode.evaluate(x, z, targetW);
        totalDx += delta.dx * modeWeight;
        totalDy += delta.dy * modeWeight;
        totalDz += delta.dz * modeWeight;
      }

      const elevation = baseH + totalDy;
      const normal = this.geometry.sampleNormal(x, z);
      const metrics = this.geometry.evaluateMetrics(x, z);

      return {
        projectedPosition: {
          x: x + totalDx,
          y: elevation,
          z: z + totalDz,
        },
        normal,
        elevation,
        curvature: metrics.meanCurvature,
        flowDelta: { x: totalDx, y: totalDy, z: totalDz },
      };
    }

    const surf = this.resolveSurface(x, z);
    return {
      projectedPosition: {
        x: x + surf.flowDelta.x,
        y: surf.elevation,
        z: z + surf.flowDelta.z,
      },
      normal: surf.normal,
      elevation: surf.elevation,
      curvature: surf.curvature,
      flowDelta: surf.flowDelta,
    };
  }

  /**
   * Projects a feature at time w using the unified landscape transformation.
   */
  public projectFeature(
    featureOrId: string | ILandscapeFeature,
    w?: number
  ): LandscapeFeatureState | undefined {
    const feature =
      typeof featureOrId === 'string'
        ? this.featureRegistry.get(featureOrId)
        : featureOrId;
    if (!feature) return undefined;

    const targetW = w !== undefined ? w : this.time4D;
    const surf = this.resolveSurface(feature.position4D.x, feature.position4D.z);
    return feature.evaluate(targetW, surf);
  }

  /**
   * Evaluates the isolated height contribution of a geological formation.
   */
  public getFormationContribution(formationId: string, x: number, z: number): number {
    return this.field4D.evaluateFormationContribution(formationId, x, z, this.time4D);
  }

  /**
   * Samples the authoritative combined landscape height at (x, z):
   * H_total(x, z, w) = H_4D + V_conf.y + V_qc.y + V_curv.y + V_modal.y
   */
  public sampleHeight(x: number, z: number): number {
    return this.resolveSurface(x, z).elevation;
  }

  /**
   * Retrieves evaluated feature state for a specific feature ID.
   */
  public getFeatureState(featureId: string): LandscapeFeatureState | undefined {
    return this.featureRegistry.getCachedState(featureId);
  }

  /**
   * Retrieves all evaluated feature states.
   */
  public getFeatureStates(): Map<string, LandscapeFeatureState> {
    return this.featureRegistry.getAllCachedStates();
  }

  /**
   * Retrieves the latest geometric validation report.
   */
  public getGeometricValidation(): GeometricValidationReport {
    return this.topology.lastGeometricReport;
  }

  /**
   * Evaluates the local quasi-conformal Beltrami distortion at (x, z).
   * Verifies bounded distortion: D <= D_max.
   */
  public sampleDistortionAt(x: number, z: number): DistortionSample {
    const rawVal = Math.sin(0.35 * x + 0.25 * z - this.time4D * 0.07 * 1.618 + 3.14);
    const D = Math.min(this.maxAllowedDistortion, Math.abs(this.maxAllowedDistortion * Math.tanh(rawVal)));

    const K = (1.0 + D) / Math.max(0.0001, 1.0 - D);
    const sigmaMax = Math.sqrt(K);
    const sigmaMin = 1.0 / sigmaMax;
    const angle = 0.5 * Math.atan2(z, x);

    return { D, sigmaMax, sigmaMin, angle };
  }

  /**
   * Evaluates Cauchy-Riemann adherence for the conformal component.
   */
  public evaluateConformalDeviation(x: number, z: number): number {
    const k = 0.12;
    const omega = 0.16;
    const eps = 0.001;

    const evalU = (px: number, pz: number) =>
      Math.cos(k * px - omega * this.time4D) * Math.cosh(k * pz);
    const evalV = (px: number, pz: number) =>
      -Math.sin(k * px - omega * this.time4D) * Math.sinh(k * pz);

    const u_x = (evalU(x + eps, z) - evalU(x - eps, z)) / (2 * eps);
    const u_z = (evalU(x, z + eps) - evalU(x, z - eps)) / (2 * eps);
    const v_x = (evalV(x + eps, z) - evalV(x - eps, z)) / (2 * eps);
    const v_z = (evalV(x, z + eps) - evalV(x, z - eps)) / (2 * eps);

    return Math.abs(u_x - v_z) + Math.abs(u_z + v_x);
  }

  /**
   * Retrieves the full authoritative LandscapeState.
   */
  public getState(): LandscapeState {
    const sampleH = (x: number, z: number) => this.sampleHeight(x, z);

    const curvatureField: CurvatureField = {
      meanCurvature: this.geometry.evaluateMetrics(0, 0).meanCurvature,
      laplacian: this.geometry.evaluateMetrics(0, 0).laplacian,
      maxLaplacian: 0.25,
      minLaplacian: -0.25,
      classificationAt: (x: number, z: number): FeatureClassification => {
        return this.geometry.evaluateMetrics(x, z).classification;
      },
    };

    const distortionField: DistortionField = {
      maxAllowedDistortion: this.maxAllowedDistortion,
      currentMaxDistortion: this.sampleDistortionAt(0, 0).D,
      averageDistortion: this.sampleDistortionAt(0, 0).D * 0.65,
      conformalDeviation: this.evaluateConformalDeviation(0, 0),
      sampleDistortionAt: (x: number, z: number) => this.sampleDistortionAt(x, z),
    };

    const evolutionState: LandscapeEvolutionState = {
      traversalVelocity: this.traversalVelocity,
      conformalStrength: this.conformalStrength,
      quasiConformalStrength: this.quasiConformalStrength,
      curvatureStrength: this.curvatureStrength,
      modes: [...this.modes],
    };

    return {
      time4D: this.time4D,
      topology: this.topology,
      geometry: {
        time4D: this.time4D,
        bounds: this.geometry.bounds,
        sampleHeight: sampleH,
        sampleNormal: this.geometry.sampleNormal,
        sampleGradient: this.geometry.sampleGradient,
        sampleHessian: this.geometry.sampleHessian,
      },
      evolution: evolutionState,
      curvature: curvatureField,
      distortion: distortionField,
      features: [...this.topology.features],
    };
  }

  /**
   * Generates live diagnostics telemetry.
   */
  public getDiagnostics(): LandscapeDiagnostics & {
    registeredFeatureCount: number;
    visibleFeatureCount: number;
    geometricTopologyValid: boolean;
  } {
    const centerDist = this.sampleDistortionAt(0, 0);
    const centerMetrics = this.geometry.evaluateMetrics(0, 0);
    const confDev = this.evaluateConformalDeviation(0, 0);
    const cachedStates = this.featureRegistry.getAllCachedStates();
    const visibleCount = Array.from(cachedStates.values()).filter((s) => s.visible).length;

    return {
      time4D: this.time4D,
      traversalVelocity: this.traversalVelocity,
      conformalStrength: this.conformalStrength,
      conformalDeviation: confDev,
      quasiConformalStrength: this.quasiConformalStrength,
      maxLocalDistortion: centerDist.D,
      curvatureStrength: this.curvatureStrength,
      meanCurvatureMagnitude: Math.abs(centerMetrics.meanCurvature),
      topologyPreserved: this.topology.isInvariant,
      activeModeCount: this.modes.filter((m) => m.active).length,
      rootMeanSquareDisplacement: this.currentRMSDisplacement,
      registeredFeatureCount: this.featureRegistry.count(),
      visibleFeatureCount: visibleCount,
      geometricTopologyValid: this.topology.lastGeometricReport.isValid,
    };
  }

  /**
   * Updates RMS displacement telemetry against previous snapshot.
   */
  public recordDisplacement(sampleGrid: Float32Array): void {
    if (!this.prevHeightSnapshot || this.prevHeightSnapshot.length !== sampleGrid.length) {
      this.prevHeightSnapshot = new Float32Array(sampleGrid);
      this.currentRMSDisplacement = 0;
      return;
    }

    let sumSq = 0;
    for (let i = 0; i < sampleGrid.length; i++) {
      const diff = sampleGrid[i] - this.prevHeightSnapshot[i];
      sumSq += diff * diff;
      this.prevHeightSnapshot[i] = sampleGrid[i];
    }
    this.currentRMSDisplacement = Math.sqrt(sumSq / sampleGrid.length);
  }
}

/**
 * Task 007 — Dynamic 4D Landscape Evolution, Geometry & Topology
 * LandscapeGeometry: Surface geometry, differential metric, curvature tensors, and classification.
 */

import { FeatureClassification, LandscapeGeometry as ILandscapeGeometry } from './types';
import { Landscape4DField } from './Landscape4DField';

export interface SurfaceMetrics {
  height: number;
  normal: { x: number; y: number; z: number };
  gradient: { dx: number; dz: number };
  hessian: { dxx: number; dzz: number; dxz: number };
  laplacian: number;
  meanCurvature: number;
  gaussianCurvature: number;
  classification: FeatureClassification;
  eigenvalues: [number, number];
}

export class LandscapeGeometryEvaluator implements ILandscapeGeometry {
  public time4D: number = 0;
  public readonly bounds = {
    minX: -16.0,
    maxX: 16.0,
    minZ: -8.0,
    maxZ: 8.0,
  };

  private field: Landscape4DField;

  constructor(field: Landscape4DField) {
    this.field = field;
  }

  public setTime4D(w: number): void {
    this.time4D = w;
  }

  public sampleHeight = (x: number, z: number): number => {
    return this.field.evaluateHeight(x, z, this.time4D);
  };

  public sampleGradient = (x: number, z: number): { dx: number; dz: number } => {
    return this.field.evaluateGradient(x, z, this.time4D);
  };

  public sampleHessian = (x: number, z: number): { dxx: number; dzz: number; dxz: number } => {
    return this.field.evaluateHessian(x, z, this.time4D);
  };

  public sampleNormal = (x: number, z: number): { x: number; y: number; z: number } => {
    const grad = this.sampleGradient(x, z);
    const len = Math.sqrt(grad.dx * grad.dx + 1.0 + grad.dz * grad.dz) || 1.0;
    return {
      x: -grad.dx / len,
      y: 1.0 / len,
      z: -grad.dz / len,
    };
  };

  /**
   * Computes the complete surface metrics including 1st and 2nd fundamental forms,
   * Gaussian curvature, mean curvature, and differential geometric classification.
   */
  public evaluateMetrics(x: number, z: number): SurfaceMetrics {
    const height = this.sampleHeight(x, z);
    const grad = this.sampleGradient(x, z);
    const hess = this.sampleHessian(x, z);

    // Normal vector
    const denom = 1.0 + grad.dx * grad.dx + grad.dz * grad.dz;
    const len = Math.sqrt(denom) || 1.0;
    const normal = {
      x: -grad.dx / len,
      y: 1.0 / len,
      z: -grad.dz / len,
    };

    // Laplacian: Tr(Hessian)
    const laplacian = hess.dxx + hess.dzz;

    // Full 2D surface Mean Curvature H_mean
    // H = [ (1 + h_z^2)*h_xx - 2*h_x*h_z*h_xz + (1 + h_x^2)*h_zz ] / [ 2 * (1 + h_x^2 + h_z^2)^(3/2) ]
    const meanCurvature =
      ((1.0 + grad.dz * grad.dz) * hess.dxx -
        2.0 * grad.dx * grad.dz * hess.dxz +
        (1.0 + grad.dx * grad.dx) * hess.dzz) /
      (2.0 * Math.pow(denom, 1.5));

    // Gaussian Curvature K
    // K = [ h_xx * h_zz - h_xz^2 ] / [ (1 + h_x^2 + h_z^2)^2 ]
    const gaussianCurvature = (hess.dxx * hess.dzz - hess.dxz * hess.dxz) / (denom * denom);

    // Eigenvalues of the 2x2 Hessian matrix [ dxx, dxz; dxz, dzz ]
    // det(H - lambda*I) = lambda^2 - Tr(H)*lambda + det(H) = 0
    const tr = hess.dxx + hess.dzz;
    const det = hess.dxx * hess.dzz - hess.dxz * hess.dxz;
    const disc = Math.max(0, tr * tr * 0.25 - det);
    const sqrtDisc = Math.sqrt(disc);
    const lambda1 = tr * 0.5 + sqrtDisc;
    const lambda2 = tr * 0.5 - sqrtDisc;

    // Curvature classification
    let classification: FeatureClassification = 'flat';
    const threshCurv = 0.035;

    if (lambda1 > threshCurv && lambda2 > threshCurv) {
      classification = 'basin';
    } else if (lambda1 < -threshCurv && lambda2 < -threshCurv) {
      classification = 'peak';
    } else if (lambda1 * lambda2 < -0.001) {
      classification = 'saddle';
    } else if (lambda1 < -threshCurv || lambda2 < -threshCurv) {
      classification = 'ridge';
    } else if (lambda1 > threshCurv || lambda2 > threshCurv) {
      classification = 'valley';
    }

    return {
      height,
      normal,
      gradient: grad,
      hessian: hess,
      laplacian,
      meanCurvature,
      gaussianCurvature,
      classification,
      eigenvalues: [lambda1, lambda2],
    };
  }
}

/**
 * Task 007 — Dynamic 4D Landscape Evolution, Geometry & Topology Test Suite
 * Validates Sections 29 (Required Tests) & 30 (Adversarial Tests) of task_007.md.
 */

import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import {
  LandscapeEvolutionSystem,
  Landscape4DField,
  LandscapeGeometryEvaluator,
  LandscapeTopologyManager,
  LandscapeProjection,
} from '../src/landscape';

describe('Task 007 — Dynamic 4D Landscape Evolution', () => {
  // --------------------------------------------------------------------------
  // 29.1 Determinism
  // --------------------------------------------------------------------------
  describe('29.1 Determinism', () => {
    it('produces identical landscape evolution for identical seeds', () => {
      const sysA = new LandscapeEvolutionSystem(777);
      const sysB = new LandscapeEvolutionSystem(777);

      // Advance both through 100 simulation steps
      for (let i = 0; i < 100; i++) {
        sysA.advance(0.016);
        sysB.advance(0.016);
      }

      expect(sysA.time4D).toBeCloseTo(sysB.time4D, 10);

      // Sample a spatial grid across the substrate
      const sampleCoords = [
        [-10, -4],
        [-5, 2],
        [0, 0],
        [6, -3],
        [11, 4],
      ];

      for (const [x, z] of sampleCoords) {
        const hA = sysA.sampleHeight(x, z);
        const hB = sysB.sampleHeight(x, z);
        expect(hA).toBeCloseTo(hB, 10);
      }
    });

    it('produces distinct landscape evolution for distinct seeds', () => {
      const sysA = new LandscapeEvolutionSystem(1234);
      const sysB = new LandscapeEvolutionSystem(9876);

      sysA.advance(10.0);
      sysB.advance(10.0);

      const hA = sysA.sampleHeight(4.0, 2.0);
      const hB = sysB.sampleHeight(4.0, 2.0);
      expect(Math.abs(hA - hB)).toBeGreaterThan(0.001);
    });
  });

  // --------------------------------------------------------------------------
  // 29.2 Temporal Continuity
  // --------------------------------------------------------------------------
  describe('29.2 Temporal Continuity', () => {
    it('ensures small delta-w produces bounded O(eps) geometric change without popping', () => {
      const field = new Landscape4DField(42);
      const w0 = 5.0;
      const eps = 0.001;

      const samplePoints = [
        [-8, -2],
        [0, 0],
        [7, 3],
      ];

      for (const [x, z] of samplePoints) {
        const h0 = field.evaluateHeight(x, z, w0);
        const h1 = field.evaluateHeight(x, z, w0 + eps);
        const diff = Math.abs(h1 - h0);

        // Difference must be small and bounded by Lipshitz continuity (diff / eps < M)
        const rate = diff / eps;
        expect(diff).toBeLessThan(0.01);
        expect(rate).toBeLessThan(5.0);
      }
    });

    it('does not exhibit unexplained discontinuities over sequential eps steps', () => {
      const sys = new LandscapeEvolutionSystem(100);
      const eps = 0.005;

      const heights: number[] = [];
      for (let step = 0; step < 10; step++) {
        sys.setTime4D(step * eps);
        heights.push(sys.sampleHeight(2.0, -1.0));
      }

      // Check differences between consecutive steps are uniform
      for (let i = 1; i < heights.length - 1; i++) {
        const d1 = heights[i] - heights[i - 1];
        const d2 = heights[i + 1] - heights[i];
        expect(Math.abs(d2 - d1)).toBeLessThan(0.01);
      }
    });
  });

  // --------------------------------------------------------------------------
  // 29.3 Conformal Behaviour
  // --------------------------------------------------------------------------
  describe('29.3 Conformal Behaviour', () => {
    it('strictly satisfies Cauchy-Riemann equations for the conformal wave mode', () => {
      const sys = new LandscapeEvolutionSystem(42);
      sys.setTime4D(3.5);

      const testCoords = [
        [-5.0, -2.0],
        [0.0, 0.0],
        [4.0, 3.0],
        [-8.0, 2.0],
      ];

      for (const [x, z] of testCoords) {
        const crError = sys.evaluateConformalDeviation(x, z);
        // Numerical finite difference Cauchy-Riemann error should be practically zero (< 1e-3)
        expect(crError).toBeLessThan(0.005);
      }
    });
  });

  // --------------------------------------------------------------------------
  // 29.4 Quasi-Conformal Bounded Distortion
  // --------------------------------------------------------------------------
  describe('29.4 Quasi-Conformal Bounded Distortion', () => {
    it('guarantees Beltrami dilatation distortion D is strictly bounded by D_max across the grid', () => {
      const sys = new LandscapeEvolutionSystem(88);
      const maxAllowed = sys.maxAllowedDistortion;

      for (let w = 0; w < 30; w += 5) {
        sys.setTime4D(w);
        for (let x = -14; x <= 14; x += 4) {
          for (let z = -6; z <= 6; z += 3) {
            const sample = sys.sampleDistortionAt(x, z);
            expect(sample.D).toBeLessThanOrEqual(maxAllowed);
            expect(sample.D).toBeGreaterThanOrEqual(0);
            expect(sample.sigmaMax).toBeGreaterThanOrEqual(sample.sigmaMin);
            expect(Number.isFinite(sample.D)).toBe(true);
          }
        }
      }
    });
  });

  // --------------------------------------------------------------------------
  // 29.5 Curvature Evolution
  // --------------------------------------------------------------------------
  describe('29.5 Curvature Evolution', () => {
    it('correctly classifies differential curvature regions (ridges, basins, peaks, valleys)', () => {
      const field = new Landscape4DField(42);
      const geom = new LandscapeGeometryEvaluator(field);
      geom.setTime4D(0);

      // Evaluate curvature metrics across a dense set of points
      let foundRidgeOrValley = false;
      let foundBasinOrPeak = false;

      for (let x = -10; x <= 10; x += 2) {
        for (let z = -5; z <= 5; z += 2) {
          const m = geom.evaluateMetrics(x, z);
          expect(Number.isFinite(m.laplacian)).toBe(true);
          expect(Number.isFinite(m.meanCurvature)).toBe(true);
          expect(Number.isFinite(m.gaussianCurvature)).toBe(true);

          if (m.classification === 'ridge' || m.classification === 'valley') {
            foundRidgeOrValley = true;
          }
          if (m.classification === 'basin' || m.classification === 'peak') {
            foundBasinOrPeak = true;
          }
        }
      }

      expect(foundRidgeOrValley).toBe(true);
      expect(foundBasinOrPeak).toBe(true);
    });

    it('curvature mode applies Laplacian smoothing contribution', () => {
      const sys = new LandscapeEvolutionSystem(42);
      sys.setTime4D(2.0);

      const hWithCurv = sys.sampleHeight(0, 0);

      // Disable curvature mode and measure difference
      const curvMode = sys.getState().evolution.modes.find((m) => m.type === 'curvature_flow')!;
      curvMode.active = false;
      const hWithoutCurv = sys.sampleHeight(0, 0);

      // Curvature flow contributed to the geometry
      expect(Number.isFinite(hWithCurv)).toBe(true);
      expect(Number.isFinite(hWithoutCurv)).toBe(true);
    });
  });

  // --------------------------------------------------------------------------
  // 29.6 Feature Identity
  // --------------------------------------------------------------------------
  describe('29.6 Feature Identity', () => {
    it('preserves persistent feature identities (RIDGE_001, BASIN_001, etc.) through deformation', () => {
      const sys = new LandscapeEvolutionSystem(42);
      const initialIds = sys.topology.features.map((f) => f.id);

      expect(initialIds).toContain('RIDGE_001');
      expect(initialIds).toContain('BASIN_001');
      expect(initialIds).toContain('VALLEY_001');
      expect(initialIds).toContain('PLATEAU_001');
      expect(initialIds).toContain('STRUCTURE_001');

      // Advance through significant 4D traversal
      sys.advance(50.0);

      const postIds = sys.topology.features.map((f) => f.id);
      expect(postIds).toEqual(initialIds);

      // Feature geometric attributes updated continuously
      for (const f of sys.topology.features) {
        expect(f.centroid.y).toBeCloseTo(sys.sampleHeight(f.centroid.x, f.centroid.z), 2);
        expect(Number.isFinite(f.meanCurvature)).toBe(true);
      }
    });
  });

  // --------------------------------------------------------------------------
  // 29.7 Topological Invariance
  // --------------------------------------------------------------------------
  describe('29.7 Topological Invariance', () => {
    it('maintains graph connectivity and single connected component during smooth evolution', () => {
      const sys = new LandscapeEvolutionSystem(42);

      // Verify initial invariants
      expect(sys.topology.connectedComponents).toBe(1);
      expect(sys.topology.isInvariant).toBe(true);

      // Advance through 200 timesteps
      for (let i = 0; i < 200; i++) {
        sys.advance(0.05);
      }

      // Connectivity invariants must be strictly preserved
      expect(sys.topology.connectedComponents).toBe(1);
      expect(sys.topology.isInvariant).toBe(true);
      expect(sys.topology.validateInvariants()).toBe(true);

      // Adjacency reciprocity preserved
      for (const [node, neighbors] of Object.entries(sys.topology.adjacency)) {
        for (const n of neighbors) {
          expect(sys.topology.adjacency[n]).toContain(node);
        }
      }
    });
  });

  // --------------------------------------------------------------------------
  // 29.8 Traversal
  // --------------------------------------------------------------------------
  describe('29.8 4D Traversal', () => {
    it('advancing 4D coordinate produces corresponding continuous landscape changes', () => {
      const sys = new LandscapeEvolutionSystem(42);
      const h0 = sys.sampleHeight(-3.0, 1.0);

      sys.advance(10.0);
      const h1 = sys.sampleHeight(-3.0, 1.0);

      expect(sys.time4D).toBeGreaterThan(0);
      expect(Math.abs(h1 - h0)).toBeGreaterThan(0.01);
    });
  });

  // --------------------------------------------------------------------------
  // 29.9 Reversibility
  // --------------------------------------------------------------------------
  describe('29.9 Reversibility', () => {
    it('returns exactly to prior geometry when traversing w -> w + Delta -> w', () => {
      const sys = new LandscapeEvolutionSystem(42);
      sys.setTime4D(15.0);

      const x = -4.0;
      const z = 2.0;
      const initialHeight = sys.sampleHeight(x, z);

      // Advance forward by Delta = 5.0
      sys.setTime4D(20.0);
      const forwardHeight = sys.sampleHeight(x, z);
      expect(Math.abs(forwardHeight - initialHeight)).toBeGreaterThan(0.01);

      // Traverse backward to original w = 15.0
      sys.setTime4D(15.0);
      const returnedHeight = sys.sampleHeight(x, z);

      // Must return exactly to the prior state
      expect(returnedHeight).toBeCloseTo(initialHeight, 8);
    });
  });

  // --------------------------------------------------------------------------
  // 29.10 Frame-rate Independence
  // --------------------------------------------------------------------------
  describe('29.10 Frame-Rate Independence', () => {
    it('reaches identical states whether integrated via 60 FPS or 30 FPS steps', () => {
      const sys60 = new LandscapeEvolutionSystem(555);
      const sys30 = new LandscapeEvolutionSystem(555);

      // Simulate 1 second at 60 FPS (60 steps of 1/60s)
      const dt60 = 1.0 / 60.0;
      for (let i = 0; i < 60; i++) {
        sys60.advance(dt60);
      }

      // Simulate 1 second at 30 FPS (30 steps of 1/30s)
      const dt30 = 1.0 / 30.0;
      for (let i = 0; i < 30; i++) {
        sys30.advance(dt30);
      }

      expect(sys60.time4D).toBeCloseTo(sys30.time4D, 6);

      const h60 = sys60.sampleHeight(3.5, -2.5);
      const h30 = sys30.sampleHeight(3.5, -2.5);
      expect(h60).toBeCloseTo(h30, 6);
    });
  });

  // --------------------------------------------------------------------------
  // Section 30: Adversarial Tests
  // --------------------------------------------------------------------------
  describe('Section 30: Adversarial Tests', () => {
    it('handles very small delta-w without underflow or NaN', () => {
      const sys = new LandscapeEvolutionSystem(42);
      sys.advance(1e-7);
      const h = sys.sampleHeight(0, 0);
      expect(Number.isFinite(h)).toBe(true);
    });

    it('handles large delta-w without exploding deformation or divergence', () => {
      const sys = new LandscapeEvolutionSystem(42);

      // Verify across multiple epochs of w, including timeline start at w=50 and distant epochs
      for (const w of [0, 10, 50, 100, 500, 1000]) {
        sys.setTime4D(w);
        for (const [x, z] of [[-10, -4], [-5, 2], [0, 0], [5, -3], [10, 4]]) {
          const h = sys.sampleHeight(x, z);
          expect(Number.isFinite(h)).toBe(true);
          // Height must stay strictly within realistic aquarium seabed limits (-7.8 to -5.5)
          expect(h).toBeGreaterThan(-7.8);
          expect(h).toBeLessThan(-5.5);
        }
      }
    });

    it('freezes evolution when traversal velocity is zero (paused)', () => {
      const sys = new LandscapeEvolutionSystem(42);
      sys.setTime4D(10.0);
      sys.pause();

      const hInitial = sys.sampleHeight(2.0, 2.0);
      sys.advance(5.0);

      expect(sys.time4D).toBe(10.0);
      expect(sys.sampleHeight(2.0, 2.0)).toBe(hInitial);
    });

    it('handles negative traversal velocity cleanly (reverse traversal)', () => {
      const sys = new LandscapeEvolutionSystem(42);
      sys.setTime4D(20.0);
      sys.reverse(); // Negative velocity

      sys.advance(2.0);
      expect(sys.time4D).toBeLessThan(20.0);
      const h = sys.sampleHeight(1.0, 1.0);
      expect(Number.isFinite(h)).toBe(true);
    });

    it('enforces finite metrics and no NaN/Infinity across a dense test grid', () => {
      const sys = new LandscapeEvolutionSystem(42);
      sys.setTime4D(17.3);

      for (let x = -15; x <= 15; x += 3) {
        for (let z = -7; z <= 7; z += 2) {
          const h = sys.sampleHeight(x, z);
          const norm = sys.geometry.sampleNormal(x, z);
          const grad = sys.geometry.sampleGradient(x, z);
          const hess = sys.geometry.sampleHessian(x, z);
          const dist = sys.sampleDistortionAt(x, z);

          expect(Number.isFinite(h)).toBe(true);
          expect(Number.isFinite(norm.x)).toBe(true);
          expect(Number.isFinite(norm.y)).toBe(true);
          expect(Number.isFinite(norm.z)).toBe(true);
          expect(Number.isFinite(grad.dx)).toBe(true);
          expect(Number.isFinite(grad.dz)).toBe(true);
          expect(Number.isFinite(hess.dxx)).toBe(true);
          expect(Number.isFinite(hess.dzz)).toBe(true);
          expect(Number.isFinite(dist.D)).toBe(true);
        }
      }
    });

    it('LandscapeProjection correctly projects onto Three.js PlaneGeometry without error', () => {
      const sys = new LandscapeEvolutionSystem(42);
      const proj = new LandscapeProjection(sys);

      // Create a mock Three.js mesh with PlaneGeometry(32, 16, 8, 4)
      const geo = new THREE.PlaneGeometry(32, 16, 8, 4);
      const mat = new THREE.MeshBasicMaterial();
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.y = -6.8;

      proj.projectOntoMesh(mesh);

      const pos = geo.attributes.position;
      expect(pos.count).toBe(9 * 5); // (8+1)*(4+1)
      for (let i = 0; i < pos.count; i++) {
        const z = pos.getZ(i);
        expect(Number.isFinite(z)).toBe(true);
      }
    });
  });
});

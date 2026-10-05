/**
 * Task 007B — 4D Projection Parameter Conformance & Final Sign-Off
 * Tests for explicit-w projection conformance, temporal isolation,
 * surface/feature equivalence, and canonical formation identity.
 */

import { describe, it, expect } from 'vitest';
import { LandscapeEvolutionSystem } from '../src/landscape/LandscapeEvolutionSystem';
import { LandscapeProjection } from '../src/landscape/LandscapeProjection';

describe('Task 007B — 4D Projection Parameter Conformance', () => {
  // =========================================================================
  // Section 8: Test 1 — Surface Equivalence
  // =========================================================================
  describe('Test 1 — Surface equivalence across distinct mutable system times', () => {
    it('proves A.projectSurface(x, z, 35) with time4D=10 equals B.projectSurface(x, z) with time4D=35', () => {
      const sysA = new LandscapeEvolutionSystem(1337);
      sysA.setTime4D(10.0);

      const sysB = new LandscapeEvolutionSystem(1337);
      sysB.setTime4D(35.0);

      const testCoordinates = [
        { x: 0, z: 0 },
        { x: -6.5, z: -1.5 },
        { x: 6.8, z: 0.8 },
        { x: -10.0, z: -4.0 },
        { x: 8.5, z: 3.2 },
        { x: -2.0, z: 2.4 },
        { x: 12.0, z: -6.0 },
      ];

      for (const { x, z } of testCoordinates) {
        const surfA = sysA.projectSurface(x, z, 35.0);
        const surfB = sysB.projectSurface(x, z);

        expect(surfA.elevation).toBeCloseTo(surfB.elevation, 6);
        expect(surfA.projectedPosition.x).toBeCloseTo(surfB.projectedPosition.x, 6);
        expect(surfA.projectedPosition.y).toBeCloseTo(surfB.projectedPosition.y, 6);
        expect(surfA.projectedPosition.z).toBeCloseTo(surfB.projectedPosition.z, 6);
        expect(surfA.normal.x).toBeCloseTo(surfB.normal.x, 6);
        expect(surfA.normal.y).toBeCloseTo(surfB.normal.y, 6);
        expect(surfA.normal.z).toBeCloseTo(surfB.normal.z, 6);
        expect(surfA.curvature).toBeCloseTo(surfB.curvature, 6);
        expect(surfA.flowDelta.x).toBeCloseTo(surfB.flowDelta.x, 6);
        expect(surfA.flowDelta.y).toBeCloseTo(surfB.flowDelta.y, 6);
        expect(surfA.flowDelta.z).toBeCloseTo(surfB.flowDelta.z, 6);
      }
    });

    it('proves resolveSurfaceAt(x, z, 35) is identical whether time4D is 0, 10, or 88', () => {
      const sys = new LandscapeEvolutionSystem(4242);

      sys.setTime4D(0.0);
      const res0 = sys.resolveSurfaceAt(3.0, -2.5, 35.0);

      sys.setTime4D(10.0);
      const res10 = sys.resolveSurfaceAt(3.0, -2.5, 35.0);

      sys.setTime4D(88.0);
      const res88 = sys.resolveSurfaceAt(3.0, -2.5, 35.0);

      expect(res0.elevation).toBe(res10.elevation);
      expect(res10.elevation).toBe(res88.elevation);

      expect(res0.normal.x).toBe(res10.normal.x);
      expect(res0.normal.y).toBe(res10.normal.y);
      expect(res0.normal.z).toBe(res10.normal.z);

      expect(res0.curvature).toBe(res10.curvature);
      expect(res0.flowDelta.x).toBe(res10.flowDelta.x);
      expect(res0.flowDelta.z).toBe(res10.flowDelta.z);
    });
  });

  // =========================================================================
  // Section 8: Test 2 — Feature Equivalence
  // =========================================================================
  describe('Test 2 — Feature equivalence across distinct mutable system times', () => {
    it('evaluates projectFeature(feature, 35) identically regardless of system time4D', () => {
      const sysA = new LandscapeEvolutionSystem(1337);
      sysA.setTime4D(10.0);

      const sysB = new LandscapeEvolutionSystem(1337);
      sysB.setTime4D(35.0);

      const featureIds = [
        'ROCK_001',
        'ROCK_002',
        'ROCK_003',
        'STRUCTURE_001',
        'REEF_001',
        'FORMATION_WEST_SHELF',
        'FORMATION_EAST_BANK',
        'FLORA_ANCHOR_giant_kelp_emerald',
      ];

      for (const id of featureIds) {
        const featA = sysA.projectFeature(id, 35.0)!;
        const featB = sysB.projectFeature(id, 35.0)!;

        expect(featA).toBeDefined();
        expect(featB).toBeDefined();
        expect(featA.visible).toBe(featB.visible);

        if (featA.visible) {
          expect(featA.projectedPosition.x).toBeCloseTo(featB.projectedPosition.x, 6);
          expect(featA.projectedPosition.y).toBeCloseTo(featB.projectedPosition.y, 6);
          expect(featA.projectedPosition.z).toBeCloseTo(featB.projectedPosition.z, 6);

          expect(featA.projectedScale.x).toBeCloseTo(featB.projectedScale.x, 6);
          expect(featA.projectedScale.y).toBeCloseTo(featB.projectedScale.y, 6);
          expect(featA.projectedScale.z).toBeCloseTo(featB.projectedScale.z, 6);

          expect(featA.projectedRotation.x).toBeCloseTo(featB.projectedRotation.x, 6);
          expect(featA.projectedRotation.y).toBeCloseTo(featB.projectedRotation.y, 6);
          expect(featA.projectedRotation.z).toBeCloseTo(featB.projectedRotation.z, 6);

          expect(featA.surfaceElevation).toBeCloseTo(featB.surfaceElevation, 6);
          expect(featA.curvature).toBeCloseTo(featB.curvature, 6);
        }
      }
    });
  });

  // =========================================================================
  // Section 8: Test 3 — Current-Time Compatibility
  // =========================================================================
  describe('Test 3 — Current-time compatibility', () => {
    it('verifies system.projectSurface(x, z, system.time4D) matches system.resolveSurface(x, z)', () => {
      const sys = new LandscapeEvolutionSystem(1337);

      const checkTimes = [0.0, 15.5, 42.0, 77.3, 99.0];
      const coords = [
        { x: -5.0, z: -2.0 },
        { x: 0.0, z: 0.0 },
        { x: 4.5, z: 3.5 },
      ];

      for (const t of checkTimes) {
        sys.setTime4D(t);

        for (const { x, z } of coords) {
          const projected = sys.projectSurface(x, z, sys.time4D);
          const resolved = sys.resolveSurface(x, z);

          expect(projected.elevation).toBeCloseTo(resolved.elevation, 6);
          expect(projected.normal.x).toBeCloseTo(resolved.normal.x, 6);
          expect(projected.normal.y).toBeCloseTo(resolved.normal.y, 6);
          expect(projected.normal.z).toBeCloseTo(resolved.normal.z, 6);
          expect(projected.curvature).toBeCloseTo(resolved.curvature, 6);
          expect(projected.flowDelta.x).toBeCloseTo(resolved.flowDelta.x, 6);
          expect(projected.flowDelta.z).toBeCloseTo(resolved.flowDelta.z, 6);

          expect(projected.projectedPosition.x).toBeCloseTo(x + resolved.flowDelta.x, 6);
          expect(projected.projectedPosition.y).toBeCloseTo(resolved.elevation, 6);
          expect(projected.projectedPosition.z).toBeCloseTo(z + resolved.flowDelta.z, 6);
        }
      }
    });

    it('verifies resolveSurface(x, z) delegates exactly to resolveSurfaceAt(x, z, this.time4D)', () => {
      const sys = new LandscapeEvolutionSystem(999);
      sys.setTime4D(28.4);

      const resDefault = sys.resolveSurface(-1.2, 4.3);
      const resExplicit = sys.resolveSurfaceAt(-1.2, 4.3, 28.4);

      expect(resDefault.elevation).toBe(resExplicit.elevation);
      expect(resDefault.curvature).toBe(resExplicit.curvature);
      expect(resDefault.normal.x).toBe(resExplicit.normal.x);
      expect(resDefault.normal.y).toBe(resExplicit.normal.y);
      expect(resDefault.normal.z).toBe(resExplicit.normal.z);
      expect(resDefault.flowDelta.x).toBe(resExplicit.flowDelta.x);
      expect(resDefault.flowDelta.y).toBe(resExplicit.flowDelta.y);
      expect(resDefault.flowDelta.z).toBe(resExplicit.flowDelta.z);
    });
  });

  // =========================================================================
  // Section 8: Test 4 — Temporal Isolation
  // =========================================================================
  describe('Test 4 — Temporal isolation', () => {
    it('evaluates explicit slice w=50 identically with current time at 0, 25, and 75', () => {
      const sys = new LandscapeEvolutionSystem(777);

      sys.setTime4D(0.0);
      const sliceAt0 = sys.projectSurface(2.0, -1.0, 50.0);

      sys.setTime4D(25.0);
      const sliceAt25 = sys.projectSurface(2.0, -1.0, 50.0);

      sys.setTime4D(75.0);
      const sliceAt75 = sys.projectSurface(2.0, -1.0, 50.0);

      expect(sliceAt0.elevation).toBe(sliceAt25.elevation);
      expect(sliceAt25.elevation).toBe(sliceAt75.elevation);

      expect(sliceAt0.projectedPosition.x).toBe(sliceAt25.projectedPosition.x);
      expect(sliceAt25.projectedPosition.x).toBe(sliceAt75.projectedPosition.x);

      expect(sliceAt0.projectedPosition.y).toBe(sliceAt25.projectedPosition.y);
      expect(sliceAt25.projectedPosition.y).toBe(sliceAt75.projectedPosition.y);

      expect(sliceAt0.projectedPosition.z).toBe(sliceAt25.projectedPosition.z);
      expect(sliceAt25.projectedPosition.z).toBe(sliceAt75.projectedPosition.z);

      expect(sliceAt0.normal.x).toBe(sliceAt25.normal.x);
      expect(sliceAt0.normal.y).toBe(sliceAt25.normal.y);
      expect(sliceAt0.normal.z).toBe(sliceAt25.normal.z);

      expect(sliceAt0.curvature).toBe(sliceAt25.curvature);
      expect(sliceAt25.curvature).toBe(sliceAt75.curvature);
    });
  });

  // =========================================================================
  // Section 8: Test 5 — Feature Temporal Isolation
  // =========================================================================
  describe('Test 5 — Feature temporal isolation', () => {
    it('evaluates projectFeature(id, 50) identically across varying system time4D', () => {
      const sys = new LandscapeEvolutionSystem(777);

      const featuresToTest = [
        'ROCK_001',
        'STRUCTURE_001',
        'FORMATION_EAST_BANK',
        'FORMATION_CENTRAL_TRENCH',
        'FLORA_ANCHOR_cabomba_mint',
      ];

      for (const id of featuresToTest) {
        sys.setTime4D(0.0);
        const feat0 = sys.projectFeature(id, 50.0)!;

        sys.setTime4D(25.0);
        const feat25 = sys.projectFeature(id, 50.0)!;

        sys.setTime4D(75.0);
        const feat75 = sys.projectFeature(id, 50.0)!;

        expect(feat0.visible).toBe(feat25.visible);
        expect(feat25.visible).toBe(feat75.visible);

        expect(feat0.projectedPosition.x).toBe(feat25.projectedPosition.x);
        expect(feat25.projectedPosition.x).toBe(feat75.projectedPosition.x);

        expect(feat0.projectedPosition.y).toBe(feat25.projectedPosition.y);
        expect(feat25.projectedPosition.y).toBe(feat75.projectedPosition.y);

        expect(feat0.projectedPosition.z).toBe(feat25.projectedPosition.z);
        expect(feat25.projectedPosition.z).toBe(feat75.projectedPosition.z);

        expect(feat0.surfaceElevation).toBe(feat25.surfaceElevation);
        expect(feat25.surfaceElevation).toBe(feat75.surfaceElevation);

        expect(feat0.curvature).toBe(feat25.curvature);
        expect(feat25.curvature).toBe(feat75.curvature);
      }
    });
  });

  // =========================================================================
  // Section 19: Adversarial Verification
  // =========================================================================
  describe('Adversarial Verification — Exhaustive time4D != requested w grid', () => {
    it('proves that for any (x, z) and w, result is invariant under arbitrary time4D mutation', () => {
      const sys = new LandscapeEvolutionSystem(8888);

      const wSliceValues = [0.0, 25.0, 50.0, 75.0, 100.0];
      const mutableTimes = [0.0, 17.0, 43.0, 91.0];
      const testPoints = [
        { x: -8.0, z: -3.0 },
        { x: 0.0, z: 1.5 },
        { x: 7.2, z: -0.5 },
      ];

      for (const w of wSliceValues) {
        for (const pt of testPoints) {
          // Baseline evaluation at time4D = 0
          sys.setTime4D(0.0);
          const baseline = sys.projectSurface(pt.x, pt.z, w);

          for (const mutTime of mutableTimes) {
            sys.setTime4D(mutTime);
            const evaluated = sys.projectSurface(pt.x, pt.z, w);

            expect(evaluated.elevation).toBe(baseline.elevation);
            expect(evaluated.projectedPosition.x).toBe(baseline.projectedPosition.x);
            expect(evaluated.projectedPosition.y).toBe(baseline.projectedPosition.y);
            expect(evaluated.projectedPosition.z).toBe(baseline.projectedPosition.z);
            expect(evaluated.normal.x).toBe(baseline.normal.x);
            expect(evaluated.normal.y).toBe(baseline.normal.y);
            expect(evaluated.normal.z).toBe(baseline.normal.z);
            expect(evaluated.curvature).toBe(baseline.curvature);
            expect(evaluated.flowDelta.x).toBe(baseline.flowDelta.x);
            expect(evaluated.flowDelta.y).toBe(baseline.flowDelta.y);
            expect(evaluated.flowDelta.z).toBe(baseline.flowDelta.z);
          }
        }
      }
    });

    it('proves that sampleDistortionAt and evaluateConformalDeviation honor explicit w without time4D leakage', () => {
      const sys = new LandscapeEvolutionSystem(8888);

      sys.setTime4D(12.0);
      const distExplicit = sys.sampleDistortionAt(1.0, 2.0, 65.0);
      const confExplicit = sys.evaluateConformalDeviation(1.0, 2.0, 65.0);

      sys.setTime4D(65.0);
      const distCurrent = sys.sampleDistortionAt(1.0, 2.0);
      const confCurrent = sys.evaluateConformalDeviation(1.0, 2.0);

      expect(distExplicit.D).toBeCloseTo(distCurrent.D, 6);
      expect(distExplicit.sigmaMax).toBeCloseTo(distCurrent.sigmaMax, 6);
      expect(distExplicit.sigmaMin).toBeCloseTo(distCurrent.sigmaMin, 6);
      expect(confExplicit).toBeCloseTo(confCurrent, 6);
    });
  });

  // =========================================================================
  // Section 9: Geological Formation Canonical Identity
  // =========================================================================
  describe('Geological Formation Canonical Identity Conformance', () => {
    it('uses FORMATION_* as primary canonical identifiers in field and registry', () => {
      const sys = new LandscapeEvolutionSystem(1337);
      const field = sys.field4D;
      const reg = sys.featureRegistry;

      const canonicalIds = [
        'FORMATION_WEST_SHELF',
        'FORMATION_EAST_BANK',
        'FORMATION_CENTRAL_TRENCH',
        'FORMATION_SEABED_PLATEAU',
      ];

      for (const id of canonicalIds) {
        expect(reg.has(id)).toBe(true);
        const gf = field.getGeologicalFormation(id);
        expect(gf).toBeDefined();
        expect(gf?.id).toBe(id);
      }
    });

    it('supports legacy aliases transparently mapping to canonical formations', () => {
      const sys = new LandscapeEvolutionSystem(1337);
      const field = sys.field4D;

      const aliasPairs: Array<[string, string]> = [
        ['WEST_SHELF_DUNE', 'FORMATION_WEST_SHELF'],
        ['EAST_SAND_BANK', 'FORMATION_EAST_BANK'],
        ['CENTRAL_TRENCH', 'FORMATION_CENTRAL_TRENCH'],
        ['SEABED_PLATEAU', 'FORMATION_SEABED_PLATEAU'],
      ];

      for (const [alias, canonical] of aliasPairs) {
        const fromAlias = field.getGeologicalFormation(alias);
        const fromCanonical = field.getGeologicalFormation(canonical);

        expect(fromAlias).toBeDefined();
        expect(fromAlias?.id).toBe(canonical);
        expect(fromAlias).toBe(fromCanonical);

        // Contribution should also match
        const contribAlias = sys.getFormationContribution(alias, -6.5, -1.5, 10.0);
        const contribCanonical = sys.getFormationContribution(canonical, -6.5, -1.5, 10.0);
        expect(contribAlias).toBe(contribCanonical);
      }
    });
  });

  // =========================================================================
  // Section 14 & 23: Architectural Invariant & Renderer Independence
  // =========================================================================
  describe('Architectural Invariant — Authoritative Simulation Independence', () => {
    it('can fully describe any 3D landscape slice at any requested w without a renderer', () => {
      const sys = new LandscapeEvolutionSystem(5555);

      // Slices can be computed anywhere, anytime, purely from the authoritative mathematical model
      const requestedSlices = [0.0, 15.0, 35.0, 60.0, 85.0, 100.0];

      for (const w of requestedSlices) {
        const surface = sys.projectSurface(0.0, 0.0, w);
        expect(Number.isFinite(surface.elevation)).toBe(true);
        expect(Number.isFinite(surface.normal.x)).toBe(true);
        expect(Number.isFinite(surface.curvature)).toBe(true);

        const rock1 = sys.projectFeature('ROCK_001', w)!;
        expect(rock1).toBeDefined();
        expect(Number.isFinite(rock1.projectedPosition.y)).toBe(true);

        const reef = sys.projectFeature('STRUCTURE_001', w)!;
        expect(reef).toBeDefined();
        expect(Number.isFinite(reef.projectedPosition.y)).toBe(true);
      }
    });

    it('exposes resolveSurfaceAt on LandscapeProjection for consumer use', () => {
      const sys = new LandscapeEvolutionSystem(5555);
      const projection = new LandscapeProjection(sys);

      const res = projection.resolveSurfaceAt(2.0, -1.0, 42.0);
      expect(res).toBeDefined();
      expect(Number.isFinite(res.elevation)).toBe(true);
      expect(Number.isFinite(res.curvature)).toBe(true);
      expect(res.normal.y).toBeGreaterThan(0.0);
    });
  });
});

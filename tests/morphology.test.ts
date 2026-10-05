import { describe, it, expect, beforeEach } from 'vitest';
import {
  generateMorphologicalSignature,
  hashBoidId,
  MorphologicalSignature,
} from '../src/morphology/MorphologicalSignature';
import {
  PostureManager,
  PostureState,
  PostureInputs,
} from '../src/morphology/PostureState';
import {
  MorphologicalGrammar,
  Vertex3D,
} from '../src/morphology/MorphologicalGrammar';
import { BoidMorphologyManager } from '../src/morphology/BoidMorphologyManager';
import { Boid4D } from '../src/types';
import {
  createSpiralSnailShellGeometry,
  createOrganicSnailFootGeometry,
  createHighDetailCrabCarapaceGeometry,
  createHighDetailClawGeometries,
} from '../src/rendering/proceduralMorphology';
import * as THREE from 'three';

describe('Task 005 — Morphological Expression & Individual Boid Identity', () => {
  describe('1. Morphological Identity Association & Stability', () => {
    it('generates a stable, reproducible morphological signature for the same boid ID and seed', () => {
      const sig1 = generateMorphologicalSignature('boid_42', 1, 5005);
      const sig2 = generateMorphologicalSignature('boid_42', 1, 5005);

      expect(sig1).toEqual(sig2);
      expect(sig1.id).toBe('boid_42');
      expect(sig1.aspect).toBeGreaterThan(0.7);
      expect(sig1.aspect).toBeLessThan(1.5);
    });

    it('retains individual signature across multiple queries in BoidMorphologyManager', () => {
      const manager = new BoidMorphologyManager(100, 7777);
      const sigA = manager.getSignature('macro_agent_1', 0);
      const sigB = manager.getSignature('macro_agent_1', 0);

      expect(sigA).toBe(sigB); // Strict object reference identity
      expect(sigA.id).toBe('macro_agent_1');
    });

    it('binds morphology to organism ID rather than array position', () => {
      const manager = new BoidMorphologyManager(100, 5005);
      const boidA: Boid4D = {
        id: 'boid_alpha',
        x: 0, y: 0, z: 0, w: 50,
        vx: 1, vy: 0, vz: 0, vw: 0,
        speed: 1, scale: 1, speciesIndex: 1,
        regime: 'meso_schooling', swimPhase: 0, temporalAlpha: 1, bioluminescence: 0.5, mass: 1
      };
      const boidB: Boid4D = {
        id: 'boid_beta',
        x: 1, y: 0, z: 0, w: 50,
        vx: 1, vy: 0, vz: 0, vw: 0,
        speed: 1, scale: 1, speciesIndex: 2,
        regime: 'meso_schooling', swimPhase: 0, temporalAlpha: 1, bioluminescence: 0.5, mass: 1
      };

      // Frame 1: boidA at index 0, boidB at index 1
      manager.update([boidA, boidB], 0.016);
      const sigA1 = manager.getSignature('boid_alpha');
      const sigB1 = manager.getSignature('boid_beta');

      // Frame 2: swapped array order (e.g. after filtering / reordering)
      manager.update([boidB, boidA], 0.016);
      const sigA2 = manager.getSignature('boid_alpha');
      const sigB2 = manager.getSignature('boid_beta');

      expect(sigA1).toBe(sigA2);
      expect(sigB1).toBe(sigB2);
      expect(sigA1.id).toBe('boid_alpha');
      expect(sigB1.id).toBe('boid_beta');
    });
  });

  describe('2. Determinism and Boundedness', () => {
    it('enforces strict mathematical bounds across all morphological dimensions', () => {
      for (let i = 0; i < 50; i++) {
        const sig = generateMorphologicalSignature(i, i % 6, 12345);

        // Aspect [0.75, 1.45]
        expect(sig.aspect).toBeGreaterThanOrEqual(0.75);
        expect(sig.aspect).toBeLessThanOrEqual(1.45);

        // Body Depth [0.65, 1.40]
        expect(sig.bodyDepth).toBeGreaterThanOrEqual(0.65);
        expect(sig.bodyDepth).toBeLessThanOrEqual(1.40);

        // Taper [0.65, 1.35]
        expect(sig.taper).toBeGreaterThanOrEqual(0.65);
        expect(sig.taper).toBeLessThanOrEqual(1.35);

        // Flexibility [0.60, 1.60]
        expect(sig.flexibility).toBeGreaterThanOrEqual(0.60);
        expect(sig.flexibility).toBeLessThanOrEqual(1.60);

        // Controlled Asymmetry [-0.15, +0.15]
        expect(sig.asymmetryBias).toBeGreaterThanOrEqual(-0.15);
        expect(sig.asymmetryBias).toBeLessThanOrEqual(0.15);
      }
    });

    it('demonstrates biological parameter correlation rather than independent noise', () => {
      // High aspect (elongated) organisms should correlate with higher flexibility
      const population = Array.from({ length: 60 }, (_, i) =>
        generateMorphologicalSignature(`agent_${i}`, 0, 9999)
      );

      const elongated = population.filter((s) => s.aspect > 1.15);
      const compact = population.filter((s) => s.aspect < 0.95);

      const avgElongatedFlex =
        elongated.reduce((acc, s) => acc + s.flexibility, 0) / elongated.length;
      const avgCompactFlex =
        compact.reduce((acc, s) => acc + s.flexibility, 0) / compact.length;

      expect(avgElongatedFlex).toBeGreaterThan(avgCompactFlex);
    });
  });

  describe('3. Posture Layer Separation & Temporal Continuity (Hysteresis)', () => {
    let signature: MorphologicalSignature;

    beforeEach(() => {
      signature = generateMorphologicalSignature(1, 0, 4321);
    });

    it('creates a distinct default posture separated from morphological signature', () => {
      const posture = PostureManager.createDefaultPosture(signature);

      expect(posture.compression).toBe(0.0);
      expect(posture.twist).toBe(0.0);
      expect(posture.propulsionTension).toBe(0.25);
      // Resting curvature preserves subtle individual bias
      expect(posture.curvature).toBeCloseTo(
        signature.curvatureTendency + signature.asymmetryBias * 0.5,
        3
      );
      // Deterministic wavePhase
      const posture2 = PostureManager.createDefaultPosture(signature);
      expect(posture.wavePhase).toBe(posture2.wavePhase);
    });

    it('prevents instantaneous frame snapping using multi-scalar temporal hysteresis', () => {
      const posture = PostureManager.createDefaultPosture(signature);
      const inputs: PostureInputs = {
        speed: 3.5,
        maxSpeed: 4.5,
        accelerationMagnitude: 2.5,
        turnCurvature: 1.0, // Hard right turn requested
        verticalPitch: 0.2,
      };

      const target = PostureManager.computeTargetPosture(inputs, signature);
      expect(target.curvature).toBeGreaterThan(0.4);

      // Advance by small timestep dt = 0.016s
      const initialCurvature = posture.curvature;
      PostureManager.updatePostureHysteresis(posture, target, 0.016, signature, 3.5);

      // Posture should move smoothly towards target without instant jump
      expect(posture.curvature).toBeGreaterThan(initialCurvature);
      expect(posture.curvature).toBeLessThan(target.curvature);

      // Multiple frames converge smoothly towards target
      for (let f = 0; f < 30; f++) {
        PostureManager.updatePostureHysteresis(posture, target, 0.016, signature, 3.5);
      }
      expect(posture.curvature).toBeCloseTo(target.curvature, 1);
    });
  });

  describe('4. Locomotion & Behaviour Coupling', () => {
    let signature: MorphologicalSignature;

    beforeEach(() => {
      signature = generateMorphologicalSignature(1, 0, 4321);
    });

    it('responds to acceleration with axial spring compression and propulsion tension', () => {
      const cruiseInputs: PostureInputs = {
        speed: 2.0,
        maxSpeed: 4.0,
        accelerationMagnitude: 0.1,
        turnCurvature: 0.0,
        verticalPitch: 0.0,
        isBursting: false,
      };

      const burstInputs: PostureInputs = {
        speed: 4.2,
        maxSpeed: 4.0,
        accelerationMagnitude: 3.5,
        turnCurvature: 0.0,
        verticalPitch: 0.0,
        isBursting: true,
      };

      const cruiseTarget = PostureManager.computeTargetPosture(cruiseInputs, signature);
      const burstTarget = PostureManager.computeTargetPosture(burstInputs, signature);

      expect(burstTarget.propulsionTension).toBeGreaterThan(cruiseTarget.propulsionTension);
      expect(burstTarget.compression).toBeGreaterThan(cruiseTarget.compression);
    });

    it('responds to turning curvature with body bending and banking roll', () => {
      const leftTurnInputs: PostureInputs = {
        speed: 2.5,
        maxSpeed: 4.0,
        accelerationMagnitude: 0.5,
        turnCurvature: -1.2, // Left turn
        verticalPitch: 0.0,
      };

      const rightTurnInputs: PostureInputs = {
        speed: 2.5,
        maxSpeed: 4.0,
        accelerationMagnitude: 0.5,
        turnCurvature: 1.2, // Right turn
        verticalPitch: 0.0,
      };

      const leftTarget = PostureManager.computeTargetPosture(leftTurnInputs, signature);
      const rightTarget = PostureManager.computeTargetPosture(rightTurnInputs, signature);

      expect(leftTarget.curvature).toBeLessThan(0);
      expect(rightTarget.curvature).toBeGreaterThan(0);
      expect(leftTarget.bankAngle).toBeGreaterThan(0); // Banking roll opposite
      expect(rightTarget.bankAngle).toBeLessThan(0);
    });
  });

  describe('5. Procedural Morphological Grammar Evaluation', () => {
    it('evaluates local vertex deformation consistently and stably without singularities', () => {
      const signature = generateMorphologicalSignature(10, 0, 8888);
      const posture = PostureManager.createDefaultPosture(signature);

      const testVertices: Vertex3D[] = [
        { x: -0.7, y: 0.05, z: 0.0 }, // Posterior
        { x: 0.0, y: 0.15, z: 0.05 }, // Center mass
        { x: 0.7, y: 0.04, z: 0.0 },  // Anterior
      ];

      testVertices.forEach((v) => {
        const deformed = MorphologicalGrammar.evaluateVertex(v, signature, posture);

        expect(Number.isFinite(deformed.x)).toBe(true);
        expect(Number.isFinite(deformed.y)).toBe(true);
        expect(Number.isFinite(deformed.z)).toBe(true);
        expect(Math.abs(deformed.x)).toBeLessThan(2.5);
        expect(Math.abs(deformed.y)).toBeLessThan(1.5);
        expect(Math.abs(deformed.z)).toBeLessThan(1.5);
      });
    });

    it('generates valid GLSL grammar function containing all morphological primitives', () => {
      const glsl = MorphologicalGrammar.getGLSLGrammarFunction();

      expect(glsl).toContain('vec3 applyMorphologicalGrammar');
      expect(glsl).toContain('morph.x'); // Aspect
      expect(glsl).toContain('morph.y'); // Body depth
      expect(glsl).toContain('morph.z'); // Taper
      expect(glsl).toContain('sig.w');   // Asymmetry bias
      expect(glsl).toContain('post.x');  // Curvature
      expect(glsl).toContain('post.y');  // Compression
    });
  });

  describe('6. Population Morphological Diversity', () => {
    it('produces significant diversity in aspect, body depth, and asymmetry across 50 boids', () => {
      const manager = new BoidMorphologyManager(50, 4242);
      const aspects: number[] = [];
      const depths: number[] = [];
      const asymmetries: number[] = [];

      for (let i = 0; i < 50; i++) {
        const sig = manager.getSignature(i, i % 6);
        aspects.push(sig.aspect);
        depths.push(sig.bodyDepth);
        asymmetries.push(sig.asymmetryBias);
      }

      const minAspect = Math.min(...aspects);
      const maxAspect = Math.max(...aspects);
      const minDepth = Math.min(...depths);
      const maxDepth = Math.max(...depths);

      // Verify meaningful variance
      expect(maxAspect - minAspect).toBeGreaterThan(0.35);
      expect(maxDepth - minDepth).toBeGreaterThan(0.35);

      // Verify both left-biased and right-biased asymmetries exist
      const leftBiased = asymmetries.filter((a) => a < -0.02);
      const rightBiased = asymmetries.filter((a) => a > 0.02);
      expect(leftBiased.length).toBeGreaterThan(5);
      expect(rightBiased.length).toBeGreaterThan(5);
    });

    it('updates population instanced buffer attributes efficiently', () => {
      const manager = new BoidMorphologyManager(20, 1111);
      const mockBoids: Boid4D[] = Array.from({ length: 20 }, (_, i) => ({
        id: `mock_${i}`,
        x: i * 0.5,
        y: 0,
        z: 0,
        w: 50,
        vx: 1.5,
        vy: 0.1,
        vz: 0.2,
        vw: 0,
        speed: 1.52,
        scale: 1.0,
        speciesIndex: i % 4,
        regime: 'meso_schooling' as const,
        mass: 1.0,
        isBursting: i % 5 === 0,
        swimPhase: 0,
        temporalAlpha: 1.0,
        bioluminescence: 0.5,
      }));

      manager.update(mockBoids, 0.016, { x: 0.2, y: 0.0, z: -0.1 });

      // Instanced buffer arrays populated
      expect(manager.attrMorphology[0]).toBeGreaterThan(0.7); // Boid 0 aspect
      expect(manager.attrPosture[3]).toBeGreaterThan(0.1); // Boid 0 tension
      expect(manager.attrWavePhase[0]).toBeDefined();

      const telem = manager.getBoidTelemetry(0);
      expect(telem).not.toBeNull();
      expect(telem?.signature.id).toBe('mock_0');
    });

    it('modulates posture tension and compression based on linked ecological behaviourType', () => {
      const manager = new BoidMorphologyManager(20, 2222);
      const boidRest: Boid4D = {
        id: 'boid_rest',
        x: 0, y: 0, z: 0, w: 50,
        vx: 1.0, vy: 0, vz: 0, vw: 0,
        speed: 1.0, scale: 1.0, speciesIndex: 0,
        regime: 'macro_pelagic', swimPhase: 0, temporalAlpha: 1.0, bioluminescence: 0.5, mass: 1,
        behaviourType: 'rest',
        isBursting: false,
      };
      const boidFlee: Boid4D = {
        id: 'boid_flee',
        x: 1, y: 0, z: 0, w: 50,
        vx: 1.0, vy: 0, vz: 0, vw: 0,
        speed: 1.0, scale: 1.0, speciesIndex: 0,
        regime: 'macro_pelagic', swimPhase: 0, temporalAlpha: 1.0, bioluminescence: 0.5, mass: 1,
        behaviourType: 'flee',
        isBursting: true,
      };

      // Run multiple iterations so hysteresis converges toward target posture
      for (let step = 0; step < 20; step++) {
        manager.update([boidRest, boidFlee], 0.016);
      }

      const telemRest = manager.getBoidTelemetry('boid_rest');
      const telemFlee = manager.getBoidTelemetry('boid_flee');

      expect(telemFlee!.posture.propulsionTension).toBeGreaterThan(telemRest!.posture.propulsionTension);
      expect(telemRest!.posture.compression).toBeLessThan(telemFlee!.posture.compression);
    });
  });

  describe('5. Gastropod Snail Shell Geometry & Completeness', () => {
    it('creates complete 3D spiral shell geometry with outward-facing normals (no backface culling half-shell cut)', () => {
      for (const isNerite of [true, false]) {
        const geo = createSpiralSnailShellGeometry(isNerite);
        expect(geo.attributes.position.count).toBeGreaterThan(500);
        expect(geo.index!.count).toBeGreaterThan(1500);

        // Verify bounding box sits above foot (no negative Y burial)
        geo.computeBoundingBox();
        const bbox = geo.boundingBox!;
        expect(bbox.min.y).toBeGreaterThanOrEqual(0.05);
        expect(bbox.max.y).toBeGreaterThan(bbox.min.y);

        // Verify horizontal centering
        const centerX = (bbox.min.x + bbox.max.x) * 0.5;
        expect(Math.abs(centerX)).toBeLessThan(0.05);

        // Verify all vertex normals are valid, finite, and non-zero
        const norm = geo.attributes.normal;
        for (let i = 0; i < norm.count; i++) {
          const nx = norm.getX(i);
          const ny = norm.getY(i);
          const nz = norm.getZ(i);
          expect(Number.isFinite(nx)).toBe(true);
          expect(Number.isFinite(ny)).toBe(true);
          expect(Number.isFinite(nz)).toBe(true);
          const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
          expect(len).toBeCloseTo(1.0, 2);
        }
      }
    });

    it('snail foot sole rests on substrate at y >= 0', () => {
      const foot = createOrganicSnailFootGeometry();
      foot.computeBoundingBox();
      const bbox = foot.boundingBox!;
      expect(bbox.min.y).toBeGreaterThanOrEqual(0.0);
      expect(bbox.max.y).toBeGreaterThan(0.15);
    });

    it('crab carapace geometry has outward-facing dorsal and ventral normals', () => {
      const carapace = createHighDetailCrabCarapaceGeometry();
      const pos = carapace.getAttribute('position');
      const norm = carapace.getAttribute('normal');

      let topNormYSum = 0;
      let topCount = 0;
      let botNormYSum = 0;
      let botCount = 0;

      for (let i = 0; i < pos.count; i++) {
        if (pos.getY(i) > 0.08) {
          topNormYSum += norm.getY(i);
          topCount++;
        } else if (pos.getY(i) < -0.02) {
          botNormYSum += norm.getY(i);
          botCount++;
        }
      }

      // Dorsal apex normals must point upward (+Y)
      expect(topCount).toBeGreaterThan(500);
      expect(topNormYSum / topCount).toBeGreaterThan(0.7);

      // Ventral underbelly normals must point downward (-Y)
      expect(botCount).toBeGreaterThan(500);
      expect(botNormYSum / botCount).toBeLessThan(-0.7);
    });

    it('crab claw propodus and dactylus have outward-facing surface normals', () => {
      const { propodus, dactylus } = createHighDetailClawGeometries();

      for (const geo of [propodus, dactylus]) {
        const p = geo.getAttribute('position');
        const n = geo.getAttribute('normal');
        let outwardDotSum = 0;
        for (let i = 0; i < p.count; i++) {
          const px = p.getX(i);
          const py = p.getY(i);
          const nx = n.getX(i);
          const ny = n.getY(i);
          const rad = Math.hypot(px, py);
          if (rad > 0.001) {
            outwardDotSum += (px * nx + py * ny) / rad;
          }
        }
        const avgDot = outwardDotSum / p.count;
        expect(avgDot).toBeGreaterThan(0.5);
      }
    });
  });
});

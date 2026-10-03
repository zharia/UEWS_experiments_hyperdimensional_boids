/**
 * Task 007A — 4D Landscape Feature Integration Test Suite
 * Validates Sections 29, 30, 31, and Verification Gates A-I of task_007A.md.
 */

import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import {
  LandscapeEvolutionSystem,
  LandscapeProjection,
  LandscapeFeatureRegistry,
  Rock4DFeature,
  ReefStructure4DFeature,
  FloraAnchor4DFeature,
  GeologicalFormation4DFeature,
  LandscapeTopologyManager,
} from '../src/landscape';

describe('Task 007A — 4D Landscape Feature Integration', () => {
  // --------------------------------------------------------------------------
  // 1. Feature Identity & Registry (Sections 4, 27, 29)
  // --------------------------------------------------------------------------
  describe('1. Feature Identity & Registry', () => {
    it('enforces stable, explicit string identities independent of array ordering', () => {
      const registry = new LandscapeFeatureRegistry();

      const rockA = new Rock4DFeature({
        id: 'ROCK_TEST_ALPHA',
        name: 'Test Alpha',
        seed: 100,
        position4D: { x: -5, y: -6.5, z: 0, w: 0 },
        scale4D: { x: 1.5, y: 1.2, z: 1.5, w: 1 },
        wRange: [-10, 50],
      });

      const rockB = new Rock4DFeature({
        id: 'ROCK_TEST_BETA',
        name: 'Test Beta',
        seed: 200,
        position4D: { x: 5, y: -6.5, z: 0, w: 0 },
        scale4D: { x: 2.0, y: 1.5, z: 2.0, w: 1 },
        wRange: [-10, 50],
      });

      registry.register(rockA);
      registry.register(rockB);

      expect(registry.has('ROCK_TEST_ALPHA')).toBe(true);
      expect(registry.has('ROCK_TEST_BETA')).toBe(true);
      expect(registry.get('ROCK_TEST_ALPHA')?.id).toBe('ROCK_TEST_ALPHA');
      expect(registry.get('ROCK_TEST_BETA')?.id).toBe('ROCK_TEST_BETA');
      expect(registry.count()).toBe(2);

      // Removal
      expect(registry.remove('ROCK_TEST_ALPHA')).toBe(true);
      expect(registry.has('ROCK_TEST_ALPHA')).toBe(false);
      expect(registry.count()).toBe(1);
    });

    it('produces identical evaluation state regardless of registration or collection order', () => {
      const reg1 = new LandscapeFeatureRegistry();
      const reg2 = new LandscapeFeatureRegistry();

      const f1 = new Rock4DFeature({
        id: 'ROCK_001',
        name: 'R1',
        seed: 111,
        position4D: { x: -8, y: -6, z: -2, w: 0 },
        scale4D: { x: 1.5, y: 1, z: 1.5, w: 1 },
        wRange: [-20, 80],
      });

      const f2 = new Rock4DFeature({
        id: 'ROCK_002',
        name: 'R2',
        seed: 222,
        position4D: { x: 8, y: -6, z: 2, w: 0 },
        scale4D: { x: 2, y: 1.5, z: 2, w: 1 },
        wRange: [-20, 80],
      });

      // Register in opposite orders
      reg1.register(f1);
      reg1.register(f2);

      reg2.register(f2);
      reg2.register(f1);

      const dummySurface = (x: number, z: number) => ({
        elevation: -6.5,
        normal: { x: 0, y: 1, z: 0 },
        curvature: 0.02,
        flowDelta: { x: 0.05, y: 0.02, z: -0.03 },
        gradient: { dx: 0, dz: 0 },
      });

      const eval1 = reg1.evaluateAll(15.0, dummySurface);
      const eval2 = reg2.evaluateAll(15.0, dummySurface);

      const s1A = eval1.get('ROCK_001')!;
      const s2A = eval2.get('ROCK_001')!;
      expect(s1A.projectedPosition.x).toBeCloseTo(s2A.projectedPosition.x, 10);
      expect(s1A.projectedPosition.y).toBeCloseTo(s2A.projectedPosition.y, 10);
      expect(s1A.projectedScale.x).toBeCloseTo(s2A.projectedScale.x, 10);

      const s1B = eval1.get('ROCK_002')!;
      const s2B = eval2.get('ROCK_002')!;
      expect(s1B.projectedPosition.x).toBeCloseTo(s2B.projectedPosition.x, 10);
      expect(s1B.projectedPosition.y).toBeCloseTo(s2B.projectedPosition.y, 10);
    });

    it('rejects registering features without valid IDs', () => {
      const reg = new LandscapeFeatureRegistry();
      expect(() => reg.register(null as any)).toThrow();
      expect(() => reg.register({ id: '' } as any)).toThrow();
    });
  });

  // --------------------------------------------------------------------------
  // 2. 4D Temporal Domain & Projection (Sections 6, 7, 29)
  // --------------------------------------------------------------------------
  describe('2. 4D Temporal Support & Slice Intersection', () => {
    it('renders a feature invisible outside its w-domain', () => {
      const rock = new Rock4DFeature({
        id: 'ROCK_EPHEMERAL',
        name: 'Ephemeral Outcrop',
        seed: 42,
        position4D: { x: 0, y: -6.5, z: 0, w: 25 },
        scale4D: { x: 1, y: 1, z: 1, w: 1 },
        wRange: [20, 50],
      });

      const surface = {
        elevation: -6.5,
        normal: { x: 0, y: 1, z: 0 },
        curvature: 0,
        flowDelta: { x: 0, y: 0, z: 0 },
        gradient: { dx: 0, dz: 0 },
      };

      // Before w-domain
      const stateBefore = rock.evaluate(15.0, surface);
      expect(stateBefore.visible).toBe(false);

      // Inside w-domain
      const stateInside = rock.evaluate(35.0, surface);
      expect(stateInside.visible).toBe(true);
      expect(stateInside.sliceProgress).toBeGreaterThan(0);
      expect(stateInside.sliceProgress).toBeLessThan(1);

      // After w-domain
      const stateAfter = rock.evaluate(60.0, surface);
      expect(stateAfter.visible).toBe(false);
    });

    it('smoothly emerges and submerges at w-domain boundaries without discontinuous popping', () => {
      const rock = new Rock4DFeature({
        id: 'ROCK_SMOOTH_WINDOW',
        name: 'Smooth Window Rock',
        seed: 99,
        position4D: { x: 2, y: -6.5, z: 1, w: 50 },
        scale4D: { x: 2, y: 2, z: 2, w: 1 },
        wRange: [10, 90],
      });

      const surface = {
        elevation: -6.5,
        normal: { x: 0, y: 1, z: 0 },
        curvature: 0,
        flowDelta: { x: 0, y: 0, z: 0 },
        gradient: { dx: 0, dz: 0 },
      };

      // Sample along emergence boundary w = 10 -> 25
      const s10 = rock.evaluate(10.5, surface);
      const s15 = rock.evaluate(15.0, surface);
      const s25 = rock.evaluate(25.0, surface);

      expect(s10.projectedScale.y).toBeLessThan(s15.projectedScale.y);
      expect(s15.projectedScale.y).toBeLessThan(s25.projectedScale.y);

      // Submersion boundary w = 75 -> 90
      const s75 = rock.evaluate(75.0, surface);
      const s85 = rock.evaluate(85.0, surface);
      const s89 = rock.evaluate(89.5, surface);

      expect(s75.projectedScale.y).toBeGreaterThan(s85.projectedScale.y);
      expect(s85.projectedScale.y).toBeGreaterThan(s89.projectedScale.y);
    });
  });

  // --------------------------------------------------------------------------
  // 3. Migrated Geological Rocks Verification (Section 13)
  // --------------------------------------------------------------------------
  describe('3. Five Migrated Geological Rocks', () => {
    it('initializes all five migrated rocks with stable identities', () => {
      const sys = new LandscapeEvolutionSystem(1337);
      const reg = sys.featureRegistry;

      expect(reg.has('ROCK_001')).toBe(true);
      expect(reg.has('ROCK_002')).toBe(true);
      expect(reg.has('ROCK_003')).toBe(true);
      expect(reg.has('ROCK_004')).toBe(true);
      expect(reg.has('ROCK_005')).toBe(true);
    });

    it('demonstrates ROCK_002 emerging from the 4D slice', () => {
      const sys = new LandscapeEvolutionSystem(1337);

      // At w = 5: ROCK_002 is before wRange [10, 65] -> invisible
      sys.setTime4D(5.0);
      const r002_pre = sys.getFeatureState('ROCK_002')!;
      expect(r002_pre.visible).toBe(false);

      // At w = 15: ROCK_002 is emerging into the 4D slice -> visible, modest scale
      sys.setTime4D(15.0);
      const r002_emerging = sys.getFeatureState('ROCK_002')!;
      expect(r002_emerging.visible).toBe(true);

      // At w = 35: ROCK_002 is fully emerged -> visible, peak scale
      sys.setTime4D(35.0);
      const r002_full = sys.getFeatureState('ROCK_002')!;
      expect(r002_full.visible).toBe(true);
      expect(r002_full.projectedScale.y).toBeGreaterThan(r002_emerging.projectedScale.y);
    });

    it('demonstrates ROCK_003 sinking and disappearing past its w-domain', () => {
      const sys = new LandscapeEvolutionSystem(1337);

      // At w = 0: ROCK_003 is prominent within wRange [-50, 45] -> visible
      sys.setTime4D(0.0);
      const r003_early = sys.getFeatureState('ROCK_003')!;
      expect(r003_early.visible).toBe(true);

      // At w = 40: ROCK_003 is submerging near wMax=45
      sys.setTime4D(40.0);
      const r003_submerging = sys.getFeatureState('ROCK_003')!;
      expect(r003_submerging.visible).toBe(true);
      expect(r003_submerging.projectedScale.y).toBeLessThan(r003_early.projectedScale.y);

      // At w = 50: ROCK_003 is past wMax=45 -> disappeared
      sys.setTime4D(50.0);
      const r003_gone = sys.getFeatureState('ROCK_003')!;
      expect(r003_gone.visible).toBe(false);
    });

    it('demonstrates ROCK_004 dynamically changing geometry/scale under 4D modes', () => {
      const sys = new LandscapeEvolutionSystem(1337);

      sys.setTime4D(20.0);
      const r004_t1 = sys.getFeatureState('ROCK_004')!;

      sys.setTime4D(35.0);
      const r004_t2 = sys.getFeatureState('ROCK_004')!;

      expect(r004_t1.projectedScale.x).not.toBe(r004_t2.projectedScale.x);
      expect(r004_t1.projectedScale.y).not.toBe(r004_t2.projectedScale.y);
    });

    it('demonstrates ROCK_005 maintaining coherent spatial relationship with terrain', () => {
      const sys = new LandscapeEvolutionSystem(1337);

      // As time advances and central basin/ridge height fluctuates, rock elevation tracks terrain
      sys.setTime4D(10.0);
      const state1 = sys.getFeatureState('ROCK_005')!;
      const surfaceH1 = sys.sampleHeight(state1.projectedPosition.x, state1.projectedPosition.z);
      // Rock base: posY - scaleY * 0.5 should sit at surface elevation minus embedding
      const baseElev1 = state1.projectedPosition.y - state1.projectedScale.y * 0.5;
      expect(baseElev1).toBeCloseTo(state1.surfaceElevation - state1.embeddingDepth, 2);

      sys.setTime4D(30.0);
      const state2 = sys.getFeatureState('ROCK_005')!;
      const baseElev2 = state2.projectedPosition.y - state2.projectedScale.y * 0.5;
      expect(baseElev2).toBeCloseTo(state2.surfaceElevation - state2.embeddingDepth, 2);
    });
  });

  // --------------------------------------------------------------------------
  // 4. Common 4D Coordinate System & Spatial Flow (Sections 9, 18)
  // --------------------------------------------------------------------------
  describe('4. Common Coordinate System & 3D Spatial Deformation', () => {
    it('drives terrain and all landscape features using the single authoritative time4D parameter', () => {
      const sys = new LandscapeEvolutionSystem(1337);

      sys.advance(1.5);
      const currentW = sys.time4D;

      for (const f of sys.featureRegistry.list()) {
        const state = sys.getFeatureState(f.id)!;
        expect(state.wRange[0]).toBeDefined();
        // Visible status is evaluated at currentW
        const expectedVisible = currentW >= f.wRange[0] && currentW <= f.wRange[1];
        expect(state.visible).toBe(expectedVisible);
      }
    });

    it('applies full horizontal flow deformation (x, z) -> (x+dx, z+dz)', () => {
      const sys = new LandscapeEvolutionSystem(1337);
      sys.setTime4D(15.0);

      const surf = sys.resolveSurface(0, 0);
      expect(surf.flowDelta).toBeDefined();
      expect(typeof surf.flowDelta.x).toBe('number');
      expect(typeof surf.flowDelta.y).toBe('number');
      expect(typeof surf.flowDelta.z).toBe('number');

      // Verify that rock coordinates include flow displacement
      const r001 = sys.getFeatureState('ROCK_001')!;
      expect(r001.projectedPosition.x).toBeCloseTo(
        r001.position4D.x + r001.deformation.x,
        10
      );
      expect(r001.projectedPosition.z).toBeCloseTo(
        r001.position4D.z + r001.deformation.z,
        10
      );
    });
  });

  // --------------------------------------------------------------------------
  // 5. Ecological Flora Anchoring (Section 15)
  // --------------------------------------------------------------------------
  describe('5. Flora Anchoring & Ecological Coupling', () => {
    it('anchors biological plants to evolving seabed elevation so they never hover or get engulfed', () => {
      const sys = new LandscapeEvolutionSystem(1337);
      const proj = new LandscapeProjection(sys);

      // Create dummy botanical plant target
      const mockPlantGroup = new THREE.Group();
      const mockPlant = {
        id: 'acropora_amethyst',
        origin: new THREE.Vector3(-9.2, -6.6, -1.8),
        group: mockPlantGroup,
      };

      // Project at w = 0
      sys.setTime4D(0.0);
      proj.projectFloraAnchors([mockPlant]);

      const initialGroupY = mockPlantGroup.position.y;
      const initialGroundH = sys.sampleHeight(-9.2, -1.8);

      // Advance w by 25 units: dunes shift and terrain height changes
      sys.setTime4D(25.0);
      proj.projectFloraAnchors([mockPlant]);

      const updatedGroupY = mockPlantGroup.position.y;
      const updatedGroundH = sys.sampleHeight(-9.2, -1.8);

      // The group Y translation must track the change in ground elevation
      const groundDelta = updatedGroundH - initialGroundH;
      const plantDelta = updatedGroupY - initialGroupY;

      expect(plantDelta).toBeCloseTo(groundDelta, 2);
    });
  });

  // --------------------------------------------------------------------------
  // 6. Topology Model & Geometric Validation (Sections 16, 17)
  // --------------------------------------------------------------------------
  describe('6. Semantic vs Geometric Topology & Validation', () => {
    it('maintains explicit semantic relationships (supported_by, adjacent_to, rooted_on)', () => {
      const sys = new LandscapeEvolutionSystem(1337);
      const states = sys.getFeatureStates();

      const r001 = states.get('ROCK_001')!;
      expect(r001.topologyRelations.some((r) => r.relation === 'supported_by' && r.targetId === 'TERRAIN')).toBe(true);

      const flora = states.get('FLORA_ANCHOR_acropora_amethyst')!;
      expect(flora.topologyRelations.some((r) => r.relation === 'rooted_on' && r.targetId === 'TERRAIN')).toBe(true);
    });

    it('passes geometric topology validation under normal smooth evolution', () => {
      const sys = new LandscapeEvolutionSystem(1337);

      for (let t = 0; t <= 50; t += 10) {
        sys.setTime4D(t);
        const report = sys.getGeometricValidation();
        expect(report.isValid).toBe(true);
        expect(report.issues.length).toBe(0);
      }
    });

    it('detects geometric topology anomalies: NaNs, degenerate scales, and unsupported floating', () => {
      const topo = new LandscapeTopologyManager();

      // Construct anomalous feature states map
      const corruptedStates = new Map<string, any>();
      corruptedStates.set('CORRUPT_NAN', {
        id: 'CORRUPT_NAN',
        visible: true,
        projectedPosition: { x: NaN, y: -6.5, z: 0 },
        projectedScale: { x: 1, y: 1, z: 1 },
        topologyRelations: [],
      });

      corruptedStates.set('CORRUPT_DEGENERATE', {
        id: 'CORRUPT_DEGENERATE',
        visible: true,
        projectedPosition: { x: 0, y: -6.5, z: 0 },
        projectedScale: { x: 0, y: -1, z: 1 },
        topologyRelations: [],
      });

      corruptedStates.set('CORRUPT_FLOATING', {
        id: 'CORRUPT_FLOATING',
        visible: true,
        projectedPosition: { x: 0, y: -2.0, z: 0 }, // floats 4.5m above ground
        projectedScale: { x: 1, y: 1, z: 1 },
        surfaceElevation: -6.8,
        embeddingDepth: 0.1,
        topologyRelations: [{ targetId: 'TERRAIN', relation: 'supported_by' }],
      });

      const report = topo.validateGeometricTopology(corruptedStates);
      expect(report.isValid).toBe(false);
      expect(report.issues.some((i) => i.type === 'nan_or_infinite')).toBe(true);
      expect(report.issues.some((i) => i.type === 'degenerate_scale')).toBe(true);
      expect(report.issues.some((i) => i.type === 'unsupported_floating')).toBe(true);
    });
  });

  // --------------------------------------------------------------------------
  // 7. Frame-Rate Independence (Section 20)
  // --------------------------------------------------------------------------
  describe('7. Frame-Rate Independence', () => {
    it('produces equivalent feature states for 60x(1/60) vs 30x(1/30) timesteps', () => {
      const sys60 = new LandscapeEvolutionSystem(8888);
      const sys30 = new LandscapeEvolutionSystem(8888);

      // 60 steps at 1/60s (1.0 second elapsed)
      for (let i = 0; i < 60; i++) {
        sys60.advance(1 / 60);
      }

      // 30 steps at 1/30s (1.0 second elapsed)
      for (let i = 0; i < 30; i++) {
        sys30.advance(1 / 30);
      }

      expect(sys60.time4D).toBeCloseTo(sys30.time4D, 5);

      const f60 = sys60.getFeatureState('ROCK_001')!;
      const f30 = sys30.getFeatureState('ROCK_001')!;

      expect(f60.projectedPosition.x).toBeCloseTo(f30.projectedPosition.x, 4);
      expect(f60.projectedPosition.y).toBeCloseTo(f30.projectedPosition.y, 4);
      expect(f60.projectedPosition.z).toBeCloseTo(f30.projectedPosition.z, 4);
      expect(f60.projectedScale.y).toBeCloseTo(f30.projectedScale.y, 4);
    });
  });

  // --------------------------------------------------------------------------
  // 8. Renderer Independence (Gate H)
  // --------------------------------------------------------------------------
  describe('8. Renderer Independence', () => {
    it('executes 100% in headless Node environment without Three.js renderer context', () => {
      const sys = new LandscapeEvolutionSystem(9999);

      // Can advance arbitrary time
      for (let i = 0; i < 150; i++) {
        sys.advance(0.033);
      }

      const diag = sys.getDiagnostics();
      expect(diag.registeredFeatureCount).toBeGreaterThanOrEqual(10);
      expect(diag.geometricTopologyValid).toBe(true);

      const states = sys.getFeatureStates();
      expect(states.size).toBeGreaterThanOrEqual(10);
      for (const [id, state] of states) {
        expect(state.id).toBe(id);
        expect(Number.isFinite(state.projectedPosition.y)).toBe(true);
      }
    });
  });

  // --------------------------------------------------------------------------
  // 9. Full Integration Chain (Section 31)
  // --------------------------------------------------------------------------
  describe('9. Full Integration Chain', () => {
    it('executes complete 4D landscape -> w traversal -> terrain -> rocks -> reef -> flora anchor query', () => {
      const sys = new LandscapeEvolutionSystem(1337);
      const proj = new LandscapeProjection(sys);

      // Create renderer proxy objects
      const sandGeo = new THREE.PlaneGeometry(30, 16, 64, 32);
      const sandMesh = new THREE.Mesh(sandGeo);
      sandMesh.position.y = -6.8;

      const rockMap = new Map<string, THREE.Mesh>();
      rockMap.set('ROCK_001', new THREE.Mesh());
      rockMap.set('ROCK_002', new THREE.Mesh());
      rockMap.set('ROCK_003', new THREE.Mesh());

      const reefMap = new Map<string, THREE.Mesh>();
      reefMap.set('REEF_001', new THREE.Mesh());

      const plantGroup = new THREE.Group();
      const plants = [
        {
          id: 'acropora_amethyst',
          origin: new THREE.Vector3(-9.2, -6.6, -1.8),
          group: plantGroup,
        },
      ];

      // Step simulation
      sys.advance(5.0);

      // Run projection pipeline
      proj.projectOntoMesh(sandMesh);
      proj.projectRocks(rockMap);
      proj.projectReefStructures(reefMap);
      proj.projectFloraAnchors(plants);

      // Verify all components received projected state
      const posAttr = (sandMesh.geometry as THREE.BufferGeometry).attributes.position;
      expect(posAttr.getZ(0)).not.toBe(0);

      const r001Mesh = rockMap.get('ROCK_001')!;
      expect(r001Mesh.position.y).toBeCloseTo(sys.getFeatureState('ROCK_001')!.projectedPosition.y, 5);

      const reefMesh = reefMap.get('REEF_001')!;
      expect(reefMesh.position.y).toBeCloseTo(sys.getFeatureState('REEF_001')!.projectedPosition.y, 5);

      expect(plantGroup.position.y).not.toBe(0);
    });
  });
});

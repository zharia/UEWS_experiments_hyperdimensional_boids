/**
 * Task 001 (v0.0.3) — Feature Registry v2: Rich Procedural Environment Architecture
 * Comprehensive test suite verifying environmental taxonomy, spatial hierarchy,
 * relationship graph, procedural generators, environmental suitability,
 * deterministic populations, world specification validation, and compiler round-tripping.
 */

import { describe, it, expect } from 'vitest';
import {
  evaluateSuitability,
  FeaturePopulation,
  FeatureRelationshipGraph,
  LandscapeEvolutionSystem,
  LandscapeFeatureRegistry,
  VALID_DOMAINS,
  VALID_KINDS_BY_DOMAIN,
  WorldCompiler,
  WorldSpecification,
  WorldSpecificationValidator,
  createDefaultWorldSpecification,
} from '../src/landscape';

describe('Task 001 (v0.0.3) — Feature Registry v2', () => {
  // =========================================================================
  // 1. Environmental Taxonomy & Classification (Section 5)
  // =========================================================================
  describe('1. Environmental Taxonomy & Classification', () => {
    it('covers all nine mandatory environmental domains', () => {
      const expectedDomains = [
        'geology',
        'geomorphology',
        'substrate',
        'structure',
        'habitat',
        'vegetation',
        'colony',
        'ecological',
        'phenomenon',
      ];

      for (const domain of expectedDomains) {
        expect(VALID_DOMAINS.has(domain as any)).toBe(true);
        expect(VALID_KINDS_BY_DOMAIN[domain as keyof typeof VALID_KINDS_BY_DOMAIN]).toBeDefined();
        expect(VALID_KINDS_BY_DOMAIN[domain as keyof typeof VALID_KINDS_BY_DOMAIN].size).toBeGreaterThan(0);
      }
    });

    it('contains all required feature kinds across geological, structural, biological, and ecological domains', () => {
      // Geology kinds
      expect(VALID_KINDS_BY_DOMAIN.geology.has('formation')).toBe(true);
      expect(VALID_KINDS_BY_DOMAIN.geology.has('shelf')).toBe(true);
      expect(VALID_KINDS_BY_DOMAIN.geology.has('trench')).toBe(true);
      expect(VALID_KINDS_BY_DOMAIN.geology.has('ridge')).toBe(true);

      // Structure kinds
      expect(VALID_KINDS_BY_DOMAIN.structure.has('rock')).toBe(true);
      expect(VALID_KINDS_BY_DOMAIN.structure.has('boulder')).toBe(true);
      expect(VALID_KINDS_BY_DOMAIN.structure.has('slab')).toBe(true);
      expect(VALID_KINDS_BY_DOMAIN.structure.has('pillar')).toBe(true);
      expect(VALID_KINDS_BY_DOMAIN.structure.has('arch')).toBe(true);
      expect(VALID_KINDS_BY_DOMAIN.structure.has('overhang')).toBe(true);
      expect(VALID_KINDS_BY_DOMAIN.structure.has('rubble_field')).toBe(true);
      expect(VALID_KINDS_BY_DOMAIN.structure.has('reef_mound')).toBe(true);
      expect(VALID_KINDS_BY_DOMAIN.structure.has('reef_wall')).toBe(true);

      // Biology & Colony kinds
      expect(VALID_KINDS_BY_DOMAIN.colony.has('coral_colony')).toBe(true);
      expect(VALID_KINDS_BY_DOMAIN.colony.has('sponge_colony')).toBe(true);
      expect(VALID_KINDS_BY_DOMAIN.vegetation.has('kelp_forest')).toBe(true);
      expect(VALID_KINDS_BY_DOMAIN.vegetation.has('seagrass_meadow')).toBe(true);
      expect(VALID_KINDS_BY_DOMAIN.vegetation.has('algae_bed')).toBe(true);

      // Habitat & Phenomenon kinds
      expect(VALID_KINDS_BY_DOMAIN.habitat.has('shelter_zone')).toBe(true);
      expect(VALID_KINDS_BY_DOMAIN.habitat.has('nursery_zone')).toBe(true);
      expect(VALID_KINDS_BY_DOMAIN.habitat.has('feeding_ground')).toBe(true);
      expect(VALID_KINDS_BY_DOMAIN.phenomenon.has('current')).toBe(true);
      expect(VALID_KINDS_BY_DOMAIN.phenomenon.has('upwelling')).toBe(true);
      expect(VALID_KINDS_BY_DOMAIN.phenomenon.has('sediment_plume')).toBe(true);
      expect(VALID_KINDS_BY_DOMAIN.phenomenon.has('bubble_field')).toBe(true);
    });
  });

  // =========================================================================
  // 2. Identity Stability & Legacy Compatibility (Section 29)
  // =========================================================================
  describe('2. Identity Stability & Legacy Compatibility', () => {
    it('preserves all legacy rock, reef, flora anchor, and formation IDs in default environment', () => {
      const reg = new LandscapeFeatureRegistry(1337);

      const legacyRockIds = ['ROCK_001', 'ROCK_002', 'ROCK_003', 'ROCK_004', 'ROCK_005'];
      for (const id of legacyRockIds) {
        expect(reg.has(id)).toBe(true);
        const f = reg.get(id)!;
        expect(f.category).toBe('rock');
        expect(f.domain).toBe('structure');
      }

      const legacyReefIds = ['STRUCTURE_001', 'REEF_001', 'REEF_002'];
      for (const id of legacyReefIds) {
        expect(reg.has(id)).toBe(true);
        const f = reg.get(id)!;
        expect(f.category).toBe('reef_structure');
        expect(f.domain).toBe('structure');
      }

      const legacyFloraAnchorIds = [
        'FLORA_ANCHOR_acropora_amethyst',
        'FLORA_ANCHOR_giant_kelp_emerald',
        'FLORA_ANCHOR_cabomba_mint',
        'FLORA_ANCHOR_amazon_sword_crimson',
        'FLORA_ANCHOR_acropora_coral_pink',
        'FLORA_ANCHOR_giant_kelp_golden',
      ];
      for (const id of legacyFloraAnchorIds) {
        expect(reg.has(id)).toBe(true);
        const f = reg.get(id)!;
        expect(f.category).toBe('flora_anchor');
      }

      const canonicalFormations = [
        'FORMATION_WEST_SHELF',
        'FORMATION_EAST_BANK',
        'FORMATION_CENTRAL_TRENCH',
        'FORMATION_SEABED_PLATEAU',
      ];
      for (const id of canonicalFormations) {
        expect(reg.has(id)).toBe(true);
        const f = reg.get(id)!;
        expect(f.category).toBe('formation');
        expect(f.domain).toBe('geology');
      }
    });

    it('ensures every registered feature has a strictly unique, non-empty ID', () => {
      const reg = new LandscapeFeatureRegistry(4242);
      const all = reg.list();
      const ids = new Set<string>();

      expect(all.length).toBeGreaterThanOrEqual(25); // Substantially richer than previous 18
      for (const f of all) {
        expect(f.id).toBeTruthy();
        expect(typeof f.id).toBe('string');
        expect(ids.has(f.id)).toBe(false);
        ids.add(f.id);
      }
    });
  });

  // =========================================================================
  // 3. Determinism & Seeding (Section 11)
  // =========================================================================
  describe('3. Determinism & Seeding', () => {
    it('produces bit-identical feature registries when initialized with the same seed', () => {
      const regA = new LandscapeFeatureRegistry(9876);
      const regB = new LandscapeFeatureRegistry(9876);

      expect(regA.count()).toBe(regB.count());

      const listA = regA.list();
      const listB = regB.list();

      for (let i = 0; i < listA.length; i++) {
        const a = listA[i];
        const b = listB[i];

        expect(a.id).toBe(b.id);
        expect(a.domain).toBe(b.domain);
        expect(a.kind).toBe(b.kind);
        expect(a.position4D.x).toBeCloseTo(b.position4D.x, 8);
        expect(a.position4D.z).toBeCloseTo(b.position4D.z, 8);
        expect(a.scale4D.x).toBeCloseTo(b.scale4D.x, 8);
        expect(a.scale4D.y).toBeCloseTo(b.scale4D.y, 8);
        expect(a.scale4D.z).toBeCloseTo(b.scale4D.z, 8);
      }
    });

    it('produces meaningful environmental variation with different seeds', () => {
      const regA = new LandscapeFeatureRegistry(1001);
      const regB = new LandscapeFeatureRegistry(9999);

      const slabsA = regA.list().filter(f => f.id.startsWith('POP_SLABS_WEST'));
      const slabsB = regB.list().filter(f => f.id.startsWith('POP_SLABS_WEST'));

      expect(slabsA.length).toBeGreaterThan(0);
      expect(slabsB.length).toBeGreaterThan(0);
      expect(slabsA.length).toBe(slabsB.length);

      // Coordinates between different seeds must vary
      const firstA = slabsA[0];
      const firstB = slabsB[0];
      expect(firstA.position4D.x).not.toBe(firstB.position4D.x);
    });
  });

  // =========================================================================
  // 4. Spatial Hierarchy (Section 12)
  // =========================================================================
  describe('4. Spatial Hierarchy', () => {
    it('establishes structured regions and zones with resolved parentage', () => {
      const reg = new LandscapeFeatureRegistry(1337);

      const regions = reg.getRegions();
      expect(regions.length).toBe(3); // West, Central, East
      expect(regions.map(r => r.id)).toContain('REGION_WEST');
      expect(regions.map(r => r.id)).toContain('REGION_CENTRAL');
      expect(regions.map(r => r.id)).toContain('REGION_EAST');

      const zones = reg.getZones();
      expect(zones.length).toBe(4);
      expect(zones.map(z => z.id)).toContain('ZONE_WEST_SHELF');
      expect(zones.map(z => z.id)).toContain('ZONE_CENTRAL_REEF');
      expect(zones.map(z => z.id)).toContain('ZONE_TRENCH_DEPTHS');
      expect(zones.map(z => z.id)).toContain('ZONE_EAST_PLATEAU');

      // Verify parent linkage
      for (const z of zones) {
        expect(reg.getRegion(z.parentId)).toBeDefined();
      }
    });

    it('allows spatial filtering of features by zone and region', () => {
      const reg = new LandscapeFeatureRegistry(1337);

      const westFeatures = reg.getByZone('ZONE_WEST_SHELF');
      expect(westFeatures.length).toBeGreaterThan(0);
      for (const f of westFeatures) {
        expect(f.parentId).toBe('ZONE_WEST_SHELF');
      }

      const centralRegionFeatures = reg.getByRegion('REGION_CENTRAL');
      expect(centralRegionFeatures.length).toBeGreaterThan(0);
    });
  });

  // =========================================================================
  // 5. Feature Relationship Graph (Section 13)
  // =========================================================================
  describe('5. Feature Relationship Graph', () => {
    it('manages directed relationships without dangling references', () => {
      const reg = new LandscapeFeatureRegistry(1337);
      const graph = reg.relationshipGraph;

      const allValidIds = new Set(reg.list().map(f => f.id));
      const dangling = graph.validateDanglingReferences(allValidIds);
      expect(dangling).toEqual([]);

      // Verify specific expected relationships
      const rock1Outgoing = graph.getOutgoing('ROCK_001');
      expect(rock1Outgoing.length).toBeGreaterThan(0);
      expect(rock1Outgoing.some(r => r.targetId === 'FORMATION_WEST_SHELF' && r.type === 'embedded-in')).toBe(true);

      const shelterIncoming = graph.getIncoming('STRUCTURE_001');
      expect(shelterIncoming.length).toBeGreaterThan(0);
    });

    it('detects and reports cycles in hierarchical relationships', () => {
      const graph = new FeatureRelationshipGraph();
      graph.addRelationship({ sourceId: 'A', targetId: 'B', type: 'sheltered-by' });
      graph.addRelationship({ sourceId: 'B', targetId: 'C', type: 'sheltered-by' });
      expect(graph.hasCycle('sheltered-by')).toBe(false);

      // Introduce cycle
      graph.addRelationship({ sourceId: 'C', targetId: 'A', type: 'sheltered-by' });
      expect(graph.hasCycle('sheltered-by')).toBe(true);
    });
  });

  // =========================================================================
  // 6. Environmental Suitability (Section 14 & 15)
  // =========================================================================
  describe('6. Environmental Suitability', () => {
    it('evaluates environmental suitability score correctly given local conditions', () => {
      const preferences = {
        depth: { min: -7.0, max: -5.5, optimum: -6.2 },
        slope: { min: 0.0, max: 0.4 },
        substrateAffinity: { exposed_rock: 1.0, sand: 0.2 },
      };

      // Favorable condition
      const optimalScore = evaluateSuitability(
        { depth: -6.2, slope: 0.1, substrate: 'exposed_rock' },
        preferences
      );
      expect(optimalScore).toBeCloseTo(1.0, 2);

      // Unfavorable substrate
      const sandScore = evaluateSuitability(
        { depth: -6.2, slope: 0.1, substrate: 'sand' },
        preferences
      );
      expect(sandScore).toBeLessThan(optimalScore);
      expect(sandScore).toBeGreaterThan(0.0);

      // Out of depth bound (fatal)
      const outOfBoundsScore = evaluateSuitability(
        { depth: -8.5, slope: 0.1, substrate: 'exposed_rock' },
        preferences
      );
      expect(outOfBoundsScore).toBe(0.0);
    });
  });

  // =========================================================================
  // 7. Population Expansion & Clustering (Section 9)
  // =========================================================================
  describe('7. Population Expansion & Clustering', () => {
    it('generates bounded instances with consistent morphologies', () => {
      const pop = new FeaturePopulation({
        id: 'TEST_POP_01',
        name: 'Test Population',
        domain: 'structure',
        kind: 'rock',
        archetypes: ['rounded', 'slab'],
        count: 5,
        spatialBounds: { minX: -5.0, maxX: 5.0, minZ: -3.0, maxZ: 3.0 },
        sizeDistribution: {
          minScale: { x: 0.5, y: 0.4, z: 0.5 },
          maxScale: { x: 1.2, y: 1.0, z: 1.2 },
        },
        morphologyDistribution: {
          roughness: { min: 0.2, max: 0.8 },
        },
        seed: 42,
        wRange: [-10, 50],
      });

      const instances = pop.generateInstances();
      expect(instances.length).toBe(5);

      for (const inst of instances) {
        expect(inst.position4D.x).toBeGreaterThanOrEqual(-5.0);
        expect(inst.position4D.x).toBeLessThanOrEqual(5.0);
        expect(inst.position4D.z).toBeGreaterThanOrEqual(-3.0);
        expect(inst.position4D.z).toBeLessThanOrEqual(3.0);
        expect(inst.scale4D.x).toBeGreaterThanOrEqual(0.5);
        expect(inst.scale4D.x).toBeLessThanOrEqual(1.2);
        expect(['rounded', 'slab']).toContain(inst.morphology.archetype);
        expect(inst.morphology.roughness).toBeGreaterThanOrEqual(0.2);
        expect(inst.morphology.roughness).toBeLessThanOrEqual(0.8);
      }
    });
  });

  // =========================================================================
  // 8. 4D Temporal Evaluation & Spatial Deformation (Section 22)
  // =========================================================================
  describe('8. 4D Temporal Evaluation & Spatial Deformation', () => {
    it('evaluates all feature categories at explicit w with zero reliance on mutable time4D', () => {
      const sysA = new LandscapeEvolutionSystem(1337);
      sysA.setTime4D(12.0);

      const sysB = new LandscapeEvolutionSystem(1337);
      sysB.setTime4D(75.0);

      // Slices to probe across geological epochs
      const targetW = 35.0;

      const testFeatureIds = [
        'ROCK_001',
        'STRUCTURE_001',
        'FORMATION_WEST_SHELF',
        'FORMATION_EAST_BANK',
        'CORAL_COLONY_BRANCHING_01',
        'CURRENT_BENTHIC_DRIFT_01',
        'SHELTER_ZONE_CENTRAL_01',
      ];

      for (const id of testFeatureIds) {
        const stateA = sysA.projectFeature(id, targetW);
        const stateB = sysB.projectFeature(id, targetW);

        expect(stateA).toBeDefined();
        expect(stateB).toBeDefined();

        expect(stateA!.visible).toBe(stateB!.visible);
        if (stateA!.visible) {
          expect(stateA!.projectedPosition.x).toBeCloseTo(stateB!.projectedPosition.x, 6);
          expect(stateA!.projectedPosition.y).toBeCloseTo(stateB!.projectedPosition.y, 6);
          expect(stateA!.projectedPosition.z).toBeCloseTo(stateB!.projectedPosition.z, 6);
          expect(stateA!.surfaceElevation).toBeCloseTo(stateB!.surfaceElevation, 6);
        }
      }
    });
  });

  // =========================================================================
  // 9. World Specification Validation & Adversarial Rejection (Section 26, 35)
  // =========================================================================
  describe('9. World Specification Validation & Adversarial Rejection', () => {
    it('validates a well-formed default world specification successfully', () => {
      const defaultSpec = createDefaultWorldSpecification(1337);
      const res = WorldSpecificationValidator.validate(defaultSpec);
      expect(res.isValid).toBe(true);
      expect(res.errors).toEqual([]);
    });

    it('rejects an invalid schema version', () => {
      const spec: any = {
        ...createDefaultWorldSpecification(1337),
        schemaVersion: '1.0.0',
      };
      const res = WorldSpecificationValidator.validate(spec);
      expect(res.isValid).toBe(false);
      expect(res.errors.some(e => e.includes('Unsupported schema version'))).toBe(true);
    });

    it('rejects inverted or non-finite spatial bounds', () => {
      const spec = createDefaultWorldSpecification(1337);
      spec.regions[0].bounds = { minX: 10.0, maxX: -5.0, minZ: 0, maxZ: 5 }; // inverted minX > maxX

      const res = WorldSpecificationValidator.validate(spec);
      expect(res.isValid).toBe(false);
      expect(res.errors.some(e => e.includes('Invalid X bounds'))).toBe(true);
    });

    it('rejects unknown feature domains and kinds', () => {
      const spec = createDefaultWorldSpecification(1337);
      spec.populations = [
        {
          id: 'INVALID_POP',
          name: 'Invalid Domain Pop',
          domain: 'magic' as any,
          kind: 'dragon' as any,
          archetypes: [],
          count: 5,
          spatialBounds: { minX: -2, maxX: 2, minZ: -2, maxZ: 2 },
          sizeDistribution: { minScale: { x: 1, y: 1, z: 1 }, maxScale: { x: 2, y: 2, z: 2 } },
          seed: 123,
          wRange: [-10, 10],
        },
      ];

      const res = WorldSpecificationValidator.validate(spec);
      expect(res.isValid).toBe(false);
      expect(res.errors.some(e => e.includes('Invalid domain'))).toBe(true);
    });

    it('rejects excessive population counts exceeding system safety threshold', () => {
      const spec = createDefaultWorldSpecification(1337);
      spec.populations = [
        {
          id: 'EXPLODING_POP',
          name: 'Exploding Population',
          domain: 'structure',
          kind: 'rock',
          archetypes: ['rounded'],
          count: 99999, // Unbounded attempt
          spatialBounds: { minX: -5, maxX: 5, minZ: -5, maxZ: 5 },
          sizeDistribution: { minScale: { x: 1, y: 1, z: 1 }, maxScale: { x: 2, y: 2, z: 2 } },
          seed: 123,
          wRange: [-10, 10],
        },
      ];

      const res = WorldSpecificationValidator.validate(spec);
      expect(res.isValid).toBe(false);
      expect(res.errors.some(e => e.includes('exceeds maximum allowed bound'))).toBe(true);
    });

    it('rejects duplicate feature IDs in custom features', () => {
      const spec = createDefaultWorldSpecification(1337);
      spec.customFeatures = [
        {
          id: 'DUPLICATE_ROCK',
          name: 'Rock 1',
          domain: 'structure',
          kind: 'rock',
          position4D: { x: 0, y: -6, z: 0, w: 0 },
          scale4D: { x: 1, y: 1, z: 1, w: 1 },
          wRange: [-10, 10],
        },
        {
          id: 'DUPLICATE_ROCK', // duplicate
          name: 'Rock 2',
          domain: 'structure',
          kind: 'rock',
          position4D: { x: 1, y: -6, z: 1, w: 0 },
          scale4D: { x: 1, y: 1, z: 1, w: 1 },
          wRange: [-10, 10],
        },
      ];

      const res = WorldSpecificationValidator.validate(spec);
      expect(res.isValid).toBe(false);
      expect(res.errors.some(e => e.includes('Duplicate feature ID'))).toBe(true);
    });
  });

  // =========================================================================
  // 10. World Compiler Execution & Round-Trip (Section 25)
  // =========================================================================
  describe('10. World Compiler Execution & Round-Trip', () => {
    it('compiles a validated specification into an active registry', () => {
      const spec = createDefaultWorldSpecification(2026);
      const { registry, validation } = WorldCompiler.compile(spec);

      expect(validation.isValid).toBe(true);
      expect(registry.getRegions().length).toBe(3);
      expect(registry.getZones().length).toBe(4);
      expect(registry.count()).toBeGreaterThan(0);

      // Verify that features are instantiated and evaluated properly
      const sample = registry.list()[0];
      expect(sample).toBeDefined();
      expect(sample.id).toBeTruthy();
    });

    it('round-trips registry features to serialized specification', () => {
      const reg = new LandscapeFeatureRegistry(1337);
      const serialized = WorldCompiler.serialize(reg, 1337, 'Round-trip Test');

      expect(serialized.schemaVersion).toBe('2.0.0');
      expect(serialized.seed).toBe(1337);
      expect(serialized.regions.length).toBe(3);
      expect(serialized.customFeatures?.length).toBe(reg.count());

      // Recompile serialized specification
      const { registry: recompiled, validation } = WorldCompiler.compile(serialized);
      expect(validation.isValid).toBe(true);
      expect(recompiled.count()).toBe(reg.count());
    });
  });

  // =========================================================================
  // 11. Renderer Independence (Section 2, 7 & 43)
  // =========================================================================
  describe('11. Renderer Independence', () => {
    it('generates and evaluates the complete rich world without any Three.js or DOM context', () => {
      // Execute in pure headless environment
      const reg = new LandscapeFeatureRegistry(5555);
      expect(reg.count()).toBeGreaterThanOrEqual(25);

      const states = reg.evaluateAll(25.0, (x, z) => ({
        elevation: -6.5,
        normal: { x: 0, y: 1, z: 0 },
        curvature: 0.02,
        flowDelta: { x: 0.05, y: 0.0, z: -0.02 },
        gradient: { dx: 0, dz: 0 },
      }));

      expect(states.size).toBe(reg.count());
      for (const [id, s] of states.entries()) {
        expect(s.id).toBe(id);
        expect(Number.isFinite(s.projectedPosition.y)).toBe(true);
        expect(Number.isFinite(s.projectedScale.x)).toBe(true);
      }
    });
  });
});

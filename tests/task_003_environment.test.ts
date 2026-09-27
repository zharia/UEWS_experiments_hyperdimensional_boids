import { describe, it, expect } from 'vitest';
import { EnvironmentalWorldManager } from '../src/ecology/environment/EnvironmentalWorldManager';
import { EcologySimulation } from '../src/simulation/EcologySimulation';
import { Vector3D } from '../src/space/physical/Vector3D';
import { MemoryStorageProvider, WorldPersistenceService } from '../src/core/persistence/WorldPersistence';

describe('Program Increment v0.0.1 - Task 003: Authoritative Environmental World Model', () => {
  it('003.002: should initialize authoritative environmental state with valid ranges', () => {
    const env = new EnvironmentalWorldManager(42);

    // Water state
    expect(env.water.flow).toBeInstanceOf(Vector3D);
    expect(env.water.turbulence).toBeGreaterThanOrEqual(0.0);
    expect(env.water.turbulence).toBeLessThanOrEqual(1.0);
    expect(env.water.temperature).toBeGreaterThan(20.0);
    expect(env.water.temperature).toBeLessThan(30.0);
    expect(env.water.turbidity).toBeGreaterThanOrEqual(0.0);
    expect(env.water.turbidity).toBeLessThanOrEqual(1.0);
    expect(env.water.clarity).toBeCloseTo(1.0 - env.water.turbidity, 2);

    // Illumination state
    expect(env.illumination.intensity).toBeGreaterThanOrEqual(0.0);
    expect(env.illumination.intensity).toBeLessThanOrEqual(1.0);
    expect(env.illumination.direction.length()).toBeCloseTo(1.0, 2);
    expect(env.illumination.temporal_phase).toBeGreaterThanOrEqual(0.0);
    expect(env.illumination.temporal_phase).toBeLessThanOrEqual(1.0);

    // Substrate state
    expect(['fine_sand', 'coarse_gravel', 'biogenic_reef', 'silt_detritus']).toContain(env.substrate.composition);
    expect(env.substrate.stability).toBeGreaterThan(0.0);
    expect(env.substrate.stability).toBeLessThanOrEqual(1.0);
    expect(env.substrate.sediment).toBeGreaterThanOrEqual(0.0);

    // Vegetation state
    expect(env.vegetation.density).toBeGreaterThan(0.0);
    expect(env.vegetation.health).toBeGreaterThan(0.0);
    expect(env.vegetation.movement_response).toBeGreaterThan(0.0);

    // Particles & Structures
    expect(env.particles.density).toBeGreaterThan(0);
    expect(env.structures.length).toBeGreaterThanOrEqual(4);
    expect(env.structures.some((s) => s.type === 'rock')).toBe(true);
    expect(env.structures.some((s) => s.type === 'cave')).toBe(true);
  });

  it('003.008: should govern continuous dynamics, inertia, disturbance decay, and sediment settling', () => {
    const env = new EnvironmentalWorldManager(100);

    // Trigger external disturbance
    env.applyDisturbance(0.8);
    expect(env.disturbance).toBeCloseTo(0.8, 2);
    expect(env.substrate.disturbance).toBeCloseTo(0.8, 2);
    expect(env.water.turbulence).toBeGreaterThan(0.2);

    // Advance simulation over several time steps
    const initialDisturbance = env.disturbance;
    const initialSediment = env.substrate.sediment;

    for (let t = 0; t < 20; t++) {
      env.update(0.5, t * 0.5);
    }

    // Disturbance must decay exponentially
    expect(env.disturbance).toBeLessThan(initialDisturbance);
    expect(env.substrate.disturbance).toBeLessThan(initialDisturbance);

    // Sediment should settle downward gradually
    for (let t = 20; t < 80; t++) {
      env.update(0.5, t * 0.5);
    }
    expect(env.substrate.sediment).toBeLessThanOrEqual(initialSediment);
  });

  it('003.009: should couple agent activity and feeding to environmental state', () => {
    const env = new EnvironmentalWorldManager(123);
    const baselineTurbidity = env.water.turbidity;
    const baselineSediment = env.substrate.sediment;

    // High velocity agents induce turbulence
    env.recordAgentActivity([2.5, 3.2, 2.8, 3.0], 0, 50.0);
    for (let i = 0; i < 10; i++) {
      env.update(0.1, i * 0.1);
    }
    expect(env.water.turbulence).toBeGreaterThan(0.15);
    expect(env.ecologicalActivity).toBeGreaterThan(0.2);

    // Feeding disturbance near bottom kicks up sediment and turbidity
    env.applyFeedingDisturbance(new Vector3D(0, -6.0, 0), 1.0);
    for (let i = 0; i < 10; i++) {
      env.update(0.1, 1.0 + i * 0.1);
    }
    expect(env.substrate.sediment).toBeGreaterThan(baselineSediment);
    expect(env.water.turbidity).toBeGreaterThan(baselineTurbidity);
  });

  it('003.011: should produce compact, bounded environmental signature', () => {
    const env = new EnvironmentalWorldManager(55);
    const sig = env.getSignature();

    expect(sig.illumination).toBeGreaterThanOrEqual(0.0);
    expect(sig.illumination).toBeLessThanOrEqual(1.0);
    expect(sig.activity).toBeGreaterThanOrEqual(0.0);
    expect(sig.activity).toBeLessThanOrEqual(1.0);
    expect(sig.turbulence).toBeGreaterThanOrEqual(0.0);
    expect(sig.turbulence).toBeLessThanOrEqual(1.0);
    expect(sig.vegetation).toBeGreaterThanOrEqual(0.0);
    expect(sig.vegetation).toBeLessThanOrEqual(1.0);
    expect(sig.turbidity).toBeGreaterThanOrEqual(0.0);
    expect(sig.turbidity).toBeLessThanOrEqual(1.0);
    expect(sig.habitat_complexity).toBeGreaterThan(0.0);
  });

  it('003.012: observer state should modulate projection fidelity but NEVER alter authoritative simulation state', () => {
    const env = new EnvironmentalWorldManager(77);
    env.update(1.0, 10.0);

    const authoritativeTurbidity = env.water.turbidity;
    const authoritativeDensity = env.particles.density;
    const authoritativeTurbulence = env.water.turbulence;

    // Projection with WATCHING observer (full fidelity)
    const watchingProj = env.getVisualProjection('WATCHING');
    expect(watchingProj.particles.targetCount).toBe(authoritativeDensity);

    // Projection with ABSENT observer (reduced fidelity)
    const absentProj = env.getVisualProjection('ABSENT');
    expect(absentProj.particles.targetCount).toBeLessThan(watchingProj.particles.targetCount);

    // Authoritative simulation state remains strictly unchanged
    expect(env.water.turbidity).toBe(authoritativeTurbidity);
    expect(env.particles.density).toBe(authoritativeDensity);
    expect(env.water.turbulence).toBe(authoritativeTurbulence);
  });

  it('003.014: should evolve deterministically under fixed random seed', () => {
    const env1 = new EnvironmentalWorldManager(999);
    const env2 = new EnvironmentalWorldManager(999);

    for (let i = 0; i < 40; i++) {
      env1.update(0.1, i * 0.1);
      env2.update(0.1, i * 0.1);
    }

    expect(env1.water.flow.x).toBeCloseTo(env2.water.flow.x, 5);
    expect(env1.water.turbidity).toBeCloseTo(env2.water.turbidity, 5);
    expect(env1.water.turbulence).toBeCloseTo(env2.water.turbulence, 5);
    expect(env1.substrate.sediment).toBeCloseTo(env2.substrate.sediment, 5);
    expect(env1.ecologicalActivity).toBeCloseTo(env2.ecologicalActivity, 5);
  });

  it('003.015: should serialize and restore complete environmental state via WorldState persistence', async () => {
    const memoryStore = new MemoryStorageProvider();
    const persistence = new WorldPersistenceService(memoryStore);

    const sim1 = new EcologySimulation(333);
    // Perturb environment
    sim1.environment.applyDisturbance(0.7);
    sim1.dropFood(2.0, -6.2, 0.5, 1.2);

    for (let i = 0; i < 25; i++) {
      sim1.update(0.1);
    }

    const stateSnapshot = sim1.captureWorldState('0.2');
    expect(stateSnapshot.environmentalState).toBeDefined();
    expect(stateSnapshot.environmentalState!.water.turbidity).toBeGreaterThan(0);
    expect(stateSnapshot.environmentalState!.substrate.sediment).toBeGreaterThan(0);

    await persistence.saveWorld(stateSnapshot);

    const loadedSnapshot = await persistence.loadWorld();
    expect(loadedSnapshot).toBeDefined();
    expect(loadedSnapshot!.environmentalState).toBeDefined();

    const sim2 = new EcologySimulation(1);
    sim2.restoreWorldState(loadedSnapshot!);

    expect(sim2.environment.water.turbidity).toBeCloseTo(sim1.environment.water.turbidity, 4);
    expect(sim2.environment.water.turbulence).toBeCloseTo(sim1.environment.water.turbulence, 4);
    expect(sim2.environment.substrate.sediment).toBeCloseTo(sim1.environment.substrate.sediment, 4);
    expect(sim2.environment.structures.length).toBe(sim1.environment.structures.length);
  });

  it('003.016: should provide clean acoustic boundary for Task 004', () => {
    const env = new EnvironmentalWorldManager(444);
    env.update(0.5, 5.0);

    const acousticBoundary = env.getAcousticBoundary();
    expect(acousticBoundary.signature).toBeDefined();
    expect(acousticBoundary.ambientFlowIntensity).toBeGreaterThan(0);
    expect(acousticBoundary.turbulenceLevel).toBeGreaterThanOrEqual(0);
    expect(acousticBoundary.waterTemperature).toBeGreaterThan(20);
    expect(acousticBoundary.bubbleGenerationRate).toBeGreaterThan(0);
  });
});

import { describe, it, expect } from 'vitest';
import { EcologySimulation } from '../src/simulation/EcologySimulation';
import { MemoryStorageProvider, WorldPersistenceService } from '../src/core/persistence/WorldPersistence';
import { isValidWorldStateV01 } from '../src/core/state/WorldState';

describe('World State Persistence & Versioned Schema (v0.1)', () => {
  it('should capture valid v0.1 world state schema', () => {
    const sim = new EcologySimulation(42);
    const state = sim.captureWorldState();

    expect(isValidWorldStateV01(state)).toBe(true);
    expect(state.schemaVersion).toBe('0.1');
    expect(state.agents.length).toBeGreaterThan(0);
    expect(state.clock.simulationTimeSeconds).toBeGreaterThanOrEqual(0);
  });

  it('should reject invalid world states during schema validation', () => {
    expect(isValidWorldStateV01(null)).toBe(false);
    expect(isValidWorldStateV01({})).toBe(false);
    expect(isValidWorldStateV01({ schemaVersion: '99.0' })).toBe(false);
    expect(isValidWorldStateV01({ schemaVersion: '0.1', clock: null })).toBe(false);
  });

  it('should save and load state with full continuity across sessions', async () => {
    const memoryStore = new MemoryStorageProvider();
    const persistence = new WorldPersistenceService(memoryStore);

    const sim1 = new EcologySimulation(100);
    // Run simulation for several ticks
    for (let i = 0; i < 20; i++) {
      sim1.update(0.05);
    }

    sim1.dropFood(0, 0, 0, 1.0);
    const state1 = sim1.captureWorldState();
    await persistence.saveWorld(state1);

    expect(await persistence.hasSavedWorld()).toBe(true);

    const loadedState = await persistence.loadWorld();
    expect(loadedState).not.toBeNull();

    // Create fresh uninitialised simulation and restore
    const sim2 = new EcologySimulation(999);
    sim2.restoreWorldState(loadedState!);

    expect(sim2.clock.simulationTime).toBeCloseTo(sim1.clock.simulationTime, 3);
    expect(sim2.agents.length).toBe(sim1.agents.length);
    expect(sim2.phaseEngine.currentPhase).toBe(sim1.phaseEngine.currentPhase);
    expect(sim2.resources.resources.length).toBe(sim1.resources.resources.length);
  });
});

import { describe, it, expect } from 'vitest';
import { EcologySimulation } from '../src/simulation/EcologySimulation';
import { EcologicalAgent } from '../src/agents/agent/EcologicalAgent';
import { Vector3D } from '../src/space/physical/Vector3D';
import { PopulationManager } from '../src/population/PopulationManager';
import { HabitatManager } from '../src/ecology/habitats/HabitatManager';
import { EcologicalEventLedger } from '../src/history/EcologicalEventLedger';
import { MemoryStorageProvider, WorldPersistenceService } from '../src/core/persistence/WorldPersistence';

describe('Program Increment 004: Emergent Ecological Dynamics & Causal Ledger', () => {
  it('should track multi-species populations and calculate demographic carrying capacities', () => {
    const popManager = new PopulationManager();
    const agents = [
      new EcologicalAgent('a1', 'titan_discus'),
      new EcologicalAgent('a2', 'titan_discus'),
      new EcologicalAgent('a3', 'azure_discus'),
    ];

    popManager.synchronize(agents, 10.0);

    const discusPop = popManager.getPopulation('titan_discus');
    expect(discusPop).toBeDefined();
    expect(discusPop!.count).toBe(2);

    const azurePop = popManager.getPopulation('azure_discus');
    expect(azurePop).toBeDefined();
    expect(azurePop!.count).toBe(1);

    // Record births and deaths
    discusPop!.recordBirth('a4', 12.0);
    expect(discusPop!.count).toBe(3);
    expect(discusPop!.birthsTotal).toBe(1);

    discusPop!.recordMortality('a1', 'starvation', 15.0);
    expect(discusPop!.count).toBe(2);
    expect(discusPop!.deathsTotal).toBe(1);
  });

  it('should partition habitats, calculate occupancies, and evaluate suitability', () => {
    const habitatManager = new HabitatManager();
    const habitats = habitatManager.getAllHabitats();

    expect(habitats.length).toBeGreaterThanOrEqual(4);
    expect(habitats.some((h) => h.type === 'SURFACE')).toBe(true);
    expect(habitats.some((h) => h.type === 'OPEN_WATER')).toBe(true);
    expect(habitats.some((h) => h.type === 'VEGETATION')).toBe(true);
    expect(habitats.some((h) => h.type === 'BENTHIC_SUBSTRATE')).toBe(true);

    // Surface test
    const surfaceHabitat = habitatManager.findHabitatAt(new Vector3D(0, 5.5, 0));
    expect(surfaceHabitat).toBeDefined();
    expect(surfaceHabitat!.type).toBe('SURFACE');

    // Benthic test
    const benthicHabitat = habitatManager.findHabitatAt(new Vector3D(0, -6.0, 0));
    expect(benthicHabitat).toBeDefined();
    expect(benthicHabitat!.type).toBe('BENTHIC_SUBSTRATE');
  });

  it('should maintain authoritative causal ledger and trace causal lineages', () => {
    const ledger = new EcologicalEventLedger(100);

    const rootEvent = ledger.recordEvent({
      eventType: 'ENVIRONMENTAL_SHIFT',
      timestamp: 10.0,
      phase: 'DIVERSIFICATION',
      significance: 0.8,
      description: 'Sudden light intensity shift across pelagic column',
    });

    const feedingEvent = ledger.recordEvent({
      eventType: 'FEEDING',
      timestamp: 12.0,
      participants: ['agent_1'],
      phase: 'ACTIVE',
      significance: 0.6,
      description: 'Agent fed on biofilm',
      cause: { eventId: rootEvent.id, description: 'Algal bloom sparked by light shift' },
    });

    const anticEvent = ledger.recordEvent({
      eventType: 'ANTIC_MANIFESTED',
      timestamp: 14.0,
      participants: ['agent_1', 'agent_2'],
      phase: 'ACTIVE',
      significance: 0.9,
      description: 'Courtship ritual initiated',
      cause: { eventId: feedingEvent.id, description: 'Satiation prompted reproductive courtship' },
    });

    // Trace causal chain back to origin
    const chain = ledger.traceCausalChain(anticEvent.id);
    expect(chain.length).toBe(3);
    expect(chain[0].id).toBe(anticEvent.id);
    expect(chain[1].id).toBe(feedingEvent.id);
    expect(chain[2].id).toBe(rootEvent.id);
  });

  it('should demonstrate ecological feedback loop: habitat evaluation alters agent behaviour', () => {
    const sim = new EcologySimulation(42);
    expect(sim.agents.length).toBeGreaterThan(0);

    // Run simulation to observe habitat evaluation and migration steering
    const initialPositions = sim.agents.map((a) => a.position.clone());
    
    // Simulate 3 seconds
    for (let i = 0; i < 30; i++) {
      sim.update(0.1);
    }

    // At least one agent should have assigned habitat
    const agentsWithHabitat = sim.agents.filter((a) => a.currentHabitatId);
    expect(agentsWithHabitat.length).toBeGreaterThan(0);

    // Agents move and update their positions dynamically
    let movedCount = 0;
    for (let i = 0; i < sim.agents.length; i++) {
      if (sim.agents[i].position.distanceTo(initialPositions[i]) > 0.05) {
        movedCount++;
      }
    }
    expect(movedCount).toBeGreaterThan(0);
  });

  it('should persist and restore v0.2 state with populations, habitats, and event ledger', async () => {
    const memoryStore = new MemoryStorageProvider();
    const persistence = new WorldPersistenceService(memoryStore);

    const sim1 = new EcologySimulation(777);
    for (let i = 0; i < 15; i++) {
      sim1.update(0.1);
    }

    const snapshot = sim1.captureWorldState('0.2');
    expect(snapshot.schemaVersion).toBe('0.2');
    expect(snapshot.populations).toBeDefined();
    expect(snapshot.habitats).toBeDefined();
    expect(snapshot.eventLedger).toBeDefined();
    expect(snapshot.eventLedger!.events.length).toBeGreaterThan(0);

    await persistence.saveWorld(snapshot);

    const loaded = await persistence.loadWorld();
    expect(loaded).toBeDefined();
    expect(loaded!.schemaVersion).toBe('0.2');

    const sim2 = new EcologySimulation(1);
    sim2.restoreWorldState(loaded!);

    expect(sim2.populations.getAllPopulations().length).toBeGreaterThan(0);
    expect(sim2.habitats.getAllHabitats().length).toBeGreaterThan(0);
    expect(sim2.eventLedger.getAllEvents().length).toBe(snapshot.eventLedger!.events.length);
  });
});

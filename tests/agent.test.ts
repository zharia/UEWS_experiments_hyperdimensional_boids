import { describe, it, expect } from 'vitest';
import { EcologicalAgent } from '../src/agents/agent/EcologicalAgent';
import { Vector3D } from '../src/space/physical/Vector3D';
import { LatentState } from '../src/space/hyperdimensional/LatentState';

describe('Ecological Agent Subsystem', () => {
  it('should maintain persistent identity across serialization and deserialization', () => {
    const agent = new EcologicalAgent('agent_alpha_1', 'titan_discus', new Vector3D(1, 2, 3), 45.0);
    agent.lifecycle = 'elder';
    agent.ageSeconds = 620;
    agent.energy = 72.5;

    const json = agent.toJSON();
    const restored = EcologicalAgent.fromJSON(json);

    expect(restored.id).toBe('agent_alpha_1');
    expect(restored.species).toBe('titan_discus');
    expect(restored.lifecycle).toBe('elder');
    expect(restored.ageSeconds).toBe(620);
    expect(restored.energy).toBeCloseTo(72.5, 2);
    expect(restored.position.x).toBe(1);
    expect(restored.position.y).toBe(2);
    expect(restored.position.z).toBe(3);
    expect(restored.latentState.temporalW).toBe(45.0);
  });

  it('should modify and satisfy internal drives correctly', () => {
    const agent = new EcologicalAgent('agent_beta_2', 'neon_tetra');
    agent.drives.set('hunger', 0.2);
    agent.drives.add('hunger', 0.3);
    expect(agent.drives.get('hunger')).toBeCloseTo(0.5, 2);

    agent.drives.satisfy('hunger', 0.4);
    expect(agent.drives.get('hunger')).toBeCloseTo(0.1, 2);

    // Clamp boundary checks
    agent.drives.satisfy('hunger', 10.0);
    expect(agent.drives.get('hunger')).toBe(0.0);

    agent.drives.add('fear', 2.0);
    expect(agent.drives.get('fear')).toBe(1.0);
  });

  it('should enforce non-omniscient perception boundaries', () => {
    const agent = new EcologicalAgent('agent_gamma_3', 'celestial_ray', new Vector3D(0, 0, 0));
    agent.velocity.set(1, 0, 0); // Heading along +X

    const inFrontPos = new Vector3D(3.0, 0, 0);
    const behindPos = new Vector3D(-5.0, 0, 0);
    const distantPos = new Vector3D(25.0, 0, 0);

    const inFront = agent.perception.canPerceive(
      agent.position,
      agent.velocity,
      agent.latentState,
      inFrontPos
    );
    expect(inFront.perceivable).toBe(true);
    expect(inFront.salience).toBeGreaterThan(0);

    // Behind check (outside FOV and outside hearing radius)
    const behind = agent.perception.canPerceive(
      agent.position,
      agent.velocity,
      agent.latentState,
      behindPos
    );
    expect(behind.perceivable).toBe(false);

    // Distant check (outside sensory radius)
    const distant = agent.perception.canPerceive(
      agent.position,
      agent.velocity,
      agent.latentState,
      distantPos
    );
    expect(distant.perceivable).toBe(false);
  });

  it('should create and decay episodic memory over simulation time', () => {
    const agent = new EcologicalAgent('agent_delta_4', 'golden_guppy', new Vector3D(2, 2, 2));
    const mem = agent.memory.addMemory('food_discovered', agent.position, 10.0, 0.8, 1.0);

    expect(mem.eventType).toBe('food_discovered');
    expect(mem.valence).toBe(0.8);
    expect(mem.strength).toBe(1.0);

    // Advance memory decay by 150 seconds (one half-life)
    agent.memory.update(150.0);
    expect(mem.strength).toBeCloseTo(0.5, 1);

    // Further decay drops strength below threshold and purges
    agent.memory.update(600.0);
    expect(agent.memory.getMemoriesByType('food_discovered').length).toBe(0);
  });

  it('should modify and track agent relationships', () => {
    const agent = new EcologicalAgent('agent_1', 'neon_tetra');
    const targetId = 'agent_2';

    const rel = agent.relationships.getRelationship(targetId);
    expect(rel.familiarity).toBe(0);
    expect(rel.affinity).toBe(0);

    agent.relationships.modifyRelationship(targetId, 0.4, 0.5, 0.1, 20.0);
    const updated = agent.relationships.getRelationship(targetId);

    expect(updated.affinity).toBeCloseTo(0.4, 2);
    expect(updated.familiarity).toBeCloseTo(0.5, 2);
    expect(updated.fear).toBeCloseTo(0.1, 2);
    expect(updated.lastInteractionTime).toBe(20.0);

    agent.relationships.recordCooperation(targetId, 25.0);
    expect(updated.cooperationCount).toBe(1);
    expect(updated.affinity).toBeGreaterThan(0.4);
  });
});

import { describe, it, expect } from 'vitest';
import { bridgeEcologicalStateToBoids, IdentityBridgeStats } from '../src/rendering/aquariumScene';
import { EcologicalAgent } from '../src/agents/agent/EcologicalAgent';
import { Vector3D } from '../src/space/physical/Vector3D';
import { Boid4D } from '../src/types';
import { BoidSimulation4D } from '../src/simulation/boids4D';
import { EcologySimulation } from '../src/simulation/EcologySimulation';
import { BoidMorphologyManager } from '../src/morphology/BoidMorphologyManager';

function createTestAgent(
  id: string,
  behaviourType: any,
  energy: number,
  hunger: number,
  fear: number
): EcologicalAgent {
  const agent = new EcologicalAgent(
    id,
    'neon_tetra',
    new Vector3D(0, 0, 0),
    50.0,
    new Vector3D(1, 0, 0),
    0
  );
  agent.energy = energy;
  if (agent.behaviour) {
    agent.behaviour.currentBehaviour = {
      type: behaviourType,
      desiredSpeedMultiplier: 1.0,
      startTime: 0,
      reason: 'test',
    };
  }
  agent.drives.set('hunger', hunger);
  agent.drives.set('fear', fear);
  return agent;
}

function createTestBoid(id: string): Boid4D {
  return {
    id,
    x: 0,
    y: 0,
    z: 0,
    w: 50,
    vx: 1.0,
    vy: 0,
    vz: 0,
    vw: 0,
    speed: 1.0,
    scale: 1.0,
    speciesIndex: 2,
    regime: 'meso_schooling',
    swimPhase: 0,
    temporalAlpha: 1.0,
    bioluminescence: 0.5,
    mass: 1.0,
  };
}

describe('Task 006A — Ecological Identity Coupling & Conformance Tests', () => {
  // Test 1: Identity-based ecological/boid association
  it('establishes deterministic association strictly by organism ID', () => {
    const agentA = createTestAgent('organism_A', 'flee', 85, 0.2, 0.95);
    const agentB = createTestAgent('organism_B', 'rest', 42, 0.75, 0.1);
    const agentC = createTestAgent('organism_C', 'investigate', 68, 0.35, 0.25);

    const boidA = createTestBoid('organism_A');
    const boidB = createTestBoid('organism_B');
    const boidC = createTestBoid('organism_C');

    const stats = bridgeEcologicalStateToBoids([agentA, agentB, agentC], [boidA, boidB, boidC]);

    expect(stats.matchedCount).toBe(3);
    expect(stats.unmatchedBoidCount).toBe(0);
    expect(stats.unmatchedAgentCount).toBe(0);

    // Boid A reflects Agent A
    expect(boidA.ecologicalAgentId).toBe('organism_A');
    expect(boidA.behaviourType).toBe('flee');
    expect(boidA.energyLevel).toBe(85);
    expect(boidA.hungerDrive).toBe(0.2);
    expect(boidA.fearDrive).toBe(0.95);
    expect(boidA.isBursting).toBe(true);

    // Boid B reflects Agent B
    expect(boidB.ecologicalAgentId).toBe('organism_B');
    expect(boidB.behaviourType).toBe('rest');
    expect(boidB.energyLevel).toBe(42);
    expect(boidB.hungerDrive).toBe(0.75);
    expect(boidB.fearDrive).toBe(0.1);
    expect(boidB.isBursting).toBe(false);

    // Boid C reflects Agent C
    expect(boidC.ecologicalAgentId).toBe('organism_C');
    expect(boidC.behaviourType).toBe('investigate');
    expect(boidC.energyLevel).toBe(68);
    expect(boidC.curiosityTimer).toBeGreaterThanOrEqual(1.5);
  });

  // Test 2: Ecological population reordering
  it('preserves exact associations when the ecological agent population is reordered', () => {
    const agentA = createTestAgent('organism_A', 'flee', 90, 0.1, 0.9);
    const agentB = createTestAgent('organism_B', 'rest', 30, 0.8, 0.2);
    const agentC = createTestAgent('organism_C', 'investigate', 70, 0.4, 0.3);

    const boids = [
      createTestBoid('organism_A'),
      createTestBoid('organism_B'),
      createTestBoid('organism_C'),
    ];

    // Permute ecological agents: [C, A, B] instead of [A, B, C]
    const reorderedAgents = [agentC, agentA, agentB];
    const stats = bridgeEcologicalStateToBoids(reorderedAgents, boids);

    expect(stats.matchedCount).toBe(3);

    // Boid at index 0 (ID: organism_A) MUST still bind to Agent A, NOT Agent C (positional failure)
    expect(boids[0].ecologicalAgentId).toBe('organism_A');
    expect(boids[0].behaviourType).toBe('flee');
    expect(boids[0].behaviourType).not.toBe('investigate'); // Verifies NO positional fallback to C
    expect(boids[0].energyLevel).toBe(90);

    // Boid at index 1 (ID: organism_B) MUST still bind to Agent B, NOT Agent A
    expect(boids[1].ecologicalAgentId).toBe('organism_B');
    expect(boids[1].behaviourType).toBe('rest');
    expect(boids[1].behaviourType).not.toBe('flee');

    // Boid at index 2 (ID: organism_C) MUST still bind to Agent C, NOT Agent B
    expect(boids[2].ecologicalAgentId).toBe('organism_C');
    expect(boids[2].behaviourType).toBe('investigate');
  });

  // Test 3: Boid population reordering
  it('preserves exact associations when the physical boid population is reordered', () => {
    const agentA = createTestAgent('organism_A', 'flee', 95, 0.1, 0.95);
    const agentB = createTestAgent('organism_B', 'rest', 25, 0.7, 0.15);
    const agentC = createTestAgent('organism_C', 'graze', 60, 0.5, 0.3);

    const boidA = createTestBoid('organism_A');
    const boidB = createTestBoid('organism_B');
    const boidC = createTestBoid('organism_C');

    // Reorder boids: [B, C, A]
    const reorderedBoids = [boidB, boidC, boidA];
    bridgeEcologicalStateToBoids([agentA, agentB, agentC], reorderedBoids);

    // Boid at index 0 is B
    expect(reorderedBoids[0].id).toBe('organism_B');
    expect(reorderedBoids[0].ecologicalAgentId).toBe('organism_B');
    expect(reorderedBoids[0].behaviourType).toBe('rest');
    expect(reorderedBoids[0].energyLevel).toBe(25);

    // Boid at index 1 is C
    expect(reorderedBoids[1].id).toBe('organism_C');
    expect(reorderedBoids[1].ecologicalAgentId).toBe('organism_C');
    expect(reorderedBoids[1].behaviourType).toBe('graze');
    expect(reorderedBoids[1].energyLevel).toBe(60);

    // Boid at index 2 is A
    expect(reorderedBoids[2].id).toBe('organism_A');
    expect(reorderedBoids[2].ecologicalAgentId).toBe('organism_A');
    expect(reorderedBoids[2].behaviourType).toBe('flee');
    expect(reorderedBoids[2].energyLevel).toBe(95);
  });

  // Test 4: Stable identity after reordering and mutation
  it('maintains identity integrity across sequential population updates and state mutations', () => {
    const agentA = createTestAgent('organism_A', 'graze' as any, 50, 0.5, 0.2);
    const agentB = createTestAgent('organism_B', 'explore', 70, 0.3, 0.1);

    const boidA = createTestBoid('organism_A');
    const boidB = createTestBoid('organism_B');

    // Initial bridge
    bridgeEcologicalStateToBoids([agentA, agentB], [boidA, boidB]);
    expect(boidA.energyLevel).toBe(50);
    expect(boidB.energyLevel).toBe(70);

    // Mutate state & invert order
    agentA.energy = 88;
    if (agentA.behaviour) {
      agentA.behaviour.currentBehaviour = {
        type: 'flee',
        desiredSpeedMultiplier: 1.5,
        startTime: 1,
        reason: 'fleeing predator',
      };
    }

    bridgeEcologicalStateToBoids([agentB, agentA], [boidB, boidA]);
    expect(boidA.energyLevel).toBe(88);
    expect(boidA.behaviourType).toBe('flee');
    expect(boidB.energyLevel).toBe(70);
    expect(boidB.behaviourType).toBe('explore');
  });

  // Test 5: Missing ecological agent (unmatched boid)
  it('handles boid with missing ecological agent explicitly without fallback corruption', () => {
    const agentA = createTestAgent('organism_A', 'flee', 80, 0.2, 0.8);
    const agentB = createTestAgent('organism_B', 'rest', 40, 0.5, 0.1);

    const boidA = createTestBoid('organism_A');
    const boidB = createTestBoid('organism_B');
    const boidUnmatched = createTestBoid('organism_unmatched_X');
    boidUnmatched.ecologicalAgentId = 'stale_id';
    boidUnmatched.behaviourType = undefined;

    const stats = bridgeEcologicalStateToBoids(
      [agentA, agentB],
      [boidA, boidB, boidUnmatched]
    );

    expect(stats.matchedCount).toBe(2);
    expect(stats.unmatchedBoidCount).toBe(1);
    expect(stats.unmatchedBoidIds).toEqual(['organism_unmatched_X']);

    // Unmatched boid must clear ecologicalAgentId and NOT receive state from Agent A or B
    expect(boidUnmatched.ecologicalAgentId).toBeUndefined();
    expect(boidUnmatched.behaviourType).toBeUndefined();
  });

  // Test 6: Missing boid (unmatched ecological agent)
  it('handles ecological agent without matching boid cleanly and records diagnostics', () => {
    const agentA = createTestAgent('organism_A', 'rest', 50, 0.3, 0.1);
    const agentUnmatched = createTestAgent('organism_unmatched_Y', 'graze', 60, 0.4, 0.2);

    const boidA = createTestBoid('organism_A');

    const stats = bridgeEcologicalStateToBoids(
      [agentA, agentUnmatched],
      [boidA]
    );

    expect(stats.matchedCount).toBe(1);
    expect(stats.unmatchedAgentCount).toBe(1);
    expect(stats.unmatchedAgentIds).toEqual(['organism_unmatched_Y']);
    expect(boidA.ecologicalAgentId).toBe('organism_A');
  });

  // Test 7: Deterministic simulation
  it('ensures deterministic ID and state generation across seeded simulation instances', () => {
    const seed = 98765;
    const boidSim1 = new BoidSimulation4D(3, 20, 20, seed);
    const boidSim2 = new BoidSimulation4D(3, 20, 20, seed);

    expect(boidSim1.boids.length).toBe(boidSim2.boids.length);
    for (let i = 0; i < boidSim1.boids.length; i++) {
      expect(boidSim1.boids[i].id).toBe(boidSim2.boids[i].id);
      expect(boidSim1.boids[i].x).toBeCloseTo(boidSim2.boids[i].x, 6);
      expect(boidSim1.boids[i].vx).toBeCloseTo(boidSim2.boids[i].vx, 6);
    }

    const ecoSim1 = new EcologySimulation(seed);
    const ecoSim2 = new EcologySimulation(seed);

    expect(ecoSim1.agents.length).toBe(ecoSim2.agents.length);
    for (let i = 0; i < ecoSim1.agents.length; i++) {
      expect(ecoSim1.agents[i].id).toBe(ecoSim2.agents[i].id);
    }

    // Verify canonical ID naming alignment between boids and agents
    expect(boidSim1.boids[0].id).toBe(ecoSim1.agents[0].id); // macro_agent_1
  });

  // Test 8: Existing morphology identity behaviour
  it('binds morphology signatures and posture states strictly to organism IDs across array shuffles', () => {
    const manager = new BoidMorphologyManager(50, 112233);
    const boid1 = createTestBoid('organism_M1');
    const boid2 = createTestBoid('organism_M2');
    boid1.vx = 2.0;
    boid2.vx = 0.5;

    manager.update([boid1, boid2], 0.016);
    const telem1Initial = manager.getBoidTelemetry('organism_M1');
    const telem2Initial = manager.getBoidTelemetry('organism_M2');

    expect(telem1Initial).not.toBeNull();
    expect(telem2Initial).not.toBeNull();
    expect(telem1Initial?.signature.id).toBe('organism_M1');
    expect(telem2Initial?.signature.id).toBe('organism_M2');

    // Shuffle boids array passed into morphology manager
    manager.update([boid2, boid1], 0.016);

    const telem1PostShuffle = manager.getBoidTelemetry('organism_M1');
    const telem2PostShuffle = manager.getBoidTelemetry('organism_M2');

    // Signatures must remain identical and tied to the organism ID, not the array index
    expect(telem1PostShuffle?.signature).toEqual(telem1Initial?.signature);
    expect(telem2PostShuffle?.signature).toEqual(telem2Initial?.signature);
    expect(manager.getSignature('organism_M1')).toBe(manager.getSignature('organism_M1'));
    expect(manager.getSignature('organism_M1').id).toBe('organism_M1');
  });
});

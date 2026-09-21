import { describe, it, expect } from 'vitest';
import { EcologicalAgent } from '../src/agents/agent/EcologicalAgent';
import { Vector3D } from '../src/space/physical/Vector3D';
import { SeededRandom } from '../src/core/random/SeededRandom';

describe('Autonomous Behaviour Selection Layer', () => {
  it('should generate relevant candidate behaviours based on drive intensities', () => {
    const agent = new EcologicalAgent('agent_1', 'titan_discus', new Vector3D(0, 0, 0));
    agent.drives.set('hunger', 0.85);

    const candidates = agent.behaviour.generateCandidates(
      agent.id,
      agent.position,
      agent.drives,
      agent.memory,
      agent.relationships,
      [],
      [{ id: 'food_1', type: 'food', position: new Vector3D(2, 0, 0), distance: 2, quantity: 1, salience: 0.9 }],
      [],
      10.0
    );

    expect(candidates.some((c) => c.type === 'feed')).toBe(true);
    const feedCandidate = candidates.find((c) => c.type === 'feed')!;
    expect(feedCandidate.urgency).toBeGreaterThan(0.7);
  });

  it('should reject inappropriate behaviour candidates when preconditions or drives are low', () => {
    const agent = new EcologicalAgent('agent_2', 'neon_tetra');
    agent.drives.set('hunger', 0.05); // Not hungry
    agent.drives.set('fear', 0.0);    // Not scared

    const candidates = agent.behaviour.generateCandidates(
      agent.id,
      agent.position,
      agent.drives,
      agent.memory,
      agent.relationships,
      [],
      [],
      [],
      10.0
    );

    expect(candidates.some((c) => c.type === 'flee')).toBe(false);
    expect(candidates.some((c) => c.type === 'feed')).toBe(false);
    expect(candidates.some((c) => c.type === 'wander')).toBe(true);
  });

  it('should prioritize emergency flee over routine wander or feed when hazard is present', () => {
    const agent = new EcologicalAgent('agent_3', 'azure_discus');
    agent.drives.set('hunger', 0.9);
    agent.drives.set('fear', 0.95);

    const candidates = agent.behaviour.generateCandidates(
      agent.id,
      agent.position,
      agent.drives,
      agent.memory,
      agent.relationships,
      [],
      [{ id: 'food_1', type: 'food', position: new Vector3D(1, 0, 0), distance: 1, quantity: 1, salience: 1 }],
      [{ id: 'hazard_1', type: 'predator', position: new Vector3D(2, 0, 0), distance: 2, threatLevel: 0.95 }],
      15.0
    );

    const selected = agent.behaviour.selectBehaviour(candidates, 15.0);
    expect(selected.type).toBe('flee');
    expect(selected.desiredSpeedMultiplier).toBeGreaterThan(1.5);
  });

  it('should produce identical deterministic behaviour under controlled seed', () => {
    const runSim = (seed: number) => {
      const rng = new SeededRandom(seed);
      const agent = new EcologicalAgent('agent_det', 'neon_tetra', new Vector3D(rng.nextFloat(-5, 5), rng.nextFloat(-5, 5), 0));
      agent.drives.set('curiosity', rng.nextFloat(0.4, 0.9));
      agent.drives.set('socialisation', rng.nextFloat(0.3, 0.8));

      const candidates = agent.behaviour.generateCandidates(
        agent.id,
        agent.position,
        agent.drives,
        agent.memory,
        agent.relationships,
        [],
        [],
        [],
        1.0
      );
      const selected = agent.behaviour.selectBehaviour(candidates, 1.0);
      return {
        selectedType: selected.type,
        curiosity: agent.drives.get('curiosity'),
        socialisation: agent.drives.get('socialisation'),
      };
    };

    const res1 = runSim(12345);
    const res2 = runSim(12345);
    const resDifferent = runSim(99999);

    expect(res1.selectedType).toBe(res2.selectedType);
    expect(res1.curiosity).toBe(res2.curiosity);
    expect(res1.socialisation).toBe(res2.socialisation);
  });
});

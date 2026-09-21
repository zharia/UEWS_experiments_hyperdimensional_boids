import { describe, it, expect } from 'vitest';
import { AnticScheduler } from '../src/antics/scheduler/AnticScheduler';
import { AnticHistory } from '../src/antics/history/AnticHistory';
import { EcologicalAgent } from '../src/agents/agent/EcologicalAgent';
import { ResourceSystem } from '../src/ecology/resources/ResourceSystem';
import { DiscreteEnvironmentalFieldGrid } from '../src/space/fields/EnvironmentalField';
import { Vector3D } from '../src/space/physical/Vector3D';
import { SeededRandom } from '../src/core/random/SeededRandom';

describe('Antics Engine & Lifecycle', () => {
  it('should generate antic candidates when preconditions are satisfied', () => {
    const scheduler = new AnticScheduler(new SeededRandom(42));
    const agentA = new EcologicalAgent('agent_A', 'titan_discus', new Vector3D(0, 0, 0));
    const agentB = new EcologicalAgent('agent_B', 'azure_discus', new Vector3D(2, 0, 0));
    agentA.drives.set('curiosity', 0.85);

    const candidates = scheduler.candidateGenerator.generateCandidates(
      [agentA, agentB],
      [],
      10.0
    );

    expect(candidates.some((c) => c.antic.type === 'THE_INVESTIGATION')).toBe(true);
    const investigation = candidates.find((c) => c.antic.type === 'THE_INVESTIGATION')!;
    expect(investigation.antic.participants.length).toBe(2);
    expect(investigation.antic.phases).toEqual(['notice', 'approach', 'inspect', 'circle', 'depart']);
  });

  it('should activate antic and transition through its internal phases to completion', () => {
    const scheduler = new AnticScheduler(new SeededRandom(42));
    const fields = new DiscreteEnvironmentalFieldGrid();
    const resources = new ResourceSystem();
    const agentA = new EcologicalAgent('agent_A', 'titan_discus', new Vector3D(0, 0, 0));
    const agentB = new EcologicalAgent('agent_B', 'azure_discus', new Vector3D(2, 0, 0));
    agentA.drives.set('curiosity', 0.95);

    // Initial activation
    const step1 = scheduler.step([agentA, agentB], resources.resources, fields, 10.0);
    expect(step1.newlyActivated.length).toBeGreaterThan(0);
    expect(scheduler.activeAntics.length).toBe(1);

    const activeAntic = scheduler.activeAntics[0];
    expect(activeAntic.status).toBe('active');
    expect(agentA.currentAnticId).toBe(activeAntic.id);

    // Mid-lifecycle phase progression
    scheduler.step([agentA, agentB], resources.resources, fields, 12.5);
    expect(activeAntic.currentPhaseIndex).toBeGreaterThan(0);

    // Complete duration elapsed
    const stepFinal = scheduler.step([agentA, agentB], resources.resources, fields, 18.0);
    expect(stepFinal.completed.some((a) => a.id === activeAntic.id)).toBe(true);
    expect(scheduler.activeAntics.some((a) => a.id === activeAntic.id)).toBe(false);
    expect(activeAntic.status).toBe('completed');
  });

  it('should apply state consequences upon antic completion', () => {
    const scheduler = new AnticScheduler(new SeededRandom(42));
    const fields = new DiscreteEnvironmentalFieldGrid();
    const resources = new ResourceSystem();
    const agentA = new EcologicalAgent('agent_A', 'titan_discus', new Vector3D(0, 0, 0));
    const agentB = new EcologicalAgent('agent_B', 'azure_discus', new Vector3D(2, 0, 0));
    agentA.drives.set('curiosity', 0.9);

    const initialCuriosity = agentA.drives.get('curiosity');

    scheduler.step([agentA, agentB], resources.resources, fields, 10.0);
    scheduler.step([agentA, agentB], resources.resources, fields, 20.0); // Complete

    // State effect satisfied curiosity and updated relationship
    expect(agentA.drives.get('curiosity')).toBeLessThan(initialCuriosity);
    const rel = agentA.relationships.getRelationship(agentB.id);
    expect(rel.familiarity).toBeGreaterThan(0);
  });

  it('should enforce repetition suppression to prevent loop repetition', () => {
    const history = new AnticHistory(20);
    expect(history.getRepetitionPenalty('FEEDING_FRENZY', 10.0)).toBe(0.0);

    // Record two recent feeding frenzies
    history.record('a1', 'FEEDING_FRENZY', 8.0, 4.0, [], new Vector3D(0, 0, 0), 'completed', 'done');
    history.record('a2', 'FEEDING_FRENZY', 9.5, 4.0, [], new Vector3D(0, 0, 0), 'completed', 'done');

    const penalty = history.getRepetitionPenalty('FEEDING_FRENZY', 10.0);
    expect(penalty).toBeGreaterThan(0.5);

    // Unrelated antic has no penalty
    expect(history.getRepetitionPenalty('THE_INVESTIGATION', 10.0)).toBe(0.0);
  });
});

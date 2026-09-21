import { describe, it, expect } from 'vitest';
import { PhaseTransitionEngine } from '../src/phases/transitions/PhaseTransitionEngine';
import { EcologicalMetrics } from '../src/phases/phase/EcologicalPhase';

describe('Ecological Epoch Phases and State Transitions', () => {
  const baseMetrics: EcologicalMetrics = {
    totalBiomass: 20.0,
    speciesCount: 4,
    biodiversityIndex: 1.2,
    averageEnergy: 65.0,
    resourceDensity: 2.0,
    disturbanceLevel: 0.0,
    nutrientLevel: 0.3,
    algaeCoverage: 25.0,
  };

  it('should detect valid ecological state transitions', () => {
    const engine = new PhaseTransitionEngine('COLONISATION');
    engine.phaseEnteredTime = 0;

    // Simulate 20 seconds later with established metrics
    const transition = engine.evaluateTransitions(baseMetrics, 20.0);
    expect(transition).not.toBeNull();
    expect(transition?.toPhase).toBe('ESTABLISHMENT');
    expect(engine.currentPhase).toBe('ESTABLISHMENT');
  });

  it('should reject transitions before minimum phase duration elapsed', () => {
    const engine = new PhaseTransitionEngine('COLONISATION');
    engine.phaseEnteredTime = 10.0;
    engine.minPhaseDurationSeconds = 15.0;

    // Only 5 seconds elapsed
    const transition = engine.evaluateTransitions(baseMetrics, 15.0);
    expect(transition).toBeNull();
    expect(engine.currentPhase).toBe('COLONISATION');
  });

  it('should trigger acute PERTURBATION phase when disturbance threshold is breached', () => {
    const engine = new PhaseTransitionEngine('EQUILIBRIUM');
    engine.phaseEnteredTime = 0;

    const disturbedMetrics: EcologicalMetrics = {
      ...baseMetrics,
      disturbanceLevel: 0.85,
    };

    const transition = engine.evaluateTransitions(disturbedMetrics, 30.0);
    expect(transition?.toPhase).toBe('PERTURBATION');
    expect(engine.currentPhase).toBe('PERTURBATION');
  });

  it('should preserve and restore phase transition history', () => {
    const engine = new PhaseTransitionEngine('GENESIS');
    engine.phaseEnteredTime = 0;

    engine.evaluateTransitions(baseMetrics, 20.0); // GENESIS -> COLONISATION

    const json = engine.toJSON();
    const restored = new PhaseTransitionEngine();
    restored.fromJSON(json);

    expect(restored.currentPhase).toBe(engine.currentPhase);
    expect(restored.phaseEnteredTime).toBe(engine.phaseEnteredTime);
    expect(restored.transitionHistory.length).toBe(engine.transitionHistory.length);
  });
});

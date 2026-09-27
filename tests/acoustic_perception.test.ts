import { describe, it, expect, beforeEach } from 'vitest';
import { Vector3D } from '../src/space/physical/Vector3D';
import { SpeciesRegistry } from '../src/species/Species';
import { PerceptionSystem } from '../src/agents/perception/PerceptionSystem';
import { BehaviourSystem } from '../src/agents/behaviour/BehaviourSystem';
import { EcologicalAgent } from '../src/agents/agent/EcologicalAgent';
import { AcousticField } from '../src/ecology/acoustic/AcousticField';
import { AcousticEvent } from '../src/ecology/acoustic/AcousticState';
import { EcologySimulation } from '../src/simulation/EcologySimulation';

describe('Agent Acoustic Perception & Bi-directional Sensory Coupling', () => {
  let perception: PerceptionSystem;
  let behaviour: BehaviourSystem;
  let field: AcousticField;

  beforeEach(() => {
    perception = new PerceptionSystem();
    behaviour = new BehaviourSystem();
    field = new AcousticField();
  });

  it('1. All registered species define distinct acoustic sensory traits', () => {
    const all = SpeciesRegistry.getAll();
    expect(all.length).toBeGreaterThanOrEqual(7);

    for (const sp of all) {
      const traits = sp.traits.acousticSensory;
      expect(traits).toBeDefined();
      expect(traits.hearingAcuity).toBeGreaterThan(0);
      expect(traits.hearingAcuity).toBeLessThanOrEqual(2.5);
      expect(traits.lateralLineSensitivity).toBeGreaterThan(0);
      expect(traits.lateralLineSensitivity).toBeLessThanOrEqual(2.5);
      expect(traits.startleThreshold).toBeGreaterThanOrEqual(0.2);
      expect(traits.startleThreshold).toBeLessThanOrEqual(0.95);
      expect(traits.foragingAcousticAttraction).toBeGreaterThanOrEqual(0.1);
      expect(traits.foragingAcousticAttraction).toBeLessThanOrEqual(1.0);
    }

    // Schooling nervous species should have higher hearing acuity and lower startle threshold
    const tetra = SpeciesRegistry.get('neon_tetra')!;
    const discus = SpeciesRegistry.get('titan_discus')!;
    expect(tetra.traits.acousticSensory.hearingAcuity).toBeGreaterThan(discus.traits.acousticSensory.hearingAcuity);
    expect(tetra.traits.acousticSensory.startleThreshold).toBeLessThan(discus.traits.acousticSensory.startleThreshold);
  });

  it('2. PerceptionSystem attenuates sounds with physical distance and habitat damping', () => {
    const agentPos = new Vector3D(0, 0, 0);
    const nearEvent: AcousticEvent = {
      id: 'ev_near',
      simulationTime: 10.0,
      source: 'feeding_strike',
      location: { x: 1, y: 0, z: 0 },
      intensity: 0.8,
      duration: 0.2,
      spectral_character: 0.6,
      significance: 0.8,
      ecological_context: {},
    };
    const farEvent: AcousticEvent = {
      id: 'ev_far',
      simulationTime: 10.0,
      source: 'feeding_strike',
      location: { x: 7, y: 0, z: 0 },
      intensity: 0.8,
      duration: 0.2,
      spectral_character: 0.6,
      significance: 0.8,
      ecological_context: {},
    };

    const perceived = perception.senseAcousticEvents(
      agentPos,
      [nearEvent, farEvent],
      field,
      { hearingAcuity: 1.2, lateralLineSensitivity: 1.0, startleThreshold: 0.4, foragingAcousticAttraction: 0.8 }
    );

    expect(perceived.length).toBe(2);
    const pNear = perceived.find((p) => p.id === 'ev_near')!;
    const pFar = perceived.find((p) => p.id === 'ev_far')!;
    expect(pNear.perceivedIntensity).toBeGreaterThan(pFar.perceivedIntensity);
  });

  it('3. Sudden loud disturbances trigger an acoustic startle reflex and flee candidate', () => {
    const agent = new EcologicalAgent('tetra_1', 'neon_tetra', new Vector3D(0, 0, 0));
    const shockEvent: AcousticEvent = {
      id: 'shock_1',
      simulationTime: 12.0,
      source: 'substrate_disturbance',
      location: { x: 2, y: 0, z: 0 },
      intensity: 0.85,
      duration: 0.4,
      spectral_character: 0.3,
      significance: 0.9,
      ecological_context: {},
    };

    const perceived = agent.perception.senseAcousticEvents(
      agent.position,
      [shockEvent],
      field,
      agent.speciesTraits.traits.acousticSensory
    );

    expect(perceived.length).toBe(1);
    expect(perceived[0].isStartling).toBe(true);

    const sensoryState = agent.perception.senseAcousticSensoryState(agent.position, field, agent.speciesTraits.traits.acousticSensory);
    agent.registerAcousticStimulation(perceived, sensoryState, 12.0);

    expect(agent.startleCooldown).toBeGreaterThan(0);
    expect(agent.isBursting).toBe(true);
    expect(agent.drives.get('fear')).toBeGreaterThan(0);

    const candidates = agent.behaviour.generateCandidates(
      agent.id,
      agent.position,
      agent.drives,
      agent.memory,
      agent.relationships,
      [],
      [],
      [],
      12.0,
      undefined,
      false,
      perceived,
      sensoryState
    );

    const fleeCandidate = candidates.find((c) => c.type === 'flee');
    expect(fleeCandidate).toBeDefined();
    expect(fleeCandidate!.reason).toContain('Acoustic startle reflex');
    // Escape target should be oriented away from the shock source (x=2)
    expect(fleeCandidate!.targetPosition!.x).toBeLessThan(0);
  });

  it('4. Feeding clicks acoustically attract hungry agents toward the food impact location', () => {
    const agent = new EcologicalAgent('guppy_1', 'golden_guppy', new Vector3D(0, 2, 0));
    agent.drives.add('hunger', 0.6); // hungry forager

    const feedingEvent: AcousticEvent = {
      id: 'feed_click',
      simulationTime: 15.0,
      source: 'feeding_strike',
      location: { x: 3, y: 5, z: 1 },
      intensity: 0.75,
      duration: 0.15,
      spectral_character: 0.8,
      significance: 0.75,
      ecological_context: {},
    };

    const perceived = agent.perception.senseAcousticEvents(
      agent.position,
      [feedingEvent],
      field,
      agent.speciesTraits.traits.acousticSensory
    );

    expect(perceived.length).toBe(1);
    expect(perceived[0].isAttractive).toBe(true);

    const candidates = agent.behaviour.generateCandidates(
      agent.id,
      agent.position,
      agent.drives,
      agent.memory,
      agent.relationships,
      [],
      [],
      [],
      15.0,
      undefined,
      false,
      perceived
    );

    const feedOrInvestigate = candidates.find((c) => c.type === 'feed' || c.type === 'investigate');
    expect(feedOrInvestigate).toBeDefined();
    expect(feedOrInvestigate!.reason).toContain('Investigating acoustic feeding');
    expect(feedOrInvestigate!.targetPosition!.x).toBeCloseTo(3, 1);
    expect(feedOrInvestigate!.targetPosition!.y).toBeCloseTo(5, 1);
  });

  it('5. Senses lateral line flow vibration and acoustic pressure gradients in 3D', () => {
    field.setTargetState({
      water_activity: 0.75,
      turbulence: 0.60,
      disturbance: 0.20,
    });
    field.updateHysteresis(5.0);

    const sensory = perception.senseAcousticSensoryState(
      new Vector3D(0, 0, 0),
      field,
      { hearingAcuity: 1.0, lateralLineSensitivity: 1.4, startleThreshold: 0.5, foragingAcousticAttraction: 0.5 }
    );

    expect(sensory.ambientSoundPressureDb).toBeLessThan(0);
    expect(sensory.ambientSoundPressureDb).toBeGreaterThan(-80);
    expect(sensory.flowVibrationLevel).toBeGreaterThan(0.3);
    expect(sensory.acousticGradient).toBeInstanceOf(Vector3D);
  });

  it('6. Full simulation loop integrates acoustic perception and agent behavior', () => {
    const sim = new EcologySimulation();
    sim.agents = [
      new EcologicalAgent('tetra_a', 'neon_tetra', new Vector3D(0, 0, 0)),
      new EcologicalAgent('discus_a', 'titan_discus', new Vector3D(4, 0, 0)),
    ];

    // Trigger update step with a disturbance
    const result = sim.update(0.1, 20.0, 0.8);
    expect(result.simDt).toBeGreaterThan(0);

    // Each active agent should have sampled acoustics
    for (const ag of sim.agents) {
      expect(ag.lastAcousticSensoryState).toBeDefined();
      expect(ag.lastAcousticSensoryState!.ambientSoundPressureDb).toBeDefined();
    }
  });
});

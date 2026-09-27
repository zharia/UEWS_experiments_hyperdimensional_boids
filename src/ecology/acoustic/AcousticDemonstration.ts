/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { EcologySimulation } from '../../simulation/EcologySimulation';
import { ContinuousAcousticState, AcousticEvent, AcousticSignature } from './AcousticState';

export interface DemonstrationStepRecord {
  step: number;
  simTime: number;
  phase: string;
  environmentalTurbulence: number;
  environmentalDisturbance: number;
  totalBiomass: number;
  acousticSignature: AcousticSignature;
  continuousState: ContinuousAcousticState;
  acousticEventsGenerated: AcousticEvent[];
  description: string;
}

export interface AcousticDemonstrationResult {
  seed: number;
  durationSeconds: number;
  initialSignature: AcousticSignature;
  peakSignature: AcousticSignature;
  settledSignature: AcousticSignature;
  stepRecords: DemonstrationStepRecord[];
  causalChainSummary: {
    rootCause: string;
    intermediateEffects: string[];
    acousticManifestations: string[];
  };
}

/**
 * Deterministic Demonstration for Task 004 (Section 41).
 * Executes an authoritative simulation run showcasing emergent acoustic ecology:
 *  1. Initial calm environment & low activity acoustic bed.
 *  2. Biological population feeding activity increases -> water & biological activity rise.
 *  3. Environmental hydrodynamic perturbation introduces spatial disturbance and sediment plumes.
 *  4. Discrete spatial acoustic events trigger with verifiable causal traces.
 *  5. Perturbation settles, water calms, and acoustic field gradually settles via hysteresis.
 */
export function runDeterministicAcousticDemonstration(seed: number = 4242): AcousticDemonstrationResult {
  const sim = new EcologySimulation(seed);
  const stepRecords: DemonstrationStepRecord[] = [];

  // Stage 1: Initial calm environment (t = 0 to 5s)
  for (let i = 0; i < 5; i++) {
    sim.update(1.0);
  }
  const initialSignature = sim.acousticField.getSignature();
  stepRecords.push({
    step: 1,
    simTime: sim.clock.simulationTime,
    phase: 'INITIAL_CALM',
    environmentalTurbulence: sim.environment.water.turbulence,
    environmentalDisturbance: sim.environment.disturbance,
    totalBiomass: sim.populations.calculateTotalBiomass(sim.agents),
    acousticSignature: { ...initialSignature },
    continuousState: { ...sim.acousticField.currentState },
    acousticEventsGenerated: sim.acousticDerivation.getRecentEvents(),
    description: 'Initial quiescent environment: low ambient bed presence, minimal water current and biological texture.',
  });

  // Stage 2: Ecological feeding & activity increase (t = 5 to 15s)
  // Drop food pellet to initiate feeding frenzy
  sim.dropFood(0, -2.0, 0, 1.5);
  for (let i = 0; i < 10; i++) {
    sim.update(1.0);
  }
  const peakFeedingSignature = sim.acousticField.getSignature();
  stepRecords.push({
    step: 2,
    simTime: sim.clock.simulationTime,
    phase: 'ECOLOGICAL_ACTIVITY_RAMP',
    environmentalTurbulence: sim.environment.water.turbulence,
    environmentalDisturbance: sim.environment.disturbance,
    totalBiomass: sim.populations.calculateTotalBiomass(sim.agents),
    acousticSignature: { ...peakFeedingSignature },
    continuousState: { ...sim.acousticField.currentState },
    acousticEventsGenerated: sim.acousticDerivation.getRecentEvents(),
    description: 'Ecological activity rises: agents converge and feed, biological activity metric and feeding clicks increase.',
  });

  // Stage 3: Local ecological perturbation occurs (t = 15 to 20s)
  sim.triggerDisturbance(0.85);
  const perturbationEvents: AcousticEvent[] = [];
  for (let i = 0; i < 5; i++) {
    const res = sim.update(1.0);
    perturbationEvents.push(...res.acousticEvents);
  }
  const peakSignature = sim.acousticField.getSignature();
  stepRecords.push({
    step: 3,
    simTime: sim.clock.simulationTime,
    phase: 'LOCAL_DISTURBANCE_AND_EVENTS',
    environmentalTurbulence: sim.environment.water.turbulence,
    environmentalDisturbance: sim.environment.disturbance,
    totalBiomass: sim.populations.calculateTotalBiomass(sim.agents),
    acousticSignature: { ...peakSignature },
    continuousState: { ...sim.acousticField.currentState },
    acousticEventsGenerated: perturbationEvents,
    description: 'Mechanical hydrodynamic perturbation: substrate disturbance event triggers with deep resonant thud and sediment rustle.',
  });

  // Stage 4: Settling down via acoustic hysteresis (t = 20 to 50s)
  for (let i = 0; i < 30; i++) {
    sim.update(1.0);
  }
  const settledSignature = sim.acousticField.getSignature();
  stepRecords.push({
    step: 4,
    simTime: sim.clock.simulationTime,
    phase: 'HYSTERESIS_SETTLING',
    environmentalTurbulence: sim.environment.water.turbulence,
    environmentalDisturbance: sim.environment.disturbance,
    totalBiomass: sim.populations.calculateTotalBiomass(sim.agents),
    acousticSignature: { ...settledSignature },
    continuousState: { ...sim.acousticField.currentState },
    acousticEventsGenerated: sim.acousticDerivation.getRecentEvents(),
    description: 'Gradual settling: disturbance decays rapidly, water flow smoothly stabilizes, and soundscape returns to steady baseline.',
  });

  return {
    seed,
    durationSeconds: sim.clock.simulationTime,
    initialSignature,
    peakSignature,
    settledSignature,
    stepRecords,
    causalChainSummary: {
      rootCause: 'External food nourishment and physical water disturbance',
      intermediateEffects: [
        'Agent metabolic feeding convergence and substrate agitation',
        'Suspended particulate cloud and increased hydrodynamic turbulence',
        'Fear and burst propulsion responses across teleost population',
      ],
      acousticManifestations: [
        'Initial ambient bed with low-frequency tank presence (Layer 0)',
        'Water dynamics modulation tracking convective flow (Layer 1)',
        'Discrete feeding strike clicks and substrate settling thuds (Layer 4)',
        'Gradual multi-scalar hysteresis settling back to calm baseline',
      ],
    },
  };
}

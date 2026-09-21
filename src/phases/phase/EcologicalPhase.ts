/**
 * Ecological Phases Definition.
 *
 * Models macroscopic ecosystem epochs:
 *  - GENESIS: barren initial tank condition with baseline abiotic fields
 *  - COLONISATION: pioneer species introduction and initial territory claiming
 *  - ESTABLISHMENT: stable feeding, foraging networks, and basic schooling
 *  - DIVERSIFICATION: multi-species niches, micro-fauna symbiosis, rich reef interaction
 *  - PERTURBATION: sudden environmental disturbance (water stir, temperature shock, nutrient spike)
 *  - SUCCESSION: community restructuring following perturbation
 *  - EQUILIBRIUM: mature balanced carrying capacity and steady bio-cycling
 *  - COLLAPSE: acute resource depletion or extreme disturbance overload
 *  - REGENERATION: ecological recovery and microbial/algal rebirth
 */

export type EcologicalPhaseType =
  | 'GENESIS'
  | 'COLONISATION'
  | 'ESTABLISHMENT'
  | 'DIVERSIFICATION'
  | 'PERTURBATION'
  | 'SUCCESSION'
  | 'EQUILIBRIUM'
  | 'COLLAPSE'
  | 'REGENERATION';

export interface EcologicalMetrics {
  totalBiomass: number;
  speciesCount: number;
  biodiversityIndex: number; // Shannon-Wiener entropy
  averageEnergy: number;
  resourceDensity: number;
  disturbanceLevel: number;
  nutrientLevel: number;
  algaeCoverage: number;
}

export interface PhaseTransitionRecord {
  fromPhase: EcologicalPhaseType;
  toPhase: EcologicalPhaseType;
  timestamp: number;
  reason: string;
  metricsSnapshot: EcologicalMetrics;
}

export interface IPhaseStateJSON {
  currentPhase: EcologicalPhaseType;
  phaseEnteredTime: number;
  history: PhaseTransitionRecord[];
}

/**
 * Ecological Phase Transition Engine.
 *
 * Evaluates world-state indicators (biodiversity, energy flux, disturbance, resource density)
 * to govern non-linear transitions between ecological epochs.
 */

import { EcologicalAgent } from '../../agents/agent/EcologicalAgent';
import { ResourceSystem } from '../../ecology/resources/ResourceSystem';
import { ISpatialFieldProvider } from '../../space/fields/EnvironmentalField';
import {
  EcologicalPhaseType,
  EcologicalMetrics,
  PhaseTransitionRecord,
  IPhaseStateJSON,
} from '../phase/EcologicalPhase';

export class PhaseTransitionEngine {
  public currentPhase: EcologicalPhaseType = 'GENESIS';
  public phaseEnteredTime: number = 0;
  public transitionHistory: PhaseTransitionRecord[] = [];
  public minPhaseDurationSeconds: number = 15.0; // Prevent rapid oscillation

  constructor(initialPhase: EcologicalPhaseType = 'COLONISATION') {
    this.currentPhase = initialPhase;
  }

  /**
   * Calculates comprehensive ecological metrics from current world state
   */
  public calculateMetrics(
    agents: EcologicalAgent[],
    resources: ResourceSystem,
    fields: ISpatialFieldProvider,
    algaeCoverage: number = 20.0,
    disturbanceStrength: number = 0.0
  ): EcologicalMetrics {
    const totalCount = agents.length;

    // Species count & Shannon-Wiener biodiversity index: H = - sum(p_i * ln(p_i))
    const speciesTally = new Map<string, number>();
    let totalEnergy = 0;

    for (const ag of agents) {
      speciesTally.set(ag.species, (speciesTally.get(ag.species) || 0) + 1);
      totalEnergy += ag.energy;
    }

    let shannonIndex = 0;
    if (totalCount > 0) {
      for (const count of speciesTally.values()) {
        const p = count / totalCount;
        shannonIndex -= p * Math.log(p);
      }
    }

    const avgEnergy = totalCount > 0 ? totalEnergy / totalCount : 0;
    const foodResources = resources.resources.filter((r) => r.type === 'food_pellet');
    const resourceDensity = foodResources.reduce((s, r) => s + r.quantity, 0);

    // Sample ambient water nutrient level
    const centerNutrient = fields.sample(0, 0, 0, 'nutrients');

    return {
      totalBiomass: totalCount * 1.5 + algaeCoverage * 0.2,
      speciesCount: speciesTally.size,
      biodiversityIndex: Math.max(0, shannonIndex),
      averageEnergy: avgEnergy,
      resourceDensity,
      disturbanceLevel: disturbanceStrength,
      nutrientLevel: centerNutrient,
      algaeCoverage,
    };
  }

  /**
   * Evaluates metrics and triggers state transitions if criteria are met
   */
  public evaluateTransitions(
    metrics: EcologicalMetrics,
    simTime: number
  ): PhaseTransitionRecord | null {
    const timeInCurrentPhase = simTime - this.phaseEnteredTime;
    if (timeInCurrentPhase < this.minPhaseDurationSeconds) {
      return null;
    }

    let nextPhase: EcologicalPhaseType | null = null;
    let reason = '';

    // 1. Acute Perturbation override
    if (metrics.disturbanceLevel > 0.6 && this.currentPhase !== 'PERTURBATION') {
      nextPhase = 'PERTURBATION';
      reason = `Acute kinetic disturbance threshold reached (${metrics.disturbanceLevel.toFixed(2)})`;
    }

    // 2. Collapse check
    else if (
      metrics.averageEnergy < 18.0 &&
      metrics.totalBiomass < 10.0 &&
      this.currentPhase !== 'COLLAPSE' &&
      this.currentPhase !== 'GENESIS'
    ) {
      nextPhase = 'COLLAPSE';
      reason = `Total energy exhaustion and carrying capacity breakdown`;
    }

    // 3. Normal state-dependent progressions
    else {
      switch (this.currentPhase) {
        case 'GENESIS':
          if (metrics.totalBiomass > 5.0) {
            nextPhase = 'COLONISATION';
            reason = 'Pioneer species introduced and initial biomass detected';
          }
          break;

        case 'COLONISATION':
          if (metrics.totalBiomass >= 15.0 && metrics.averageEnergy > 50.0) {
            nextPhase = 'ESTABLISHMENT';
            reason = 'Population stabilised and baseline foraging network established';
          }
          break;

        case 'ESTABLISHMENT':
          if (metrics.biodiversityIndex > 0.8 && metrics.speciesCount >= 3) {
            nextPhase = 'DIVERSIFICATION';
            reason = `Multi-species niches populated (Shannon index: ${metrics.biodiversityIndex.toFixed(2)})`;
          }
          break;

        case 'DIVERSIFICATION':
          if (metrics.averageEnergy > 70.0 && metrics.nutrientLevel < 0.6) {
            nextPhase = 'EQUILIBRIUM';
            reason = 'Mature carrying capacity and balanced bio-cycling reached';
          }
          break;

        case 'PERTURBATION':
          if (metrics.disturbanceLevel < 0.15) {
            nextPhase = 'SUCCESSION';
            reason = 'Disturbance dissipated; community entering succession recovery';
          }
          break;

        case 'SUCCESSION':
          if (metrics.biodiversityIndex > 0.6 && metrics.averageEnergy > 55.0) {
            nextPhase = 'ESTABLISHMENT';
            reason = 'Successional community re-established';
          }
          break;

        case 'COLLAPSE':
          if (metrics.algaeCoverage > 15.0 || metrics.resourceDensity > 1.0) {
            nextPhase = 'REGENERATION';
            reason = 'Nutrient enrichment fostering primary producer regrowth';
          }
          break;

        case 'REGENERATION':
          if (metrics.averageEnergy > 45.0 && metrics.totalBiomass > 15.0) {
            nextPhase = 'COLONISATION';
            reason = 'Ecosystem re-colonised by recovering populations';
          }
          break;

        case 'EQUILIBRIUM':
          if (metrics.nutrientLevel > 0.85) {
            nextPhase = 'PERTURBATION';
            reason = 'Eutrophication / excessive organic nutrient saturation';
          }
          break;
      }
    }

    if (nextPhase && nextPhase !== this.currentPhase) {
      const record: PhaseTransitionRecord = {
        fromPhase: this.currentPhase,
        toPhase: nextPhase,
        timestamp: simTime,
        reason,
        metricsSnapshot: { ...metrics },
      };

      this.currentPhase = nextPhase;
      this.phaseEnteredTime = simTime;
      this.transitionHistory.push(record);
      if (this.transitionHistory.length > 25) {
        this.transitionHistory.shift();
      }
      return record;
    }

    return null;
  }

  public toJSON(): IPhaseStateJSON {
    return {
      currentPhase: this.currentPhase,
      phaseEnteredTime: this.phaseEnteredTime,
      history: this.transitionHistory.map((h) => ({
        ...h,
        metricsSnapshot: { ...h.metricsSnapshot },
      })),
    };
  }

  public fromJSON(data: IPhaseStateJSON): void {
    if (!data) return;
    this.currentPhase = data.currentPhase || 'COLONISATION';
    this.phaseEnteredTime = data.phaseEnteredTime || 0;
    this.transitionHistory = (data.history || []).map((h) => ({
      ...h,
      metricsSnapshot: { ...h.metricsSnapshot },
    }));
  }
}

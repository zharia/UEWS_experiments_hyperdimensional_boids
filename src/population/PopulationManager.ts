/**
 * Population Manager.
 *
 * Coordinates multi-species cohorts across the ecological simulation.
 * Ensures consistent registration, mortality/birth event recording,
 * and demographic calculations.
 */

import { EcologicalAgent } from '../agents/agent/EcologicalAgent';
import { Population, IPopulationJSON } from './Population';

export interface IPopulationManagerJSON {
  populations: IPopulationJSON[];
}

export class PopulationManager {
  private _populations: Map<string, Population> = new Map();

  constructor() {}

  public getOrCreatePopulation(speciesId: string, carryingCapacity?: number): Population {
    let pop = this._populations.get(speciesId);
    if (!pop) {
      pop = new Population(`pop_${speciesId}`, speciesId, carryingCapacity || 25);
      this._populations.set(speciesId, pop);
    }
    return pop;
  }

  public getPopulation(speciesId: string): Population | undefined {
    return this._populations.get(speciesId);
  }

  public getAllPopulations(): Population[] {
    return Array.from(this._populations.values());
  }

  /**
   * Synchronizes population memberships with live agents list.
   */
  public synchronize(agents: EcologicalAgent[], simTime?: number): void {
    this.syncAgents(agents, simTime);
  }

  public syncAgents(agents: EcologicalAgent[], simTime?: number): void {
    const liveAgentIds = new Set(agents.filter((a) => a.lifecycle !== 'dead').map((a) => a.id));

    // Ensure all live agents are in their species' population
    for (const agent of agents) {
      if (agent.lifecycle === 'dead') continue;
      const pop = this.getOrCreatePopulation(agent.species);
      if (!pop.hasMember(agent.id)) {
        pop.addMember(agent.id);
      }
    }

    // Remove dead/missing agents from populations
    for (const pop of this._populations.values()) {
      for (const memberId of Array.from(pop.memberIds)) {
        if (!liveAgentIds.has(memberId)) {
          pop.removeMember(memberId, true, simTime);
        }
      }
    }
  }

  public registerBirth(agent: EcologicalAgent, simTime: number): void {
    const pop = this.getOrCreatePopulation(agent.species);
    pop.addMember(agent.id, simTime);
  }

  public recordBirth(speciesId: string, agentId: string, simTime?: number): void {
    const pop = this.getOrCreatePopulation(speciesId);
    pop.recordBirth(agentId, simTime);
  }

  public registerDeath(agent: EcologicalAgent, simTime: number): void {
    const pop = this.getOrCreatePopulation(agent.species);
    pop.removeMember(agent.id, true, simTime);
  }

  public recordDeath(speciesId: string, causeStr?: string, simTime?: number): void {
    const pop = this.getOrCreatePopulation(speciesId);
    pop.recordMortality(causeStr || '', causeStr, simTime);
  }

  public calculateTotalBiomass(agents: EcologicalAgent[]): number {
    const agentsMap = new Map(agents.map((a) => [a.id, a]));
    let totalBiomass = 0;
    for (const pop of this._populations.values()) {
      const demo = pop.getDemographics(agentsMap);
      totalBiomass += demo.totalBiomass;
    }
    return totalBiomass;
  }

  public calculateBiodiversity(agents: EcologicalAgent[]): number {
    const liveAgents = agents.filter((a) => a.lifecycle !== 'dead');
    const total = liveAgents.length;
    if (total <= 1) return 0;

    const counts: Record<string, number> = {};
    for (const a of liveAgents) {
      counts[a.species] = (counts[a.species] || 0) + 1;
    }

    // Shannon Wiener Diversity Index H = - sum(p_i * ln(p_i))
    let h = 0;
    for (const count of Object.values(counts)) {
      const p = count / total;
      if (p > 0) {
        h -= p * Math.log(p);
      }
    }
    return Math.max(0, h);
  }

  public toJSON(): IPopulationManagerJSON {
    return {
      populations: Array.from(this._populations.values()).map((p) => p.toJSON()),
    };
  }

  public fromJSON(json: IPopulationManagerJSON): void {
    this._populations.clear();
    if (json && Array.isArray(json.populations)) {
      for (const pJson of json.populations) {
        const pop = Population.fromJSON(pJson);
        this._populations.set(pop.speciesId, pop);
      }
    }
  }
}

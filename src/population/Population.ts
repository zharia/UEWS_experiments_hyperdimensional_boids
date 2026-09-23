/**
 * Population Model Abstraction.
 *
 * Represents an ecological cohort of agents sharing a species and habitat context.
 * Population demographics and distributions are dynamically derived from individual
 * member states to prevent redundant out-of-sync state.
 */

import { Vector3D } from '../space/physical/Vector3D';
import { EcologicalAgent } from '../agents/agent/EcologicalAgent';
import { ISpecies, SpeciesRegistry } from '../species/Species';

export interface IPopulationDemographics {
  totalCount: number;
  juvenileCount: number;
  matureCount: number;
  senescentCount: number;
  deadCount: number;
  averageEnergy: number;
  averageAge: number;
  totalBiomass: number;
  spatialCenter: { x: number; y: number; z: number };
  spatialRadius: number;
}

export interface IPopulationJSON {
  id: string;
  speciesId: string;
  memberIds: string[];
  carryingCapacity: number;
  totalBirths: number;
  totalDeaths: number;
  recentBirthsHistory: number[]; // timestamps of births in recent window
  recentDeathsHistory: number[]; // timestamps of deaths in recent window
}

export class Population {
  public readonly id: string;
  public readonly speciesId: string;
  public memberIds: Set<string> = new Set();
  public carryingCapacity: number = 25;

  public totalBirths: number = 0;
  public totalDeaths: number = 0;
  private _recentBirthsHistory: number[] = [];
  private _recentDeathsHistory: number[] = [];

  constructor(id: string, speciesId: string, carryingCapacity: number = 25) {
    this.id = id;
    this.speciesId = speciesId;
    this.carryingCapacity = carryingCapacity;
  }

  public get count(): number {
    return this.memberIds.size;
  }

  public get birthsTotal(): number {
    return this.totalBirths;
  }

  public get deathsTotal(): number {
    return this.totalDeaths;
  }

  public recordBirth(agentId: string, simTime?: number): void {
    this.addMember(agentId, simTime);
  }

  public recordMortality(agentId: string, cause?: string, simTime?: number): void {
    this.removeMember(agentId, true, simTime);
  }

  public get species(): ISpecies {
    return SpeciesRegistry.getOrFallback(this.speciesId);
  }

  public addMember(agentId: string, simTime?: number): void {
    if (!this.memberIds.has(agentId)) {
      this.memberIds.add(agentId);
      if (simTime !== undefined) {
        this.totalBirths++;
        this._recentBirthsHistory.push(simTime);
      }
    }
  }

  public removeMember(agentId: string, isDeath: boolean = false, simTime?: number): void {
    if (this.memberIds.has(agentId)) {
      this.memberIds.delete(agentId);
      if (isDeath && simTime !== undefined) {
        this.totalDeaths++;
        this._recentDeathsHistory.push(simTime);
      }
    }
  }

  public hasMember(agentId: string): boolean {
    return this.memberIds.has(agentId);
  }

  /**
   * Derives current demographic metrics from authoritative agent list.
   */
  public getDemographics(agentsMap: Map<string, EcologicalAgent>): IPopulationDemographics {
    let totalCount = 0;
    let juvenileCount = 0;
    let matureCount = 0;
    let senescentCount = 0;
    let deadCount = 0;
    let energySum = 0;
    let ageSum = 0;

    let posX = 0;
    let posY = 0;
    let posZ = 0;
    const activePositions: Vector3D[] = [];

    const sp = this.species;
    const biomassPerInd = sp.traits.biomassPerIndividual || 1.0;

    for (const id of this.memberIds) {
      const agent = agentsMap.get(id);
      if (!agent) continue;

      totalCount++;
      energySum += agent.energy;
      ageSum += agent.ageSeconds;

      switch (agent.lifecycle) {
        case 'juvenile':
          juvenileCount++;
          break;
        case 'mature':
          matureCount++;
          break;
        case 'senescent':
          senescentCount++;
          break;
        case 'dead':
          deadCount++;
          break;
      }

      if (agent.lifecycle !== 'dead') {
        posX += agent.position.x;
        posY += agent.position.y;
        posZ += agent.position.z;
        activePositions.push(agent.position);
      }
    }

    const liveCount = Math.max(1, activePositions.length);
    const center = new Vector3D(posX / liveCount, posY / liveCount, posZ / liveCount);

    let maxDist = 0;
    for (const pos of activePositions) {
      const dist = pos.distanceTo(center);
      if (dist > maxDist) maxDist = dist;
    }

    return {
      totalCount,
      juvenileCount,
      matureCount,
      senescentCount,
      deadCount,
      averageEnergy: totalCount > 0 ? energySum / totalCount : 0,
      averageAge: totalCount > 0 ? ageSum / totalCount : 0,
      totalBiomass: (totalCount - deadCount) * biomassPerInd,
      spatialCenter: center.toJSON(),
      spatialRadius: maxDist,
    };
  }

  /**
   * Calculates rolling rates (events per 100 simulation seconds).
   */
  public getRates(simTime: number, windowSeconds: number = 60.0): { birthRate: number; mortalityRate: number } {
    const cutoff = simTime - windowSeconds;
    this._recentBirthsHistory = this._recentBirthsHistory.filter((t) => t >= cutoff);
    this._recentDeathsHistory = this._recentDeathsHistory.filter((t) => t >= cutoff);

    const normalizer = windowSeconds > 0 ? 100.0 / windowSeconds : 1.0;
    return {
      birthRate: this._recentBirthsHistory.length * normalizer,
      mortalityRate: this._recentDeathsHistory.length * normalizer,
    };
  }

  public toJSON(): IPopulationJSON {
    return {
      id: this.id,
      speciesId: this.speciesId,
      memberIds: Array.from(this.memberIds),
      carryingCapacity: this.carryingCapacity,
      totalBirths: this.totalBirths,
      totalDeaths: this.totalDeaths,
      recentBirthsHistory: [...this._recentBirthsHistory],
      recentDeathsHistory: [...this._recentDeathsHistory],
    };
  }

  public static fromJSON(json: IPopulationJSON): Population {
    const pop = new Population(json.id, json.speciesId, json.carryingCapacity || 25);
    pop.memberIds = new Set(json.memberIds || []);
    pop.totalBirths = json.totalBirths || 0;
    pop.totalDeaths = json.totalDeaths || 0;
    pop._recentBirthsHistory = json.recentBirthsHistory || [];
    pop._recentDeathsHistory = json.recentDeathsHistory || [];
    return pop;
  }
}

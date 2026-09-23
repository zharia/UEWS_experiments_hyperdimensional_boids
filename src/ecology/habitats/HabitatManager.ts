/**
 * Habitat Manager.
 *
 * Coordinates semantic ecological habitats within the 3D world:
 *  - Partitioning and spatial lookups
 *  - Real-time occupancy tracking
 *  - Migration candidate destinations evaluation
 *  - Habitat suitability profiling
 */

import { Vector3D, IVector3D } from '../../space/physical/Vector3D';
import { EcologicalAgent } from '../../agents/agent/EcologicalAgent';
import { ISpecies } from '../../species/Species';
import { Habitat, HabitatType, IHabitatJSON } from './Habitat';
import { EcologicalResource } from '../resources/ResourceSystem';

export interface IHabitatManagerJSON {
  habitats: IHabitatJSON[];
}

export class HabitatManager {
  private _habitats: Map<string, Habitat> = new Map();

  constructor() {
    this.seedStandardHabitats();
  }

  public seedStandardHabitats(): void {
    this._habitats.clear();

    // 1. SURFACE (Top layer: rich in light, oxygen, biofilm, surface drift)
    this.register(
      new Habitat({
        id: 'habitat_surface',
        type: 'SURFACE',
        name: 'Surface Film & Shallows',
        description: 'Warm, highly illuminated surface with air-water boundary exchange.',
        bounds: { minX: -14.0, maxX: 14.0, minY: 4.5, maxY: 7.0, minZ: -6.0, maxZ: 6.0 },
        capacity: 12,
        environment: {
          temperature: 25.5,
          illumination: 0.95,
          dissolvedOxygen: 0.9,
          nutrientBaseline: 0.25,
          waterFlowVelocity: 3.5,
          coverDensity: 0.15,
        },
      })
    );

    // 2. OPEN_WATER (Mid-column pelagic expanse: swimming corridor)
    this.register(
      new Habitat({
        id: 'habitat_open_water',
        type: 'OPEN_WATER',
        name: 'Pelagic Mid-Water Column',
        description: 'Vast open water column supporting schooling runs and cruising arcs.',
        bounds: { minX: -10.0, maxX: 10.0, minY: -3.0, maxY: 4.5, minZ: -5.0, maxZ: 5.0 },
        capacity: 20,
        environment: {
          temperature: 24.5,
          illumination: 0.65,
          dissolvedOxygen: 0.8,
          nutrientBaseline: 0.35,
          waterFlowVelocity: 2.0,
          coverDensity: 0.1,
        },
      })
    );

    // 3. VEGETATION (Left reef / dense flora fronds: high shelter & foraging)
    this.register(
      new Habitat({
        id: 'habitat_vegetation',
        type: 'VEGETATION',
        name: 'Botanical Frond Thicket',
        description: 'Dense procedural flora and moss cushions providing nursery shelter.',
        bounds: { minX: -14.0, maxX: -4.5, minY: -6.5, maxY: 3.0, minZ: -6.0, maxZ: 6.0 },
        capacity: 16,
        environment: {
          temperature: 24.0,
          illumination: 0.5,
          dissolvedOxygen: 0.85,
          nutrientBaseline: 0.55,
          waterFlowVelocity: 1.0,
          coverDensity: 0.85,
        },
      })
    );

    // 4. CAVE_SHELTER (Right rocky cavern: deep crevices, low light, high safety)
    this.register(
      new Habitat({
        id: 'habitat_cave_shelter',
        type: 'CAVE_SHELTER',
        name: 'Basalt Crevice & Cave',
        description: 'Dark secluded rocky overhangs shielding from disturbances.',
        bounds: { minX: 4.5, maxX: 14.0, minY: -6.5, maxY: 0.0, minZ: -6.0, maxZ: 6.0 },
        capacity: 8,
        environment: {
          temperature: 23.5,
          illumination: 0.15,
          dissolvedOxygen: 0.65,
          nutrientBaseline: 0.45,
          waterFlowVelocity: 0.8,
          coverDensity: 0.9,
        },
      })
    );

    // 5. BENTHIC_SUBSTRATE (Bottom floor: sand, sediment, detritus & biofilms)
    this.register(
      new Habitat({
        id: 'habitat_benthic',
        type: 'BENTHIC_SUBSTRATE',
        name: 'Benthic Substrate & Detritus Bed',
        description: 'Mineral-rich substrate bed hosting decomposition and grazing fauna.',
        bounds: { minX: -14.0, maxX: 14.0, minY: -7.0, maxY: -5.0, minZ: -6.0, maxZ: 6.0 },
        capacity: 14,
        environment: {
          temperature: 23.0,
          illumination: 0.25,
          dissolvedOxygen: 0.6,
          nutrientBaseline: 0.75,
          waterFlowVelocity: 0.5,
          coverDensity: 0.4,
        },
      })
    );
  }

  public register(habitat: Habitat): void {
    this._habitats.set(habitat.id, habitat);
  }

  public getHabitat(id: string): Habitat | undefined {
    return this._habitats.get(id);
  }

  public getAllHabitats(): Habitat[] {
    return Array.from(this._habitats.values());
  }

  /**
   * Identifies which habitat contains a given 3D position
   */
  public findHabitatAt(point: IVector3D): Habitat | undefined {
    for (const h of this._habitats.values()) {
      if (h.containsPoint(point)) {
        return h;
      }
    }
    return undefined;
  }

  public getHabitatAt(point: IVector3D): Habitat | undefined {
    return this.findHabitatAt(point);
  }

  /**
   * Tracks real-time agent occupancy across all habitats
   */
  public getOccupancy(agents: EcologicalAgent[]): Map<string, number> {
    const occupancy = new Map<string, number>();
    for (const h of this._habitats.values()) {
      occupancy.set(h.id, 0);
    }

    for (const agent of agents) {
      if (agent.lifecycle === 'dead') continue;
      const h = this.findHabitatAt(agent.position);
      if (h) {
        occupancy.set(h.id, (occupancy.get(h.id) || 0) + 1);
      }
    }

    return occupancy;
  }

  /**
   * Periodic update of habitat occupancies and environmental coupling
   */
  public update(agents: EcologicalAgent[], fields: any, resources: EcologicalResource[], dt: number): void {
    const occupancy = this.getOccupancy(agents);
    for (const [id, count] of occupancy.entries()) {
      const h = this._habitats.get(id);
      if (h) {
        h.occupantCount = count;
      }
    }
  }

  /**
   * Evaluates all habitats and returns ranked suitability scores for an agent
   */
  public evaluateHabitatSuitabilities(
    species: ISpecies,
    agentEnergy: number,
    resources: EcologicalResource[],
    occupancyMap: Map<string, number>,
    dangerLevel: number = 0
  ): { habitat: Habitat; suitability: number }[] {
    const results: { habitat: Habitat; suitability: number }[] = [];

    for (const habitat of this._habitats.values()) {
      // Calculate local resource availability within habitat
      let resourceScore = 0;
      for (const res of resources) {
        if (habitat.containsPoint(res.position)) {
          if (species.traits.resourceRequirements.preferredFoodTypes.includes(res.type)) {
            resourceScore += res.quantity;
          }
        }
      }

      const currentOccupancy = occupancyMap.get(habitat.id) || 0;
      const score = habitat.evaluateSuitability(
        species,
        agentEnergy,
        resourceScore,
        currentOccupancy,
        dangerLevel
      );

      results.push({ habitat, suitability: score });
    }

    return results.sort((a, b) => b.suitability - a.suitability);
  }

  public toJSON(): IHabitatManagerJSON {
    return {
      habitats: Array.from(this._habitats.values()).map((h) => h.toJSON()),
    };
  }

  public fromJSON(json: IHabitatManagerJSON): void {
    if (json && Array.isArray(json.habitats) && json.habitats.length > 0) {
      this._habitats.clear();
      for (const hJson of json.habitats) {
        this.register(Habitat.fromJSON(hJson));
      }
    } else {
      this.seedStandardHabitats();
    }
  }
}

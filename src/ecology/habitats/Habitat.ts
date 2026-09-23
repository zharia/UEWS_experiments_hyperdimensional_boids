/**
 * Semantic Ecological Habitat and Niches.
 *
 * Habitats represent distinct ecological zones in the world with specific
 * abiotic profiles, carrying capacities, spatial bounds, and species affinities.
 */

import { Vector3D, IVector3D } from '../../space/physical/Vector3D';
import { ISpecies } from '../../species/Species';

export type HabitatType =
  | 'SURFACE'
  | 'OPEN_WATER'
  | 'VEGETATION'
  | 'CAVE_SHELTER'
  | 'BENTHIC_SUBSTRATE'
  | 'FOOD_PATCH';

export interface HabitatBounds3D {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  minZ: number;
  maxZ: number;
}

export interface HabitatEnvironmentalProfile {
  temperature: number; // typical water temp in °C
  illumination: number; // 0 to 1
  dissolvedOxygen: number; // 0 to 1
  nutrientBaseline: number; // 0 to 1
  waterFlowVelocity: number; // cm/s
  coverDensity: number; // 0 (open) to 1 (dense shelter/fronds)
}

export interface IHabitatJSON {
  id: string;
  type: HabitatType;
  name: string;
  description: string;
  bounds: HabitatBounds3D;
  capacity: number;
  environment: HabitatEnvironmentalProfile;
}

export class Habitat {
  public readonly id: string;
  public readonly type: HabitatType;
  public readonly name: string;
  public readonly description: string;
  public bounds: HabitatBounds3D;
  public capacity: number;
  public environment: HabitatEnvironmentalProfile;
  public occupantCount: number = 0;

  public get center(): Vector3D {
    return this.getCenter();
  }

  public get profile(): HabitatEnvironmentalProfile {
    return this.environment;
  }

  constructor(config: {
    id: string;
    type: HabitatType;
    name: string;
    description: string;
    bounds: HabitatBounds3D;
    capacity: number;
    environment: HabitatEnvironmentalProfile;
  }) {
    this.id = config.id;
    this.type = config.type;
    this.name = config.name;
    this.description = config.description;
    this.bounds = config.bounds;
    this.capacity = config.capacity;
    this.environment = config.environment;
  }

  public containsPoint(point: IVector3D): boolean {
    return (
      point.x >= this.bounds.minX &&
      point.x <= this.bounds.maxX &&
      point.y >= this.bounds.minY &&
      point.y <= this.bounds.maxY &&
      point.z >= this.bounds.minZ &&
      point.z <= this.bounds.maxZ
    );
  }

  public getCenter(): Vector3D {
    return new Vector3D(
      (this.bounds.minX + this.bounds.maxX) * 0.5,
      (this.bounds.minY + this.bounds.maxY) * 0.5,
      (this.bounds.minZ + this.bounds.maxZ) * 0.5
    );
  }

  /**
   * Evaluates habitat suitability for an agent based on:
   *  speciesPreference * envCompatibility * resourceAvailability * (1 - danger) * overcrowding
   */
  public evaluateSuitability(
    species: ISpecies,
    agentEnergy: number,
    localResourceScore: number,
    currentOccupancy: number,
    dangerLevel: number = 0
  ): number {
    // 1. Species innate preference (-1 to 1, remapped to 0.1 to 1.5)
    const rawPref = species.traits.habitatPreferences[this.type] ?? species.traits.habitatPreferences[this.id] ?? 0.0;
    const prefMultiplier = Math.max(0.05, 1.0 + rawPref * 0.8);

    // 2. Resource availability motivation (higher hunger demands more food)
    const hungerFactor = (100.0 - agentEnergy) / 100.0;
    const resourceWeight = 1.0 + localResourceScore * (0.5 + hungerFactor);

    // 3. Danger / threat avoidance
    const safety = Math.max(0.05, 1.0 - dangerLevel);

    // 4. Overcrowding / capacity penalty
    const occupancyRatio = currentOccupancy / Math.max(1, this.capacity);
    const capacityFactor = occupancyRatio > 1.0 ? Math.max(0.1, 1.0 / occupancyRatio) : 1.0;

    // 5. Environmental baseline compatibility (oxygen and cover)
    const envCompat = 0.5 + this.environment.dissolvedOxygen * 0.3 + (this.environment.coverDensity * (species.traits.socialTendency.territorialityTendency > 0.4 ? 0.3 : 0.1));

    return prefMultiplier * resourceWeight * safety * capacityFactor * envCompat;
  }

  public toJSON(): IHabitatJSON {
    return {
      id: this.id,
      type: this.type,
      name: this.name,
      description: this.description,
      bounds: { ...this.bounds },
      capacity: this.capacity,
      environment: { ...this.environment },
    };
  }

  public static fromJSON(json: IHabitatJSON): Habitat {
    return new Habitat(json);
  }
}

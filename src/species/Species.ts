/**
 * Species & Trait Abstraction.
 *
 * Defines configurable traits for organisms, clearly separating species-level
 * evolutionary characteristics from individual agent state.
 */

export interface MovementTraits {
  maxSpeed: number;
  maxForce: number;
  dragCoefficient: number;
}

export interface ResourceTraits {
  preferredFoodTypes: string[];
  consumptionRate: number; // energy replenished per unit consumed
  metabolicRate: number; // energy burned per second baseline
  starvationThreshold: number; // energy below which health declines
}

export interface LifespanTraits {
  juvenileDuration: number; // duration (seconds) before reaching maturity
  matureDuration: number; // duration (seconds) in mature prime
  senescentDuration: number; // duration (seconds) in elder phase
  maxLifespan: number; // total maximum expected lifespan
}

export interface ReproductionTraits {
  maturityThreshold: number; // min age in seconds
  minEnergyToReproduce: number; // required energy reserve (0-100)
  energyCost: number; // energy deducted from parent upon reproduction
  recoveryInterval: number; // cooldown period after reproduction (seconds)
  minPartnerAffinity: number; // min relationship affinity required between partners
  clutchSize: number; // number of offspring produced per event
  preferredBreedingHabitat: string; // preferred habitat id/type for breeding
}

export interface SocialTraits {
  schoolingAffinity: number; // 0 to 1
  territorialityTendency: number; // 0 to 1
  curiosityTendency: number; // 0 to 1
}

export interface SpeciesTraits {
  movement: MovementTraits;
  habitatPreferences: Record<string, number>; // HabitatId/Type -> Suitability multiplier (-1.0 to 1.0)
  resourceRequirements: ResourceTraits;
  lifespan: LifespanTraits;
  reproduction: ReproductionTraits;
  socialTendency: SocialTraits;
  trophicLevel: number; // 1 = primary/herbivore, 2 = meso-consumer, 3 = apex
  biomassPerIndividual: number;
}

export interface ISpecies {
  id: string;
  name: string;
  description: string;
  traits: SpeciesTraits;
}

export class SpeciesRegistry {
  private static _species: Map<string, ISpecies> = new Map();

  static {
    // 1. Titan Discus (Pelagic apex grazer)
    this.register({
      id: 'titan_discus',
      name: 'Titan Discus',
      description: 'Stately pelagic grazer with high territoriality and deliberate locomotion.',
      traits: {
        movement: { maxSpeed: 2.2, maxForce: 3.5, dragCoefficient: 0.94 },
        habitatPreferences: {
          OPEN_WATER: 0.8,
          SURFACE: 0.4,
          VEGETATION: 0.2,
          CAVE_SHELTER: -0.3,
          BENTHIC_SUBSTRATE: -0.5,
        },
        resourceRequirements: {
          preferredFoodTypes: ['food_pellet', 'biofilm_patch'],
          consumptionRate: 35.0,
          metabolicRate: 0.09,
          starvationThreshold: 20.0,
        },
        lifespan: {
          juvenileDuration: 60.0,
          matureDuration: 400.0,
          senescentDuration: 180.0,
          maxLifespan: 640.0,
        },
        reproduction: {
          maturityThreshold: 60.0,
          minEnergyToReproduce: 75.0,
          energyCost: 35.0,
          recoveryInterval: 45.0,
          minPartnerAffinity: 0.2,
          clutchSize: 1,
          preferredBreedingHabitat: 'OPEN_WATER',
        },
        socialTendency: {
          schoolingAffinity: 0.25,
          territorialityTendency: 0.65,
          curiosityTendency: 0.5,
        },
        trophicLevel: 2,
        biomassPerIndividual: 4.5,
      },
    });

    // 2. Neon Tetra (Agile schooling forager)
    this.register({
      id: 'neon_tetra',
      name: 'Neon Tetra',
      description: 'Energetic, cohesive schooler with high metabolisms and affinity for vegetation.',
      traits: {
        movement: { maxSpeed: 3.8, maxForce: 5.5, dragCoefficient: 0.91 },
        habitatPreferences: {
          VEGETATION: 0.9,
          OPEN_WATER: 0.6,
          SURFACE: 0.3,
          CAVE_SHELTER: 0.4,
          BENTHIC_SUBSTRATE: 0.0,
        },
        resourceRequirements: {
          preferredFoodTypes: ['food_pellet', 'biofilm_patch'],
          consumptionRate: 25.0,
          metabolicRate: 0.12,
          starvationThreshold: 15.0,
        },
        lifespan: {
          juvenileDuration: 35.0,
          matureDuration: 280.0,
          senescentDuration: 120.0,
          maxLifespan: 435.0,
        },
        reproduction: {
          maturityThreshold: 35.0,
          minEnergyToReproduce: 70.0,
          energyCost: 25.0,
          recoveryInterval: 30.0,
          minPartnerAffinity: 0.15,
          clutchSize: 2,
          preferredBreedingHabitat: 'VEGETATION',
        },
        socialTendency: {
          schoolingAffinity: 0.85,
          territorialityTendency: 0.15,
          curiosityTendency: 0.6,
        },
        trophicLevel: 1.5,
        biomassPerIndividual: 1.2,
      },
    });

    // 3. Golden Guppy (Surface and mid-column active pioneer)
    this.register({
      id: 'golden_guppy',
      name: 'Golden Guppy',
      description: 'Prolific pioneer species feeding at surface film and vegetation fronds.',
      traits: {
        movement: { maxSpeed: 3.4, maxForce: 5.0, dragCoefficient: 0.92 },
        habitatPreferences: {
          SURFACE: 0.9,
          VEGETATION: 0.7,
          OPEN_WATER: 0.4,
          CAVE_SHELTER: -0.2,
          BENTHIC_SUBSTRATE: -0.3,
        },
        resourceRequirements: {
          preferredFoodTypes: ['food_pellet', 'biofilm_patch', 'vegetation_frond'],
          consumptionRate: 22.0,
          metabolicRate: 0.11,
          starvationThreshold: 15.0,
        },
        lifespan: {
          juvenileDuration: 30.0,
          matureDuration: 250.0,
          senescentDuration: 100.0,
          maxLifespan: 380.0,
        },
        reproduction: {
          maturityThreshold: 30.0,
          minEnergyToReproduce: 68.0,
          energyCost: 22.0,
          recoveryInterval: 25.0,
          minPartnerAffinity: 0.1,
          clutchSize: 2,
          preferredBreedingHabitat: 'SURFACE',
        },
        socialTendency: {
          schoolingAffinity: 0.65,
          territorialityTendency: 0.2,
          curiosityTendency: 0.7,
        },
        trophicLevel: 1.2,
        biomassPerIndividual: 1.0,
      },
    });

    // 4. Celestial Ray (Deep pelagic gliding grazer)
    this.register({
      id: 'celestial_ray',
      name: 'Celestial Ray',
      description: 'Slow, majestic glider that sweeps through open water and lower depths.',
      traits: {
        movement: { maxSpeed: 2.0, maxForce: 3.0, dragCoefficient: 0.95 },
        habitatPreferences: {
          OPEN_WATER: 0.9,
          BENTHIC_SUBSTRATE: 0.5,
          CAVE_SHELTER: 0.2,
          SURFACE: -0.2,
          VEGETATION: -0.1,
        },
        resourceRequirements: {
          preferredFoodTypes: ['food_pellet', 'biofilm_patch', 'detritus'],
          consumptionRate: 40.0,
          metabolicRate: 0.08,
          starvationThreshold: 25.0,
        },
        lifespan: {
          juvenileDuration: 80.0,
          matureDuration: 500.0,
          senescentDuration: 200.0,
          maxLifespan: 780.0,
        },
        reproduction: {
          maturityThreshold: 80.0,
          minEnergyToReproduce: 80.0,
          energyCost: 40.0,
          recoveryInterval: 60.0,
          minPartnerAffinity: 0.25,
          clutchSize: 1,
          preferredBreedingHabitat: 'OPEN_WATER',
        },
        socialTendency: {
          schoolingAffinity: 0.3,
          territorialityTendency: 0.35,
          curiosityTendency: 0.55,
        },
        trophicLevel: 2,
        biomassPerIndividual: 5.0,
      },
    });

    // 5. Bioluminescent Tang (Shy crevice and vegetation dweller)
    this.register({
      id: 'bioluminescent_tang',
      name: 'Bioluminescent Tang',
      description: 'Nocturnal and crepuscular species that grazes in caves and reefs.',
      traits: {
        movement: { maxSpeed: 3.2, maxForce: 4.8, dragCoefficient: 0.92 },
        habitatPreferences: {
          CAVE_SHELTER: 0.9,
          VEGETATION: 0.6,
          OPEN_WATER: 0.2,
          BENTHIC_SUBSTRATE: 0.3,
          SURFACE: -0.5,
        },
        resourceRequirements: {
          preferredFoodTypes: ['biofilm_patch', 'food_pellet'],
          consumptionRate: 28.0,
          metabolicRate: 0.1,
          starvationThreshold: 18.0,
        },
        lifespan: {
          juvenileDuration: 40.0,
          matureDuration: 320.0,
          senescentDuration: 130.0,
          maxLifespan: 490.0,
        },
        reproduction: {
          maturityThreshold: 40.0,
          minEnergyToReproduce: 72.0,
          energyCost: 28.0,
          recoveryInterval: 35.0,
          minPartnerAffinity: 0.2,
          clutchSize: 1,
          preferredBreedingHabitat: 'CAVE_SHELTER',
        },
        socialTendency: {
          schoolingAffinity: 0.45,
          territorialityTendency: 0.4,
          curiosityTendency: 0.65,
        },
        trophicLevel: 1.5,
        biomassPerIndividual: 1.8,
      },
    });

    // 6. Hermit Crab (Benthic scavenger & detritivore)
    this.register({
      id: 'hermit_crab',
      name: 'Hermit Crab',
      description: 'Substrate scavenger consuming organic detritus and cleaning sediment.',
      traits: {
        movement: { maxSpeed: 1.0, maxForce: 2.5, dragCoefficient: 0.88 },
        habitatPreferences: {
          BENTHIC_SUBSTRATE: 0.95,
          CAVE_SHELTER: 0.6,
          VEGETATION: 0.3,
          OPEN_WATER: -0.9,
          SURFACE: -1.0,
        },
        resourceRequirements: {
          preferredFoodTypes: ['detritus', 'food_pellet', 'biofilm_patch'],
          consumptionRate: 30.0,
          metabolicRate: 0.05,
          starvationThreshold: 15.0,
        },
        lifespan: {
          juvenileDuration: 50.0,
          matureDuration: 450.0,
          senescentDuration: 150.0,
          maxLifespan: 650.0,
        },
        reproduction: {
          maturityThreshold: 50.0,
          minEnergyToReproduce: 75.0,
          energyCost: 30.0,
          recoveryInterval: 40.0,
          minPartnerAffinity: 0.2,
          clutchSize: 1,
          preferredBreedingHabitat: 'BENTHIC_SUBSTRATE',
        },
        socialTendency: {
          schoolingAffinity: 0.1,
          territorialityTendency: 0.5,
          curiosityTendency: 0.75,
        },
        trophicLevel: 1.0,
        biomassPerIndividual: 2.0,
      },
    });

    // 7. Nerite Snail (Benthic & glass biofilm grazer)
    this.register({
      id: 'nerite_snail',
      name: 'Nerite Snail',
      description: 'Slow-moving benthic grazer that rasps biofilms from rocks and glass surfaces.',
      traits: {
        movement: { maxSpeed: 0.45, maxForce: 1.5, dragCoefficient: 0.85 },
        habitatPreferences: {
          BENTHIC_SUBSTRATE: 0.9,
          VEGETATION: 0.5,
          CAVE_SHELTER: 0.4,
          OPEN_WATER: -1.0,
          SURFACE: -0.8,
        },
        resourceRequirements: {
          preferredFoodTypes: ['biofilm_patch', 'detritus'],
          consumptionRate: 20.0,
          metabolicRate: 0.03,
          starvationThreshold: 10.0,
        },
        lifespan: {
          juvenileDuration: 45.0,
          matureDuration: 500.0,
          senescentDuration: 180.0,
          maxLifespan: 725.0,
        },
        reproduction: {
          maturityThreshold: 45.0,
          minEnergyToReproduce: 65.0,
          energyCost: 20.0,
          recoveryInterval: 35.0,
          minPartnerAffinity: 0.1,
          clutchSize: 1,
          preferredBreedingHabitat: 'BENTHIC_SUBSTRATE',
        },
        socialTendency: {
          schoolingAffinity: 0.05,
          territorialityTendency: 0.1,
          curiosityTendency: 0.4,
        },
        trophicLevel: 1.0,
        biomassPerIndividual: 1.2,
      },
    });
  }

  public static register(species: ISpecies): void {
    this._species.set(species.id, species);
  }

  public static get(id: string): ISpecies | undefined {
    return this._species.get(id);
  }

  public static getOrFallback(id: string): ISpecies {
    const found = this._species.get(id);
    if (found) return found;
    // Default fallback species if an unknown species id is encountered
    return (
      this._species.get('neon_tetra') || {
        id,
        name: id,
        description: 'Generic organism',
        traits: {
          movement: { maxSpeed: 2.5, maxForce: 4.0, dragCoefficient: 0.92 },
          habitatPreferences: { OPEN_WATER: 0.5 },
          resourceRequirements: {
            preferredFoodTypes: ['food_pellet', 'biofilm_patch'],
            consumptionRate: 25.0,
            metabolicRate: 0.1,
            starvationThreshold: 15.0,
          },
          lifespan: { juvenileDuration: 40.0, matureDuration: 300.0, senescentDuration: 120.0, maxLifespan: 460.0 },
          reproduction: {
            maturityThreshold: 40.0,
            minEnergyToReproduce: 70.0,
            energyCost: 25.0,
            recoveryInterval: 30.0,
            minPartnerAffinity: 0.15,
            clutchSize: 1,
            preferredBreedingHabitat: 'OPEN_WATER',
          },
          socialTendency: { schoolingAffinity: 0.5, territorialityTendency: 0.3, curiosityTendency: 0.5 },
          trophicLevel: 1.5,
          biomassPerIndividual: 1.5,
        },
      }
    );
  }

  public static getAll(): ISpecies[] {
    return Array.from(this._species.values());
  }
}

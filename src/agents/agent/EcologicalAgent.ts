/**
 * Autonomous Ecological Agent.
 *
 * Unifies:
 *  - Persistent Identity (id, species, lifecycle state, age)
 *  - Physical State (position, velocity, acceleration, orientation)
 *  - Latent Hyperdimensional State (temporal coordinate w + latent channels)
 *  - Metabolic Energy (0 to 100%)
 *  - Drives System (hunger, fear, curiosity, rest, etc.)
 *  - Perception System (local sensory boundary)
 *  - Memory System (episodic memory records)
 *  - Relationship System (agent-to-agent ties)
 *  - Behaviour System (selected behaviour and candidates)
 *  - Current Antic (active episodic participation)
 *  - Locomotion Substrate (steering forces)
 */

import { Vector3D } from '../../space/physical/Vector3D';
import { LatentState, ILatentStateJSON } from '../../space/hyperdimensional/LatentState';
import { DriveSystem, IDrivesJSON } from '../drives/DriveSystem';
import { MemorySystem, IMemoryJSON } from '../memory/MemorySystem';
import { RelationshipSystem, IRelationshipsJSON } from '../relationships/RelationshipSystem';
import { PerceptionSystem } from '../perception/PerceptionSystem';
import { BehaviourSystem, ActiveBehaviour } from '../behaviour/BehaviourSystem';
import { SteeringSubstrate, TankBounds3D } from '../locomotion/SteeringSubstrate';
import { SpeciesRegistry, ISpecies } from '../../species/Species';

export type LifecycleStage = 'birth' | 'juvenile' | 'mature' | 'senescent' | 'dead' | 'adult' | 'elder';

export interface IAgentJSON {
  id: string;
  species: string;
  lifecycle: LifecycleStage;
  ageSeconds: number;
  energy: number;
  health?: number;
  position: { x: number; y: number; z: number };
  velocity: { x: number; y: number; z: number };
  latentState: ILatentStateJSON;
  drives: IDrivesJSON;
  memory: IMemoryJSON;
  relationships: IRelationshipsJSON;
  currentBehaviour: ActiveBehaviour;
  currentAnticId?: string;
  burstPhase?: number;
  isBursting?: boolean;
  lastReproductionTime?: number;
  generation?: number;
  currentHabitatId?: string;
}

export class EcologicalAgent {
  public readonly id: string;
  public readonly species: string;
  public lifecycle: LifecycleStage = 'mature';
  public ageSeconds: number = 0;
  public energy: number = 85.0; // 0-100%
  public health: number = 100.0; // 0-100%
  public lastReproductionTime: number = -100;
  public generation: number = 0;
  public currentHabitatId?: string;

  // Physical State
  public position: Vector3D;
  public velocity: Vector3D;
  public acceleration: Vector3D;

  // Latent Hyperdimensional State
  public latentState: LatentState;

  // Cognitive Subsystems
  public drives: DriveSystem;
  public memory: MemorySystem;
  public relationships: RelationshipSystem;
  public perception: PerceptionSystem;
  public behaviour: BehaviourSystem;
  public steering: SteeringSubstrate;

  // Kinematic subtleties & antics participation
  public currentAnticId?: string;
  public burstPhase: number = 0;
  public isBursting: boolean = false;
  private _wanderAngle: number = 0;

  constructor(
    id: string,
    species: string,
    initialPos?: Vector3D,
    initialLatentW: number = 50.0,
    initialVel?: Vector3D,
    initialWanderAngle?: number
  ) {
    this.id = id;
    this.species = species;
    this.position = initialPos ? initialPos.clone() : new Vector3D(0, 0, 0);
    this.velocity = initialVel ? initialVel.clone() : new Vector3D(0, 0, 0);
    this.acceleration = new Vector3D(0, 0, 0);

    this.latentState = new LatentState(8);
    this.latentState.temporalW = initialLatentW;

    this.drives = new DriveSystem();
    this.memory = new MemorySystem(24, 150.0);
    this.relationships = new RelationshipSystem();
    this.perception = new PerceptionSystem();
    this.behaviour = new BehaviourSystem();
    this.steering = new SteeringSubstrate();
    this._wanderAngle = initialWanderAngle ?? 0;

    // Apply species locomotion traits
    const sp = this.speciesTraits;
    this.steering.maxSpeed = sp.traits.movement.maxSpeed;
    this.steering.maxForce = sp.traits.movement.maxForce;
    this.steering.dragCoefficient = sp.traits.movement.dragCoefficient;
  }

  public get speciesTraits(): ISpecies {
    return SpeciesRegistry.getOrFallback(this.species);
  }

  public updateDrives(simDt: number): void {
    if (this.lifecycle === 'dead') return;

    const sp = this.speciesTraits;
    const baseMetabolism = sp.traits.resourceRequirements.metabolicRate;

    // Metabolic energy consumption
    const speed = this.velocity.length();
    // Senescent organisms burn energy slightly less efficiently
    const senescenceFactor = this.lifecycle === 'senescent' || this.lifecycle === 'elder' ? 1.25 : 1.0;
    const burnRate = (baseMetabolism + speed * 0.04) * senescenceFactor;
    this.energy = Math.max(0, this.energy - burnRate * simDt);

    // Starvation dynamics
    if (this.energy <= 0.05) {
      this.health = Math.max(0, this.health - 2.5 * simDt);
    } else if (this.energy > sp.traits.resourceRequirements.starvationThreshold && this.health < 100.0) {
      this.health = Math.min(100.0, this.health + 0.8 * simDt);
    }

    // Hunger drive rises when energy drops
    if (this.energy < 60.0) {
      this.drives.add('hunger', (1.0 - this.energy / 60.0) * 0.045 * simDt);
    }

    this.drives.update(simDt);

    // Sync drives to latent state channels for hyperdimensional query
    this.latentState.set(LatentState.DIM_HUNGER, this.drives.get('hunger'));
    this.latentState.set(LatentState.DIM_FEAR, this.drives.get('fear'));
    this.latentState.set(LatentState.DIM_CURIOSITY, this.drives.get('curiosity'));
    this.latentState.set(LatentState.DIM_SOCIAL_AFFINITY, this.drives.get('socialisation'));
    this.latentState.set(LatentState.DIM_TERRITORIALITY, this.drives.get('territoriality'));
  }

  /**
   * Advances lifecycle stages dynamically based on age, energy, and health.
   */
  public advanceLifecycle(simDt: number): { transitioned: boolean; previousStage: LifecycleStage; currentStage: LifecycleStage } {
    if (this.lifecycle === 'dead') {
      return { transitioned: false, previousStage: 'dead', currentStage: 'dead' };
    }

    const prevStage = this.lifecycle;
    this.ageSeconds += simDt;
    const sp = this.speciesTraits;
    const { juvenileDuration, matureDuration, maxLifespan } = sp.traits.lifespan;

    // Check starvation or extreme age death
    if (this.health <= 0 || this.ageSeconds >= maxLifespan) {
      this.lifecycle = 'dead';
      this.velocity.multiplyScalar(0.2);
      return { transitioned: true, previousStage: prevStage, currentStage: 'dead' };
    }

    if (this.lifecycle === 'birth') {
      if (this.ageSeconds > 3.0) {
        this.lifecycle = 'juvenile';
      }
    } else if (this.lifecycle === 'juvenile') {
      if (this.ageSeconds >= juvenileDuration && this.energy >= 30.0) {
        this.lifecycle = 'mature';
      }
    } else if (this.lifecycle === 'mature' || this.lifecycle === 'adult') {
      if (this.ageSeconds >= (juvenileDuration + matureDuration) || this.health < 40.0) {
        this.lifecycle = 'senescent';
      }
    }

    return {
      transitioned: this.lifecycle !== prevStage,
      previousStage: prevStage,
      currentStage: this.lifecycle,
    };
  }

  public canReproduce(simTime: number): boolean {
    if (this.lifecycle !== 'mature' && this.lifecycle !== 'adult') return false;
    const sp = this.speciesTraits;
    if (this.energy < sp.traits.reproduction.minEnergyToReproduce) return false;
    if (simTime - this.lastReproductionTime < sp.traits.reproduction.recoveryInterval) return false;
    if (this.health < 65.0) return false;
    return true;
  }

  public updateMemory(simDt: number): void {
    this.memory.update(simDt);
  }

  public applySteering(bounds: TankBounds3D, simDt: number, randomDelta?: number): void {
    if (this.lifecycle === 'dead') {
      // Dead agent sinks passively to the benthic substrate
      if (this.position.y > bounds.minY + 0.3) {
        this.velocity.y = -0.5;
        this.velocity.x *= 0.92;
        this.velocity.z *= 0.92;
        this.position.addScaled(this.velocity, simDt);
      }
      return;
    }

    const active = this.behaviour.currentBehaviour;
    let force = new Vector3D(0, 0, 0);

    // 1. Core behavioral intent force
    if (active.type === 'flee' && active.targetPosition) {
      force.add(this.steering.flee(this.position, this.velocity, active.targetPosition));
      this.isBursting = true;
    } else if ((active.type === 'migrate' || active.type === 'feed' || active.type === 'investigate' || active.type === 'approach' || active.type === 'socialise') && active.targetPosition) {
      force.add(this.steering.seek(this.position, this.velocity, active.targetPosition, active.desiredSpeedMultiplier));
    } else if (active.targetPosition) {
      force.add(this.steering.seek(this.position, this.velocity, active.targetPosition, active.desiredSpeedMultiplier));
    } else if (active.type === 'wander') {
      const { force: wForce, nextAngle } = this.steering.wander(this.velocity, this._wanderAngle, randomDelta);
      this._wanderAngle = nextAngle;
      force.add(wForce);
    }

    // 2. Soft boundary containment
    force.add(this.steering.boundaryRepulsion(this.position, bounds, 2.0));

    // 3. Acceleration and velocity integration
    this.acceleration.copy(force);
    this.velocity.addScaled(this.acceleration, simDt);

    // Drag & burst-and-coast kinematics
    const maxSpeed = this.steering.maxSpeed * (active.desiredSpeedMultiplier || 1.0);
    this.velocity.clampLength(maxSpeed);
    this.velocity.multiplyScalar(this.steering.dragCoefficient);

    // Position integration
    this.position.addScaled(this.velocity, simDt);

    // Keep within strict hard bounds
    this.position.x = Math.max(bounds.minX, Math.min(bounds.maxX, this.position.x));
    this.position.y = Math.max(bounds.minY, Math.min(bounds.maxY, this.position.y));
    this.position.z = Math.max(bounds.minZ, Math.min(bounds.maxZ, this.position.z));
  }

  public consumeFood(nutritionAmount: number, simTime: number): void {
    const sp = this.speciesTraits;
    const gained = nutritionAmount * sp.traits.resourceRequirements.consumptionRate;
    this.energy = Math.min(100.0, this.energy + gained);
    this.drives.satisfy('hunger', 0.55);
    this.memory.addMemory('food_discovered', this.position, simTime, 0.8, 1.0, undefined, { nutrition: nutritionAmount });
  }

  public toJSON(): IAgentJSON {
    return {
      id: this.id,
      species: this.species,
      lifecycle: this.lifecycle,
      ageSeconds: this.ageSeconds,
      energy: this.energy,
      health: this.health,
      position: this.position.toJSON(),
      velocity: this.velocity.toJSON(),
      latentState: this.latentState.toJSON(),
      drives: this.drives.toJSON(),
      memory: this.memory.toJSON(),
      relationships: this.relationships.toJSON(),
      currentBehaviour: { ...this.behaviour.currentBehaviour },
      currentAnticId: this.currentAnticId,
      burstPhase: this.burstPhase,
      isBursting: this.isBursting,
      lastReproductionTime: this.lastReproductionTime,
      generation: this.generation,
      currentHabitatId: this.currentHabitatId,
    };
  }

  public static fromJSON(json: IAgentJSON): EcologicalAgent {
    const agent = new EcologicalAgent(json.id, json.species);
    agent.lifecycle = json.lifecycle || 'mature';

    agent.ageSeconds = json.ageSeconds || 0;
    agent.energy = json.energy ?? 85;
    agent.health = json.health ?? 100;
    agent.position = Vector3D.fromJSON(json.position);
    agent.velocity = Vector3D.fromJSON(json.velocity);
    if (json.latentState) {
      agent.latentState = LatentState.fromJSON(json.latentState);
    }
    if (json.drives) {
      agent.drives.fromJSON(json.drives);
    }
    if (json.memory) {
      agent.memory.fromJSON(json.memory);
    }
    if (json.relationships) {
      agent.relationships.fromJSON(json.relationships);
    }
    if (json.currentBehaviour) {
      agent.behaviour.currentBehaviour = { ...json.currentBehaviour };
    }
    agent.currentAnticId = json.currentAnticId;
    agent.burstPhase = json.burstPhase || 0;
    agent.isBursting = json.isBursting || false;
    agent.lastReproductionTime = json.lastReproductionTime ?? -100;
    agent.generation = json.generation ?? 0;
    agent.currentHabitatId = json.currentHabitatId;
    return agent;
  }
}

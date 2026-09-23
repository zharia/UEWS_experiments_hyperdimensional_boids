/**
 * Ecology Simulation Coordinator.
 *
 * Core coordinator linking:
 *  - SimulationClock (multi-scalar temporal progression)
 *  - SeededRandom (deterministic pseudo-random execution)
 *  - DiscreteEnvironmentalFieldGrid (spatially addressable fields)
 *  - ResourceSystem (ecological resources)
 *  - EcologicalAgent[] (autonomous agents with drives, memory, perception, relationships)
 *  - AnticScheduler (episodic antics generation and execution)
 *  - PhaseTransitionEngine (ecosystem phases and state-based transitions)
 *  - ObserverModel (independent world with observer modulation)
 *  - WorldPersistenceService (continuous state survival across restarts)
 */

import { SeededRandom } from '../core/random/SeededRandom';
import { SimulationClock } from '../core/clock/SimulationClock';
import { DiscreteEnvironmentalFieldGrid } from '../space/fields/EnvironmentalField';
import { ResourceSystem } from '../ecology/resources/ResourceSystem';
import { EcologicalAgent } from '../agents/agent/EcologicalAgent';
import { AnticScheduler } from '../antics/scheduler/AnticScheduler';
import { AnticHistory } from '../antics/history/AnticHistory';
import { PhaseTransitionEngine } from '../phases/transitions/PhaseTransitionEngine';
import { ObserverModel } from '../observer/ObserverModel';
import { WorldPersistenceService } from '../core/persistence/WorldPersistence';
import { IWorldStateV02 } from '../core/state/WorldState';
import { Vector3D } from '../space/physical/Vector3D';
import { TankBounds3D } from '../agents/locomotion/SteeringSubstrate';
import { Antic } from '../antics/antic/Antic';
import { PopulationManager } from '../population/PopulationManager';
import { HabitatManager } from '../ecology/habitats/HabitatManager';
import { EcologicalEventLedger } from '../history/EcologicalEventLedger';
import { SpeciesRegistry } from '../species/Species';

export interface EcologyTelemetry {
  currentPhase: string;
  phaseDurationSeconds: number;
  simulationTime: number;
  agentCount: number;
  activeAntics: { id: string; type: string; phase: string; salience: number; progress: number }[];
  recentAntics: { type: string; time: number; outcome: string }[];
  candidateAnticsCount: number;
  averageEnergy: number;
  averageHunger: number;
  averageCuriosity: number;
  averageFear: number;
  totalBiomass: number;
  biodiversityIndex: number;
  observerState: string;
  demographics?: {
    birthCount: number;
    juvenileCount: number;
    matureCount: number;
    senescentCount: number;
  };
  habitats?: { id: string; name: string; occupancy: number; suitabilityAvg: number }[];
}

export class EcologySimulation {
  public random: SeededRandom;
  public clock: SimulationClock;
  public fields: DiscreteEnvironmentalFieldGrid;
  public resources: ResourceSystem;
  public agents: EcologicalAgent[] = [];
  public anticHistory: AnticHistory;
  public anticScheduler: AnticScheduler;
  public phaseEngine: PhaseTransitionEngine;
  public observer: ObserverModel;
  public persistence: WorldPersistenceService;
  public populations: PopulationManager;
  public habitats: HabitatManager;
  public eventLedger: EcologicalEventLedger;

  public bounds: TankBounds3D = {
    minX: -14.0,
    maxX: 14.0,
    minY: -7.0,
    maxY: 7.0,
    minZ: -6.0,
    maxZ: 6.0,
  };

  private _agentIdCounter: number = 100;

  constructor(seed?: number) {
    this.random = new SeededRandom(seed);
    this.clock = new SimulationClock();
    this.fields = new DiscreteEnvironmentalFieldGrid();
    this.resources = new ResourceSystem();
    this.anticHistory = new AnticHistory(50);
    this.anticScheduler = new AnticScheduler(this.random, this.anticHistory);
    this.phaseEngine = new PhaseTransitionEngine('COLONISATION');
    this.observer = new ObserverModel('WATCHING');
    this.persistence = new WorldPersistenceService();
    this.populations = new PopulationManager();
    this.habitats = new HabitatManager();
    this.eventLedger = new EcologicalEventLedger(300);

    // Register reproduction callback from antic scheduler
    this.anticScheduler.onReproduction = (parentAId, parentBId, location) => {
      this.handleAgentReproduction(parentAId, parentBId, location);
    };

    this.initializeDefaultPopulation();
  }

  public initializeDefaultPopulation(): void {
    this.agents = [];

    // Macro Pelagic Titans (Discus & Rays)
    const macroSpecies = ['titan_discus', 'celestial_ray', 'azure_discus'];
    for (let i = 0; i < 3; i++) {
      const pos = new Vector3D(
        (this.random.next() - 0.5) * 16.0,
        -1.0 + (this.random.next() - 0.5) * 4.0,
        (this.random.next() - 0.5) * 6.0
      );
      const vel = new Vector3D(
        (this.random.next() - 0.5) * 1.5,
        (this.random.next() - 0.5) * 0.8,
        (this.random.next() - 0.5) * 1.5
      );
      const agent = new EcologicalAgent(
        `macro_agent_${i + 1}`,
        macroSpecies[i % macroSpecies.length],
        pos,
        50.0 + (this.random.next() - 0.5) * 10.0,
        vel,
        this.random.next() * Math.PI * 2
      );
      agent.drives.set('territoriality', 0.6);
      agent.drives.set('curiosity', 0.5);
      this.agents.push(agent);
    }

    // Meso Schooling Pioneers
    const mesoSpecies = ['neon_tetra', 'golden_guppy', 'bioluminescent_tang'];
    for (let i = 0; i < 15; i++) {
      const pos = new Vector3D(
        (this.random.next() - 0.5) * 20.0,
        -2.0 + (this.random.next() - 0.5) * 5.0,
        (this.random.next() - 0.5) * 8.0
      );
      const vel = new Vector3D(
        (this.random.next() - 0.5) * 1.5,
        (this.random.next() - 0.5) * 0.8,
        (this.random.next() - 0.5) * 1.5
      );
      const agent = new EcologicalAgent(
        `meso_agent_${i + 1}`,
        mesoSpecies[i % mesoSpecies.length],
        pos,
        50.0 + (this.random.next() - 0.5) * 15.0,
        vel,
        this.random.next() * Math.PI * 2
      );
      agent.drives.set('socialisation', 0.75);
      agent.drives.set('curiosity', 0.6);
      this.agents.push(agent);
    }

    // Benthic Micro-Fauna Representatives (Hermit crab & Nerite snail)
    const crab = new EcologicalAgent(
      'fauna_hermit_1',
      'hermit_crab',
      new Vector3D(-4.0, -6.5, 0.0),
      50.0,
      new Vector3D(0.2, 0, 0),
      0
    );
    crab.drives.set('exploration', 0.8);
    crab.drives.set('rest', 0.4);
    this.agents.push(crab);

    const snail = new EcologicalAgent(
      'fauna_snail_1',
      'nerite_snail',
      new Vector3D(3.5, -6.6, 1.2),
      50.0,
      new Vector3D(0.1, 0, 0),
      0
    );
    snail.drives.set('hunger', 0.65);
    this.agents.push(snail);

    // Synchronize populations
    this.populations.synchronize(this.agents, 0);

    this.eventLedger.recordEvent({
      eventType: 'PERTURBATION',
      timestamp: 0,
      phase: 'COLONISATION',
      significance: 0.9,
      description: 'Aquarium artificial ecology initialized with initial colonization cohort.',
      participants: this.agents.map((a) => a.id),
      effects: { initialAgentCount: this.agents.length },
    });
  }

  /**
   * Spawns new offspring when reproductive antic resolves successfully
   */
  public handleAgentReproduction(parentAId: string, parentBId: string, location: any): EcologicalAgent | null {
    const parentA = this.agents.find((a) => a.id === parentAId);
    const parentB = this.agents.find((a) => a.id === parentBId);
    if (!parentA || !parentB) return null;

    const simTime = this.clock.simulationTime;
    const sp = parentA.speciesTraits;

    // Deduct reproductive metabolic cost
    parentA.energy = Math.max(10, parentA.energy - sp.traits.reproduction.energyCost);
    parentA.lastReproductionTime = simTime;
    parentB.energy = Math.max(10, parentB.energy - sp.traits.reproduction.energyCost);
    parentB.lastReproductionTime = simTime;

    const offspringId = `agent_gen_${++this._agentIdCounter}`;
    const spawnPos = new Vector3D(
      location.x + (this.random.next() - 0.5) * 1.5,
      location.y + (this.random.next() - 0.5) * 1.5,
      location.z + (this.random.next() - 0.5) * 1.5
    );

    const offspring = new EcologicalAgent(
      offspringId,
      parentA.species,
      spawnPos,
      (parentA.latentState.temporalW + parentB.latentState.temporalW) * 0.5,
      new Vector3D((this.random.next() - 0.5) * 1.0, (this.random.next() - 0.5) * 0.5, (this.random.next() - 0.5) * 1.0)
    );

    offspring.lifecycle = 'birth';
    offspring.ageSeconds = 0;
    offspring.energy = 80;
    offspring.generation = Math.max(parentA.generation, parentB.generation) + 1;

    // Positive initial bond with parents
    offspring.relationships.modifyRelationship(parentA.id, 0.8, 0.8, 0, simTime);
    offspring.relationships.modifyRelationship(parentB.id, 0.8, 0.8, 0, simTime);
    parentA.relationships.modifyRelationship(offspring.id, 0.8, 0.8, 0, simTime);
    parentB.relationships.modifyRelationship(offspring.id, 0.8, 0.8, 0, simTime);

    this.agents.push(offspring);
    this.populations.recordBirth(offspring.species, offspring.id, simTime);

    this.eventLedger.recordEvent({
      eventType: 'REPRODUCTION',
      timestamp: simTime,
      participants: [parentA.id, parentB.id, offspring.id],
      location: spawnPos,
      phase: this.phaseEngine.currentPhase,
      significance: 0.85,
      description: `New ${offspring.species} offspring [${offspring.id}] born to parents [${parentA.id}] and [${parentB.id}].`,
      cause: { description: 'Successful courtship display and reproductive spawning ritual' },
      effects: { offspringId: offspring.id, generation: offspring.generation },
    });

    return offspring;
  }

  /**
   * Main multi-scalar step loop.
   * Handles 60Hz movement, 10Hz perception, 2Hz behaviour, 1Hz antics, 0.1Hz fields/ecology, 0.02Hz phases.
   */
  public update(rawDt?: number, algaeCoverage: number = 20.0, disturbanceStrength: number = 0.0): {
    simDt: number;
    newAntics: Antic[];
    completedAntics: Antic[];
  } {
    const { simDt, triggers } = this.clock.advance(rawDt);
    const simTime = this.clock.simulationTime;
    let newAntics: Antic[] = [];
    let completedAntics: Antic[] = [];

    if (simDt <= 0) {
      return { simDt: 0, newAntics: [], completedAntics: [] };
    }

    this.observer.update();

    // 1. Locomotion & Steering (Runs every tick, ~60Hz)
    for (const agent of this.agents) {
      agent.applySteering(this.bounds, simDt, this.random.next());
      // Kinematic tail-beat oscillation
      agent.burstPhase = (agent.burstPhase + simDt * 3.5) % 1.0;
      if (agent.velocity.length() < 1.0) {
        agent.isBursting = false;
      }
    }

    // 2. Perception (10Hz)
    if (triggers.perception) {
      for (const agent of this.agents) {
        if (agent.lifecycle === 'dead') continue;

        // Habitat occupancy and suitability evaluation
        const currentHabitat = this.habitats.getHabitatAt(agent.position);
        agent.currentHabitatId = currentHabitat?.id;

        let migrationTarget: { habitatId: string; position: Vector3D; suitabilityDelta: number } | undefined;
        if (currentHabitat) {
          const occupancyMap = this.habitats.getOccupancy(this.agents);
          const ranked = this.habitats.evaluateHabitatSuitabilities(
            agent.speciesTraits,
            agent.energy,
            this.resources.resources,
            occupancyMap
          );
          const currentRankItem = ranked.find((r) => r.habitat.id === currentHabitat.id);
          const currentSuitability = currentRankItem ? currentRankItem.suitability : 1.0;
          const best = ranked[0];
          if (best && best.habitat.id !== currentHabitat.id && (best.suitability - currentSuitability) > 0.3) {
            migrationTarget = {
              habitatId: best.habitat.id,
              position: best.habitat.center,
              suitabilityDelta: best.suitability - currentSuitability,
            };
          }
        }

        // Collect perceived agents within non-omniscient sensory radius
        const perceivedOtherAgents = this.agents
          .filter((other) => other.id !== agent.id && other.lifecycle !== 'dead')
          .map((other) => {
            const check = agent.perception.canPerceive(
              agent.position,
              agent.velocity,
              agent.latentState,
              other.position,
              other.latentState
            );
            return {
              other,
              check,
            };
          })
          .filter((item) => item.check.perceivable)
          .map((item) => {
            const rel = agent.relationships.getRelationship(item.other.id);
            return {
              id: item.other.id,
              species: item.other.species,
              position: item.other.position,
              velocity: item.other.velocity,
              distance: item.check.distance,
              apparentSize: 1.0,
              affinity: rel.affinity,
              fear: rel.fear,
              isConspecific: item.other.species === agent.species,
            };
          });

        // Collect perceived resources
        const perceivedRes = this.resources.resources
          .map((r) => {
            const check = agent.perception.canPerceive(
              agent.position,
              agent.velocity,
              agent.latentState,
              r.position
            );
            return {
              id: r.id,
              type: r.type,
              position: r.position,
              distance: check.distance,
              quantity: r.quantity,
              salience: check.salience,
              perceivable: check.perceivable,
            };
          })
          .filter((r) => r.perceivable);

        // Behaviour candidates generation
        const candidates = agent.behaviour.generateCandidates(
          agent.id,
          agent.position,
          agent.drives,
          agent.memory,
          agent.relationships,
          perceivedOtherAgents,
          perceivedRes,
          disturbanceStrength > 0.4 ? [{ id: 'disturb', type: 'disturbance', position: new Vector3D(0, 0, 0), distance: 5, threatLevel: disturbanceStrength }] : [],
          simTime,
          migrationTarget,
          agent.canReproduce(simTime)
        );

        agent.behaviour.selectBehaviour(candidates, simTime);
      }
    }

    // 3. Behaviour, Drives, and Lifecycle (~2Hz)
    if (triggers.behaviour) {
      for (let i = this.agents.length - 1; i >= 0; i--) {
        const agent = this.agents[i];

        agent.updateDrives(simDt * 5.0);
        agent.updateMemory(simDt * 5.0);

        // Advance lifecycle
        const lifeResult = agent.advanceLifecycle(simDt * 5.0);
        if (lifeResult.transitioned) {
          if (lifeResult.currentStage === 'dead') {
            const causeStr = agent.health <= 0 ? 'Starvation and metabolic collapse' : 'Senescence and old age';
            this.populations.recordDeath(agent.species, causeStr, simTime);

            // Decompose body into detritus biomass
            const detritus = this.resources.addDetritus(
              agent.position,
              simTime,
              (agent.speciesTraits.traits.biomassPerIndividual || 1.0) * 1.5,
              agent.id
            );

            this.eventLedger.recordEvent({
              eventType: 'DEATH',
              timestamp: simTime,
              participants: [agent.id],
              location: agent.position,
              phase: this.phaseEngine.currentPhase,
              significance: 0.8,
              description: `Organism [${agent.id}] (${agent.species}) perished. Cause: ${causeStr}. Biomass returned to detritus pool.`,
              cause: { description: causeStr },
              effects: { detritusId: detritus.id, ageSeconds: agent.ageSeconds },
            });
          } else {
            this.eventLedger.recordEvent({
              eventType: 'LIFECYCLE_TRANSITION',
              timestamp: simTime,
              participants: [agent.id],
              location: agent.position,
              phase: this.phaseEngine.currentPhase,
              significance: 0.45,
              description: `Organism [${agent.id}] transitioned from ${lifeResult.previousStage} to ${lifeResult.currentStage}.`,
              effects: { newStage: lifeResult.currentStage },
            });
          }
        }

        // Clean up dead carcasses that have settled on the substrate for over 30s
        if (agent.lifecycle === 'dead' && agent.ageSeconds > agent.speciesTraits.traits.lifespan.maxLifespan + 30.0) {
          this.agents.splice(i, 1);
          continue;
        }

        // Check if agent can consume nearby food or detritus
        if (agent.behaviour.currentBehaviour.type === 'feed' && agent.lifecycle !== 'dead') {
          for (const res of this.resources.resources) {
            const allowed = agent.speciesTraits.traits.resourceRequirements.preferredFoodTypes;
            if (allowed.includes(res.type) && agent.position.distanceTo(res.position) < 1.4) {
              const taken = this.resources.consume(res.id, 0.5, this.fields);
              if (taken > 0) {
                agent.consumeFood(taken, simTime);

                this.eventLedger.recordEvent({
                  eventType: 'FEEDING',
                  timestamp: simTime,
                  participants: [agent.id],
                  location: agent.position,
                  phase: this.phaseEngine.currentPhase,
                  significance: 0.35,
                  description: `Organism [${agent.id}] consumed ${taken.toFixed(2)} units of ${res.type}.`,
                  effects: { resourceId: res.id, consumedAmount: taken },
                });
              }
            }
          }
        }
      }
    }

    // 4. Antics Engine (~1Hz)
    if (triggers.antics) {
      const isNight = this.fields.sample(0, 0, 0, 'illumination') < 0.25;
      const res = this.anticScheduler.step(
        this.agents,
        this.resources.resources,
        this.fields,
        simTime,
        this.observer.state,
        isNight,
        this.eventLedger
      );
      newAntics = res.newlyActivated;
      completedAntics = res.completed;
    }

    // 5. Environmental Fields & Habitat Cycling (~0.1Hz)
    if (triggers.ecology) {
      this.fields.update(simDt * 10.0, simTime);
      this.resources.update(simDt * 10.0, simTime, this.fields);
      this.habitats.update(this.agents, this.fields, this.resources.resources, simDt * 10.0);
      this.populations.synchronize(this.agents, simTime);
    }

    // 6. Succession & Ecological Phase Transitions (~0.02Hz)
    if (triggers.succession) {
      const metrics = this.phaseEngine.calculateMetrics(
        this.agents,
        this.resources,
        this.fields,
        algaeCoverage,
        disturbanceStrength
      );
      const prevPhase = this.phaseEngine.currentPhase;
      this.phaseEngine.evaluateTransitions(metrics, simTime);
      if (this.phaseEngine.currentPhase !== prevPhase) {
        this.eventLedger.recordEvent({
          eventType: 'PHASE_CHANGED',
          timestamp: simTime,
          phase: this.phaseEngine.currentPhase,
          significance: 0.95,
          description: `Ecological succession phase changed from ${prevPhase} to ${this.phaseEngine.currentPhase}.`,
          cause: { description: `Biomass: ${metrics.totalBiomass.toFixed(1)}, Biodiversity: ${metrics.biodiversityIndex.toFixed(2)}` },
          effects: { newPhase: this.phaseEngine.currentPhase, oldPhase: prevPhase },
        });
      }
    }

    return { simDt, newAntics, completedAntics };
  }

  public dropFood(x: number, y: number, z: number, nutrition: number = 1.0): void {
    const pellet = this.resources.addFoodPellet(new Vector3D(x, y, z), this.clock.simulationTime, nutrition);
    this.observer.recordInteraction();

    this.eventLedger.recordEvent({
      eventType: 'RESOURCE_REGENERATION',
      timestamp: this.clock.simulationTime,
      location: pellet.position,
      phase: this.phaseEngine.currentPhase,
      significance: 0.5,
      description: `External nourishment introduced into water column at (${x.toFixed(1)}, ${y.toFixed(1)}, ${z.toFixed(1)}).`,
      effects: { resourceId: pellet.id, nutrition },
    });
  }

  public triggerDisturbance(strength: number = 0.8): void {
    this.observer.recordInteraction();
    for (const agent of this.agents) {
      agent.drives.add('fear', strength * 0.6);
      agent.isBursting = true;
    }

    this.eventLedger.recordEvent({
      eventType: 'PERTURBATION',
      timestamp: this.clock.simulationTime,
      phase: this.phaseEngine.currentPhase,
      significance: 0.75,
      description: `Environmental hydrodynamic disturbance ripple detected (strength: ${strength.toFixed(2)}).`,
      effects: { disturbanceStrength: strength },
    });
  }

  /**
   * Fast-forwards simulation during offline idle intervals
   */
  public catchUpIdleTime(elapsedWallSeconds: number): void {
    if (elapsedWallSeconds <= 2) return;
    const maxCatchUp = 1800; // max 30 minutes simulated
    const clamped = Math.min(elapsedWallSeconds, maxCatchUp);
    const stepSize = 10.0; // 10s coarse time steps
    const steps = Math.floor(clamped / stepSize);

    for (let s = 0; s < steps; s++) {
      this.update(stepSize);
    }
  }

  /**
   * Captures full serializable world state snapshot
   */
  public captureWorldState(version: '0.1' | '0.2' = '0.1'): IWorldStateV02 {
    return {
      schemaVersion: version,
      savedAtWallTime: Date.now(),
      clock: this.clock.captureSnapshot(),
      phaseState: this.phaseEngine.toJSON(),
      agents: this.agents.map((a) => a.toJSON()),
      resources: this.resources.toJSON(),
      fields: this.fields.toJSON(),
      anticHistory: this.anticHistory.toJSON(),
      activeAntics: this.anticScheduler.activeAntics.map((a) => a.toJSON()),
      populations: this.populations.toJSON(),
      habitats: this.habitats.toJSON(),
      eventLedger: this.eventLedger.toJSON(),
      metadata: {
        tankName: 'Chronos Artificial Ecology',
        description: 'Persistent hyperdimensional multi-scalar artificial ecology with emergent causal dynamics',
      },
    };
  }

  /**
   * Restores full world state from snapshot
   */
  public restoreWorldState(state: IWorldStateV02): void {
    this.clock.restoreSnapshot(state.clock);
    this.phaseEngine.fromJSON(state.phaseState);
    this.agents = state.agents.map((json) => EcologicalAgent.fromJSON(json));
    this.resources.fromJSON(state.resources);
    this.fields.fromJSON(state.fields);
    this.anticHistory.fromJSON(state.anticHistory);
    this.anticScheduler.activeAntics = (state.activeAntics || []).map((json) => Antic.fromJSON(json));

    if (state.populations) {
      this.populations.fromJSON(state.populations);
    } else {
      this.populations.synchronize(this.agents, this.clock.simulationTime);
    }

    if (state.habitats) {
      this.habitats.fromJSON(state.habitats);
    }

    if (state.eventLedger) {
      this.eventLedger.fromJSON(state.eventLedger);
    }

    // Process idle-time simulation if saved earlier
    if (state.savedAtWallTime) {
      const elapsedSeconds = (Date.now() - state.savedAtWallTime) / 1000.0;
      if (elapsedSeconds > 5.0) {
        this.catchUpIdleTime(elapsedSeconds);
      }
    }
  }

  public async save(): Promise<boolean> {
    const state = this.captureWorldState();
    return this.persistence.saveWorld(state);
  }

  public async load(): Promise<boolean> {
    const state = await this.persistence.loadWorld();
    if (state) {
      this.restoreWorldState(state);
      return true;
    }
    return false;
  }

  public getTelemetry(): EcologyTelemetry {
    let totalEnergy = 0;
    let totalHunger = 0;
    let totalCuriosity = 0;
    let totalFear = 0;

    let birthCount = 0;
    let juvenileCount = 0;
    let matureCount = 0;
    let senescentCount = 0;

    for (const a of this.agents) {
      totalEnergy += a.energy;
      totalHunger += a.drives.get('hunger');
      totalCuriosity += a.drives.get('curiosity');
      totalFear += a.drives.get('fear');

      if (a.lifecycle === 'birth') birthCount++;
      else if (a.lifecycle === 'juvenile') juvenileCount++;
      else if (a.lifecycle === 'mature' || a.lifecycle === 'adult') matureCount++;
      else if (a.lifecycle === 'senescent' || a.lifecycle === 'elder') senescentCount++;
    }

    const n = Math.max(1, this.agents.length);
    const metrics = this.phaseEngine.calculateMetrics(this.agents, this.resources, this.fields);

    return {
      currentPhase: this.phaseEngine.currentPhase,
      phaseDurationSeconds: this.clock.simulationTime - this.phaseEngine.phaseEnteredTime,
      simulationTime: this.clock.simulationTime,
      agentCount: this.agents.length,
      activeAntics: this.anticScheduler.activeAntics.map((a) => ({
        id: a.id,
        type: a.type,
        phase: a.currentPhase,
        salience: a.salience,
        progress: a.progress,
      })),
      recentAntics: this.anticHistory.getRecentAntics(5).map((r) => ({
        type: r.type,
        time: r.startTime,
        outcome: r.outcome,
      })),
      candidateAnticsCount: this.anticScheduler.candidateGenerator.generateCandidates(
        this.agents,
        this.resources.resources,
        this.clock.simulationTime
      ).length,
      averageEnergy: totalEnergy / n,
      averageHunger: totalHunger / n,
      averageCuriosity: totalCuriosity / n,
      averageFear: totalFear / n,
      totalBiomass: metrics.totalBiomass,
      biodiversityIndex: metrics.biodiversityIndex,
      observerState: this.observer.state,
      demographics: {
        birthCount,
        juvenileCount,
        matureCount,
        senescentCount,
      },
      habitats: this.habitats.getAllHabitats().map((h) => ({
        id: h.id,
        name: h.name,
        occupancy: h.occupantCount,
        suitabilityAvg: 0.8,
      })),
    };
  }
}


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
import { IWorldStateV01 } from '../core/state/WorldState';
import { Vector3D } from '../space/physical/Vector3D';
import { TankBounds3D } from '../agents/locomotion/SteeringSubstrate';
import { Antic } from '../antics/antic/Antic';

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

  public bounds: TankBounds3D = {
    minX: -14.0,
    maxX: 14.0,
    minY: -7.0,
    maxY: 7.0,
    minZ: -6.0,
    maxZ: 6.0,
  };

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
      agent.steering.maxSpeed = 2.4;
      agent.steering.maxForce = 4.5;
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
      agent.steering.maxSpeed = 3.6;
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
    crab.steering.maxSpeed = 1.0;
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
    snail.steering.maxSpeed = 0.5;
    snail.drives.set('hunger', 0.65);
    this.agents.push(snail);
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
        // Collect perceived agents within non-omniscient sensory radius
        const perceivedOtherAgents = this.agents
          .filter((other) => other.id !== agent.id)
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
          simTime
        );

        agent.behaviour.selectBehaviour(candidates, simTime);
      }
    }

    // 3. Behaviour and Drives (~2Hz)
    if (triggers.behaviour) {
      for (const agent of this.agents) {
        agent.updateDrives(simDt * 5.0);
        agent.updateMemory(simDt * 5.0);

        // Check if agent can consume nearby food
        if (agent.behaviour.currentBehaviour.type === 'feed') {
          for (const res of this.resources.resources) {
            if (res.type === 'food_pellet' && agent.position.distanceTo(res.position) < 1.2) {
              const taken = this.resources.consume(res.id, 0.5, this.fields);
              if (taken > 0) {
                agent.consumeFood(taken, simTime);
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
        isNight
      );
      newAntics = res.newlyActivated;
      completedAntics = res.completed;
    }

    // 5. Environmental Fields & Resource Bio-cycling (~0.1Hz)
    if (triggers.ecology) {
      this.fields.update(simDt * 10.0, simTime);
      this.resources.update(simDt * 10.0, simTime, this.fields);
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
      this.phaseEngine.evaluateTransitions(metrics, simTime);
    }

    return { simDt, newAntics, completedAntics };
  }

  public dropFood(x: number, y: number, z: number, nutrition: number = 1.0): void {
    this.resources.addFoodPellet(new Vector3D(x, y, z), this.clock.simulationTime, nutrition);
    this.observer.recordInteraction();
  }

  public triggerDisturbance(strength: number = 0.8): void {
    this.observer.recordInteraction();
    for (const agent of this.agents) {
      agent.drives.add('fear', strength * 0.6);
      agent.isBursting = true;
    }
  }

  /**
   * Captures full serializable world state snapshot
   */
  public captureWorldState(): IWorldStateV01 {
    return {
      schemaVersion: '0.1',
      savedAtWallTime: Date.now(),
      clock: this.clock.captureSnapshot(),
      phaseState: this.phaseEngine.toJSON(),
      agents: this.agents.map((a) => a.toJSON()),
      resources: this.resources.toJSON(),
      fields: this.fields.toJSON(),
      anticHistory: this.anticHistory.toJSON(),
      activeAntics: this.anticScheduler.activeAntics.map((a) => a.toJSON()),
      metadata: {
        tankName: 'Chronos Aquarium Ecology',
        description: 'Persistent hyperdimensional multi-scalar artificial ecology',
      },
    };
  }

  /**
   * Restores full world state from snapshot
   */
  public restoreWorldState(state: IWorldStateV01): void {
    this.clock.restoreSnapshot(state.clock);
    this.phaseEngine.fromJSON(state.phaseState);
    this.agents = state.agents.map((json) => EcologicalAgent.fromJSON(json));
    this.resources.fromJSON(state.resources);
    this.fields.fromJSON(state.fields);
    this.anticHistory.fromJSON(state.anticHistory);
    this.anticScheduler.activeAntics = (state.activeAntics || []).map((json) => Antic.fromJSON(json));
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

    for (const a of this.agents) {
      totalEnergy += a.energy;
      totalHunger += a.drives.get('hunger');
      totalCuriosity += a.drives.get('curiosity');
      totalFear += a.drives.get('fear');
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
    };
  }
}

/**
 * Antic Scheduler and Execution Engine.
 *
 * Coordinates:
 *  - Candidate evaluation & scored selection with controlled stochasticity
 *  - Repetition suppression (via AnticHistory)
 *  - Observer-aware manifestation promotion (via AnticSalienceEvaluator)
 *  - Concurrent antic lifecycle execution (pending -> active -> phases -> completed/interrupted)
 *  - Application of state consequences to agents and environment
 */

import { SeededRandom } from '../../core/random/SeededRandom';
import { EcologicalAgent } from '../../agents/agent/EcologicalAgent';
import { ISpatialFieldProvider } from '../../space/fields/EnvironmentalField';
import { Antic, AnticStatus } from '../antic/Antic';
import { AnticCandidate, AnticCandidateGenerator } from '../candidates/AnticCandidateGenerator';
import { AnticHistory } from '../history/AnticHistory';
import { AnticSalienceEvaluator, ObserverState } from '../salience/AnticSalience';
import { EcologicalResource } from '../../ecology/resources/ResourceSystem';
import { AnticScene } from '../scenes/AnticScene';
import { EcologicalEventLedger } from '../../history/EcologicalEventLedger';

export class AnticScheduler {
  public activeAntics: Antic[] = [];
  public queuedChainedAntics: Antic[] = [];
  public activeScenes: AnticScene[] = [];
  public candidateGenerator: AnticCandidateGenerator;
  public history: AnticHistory;
  public salienceEvaluator: AnticSalienceEvaluator;
  public maxConcurrentAntics: number = 3;
  private _random: SeededRandom;

  public onReproduction?: (parentAId: string, parentBId: string, location: any) => void;

  constructor(random?: SeededRandom, history?: AnticHistory) {
    this._random = random || new SeededRandom();
    this.history = history || new AnticHistory(50);
    this.candidateGenerator = new AnticCandidateGenerator();
    this.salienceEvaluator = new AnticSalienceEvaluator();
  }

  /**
   * Main scheduler evaluation step, called on antics frequency tick (~1 Hz)
   */
  public step(
    agents: EcologicalAgent[],
    resources: EcologicalResource[],
    fields: ISpatialFieldProvider,
    simTime: number,
    observerState: ObserverState = 'WATCHING',
    isNightTime: boolean = false,
    eventLedger?: EcologicalEventLedger
  ): { newlyActivated: Antic[]; completed: Antic[] } {
    const newlyActivated: Antic[] = [];
    const completed: Antic[] = [];

    // 1. Advance existing active antics
    for (let i = this.activeAntics.length - 1; i >= 0; i--) {
      const antic = this.activeAntics[i];
      antic.advance(simTime);

      if (antic.status === 'completed' || antic.status === 'interrupted') {
        this.applyAnticConsequences(antic, agents, fields, simTime, eventLedger);
        completed.push(antic);
        this.activeAntics.splice(i, 1);

        // Remove corresponding scene from activeScenes
        const sIdx = this.activeScenes.findIndex((s) => s.anticId === antic.id);
        if (sIdx !== -1) {
          this.activeScenes.splice(sIdx, 1);
        }

        // Record into history
        this.history.record(
          antic.id,
          antic.type,
          antic.startTime,
          antic.duration,
          antic.participants,
          antic.location,
          antic.status,
          `Completed with ${antic.participants.length} participants`
        );
      }
    }

    // 2. Check queued chained antics first
    if (this.activeAntics.length < this.maxConcurrentAntics && this.queuedChainedAntics.length > 0) {
      for (let i = this.queuedChainedAntics.length - 1; i >= 0; i--) {
        if (this.activeAntics.length >= this.maxConcurrentAntics) break;
        const chained = this.queuedChainedAntics[i];

        // Check if participants are available
        const hasBusy = chained.participants.some((p) => {
          const ag = agents.find((a) => a.id === p.agentId);
          return !ag || ag.lifecycle === 'dead' || ag.currentAnticId;
        });

        if (!hasBusy) {
          this.queuedChainedAntics.splice(i, 1);
          chained.startTime = simTime;
          chained.status = 'active';
          for (const p of chained.participants) {
            const ag = agents.find((a) => a.id === p.agentId);
            if (ag) ag.currentAnticId = chained.id;
          }

          if (chained.isManifest) {
            this.activeScenes.push(chained.generateScene());
          }

          this.activeAntics.push(chained);
          newlyActivated.push(chained);
        }
      }
    }

    // 3. If below concurrency limit, generate and evaluate candidates
    if (this.activeAntics.length < this.maxConcurrentAntics) {
      const rawCandidates = this.candidateGenerator.generateCandidates(
        agents,
        resources,
        simTime,
        isNightTime
      );

      // Score candidates factoring in repetition suppression and stochasticity
      const scored: { candidate: AnticCandidate; finalScore: number }[] = [];

      for (const cand of rawCandidates) {
        const repetitionPenalty = this.history.getRepetitionPenalty(cand.antic.type, simTime, 40.0);
        
        // Controlled stochastic perturbation (+/- 15%)
        const jitter = (this._random.next() - 0.5) * 0.3;

        const finalScore = cand.baseScore * (1.0 - repetitionPenalty * 0.7) + jitter;

        if (finalScore > 0.4) {
          scored.push({ candidate: cand, finalScore });
        }
      }

      scored.sort((a, b) => b.finalScore - a.finalScore);

      // Activate top candidates up to capacity
      for (const item of scored) {
        if (this.activeAntics.length >= this.maxConcurrentAntics) break;

        const antic = item.candidate.antic;

        // Verify none of the participants became busy
        const hasBusyParticipant = antic.participants.some((p) => {
          const ag = agents.find((a) => a.id === p.agentId);
          return !ag || ag.lifecycle === 'dead' || ag.currentAnticId;
        });

        if (hasBusyParticipant) continue;

        // Evaluate salience & manifest promotion
        const evalResult = this.salienceEvaluator.evaluateSalience(
          antic,
          observerState,
          item.finalScore,
          antic.participants.length
        );

        antic.salience = evalResult.salience;
        antic.isManifest = evalResult.shouldManifest;
        antic.status = 'active';

        // Tag participating agents
        for (const p of antic.participants) {
          const ag = agents.find((a) => a.id === p.agentId);
          if (ag) {
            ag.currentAnticId = antic.id;
          }
        }

        // If manifest, generate visual scene representation
        if (antic.isManifest) {
          this.activeScenes.push(antic.generateScene());
        }

        if (eventLedger && antic.isManifest) {
          eventLedger.recordEvent({
            eventType: 'ANTIC_MANIFESTED',
            timestamp: simTime,
            participants: antic.participants.map((p) => p.agentId),
            location: antic.location,
            phase: 'ACTIVE',
            significance: antic.significance,
            description: `Manifested antic [${antic.type}] observed: ${antic.trigger}`,
            cause: antic.causeEventId ? { eventId: antic.causeEventId, description: 'Chained from preceding event' } : undefined,
          });
        }

        this.activeAntics.push(antic);
        newlyActivated.push(antic);
      }
    }

    return { newlyActivated, completed };
  }

  /**
   * Applies state effects to participants upon antic resolution
   */
  private applyAnticConsequences(
    antic: Antic,
    agents: EcologicalAgent[],
    fields: ISpatialFieldProvider,
    simTime: number,
    eventLedger?: EcologicalEventLedger
  ): void {
    for (const p of antic.participants) {
      const ag = agents.find((a) => a.id === p.agentId);
      if (ag) {
        ag.currentAnticId = undefined; // release agent
      }
    }

    // Apply explicit state effects defined on antic
    for (const eff of antic.stateEffects) {
      const ag = agents.find((a) => a.id === eff.agentId);
      if (!ag) continue;

      if (eff.driveModifications) {
        for (const [driveName, delta] of Object.entries(eff.driveModifications)) {
          ag.drives.add(driveName, delta);
        }
      }

      if (eff.energyDelta) {
        ag.energy = Math.max(0, Math.min(100, ag.energy + eff.energyDelta));
      }

      if (eff.memoryCreated) {
        ag.memory.addMemory(
          eff.memoryCreated.eventType,
          antic.location,
          simTime,
          eff.memoryCreated.valence,
          eff.memoryCreated.strength
        );
      }

      if (eff.relationshipDelta) {
        ag.relationships.modifyRelationship(
          eff.relationshipDelta.targetId,
          eff.relationshipDelta.affinity,
          eff.relationshipDelta.familiarity,
          eff.relationshipDelta.fear,
          simTime
        );
      }

      // Check chained antic opportunities
      if (eff.chainedAnticOpportunity) {
        const nextType = eff.chainedAnticOpportunity.nextType;
        const chainedAntic = new Antic({
          type: nextType,
          participants: [...antic.participants],
          trigger: `Chained from ${antic.type} resolution`,
          startTime: simTime + eff.chainedAnticOpportunity.delaySeconds,
          duration: 6.0,
          phases: ['initiate_chain', 'execute_chain', 'resolve_chain'],
          salience: antic.salience * 1.1,
          significance: Math.min(1.0, antic.significance * 1.15),
          isManifest: antic.isManifest,
          location: antic.location,
          chainedFromAnticId: antic.id,
          causeEventId: antic.causeEventId,
        });

        if (nextType === 'REPRODUCTIVE_SPAWNING') {
          chainedAntic.stateEffects.push({
            agentId: antic.participants[0].agentId,
            energyDelta: -30.0,
            memoryCreated: { eventType: 'reproduction_event', valence: 1.0, strength: 1.0 },
          });
          if (antic.participants.length > 1) {
            chainedAntic.stateEffects.push({
              agentId: antic.participants[1].agentId,
              energyDelta: -30.0,
              memoryCreated: { eventType: 'reproduction_event', valence: 1.0, strength: 1.0 },
            });
          }
        }

        this.queuedChainedAntics.push(chainedAntic);
      }
    }

    // Environmental feedback: Feeding Frenzy & Scavenger Feast stir nutrients
    if (antic.type === 'FEEDING_FRENZY' || antic.type === 'SCAVENGER_FEAST') {
      fields.add(antic.location.x, antic.location.y, antic.location.z, 'nutrients', 0.2);
    }

    // If REPRODUCTIVE_SPAWNING completed, fire reproduction event
    if (antic.type === 'REPRODUCTIVE_SPAWNING' && antic.participants.length >= 2) {
      if (this.onReproduction) {
        this.onReproduction(antic.participants[0].agentId, antic.participants[1].agentId, antic.location);
      }
    }

    if (eventLedger) {
      eventLedger.recordEvent({
        eventType: 'ANTIC_COMPLETED',
        timestamp: simTime,
        participants: antic.participants.map((p) => p.agentId),
        location: antic.location,
        phase: 'ACTIVE',
        significance: antic.significance,
        description: `Antic [${antic.type}] completed: ${antic.trigger}`,
        cause: antic.chainedFromAnticId ? { eventId: antic.chainedFromAnticId, description: 'Chained succession' } : undefined,
      });
    }
  }
}

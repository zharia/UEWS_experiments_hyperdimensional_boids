/**
 * Autonomous Behaviour Selection Layer.
 *
 * Implements:
 *  - wander
 *  - school
 *  - follow
 *  - avoid
 *  - flee
 *  - feed
 *  - rest
 *  - investigate
 *  - approach
 *  - socialise
 *  - defend
 *  - explore
 *
 * Generates behaviour candidates based on:
 *  Drives + Perception + Memory + Relationships + Environment + Risk -> Scored Candidates -> Selected Behaviour.
 */

import { Vector3D } from '../../space/physical/Vector3D';
import { DriveSystem } from '../drives/DriveSystem';
import { MemorySystem } from '../memory/MemorySystem';
import { RelationshipSystem } from '../relationships/RelationshipSystem';
import { PerceivedAgent, PerceivedHazard, PerceivedResource } from '../perception/PerceptionSystem';

export type BehaviourType =
  | 'wander'
  | 'school'
  | 'follow'
  | 'avoid'
  | 'flee'
  | 'feed'
  | 'rest'
  | 'investigate'
  | 'approach'
  | 'socialise'
  | 'defend'
  | 'explore'
  | 'migrate'
  | 'mate';

export interface BehaviourCandidate {
  type: BehaviourType;
  score: number;
  urgency: number;
  targetPosition?: Vector3D;
  targetEntityId?: string;
  reason: string;
}

export interface ActiveBehaviour {
  type: BehaviourType;
  targetPosition?: Vector3D;
  targetEntityId?: string;
  desiredSpeedMultiplier: number;
  startTime: number;
  reason: string;
}

export class BehaviourSystem {
  public currentBehaviour: ActiveBehaviour = {
    type: 'wander',
    desiredSpeedMultiplier: 1.0,
    startTime: 0,
    reason: 'Initial default wander',
  };

  /**
   * Generates scored candidate behaviours based on internal motivations and external perceptions
   */
  public generateCandidates(
    agentId: string,
    selfPos: Vector3D,
    drives: DriveSystem,
    memory: MemorySystem,
    relationships: RelationshipSystem,
    perceivedAgents: PerceivedAgent[],
    perceivedResources: PerceivedResource[],
    perceivedHazards: PerceivedHazard[],
    simTime: number,
    migrationTarget?: { habitatId: string; position: Vector3D; suitabilityDelta: number },
    canReproduce: boolean = false
  ): BehaviourCandidate[] {
    const candidates: BehaviourCandidate[] = [];

    const hunger = drives.get('hunger');
    const fear = drives.get('fear');
    const curiosity = drives.get('curiosity');
    const rest = drives.get('rest');
    const exploration = drives.get('exploration');
    const socialisation = drives.get('socialisation');
    const territoriality = drives.get('territoriality');

    // 1. FLEE (survival imperative)
    if (perceivedHazards.length > 0 || fear > 0.45) {
      let threatLevel = fear;
      let escapeDir = new Vector3D(0, 0, 0);

      for (const h of perceivedHazards) {
        threatLevel = Math.max(threatLevel, h.threatLevel);
        const away = selfPos.clone().sub(h.position).normalize();
        escapeDir.add(away);
      }

      if (threatLevel > 0.3) {
        const escapeTarget = selfPos.clone().addScaled(escapeDir.normalize(), 8.0);
        candidates.push({
          type: 'flee',
          score: threatLevel * 2.5, // High priority override
          urgency: threatLevel,
          targetPosition: escapeTarget,
          reason: `Evading hazard/threat (threat level: ${threatLevel.toFixed(2)})`,
        });
      }
    }

    // 2. FEED (energy replenishment)
    const foodResources = perceivedResources.filter((r) => r.type === 'food' || r.type === 'biofilm' || r.type === 'detritus' || r.type === 'food_pellet');
    if (foodResources.length > 0 && hunger > 0.25) {
      // Find closest salient food item
      foodResources.sort((a, b) => (a.distance / a.salience) - (b.distance / b.salience));
      const targetFood = foodResources[0];
      candidates.push({
        type: 'feed',
        score: hunger * 1.8 + targetFood.salience * 0.6,
        urgency: hunger,
        targetPosition: targetFood.position,
        targetEntityId: targetFood.id,
        reason: `Targeting detected food (hunger: ${hunger.toFixed(2)})`,
      });
    } else if (hunger > 0.4) {
      // Memory-biased foraging: recall positive food site
      const foodMem = memory.getMostSalientMemory('food_discovered');
      if (foodMem && foodMem.strength > 0.2) {
        candidates.push({
          type: 'feed',
          score: hunger * 1.4 * foodMem.strength,
          urgency: hunger * 0.8,
          targetPosition: new Vector3D(foodMem.location.x, foodMem.location.y, foodMem.location.z),
          reason: `Navigating to remembered food discovery site (salience: ${foodMem.strength.toFixed(2)})`,
        });
      }
    }

    // 2.5 MATE / COURTSHIP (reproductive imperative)
    if (canReproduce) {
      const matureConspecifics = perceivedAgents.filter((a) => a.isConspecific);
      for (const partner of matureConspecifics) {
        const rel = relationships.getRelationship(partner.id);
        if (rel.affinity > 0.05 && rel.fear < 0.25) {
          candidates.push({
            type: 'mate',
            score: 1.6 + rel.affinity * 0.5,
            urgency: 0.75,
            targetPosition: partner.position,
            targetEntityId: partner.id,
            reason: `Initiating courtship approach with partner ${partner.id}`,
          });
          break;
        }
      }
    }

    // 2.8 MIGRATE (Habitat suitability differential)
    if (migrationTarget && migrationTarget.suitabilityDelta > 0.25) {
      candidates.push({
        type: 'migrate',
        score: exploration * 0.8 + migrationTarget.suitabilityDelta * 1.2,
        urgency: migrationTarget.suitabilityDelta * 0.7,
        targetPosition: migrationTarget.position,
        reason: `Migrating to higher-suitability habitat (${migrationTarget.habitatId})`,
      });
    }

    // 3. INVESTIGATE (curiosity)
    if (curiosity > 0.35) {
      // Check for unfamiliar agents or curious landmarks
      const unfamiliarAgents = perceivedAgents.filter((a) => {
        const rel = relationships.getRelationship(a.id);
        return rel.familiarity < 0.35 && rel.fear < 0.2;
      });

      if (unfamiliarAgents.length > 0) {
        const target = unfamiliarAgents[0];
        candidates.push({
          type: 'investigate',
          score: curiosity * 1.3 + (1.0 - target.distance / 8.0) * 0.4,
          urgency: curiosity * 0.7,
          targetPosition: target.position,
          targetEntityId: target.id,
          reason: `Investigating unfamiliar peer ${target.species}`,
        });
      } else {
        // Check recent memory for novel locations
        const salientMem = memory.getMostSalientMemory();
        if (salientMem && salientMem.valence > 0) {
          candidates.push({
            type: 'investigate',
            score: curiosity * 0.9,
            urgency: curiosity * 0.5,
            targetPosition: new Vector3D(salientMem.location.x, salientMem.location.y, salientMem.location.z),
            reason: `Re-visiting positive memory site (${salientMem.eventType})`,
          });
        }
      }
    }

    // 4. SCHOOL / SOCIALISE
    const conspecifics = perceivedAgents.filter((a) => a.isConspecific);
    if (conspecifics.length >= 2 && socialisation > 0.3) {
      candidates.push({
        type: 'school',
        score: socialisation * 1.2 + Math.min(1.0, conspecifics.length * 0.15),
        urgency: socialisation * 0.6,
        reason: `Cohesive schooling with ${conspecifics.length} conspecifics`,
      });
    } else if (conspecifics.length === 1 && socialisation > 0.4) {
      const peer = conspecifics[0];
      const rel = relationships.getRelationship(peer.id);
      if (rel.affinity >= -0.2) {
        candidates.push({
          type: 'socialise',
          score: socialisation * 1.1 + rel.affinity * 0.4,
          urgency: socialisation * 0.5,
          targetPosition: peer.position,
          targetEntityId: peer.id,
          reason: `Approaching bonded peer for interaction`,
        });
      }
    }

    // 5. REST (energy conservation / fatigue)
    if (rest > 0.5) {
      candidates.push({
        type: 'rest',
        score: rest * 1.4,
        urgency: rest,
        reason: `Fatigue threshold reached (rest drive: ${rest.toFixed(2)})`,
      });
    }

    // 6. DEFEND / TERRITORIALITY
    if (territoriality > 0.5) {
      const intruders = perceivedAgents.filter((a) => {
        const rel = relationships.getRelationship(a.id);
        return rel.dominance < 0.2 && rel.familiarity < 0.4 && a.distance < 3.0;
      });
      if (intruders.length > 0) {
        const intruder = intruders[0];
        candidates.push({
          type: 'defend',
          score: territoriality * 1.5,
          urgency: territoriality * 0.8,
          targetPosition: intruder.position,
          targetEntityId: intruder.id,
          reason: `Displaying defensive posturing against intruder`,
        });
      }
    }

    // 7. EXPLORE (environmental roaming)
    if (exploration > 0.3) {
      candidates.push({
        type: 'explore',
        score: exploration * 1.0,
        urgency: exploration * 0.4,
        reason: `Patrolling territory and checking habitat fringes`,
      });
    }

    // 8. BASELINE WANDER (always available default)
    candidates.push({
      type: 'wander',
      score: 0.35,
      urgency: 0.1,
      reason: 'Ambient baseline cruising',
    });

    return candidates.sort((a, b) => b.score - a.score);
  }

  /**
   * Selects highest scoring candidate with hysteresis (avoids thrashing every tick)
   */
  public selectBehaviour(
    candidates: BehaviourCandidate[],
    simTime: number,
    hysteresisThreshold: number = 0.25
  ): ActiveBehaviour {
    if (candidates.length === 0) {
      return this.currentBehaviour;
    }

    const best = candidates[0];

    // If current behaviour is still active and best isn't significantly better, persist
    const currentStillValid = candidates.find((c) => c.type === this.currentBehaviour.type);
    if (
      currentStillValid &&
      currentStillValid.type !== 'flee' &&
      best.type !== 'flee' &&
      best.score < currentStillValid.score + hysteresisThreshold &&
      simTime - this.currentBehaviour.startTime < 2.5
    ) {
      return this.currentBehaviour;
    }

    let speedMult = 1.0;
    switch (best.type) {
      case 'flee': speedMult = 1.9; break;
      case 'feed': speedMult = 1.3; break;
      case 'school': speedMult = 1.0; break;
      case 'investigate': speedMult = 0.65; break;
      case 'rest': speedMult = 0.2; break;
      case 'defend': speedMult = 0.8; break;
      case 'explore': speedMult = 1.1; break;
      case 'migrate': speedMult = 1.25; break;
      case 'mate': speedMult = 0.75; break;
      case 'wander': default: speedMult = 0.9; break;
    }

    this.currentBehaviour = {
      type: best.type,
      targetPosition: best.targetPosition,
      targetEntityId: best.targetEntityId,
      desiredSpeedMultiplier: speedMult,
      startTime: simTime,
      reason: best.reason,
    };

    return this.currentBehaviour;
  }
}

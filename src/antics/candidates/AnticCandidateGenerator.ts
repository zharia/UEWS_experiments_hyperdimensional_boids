/**
 * Antic Candidate Generator.
 *
 * Evaluates world state, agent motivations, and environmental triggers
 * to produce candidate episodic antics for selection by the AnticScheduler.
 */

import { Vector3D } from '../../space/physical/Vector3D';
import { EcologicalAgent } from '../../agents/agent/EcologicalAgent';
import { EcologicalResource } from '../../ecology/resources/ResourceSystem';
import { Antic, AnticType, AnticParticipant } from '../antic/Antic';

export interface AnticCandidate {
  antic: Antic;
  baseScore: number;
  urgency: number;
  initiatorId: string;
}

export class AnticCandidateGenerator {
  public generateCandidates(
    agents: EcologicalAgent[],
    resources: EcologicalResource[],
    simTime: number,
    isNightTime: boolean = false
  ): AnticCandidate[] {
    const candidates: AnticCandidate[] = [];

    // Filter agents currently free of active antics
    const availableAgents = agents.filter((a) => !a.currentAnticId);

    // 1. THE_INVESTIGATION Candidates
    for (const agent of availableAgents) {
      const curiosity = agent.drives.get('curiosity');
      if (curiosity > 0.45 && agent.drives.get('fear') < 0.3) {
        // Look for another stationary or resting agent or resource
        const targetAgent = availableAgents.find(
          (other) => other.id !== agent.id && agent.position.distanceTo(other.position) < 7.0
        );

        if (targetAgent) {
          const rel = agent.relationships.getRelationship(targetAgent.id);
          if (rel.familiarity < 0.4) {
            const antic = new Antic({
              type: 'THE_INVESTIGATION',
              participants: [
                { agentId: agent.id, role: 'initiator' },
                { agentId: targetAgent.id, role: 'target' },
              ],
              trigger: `Unfamiliar entity ${targetAgent.species} encountered in perceptual range`,
              startTime: simTime,
              duration: 5.5,
              phases: ['notice', 'approach', 'inspect', 'circle', 'depart'],
              salience: 0.55 + curiosity * 0.3,
              location: targetAgent.position,
            });

            antic.stateEffects.push({
              agentId: agent.id,
              driveModifications: { curiosity: -0.4 },
              memoryCreated: { eventType: 'investigated_peer', valence: 0.4, strength: 0.8 },
              relationshipDelta: { targetId: targetAgent.id, affinity: 0.1, familiarity: 0.25, fear: 0 },
            });

            candidates.push({
              antic,
              baseScore: curiosity * 1.5,
              urgency: curiosity * 0.6,
              initiatorId: agent.id,
            });
          }
        }
      }
    }

    // 2. FEEDING_FRENZY Candidates
    const foodPellets = resources.filter((r) => r.type === 'food_pellet' && r.quantity > 0.1);
    for (const food of foodPellets) {
      const hungryNear = availableAgents.filter(
        (a) => a.position.distanceTo(food.position) < 8.0 && a.drives.get('hunger') > 0.35
      );

      if (hungryNear.length >= 2) {
        const participants: AnticParticipant[] = hungryNear.slice(0, 4).map((a, idx) => ({
          agentId: a.id,
          role: idx === 0 ? 'initiator' : 'competitor',
        }));

        const avgHunger = hungryNear.reduce((sum, a) => sum + a.drives.get('hunger'), 0) / hungryNear.length;

        const antic = new Antic({
          type: 'FEEDING_FRENZY',
          participants,
          trigger: `High-nutrient food pellet detected with ${hungryNear.length} competing foragers`,
          startTime: simTime,
          duration: 4.8,
          phases: ['converge', 'jostle', 'consume', 'disperse'],
          salience: 0.75 + avgHunger * 0.2,
          location: food.position,
        });

        for (const p of participants) {
          antic.stateEffects.push({
            agentId: p.agentId,
            driveModifications: { hunger: -0.6 },
            energyDelta: 25.0,
            memoryCreated: { eventType: 'feeding_event', valence: 0.9, strength: 1.0 },
          });
        }

        candidates.push({
          antic,
          baseScore: avgHunger * 2.0 + 0.3,
          urgency: avgHunger * 1.8,
          initiatorId: hungryNear[0].id,
        });
      }
    }

    // 3. TERRITORIAL_STANDOFF Candidates
    for (let i = 0; i < availableAgents.length; i++) {
      const a1 = availableAgents[i];
      const t1 = a1.drives.get('territoriality');
      if (t1 < 0.5) continue;

      for (let j = i + 1; j < availableAgents.length; j++) {
        const a2 = availableAgents[j];
        const t2 = a2.drives.get('territoriality');
        if (t2 < 0.4) continue;

        const dist = a1.position.distanceTo(a2.position);
        if (dist < 3.5) {
          const antic = new Antic({
            type: 'TERRITORIAL_STANDOFF',
            participants: [
              { agentId: a1.id, role: 'initiator' },
              { agentId: a2.id, role: 'target' },
            ],
            trigger: `Territorial overlap between ${a1.species} and ${a2.species}`,
            startTime: simTime,
            duration: 6.0,
            phases: ['approach', 'display_threat', 'lateral_feint', 'resolution'],
            salience: 0.7,
            location: a1.position.clone().add(a2.position).multiplyScalar(0.5),
          });

          antic.stateEffects.push({
            agentId: a1.id,
            driveModifications: { territoriality: -0.3, fear: 0.1 },
            relationshipDelta: { targetId: a2.id, affinity: -0.2, familiarity: 0.3, fear: 0.1 },
          });
          antic.stateEffects.push({
            agentId: a2.id,
            driveModifications: { territoriality: -0.3, fear: 0.1 },
            relationshipDelta: { targetId: a1.id, affinity: -0.2, familiarity: 0.3, fear: 0.1 },
          });

          candidates.push({
            antic,
            baseScore: (t1 + t2) * 1.1,
            urgency: Math.max(t1, t2),
            initiatorId: a1.id,
          });
        }
      }
    }

    // 4. COOPERATIVE_SCHOOLING Candidates
    const schoolingCandidates = availableAgents.filter(
      (a) => a.drives.get('socialisation') > 0.4 && a.drives.get('fear') < 0.3
    );
    if (schoolingCandidates.length >= 3) {
      const participants: AnticParticipant[] = schoolingCandidates.slice(0, 6).map((a, idx) => ({
        agentId: a.id,
        role: idx === 0 ? 'initiator' : 'partner',
      }));

      const antic = new Antic({
        type: 'COOPERATIVE_SCHOOLING',
        participants,
        trigger: 'Conspecific polarization and social affinity sync',
        startTime: simTime,
        duration: 8.0,
        phases: ['cohesion_gather', 'polarized_cruise', 'synced_turn', 'disperse'],
        salience: 0.6,
        location: schoolingCandidates[0].position,
      });

      for (const p of participants) {
        antic.stateEffects.push({
          agentId: p.agentId,
          driveModifications: { socialisation: -0.4 },
        });
      }

      candidates.push({
        antic,
        baseScore: 1.2,
        urgency: 0.5,
        initiatorId: schoolingCandidates[0].id,
      });
    }

    // 5. RESTING_PERCH Candidates
    for (const agent of availableAgents) {
      const rest = agent.drives.get('rest');
      if (rest > 0.65 && agent.position.y < -3.0) {
        const antic = new Antic({
          type: 'RESTING_PERCH',
          participants: [{ agentId: agent.id, role: 'initiator' }],
          trigger: `Fatigue threshold (${rest.toFixed(2)}) reached near benthic zone`,
          startTime: simTime,
          duration: 7.0,
          phases: ['descend', 'benthic_touchdown', 'quiescent_rest', 'ascend'],
          salience: 0.4,
          location: agent.position,
        });

        antic.stateEffects.push({
          agentId: agent.id,
          driveModifications: { rest: -0.7 },
          energyDelta: 15.0,
        });

        candidates.push({
          antic,
          baseScore: rest * 1.3,
          urgency: rest,
          initiatorId: agent.id,
        });
      }
    }

    // 6. BIOLUMINESCENT_BLOOM Candidates (especially at night)
    if (isNightTime && availableAgents.length >= 2) {
      const antic = new Antic({
        type: 'BIOLUMINESCENT_BLOOM',
        participants: availableAgents.slice(0, 5).map((a) => ({ agentId: a.id, role: 'partner' })),
        trigger: 'Nocturnal photoperiod triggering synchronized bioluminescent flashes',
        startTime: simTime,
        duration: 6.5,
        phases: ['initial_glow', 'kuramoto_entrainment', 'bloom_pulse', 'decay_glow'],
        salience: 0.85,
        significance: 0.7,
        location: new Vector3D(0, 0, 0),
      });

      candidates.push({
        antic,
        baseScore: 1.4,
        urgency: 0.7,
        initiatorId: availableAgents[0].id,
      });
    }

    // 7. COURTSHIP_DISPLAY & REPRODUCTIVE_SPAWNING Candidates
    for (let i = 0; i < availableAgents.length; i++) {
      const a1 = availableAgents[i];
      if (!a1.canReproduce(simTime)) continue;

      for (let j = i + 1; j < availableAgents.length; j++) {
        const a2 = availableAgents[j];
        if (a2.species !== a1.species) continue;
        if (!a2.canReproduce(simTime)) continue;

        const dist = a1.position.distanceTo(a2.position);
        if (dist < 6.0) {
          const rel = a1.relationships.getRelationship(a2.id);
          const sp = a1.speciesTraits;
          if (rel.affinity >= sp.traits.reproduction.minPartnerAffinity) {
            const antic = new Antic({
              type: 'COURTSHIP_DISPLAY',
              participants: [
                { agentId: a1.id, role: 'initiator' },
                { agentId: a2.id, role: 'partner' },
              ],
              trigger: `Mutual courtship affinity between mature ${a1.species} peers`,
              startTime: simTime,
              duration: 7.5,
              phases: ['approach', 'parallel_glide', 'nuptial_dance', 'synchrony', 'commitment'],
              salience: 0.88,
              significance: 0.85,
              location: a1.position.clone().add(a2.position).multiplyScalar(0.5),
            });

            // Courtship strengthens bonds and chains into spawning!
            antic.stateEffects.push({
              agentId: a1.id,
              relationshipDelta: { targetId: a2.id, affinity: 0.35, familiarity: 0.5, fear: 0 },
              memoryCreated: { eventType: 'courtship_success', valence: 0.9, strength: 1.0 },
              chainedAnticOpportunity: { nextType: 'REPRODUCTIVE_SPAWNING', delaySeconds: 0.5 },
            });
            antic.stateEffects.push({
              agentId: a2.id,
              relationshipDelta: { targetId: a1.id, affinity: 0.35, familiarity: 0.5, fear: 0 },
              memoryCreated: { eventType: 'courtship_success', valence: 0.9, strength: 1.0 },
            });

            candidates.push({
              antic,
              baseScore: 1.8 + rel.affinity * 0.8,
              urgency: 0.85,
              initiatorId: a1.id,
            });
            break;
          }
        }
      }
    }

    // 8. SCAVENGER_FEAST Candidates (hermit crabs, snails on detritus)
    const detritusList = resources.filter((r) => r.type === 'detritus' && r.quantity > 0.1);
    for (const det of detritusList) {
      const scavengers = availableAgents.filter((a) => {
        const foodTypes = a.speciesTraits.traits.resourceRequirements.preferredFoodTypes;
        return foodTypes.includes('detritus') && a.position.distanceTo(det.position) < 8.0;
      });

      if (scavengers.length > 0) {
        const leadScavenger = scavengers[0];
        const antic = new Antic({
          type: 'SCAVENGER_FEAST',
          participants: scavengers.slice(0, 3).map((a, idx) => ({
            agentId: a.id,
            role: idx === 0 ? 'initiator' : 'competitor',
          })),
          trigger: `Organic detritus biomass discovered on substrate floor`,
          startTime: simTime,
          duration: 6.0,
          phases: ['converge', 'graze', 'process_sediment', 'satiate'],
          salience: 0.65,
          significance: 0.6,
          location: det.position,
        });

        for (const s of scavengers.slice(0, 3)) {
          antic.stateEffects.push({
            agentId: s.id,
            driveModifications: { hunger: -0.5 },
            energyDelta: 20.0,
            memoryCreated: { eventType: 'detritus_scavenged', valence: 0.7, strength: 0.8 },
          });
        }

        candidates.push({
          antic,
          baseScore: 1.5,
          urgency: 0.8,
          initiatorId: leadScavenger.id,
        });
      }
    }

    // 9. HABITAT_MIGRATION Candidates
    for (const agent of availableAgents) {
      if (agent.behaviour.currentBehaviour.type === 'migrate' && agent.behaviour.currentBehaviour.targetPosition) {
        const antic = new Antic({
          type: 'HABITAT_MIGRATION',
          participants: [{ agentId: agent.id, role: 'initiator' }],
          trigger: `Agent initiated migration toward favorable ecological niche`,
          startTime: simTime,
          duration: 7.0,
          phases: ['depart', 'transit_corridor', 'arrive_boundary', 'settle'],
          salience: 0.6,
          significance: 0.65,
          location: agent.position,
        });

        antic.stateEffects.push({
          agentId: agent.id,
          driveModifications: { exploration: -0.4 },
          memoryCreated: { eventType: 'niche_settled', valence: 0.6, strength: 0.7 },
        });

        candidates.push({
          antic,
          baseScore: 1.3,
          urgency: 0.6,
          initiatorId: agent.id,
        });
      }
    }

    return candidates;
  }
}

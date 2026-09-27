/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SeededRandom } from '../../core/random/SeededRandom';
import { Vector3D } from '../../space/physical/Vector3D';
import { ContinuousAcousticState, AcousticEvent, AcousticSourceType } from './AcousticState';
import { AcousticField } from './AcousticField';
import { EcologicalEventLedger, EcologicalEvent } from '../../history/EcologicalEventLedger';
import { EnvironmentalWorldManager } from '../environment/EnvironmentalWorldManager';
import { PopulationManager } from '../../population/PopulationManager';
import { HabitatManager } from '../habitats/HabitatManager';
import { Antic } from '../../antics/antic/Antic';

export interface AcousticDerivationOptions {
  seed?: number;
  maxRecentEvents?: number;
}

/**
 * Authoritative Acoustic Derivation Engine.
 *
 * Implements the causal chain:
 *   Authoritative World (Ecology + Environment + History)
 *     -> Acoustic Derivation
 *       -> Continuous Acoustic State & Discrete Acoustic Events
 *
 * Strict Principles:
 *  - Audio is a derived manifestation, never mutating the simulation.
 *  - Discrete sounds correspond to verified ecological events / antic consequences.
 *  - Repetition suppression prevents mechanical or annoying loops.
 *  - Every acoustic event maintains a causal trace back to the authoritative ledger.
 */
export class AcousticDerivation {
  public field: AcousticField;
  public random: SeededRandom;
  private maxRecentEvents: number;

  private recentEvents: AcousticEvent[] = [];
  private lastProcessedEventTimestamp: number = 0;

  // Repetition suppression cooldown trackers (simulation time in seconds)
  private lastEventTimeBySource: Map<AcousticSourceType, number> = new Map();
  private eventCooldowns: Record<AcousticSourceType, number> = {
    environmental_bed: 0.0,
    water_current: 0.0,
    water_turbulence: 0.0,
    bubble_stream: 0.18,
    biological_texture: 0.12,
    feeding_strike: 0.35,
    substrate_settling: 0.40,
    substrate_disturbance: 0.50,
    vegetation_rustle: 0.45,
    organism_collision: 0.30,
    antic_manifestation: 0.80,
    water_ripple: 0.25,
    glass_interaction: 0.20,
  };

  constructor(field: AcousticField, options?: AcousticDerivationOptions) {
    this.field = field;
    this.random = new SeededRandom(options?.seed ?? 1004);
    this.maxRecentEvents = options?.maxRecentEvents ?? 40;
  }

  /**
   * Derives target continuous acoustic state and discrete candidate events from authoritative world state.
   */
  public update(
    dt: number,
    simTime: number,
    environment: EnvironmentalWorldManager,
    populations: PopulationManager,
    habitats: HabitatManager,
    eventLedger: EcologicalEventLedger,
    activeAntics: Antic[] = [],
    circadianPhase: number = 0.25
  ): AcousticEvent[] {
    const newAcousticEvents: AcousticEvent[] = [];

    // =========================================================================
    // 1. CONTINUOUS ACOUSTIC DERIVATION
    // =========================================================================
    const water = environment.water;
    const substrate = environment.substrate;
    const vegetation = environment.vegetation;

    // Water flow magnitude & turbulence
    const flowSpeed = Math.sqrt(
      water.flow.x * water.flow.x +
      water.flow.y * water.flow.y +
      water.flow.z * water.flow.z
    );

    const currentActivity = Math.min(1.0, flowSpeed * 1.8);
    const turbulenceActivity = Math.min(1.0, water.turbulence);
    const waterActivity = Math.min(1.0, currentActivity * 0.6 + turbulenceActivity * 0.4);

    // Biological activity derived from total biomass and population metrics
    const allPops = populations.getAllPopulations();
    const totalCount = allPops.reduce((sum, p) => sum + p.count, 0);
    const totalBiomass = totalCount * 1.5;

    const normalizedCount = Math.min(1.0, totalCount / 20.0);
    const normalizedBiomass = Math.min(1.0, totalBiomass / 35.0);
    const biologicalActivity = Math.min(1.0, normalizedCount * 0.4 + normalizedBiomass * 0.6);

    // Substrate activity
    const substrateActivity = Math.min(1.0, substrate.disturbance * 0.7 + substrate.sediment * 0.3);

    // Vegetation canopy activity
    const vegetationActivity = Math.min(1.0, vegetation.density * 0.5 + vegetation.movement_response * 0.5);

    // Environmental disturbance
    const disturbance = Math.min(1.0, environment.disturbance);

    // Diurnal factor (0=dawn, 0.25=noon/peak day, 0.5=sunset, 0.75=night)
    // Night exhibits lower high-frequency surface activity and richer low-end benthic resonance
    const isNight = circadianPhase > 0.65 && circadianPhase < 0.95;
    const diurnalFactor = isNight ? 0.25 : 0.85;

    // Spectral character (turbid water damps high frequencies; clear water sparkles)
    const spectralCharacter = Math.max(0.1, Math.min(0.9, water.clarity * 0.7 + (1.0 - substrate.sediment) * 0.3));

    // Base ambient bed level (always gently present; established physical presence of tank)
    const ambientLevel = Math.max(0.18, Math.min(0.45, 0.22 + waterActivity * 0.15 + biologicalActivity * 0.08));

    // Set targets on acoustic field
    this.field.setTargetState({
      ambient_level: ambientLevel,
      water_activity: waterActivity,
      current_activity: currentActivity,
      turbulence: turbulenceActivity,
      biological_activity: biologicalActivity,
      substrate_activity: substrateActivity,
      vegetation_activity: vegetationActivity,
      disturbance,
      spectral_character: spectralCharacter,
      diurnal_factor: diurnalFactor,
    });

    // Advance hysteresis with inertia
    this.field.updateHysteresis(dt);

    // =========================================================================
    // 2. DISCRETE ACOUSTIC EVENT DERIVATION
    // =========================================================================
    // Process new ecological events recorded in the ledger since last tick
    const unreadEvents = eventLedger.getEventsSince(this.lastProcessedEventTimestamp);
    for (const evt of unreadEvents) {
      if (evt.timestamp <= this.lastProcessedEventTimestamp) continue;

      const derivedAcousticEvent = this.deriveAcousticEventFromEcologicalEvent(evt, simTime);
      if (derivedAcousticEvent) {
        newAcousticEvents.push(derivedAcousticEvent);
      }
    }

    if (unreadEvents.length > 0) {
      this.lastProcessedEventTimestamp = Math.max(
        this.lastProcessedEventTimestamp,
        ...unreadEvents.map((e) => e.timestamp)
      );
    }

    // Process active antics for continuous/episodic manifestations (Section 16)
    for (const antic of activeAntics) {
      const anticEvent = this.deriveAcousticEventFromAntic(antic, simTime);
      if (anticEvent) {
        newAcousticEvents.push(anticEvent);
      }
    }

    // Add generated events to history buffer
    for (const e of newAcousticEvents) {
      this.recentEvents.push(e);
      this.lastEventTimeBySource.set(e.source, simTime);
    }

    if (this.recentEvents.length > this.maxRecentEvents) {
      this.recentEvents.splice(0, this.recentEvents.length - this.maxRecentEvents);
    }

    return newAcousticEvents;
  }

  /**
   * Maps an authoritative EcologicalEvent from the ledger to an AcousticEvent candidate,
   * applying causality checks, repetition suppression, and deterministic variation.
   */
  private deriveAcousticEventFromEcologicalEvent(
    evt: EcologicalEvent,
    simTime: number
  ): AcousticEvent | null {
    let source: AcousticSourceType | null = null;
    let baseIntensity = 0.5;
    let duration = 0.25;
    let spectral = 0.5;

    switch (evt.eventType) {
      case 'FEEDING':
        source = 'feeding_strike';
        baseIntensity = 0.35 + evt.significance * 0.3;
        duration = 0.08;
        spectral = 0.65;
        break;

      case 'PERTURBATION':
        source = 'substrate_disturbance';
        baseIntensity = 0.55 + evt.significance * 0.4;
        duration = 0.45;
        spectral = 0.25; // deep dull thud
        break;

      case 'RESOURCE_REGENERATION':
        source = 'water_ripple';
        baseIntensity = 0.35;
        duration = 0.22;
        spectral = 0.75;
        break;

      case 'DEATH':
        source = 'substrate_settling';
        baseIntensity = 0.25;
        duration = 0.50;
        spectral = 0.20;
        break;

      case 'COURTSHIP':
      case 'REPRODUCTION':
        source = 'antic_manifestation';
        baseIntensity = 0.45;
        duration = 0.35;
        spectral = 0.60;
        break;

      default:
        return null;
    }

    // Repetition suppression check
    const lastTime = this.lastEventTimeBySource.get(source) ?? -999;
    const cooldown = this.eventCooldowns[source] ?? 0.2;
    if (simTime - lastTime < cooldown) {
      return null; // Suppressed: recurring too fast
    }

    this.lastEventTimeBySource.set(source, simTime);

    // Deterministic parametric variation (Section 18 & 31)
    const varSeed = this.random.next();
    const intensity = Math.max(0.1, Math.min(1.0, baseIntensity * (0.85 + varSeed * 0.3)));
    const finalDuration = duration * (0.9 + this.random.next() * 0.2);
    const finalSpectral = Math.max(0.05, Math.min(0.95, spectral + (this.random.next() - 0.5) * 0.15));

    return {
      id: `ac_evt_${evt.id}`,
      simulationTime: simTime,
      source,
      location: evt.location || { x: 0, y: 0, z: 0 },
      intensity,
      duration: finalDuration,
      spectral_character: finalSpectral,
      significance: evt.significance,
      ecological_context: {
        habitatId: evt.habitatId,
        species: evt.participants[0],
        phase: evt.phase,
      },
      cause: {
        eventId: evt.id,
        description: evt.description,
      },
    };
  }

  /**
   * Derives an acoustic manifestation from an active Antic if and only if
   * it carries physical/ecological consequence (Section 16).
   */
  private deriveAcousticEventFromAntic(antic: Antic, simTime: number): AcousticEvent | null {
    // Only antics in their active phase with high salience generate discrete manifestations
    if (antic.status !== 'active') return null;
    if (antic.salience < 0.4) return null;

    let source: AcousticSourceType = 'antic_manifestation';
    let baseIntensity = 0.35 * antic.salience;
    let duration = 0.3;
    let spectral = 0.5;

    // Check specific antic manifestations
    const typeStr = antic.type.toLowerCase();
    if (typeStr.includes('courtship') || typeStr.includes('mating')) {
      source = 'antic_manifestation';
      baseIntensity = 0.4;
      duration = 0.45;
      spectral = 0.55;
    } else if (typeStr.includes('forage') || typeStr.includes('substrate') || typeStr.includes('investigate')) {
      source = 'substrate_disturbance';
      baseIntensity = 0.38;
      duration = 0.32;
      spectral = 0.35;
    } else if (typeStr.includes('territory') || typeStr.includes('chase') || typeStr.includes('threat')) {
      source = 'organism_collision';
      baseIntensity = 0.48;
      duration = 0.18;
      spectral = 0.70;
    } else {
      return null;
    }

    const lastTime = this.lastEventTimeBySource.get(source) ?? -999;
    const cooldown = this.eventCooldowns[source] ?? 0.5;
    if (simTime - lastTime < cooldown) {
      return null;
    }

    const loc = antic.location || { x: 0, y: 0, z: 0 };
    return {
      id: `ac_antic_${antic.id}_${Math.floor(simTime * 10)}`,
      simulationTime: simTime,
      source,
      location: loc,
      intensity: baseIntensity,
      duration,
      spectral_character: spectral,
      significance: antic.salience,
      ecological_context: {
        species: antic.participants[0]?.agentId,
      },
      cause: {
        anticId: antic.id,
        description: `Antic [${antic.type}] executed with physical consequence at (${loc.x.toFixed(1)}, ${loc.y.toFixed(1)}, ${loc.z.toFixed(1)})`,
      },
    };
  }

  public getRecentEvents(): AcousticEvent[] {
    return [...this.recentEvents];
  }

  public clearRecentEvents() {
    this.recentEvents = [];
  }
}

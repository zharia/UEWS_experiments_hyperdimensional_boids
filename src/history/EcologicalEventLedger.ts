/**
 * Ecological Event Ledger & Historical Causality Engine.
 *
 * Provides an authoritative, queryable ledger of significant ecological events
 * with explicit causal references allowing the simulation history to explain itself.
 */

import { Vector3D, IVector3D } from '../space/physical/Vector3D';

export type EcologicalEventType =
  | 'BIRTH'
  | 'DEATH'
  | 'LIFECYCLE_TRANSITION'
  | 'FEEDING'
  | 'RESOURCE_DEPLETION'
  | 'RESOURCE_REGENERATION'
  | 'MIGRATION'
  | 'HABITAT_DISCOVERY'
  | 'COURTSHIP'
  | 'REPRODUCTION'
  | 'ANTIC_MANIFESTED'
  | 'ANTIC_COMPLETED'
  | 'PHASE_CHANGED'
  | 'ENVIRONMENTAL_SHIFT'
  | 'PERTURBATION';

export interface EventCause {
  eventId?: string; // Optional direct reference to predecessor event
  description: string;
  rule?: string;
}

export interface EcologicalEvent {
  id: string;
  timestamp: number;
  eventType: EcologicalEventType;
  participants: string[];
  location: { x: number; y: number; z: number };
  habitatId?: string;
  phase: string;
  cause?: EventCause;
  effects: Record<string, any>;
  significance: number; // 0 to 1
  description: string;
}

export interface IEventLedgerJSON {
  events: EcologicalEvent[];
  maxEvents: number;
}

export class EcologicalEventLedger {
  private _events: EcologicalEvent[] = [];
  public maxEvents: number;

  constructor(maxEvents: number = 300) {
    this.maxEvents = maxEvents;
  }

  public recordEvent(config: {
    eventType: EcologicalEventType;
    timestamp: number;
    participants?: string[];
    location?: IVector3D;
    habitatId?: string;
    phase: string;
    cause?: EventCause;
    effects?: Record<string, any>;
    significance?: number;
    description: string;
    id?: string;
  }): EcologicalEvent {
    const event: EcologicalEvent = {
      id: config.id || `evt_${Math.random().toString(36).substring(2, 9)}_${Math.floor(config.timestamp)}`,
      timestamp: config.timestamp,
      eventType: config.eventType,
      participants: config.participants || [],
      location: config.location ? { x: config.location.x, y: config.location.y, z: config.location.z } : { x: 0, y: 0, z: 0 },
      habitatId: config.habitatId,
      phase: config.phase,
      cause: config.cause,
      effects: config.effects || {},
      significance: Math.min(1.0, Math.max(0.0, config.significance ?? 0.5)),
      description: config.description,
    };

    this._events.push(event);

    if (this._events.length > this.maxEvents) {
      this._events.splice(0, this._events.length - this.maxEvents);
    }

    return event;
  }

  public getEventsSince(timestamp: number): EcologicalEvent[] {
    return this._events.filter((e) => e.timestamp >= timestamp);
  }

  public getRecentSignificantEvents(limit: number = 10, minSignificance: number = 0.6): EcologicalEvent[] {
    return this._events
      .filter((e) => e.significance >= minSignificance)
      .slice(-limit)
      .reverse();
  }

  public getEventsInvolvingAgent(agentId: string, limit: number = 20): EcologicalEvent[] {
    return this._events
      .filter((e) => e.participants.includes(agentId))
      .slice(-limit)
      .reverse();
  }

  public getEventsInHabitat(habitatId: string, limit: number = 20): EcologicalEvent[] {
    return this._events
      .filter((e) => e.habitatId === habitatId)
      .slice(-limit)
      .reverse();
  }

  public getEventsDuringPhase(phase: string): EcologicalEvent[] {
    return this._events.filter((e) => e.phase === phase);
  }

  public getEventById(id: string): EcologicalEvent | undefined {
    return this._events.find((e) => e.id === id);
  }

  /**
   * Traces causal chain backwards from an event to explain historical causality
   */
  public traceCausalChain(eventId: string, maxDepth: number = 8): EcologicalEvent[] {
    const chain: EcologicalEvent[] = [];
    let currentId: string | undefined = eventId;
    let depth = 0;

    while (currentId && depth < maxDepth) {
      const evt = this.getEventById(currentId);
      if (!evt) break;
      chain.push(evt);
      currentId = evt.cause?.eventId;
      depth++;
    }

    return chain;
  }

  public getAllEvents(): EcologicalEvent[] {
    return [...this._events];
  }

  public clear(): void {
    this._events = [];
  }

  public toJSON(): IEventLedgerJSON {
    return {
      events: [...this._events],
      maxEvents: this.maxEvents,
    };
  }

  public fromJSON(json: IEventLedgerJSON): void {
    if (json && Array.isArray(json.events)) {
      this._events = [...json.events];
      this.maxEvents = json.maxEvents || 300;
    }
  }
}

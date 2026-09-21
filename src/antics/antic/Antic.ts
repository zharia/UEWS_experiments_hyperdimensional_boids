/**
 * Episodic Antic Core Definition.
 *
 * An Antic is a bounded, potentially observable episode arising from agent motivations
 * and world state. It has participants, preconditions, a trigger, duration, internal
 * phases, behavioural actions, spatial extent, state effects, and salience.
 */

import { Vector3D } from '../../space/physical/Vector3D';

export type AnticType =
  | 'THE_INVESTIGATION'
  | 'FEEDING_FRENZY'
  | 'TERRITORIAL_STANDOFF'
  | 'COOPERATIVE_SCHOOLING'
  | 'PREDATOR_EVASION'
  | 'COURTSHIP_DISPLAY'
  | 'SUBSTRATE_GRAZING'
  | 'RESTING_PERCH'
  | 'BIOLUMINESCENT_BLOOM';

export type AnticStatus = 'pending' | 'active' | 'completed' | 'interrupted';

export interface AnticParticipant {
  agentId: string;
  role: 'initiator' | 'target' | 'competitor' | 'partner' | 'observer';
}

export interface AnticStateEffect {
  agentId: string;
  driveModifications?: Record<string, number>;
  energyDelta?: number;
  memoryCreated?: {
    eventType: string;
    valence: number;
    strength: number;
  };
  relationshipDelta?: {
    targetId: string;
    affinity: number;
    familiarity: number;
    fear: number;
  };
}

export interface IAnticJSON {
  id: string;
  type: AnticType;
  participants: AnticParticipant[];
  trigger: string;
  startTime: number;
  duration: number;
  currentPhaseIndex: number;
  phases: string[];
  status: AnticStatus;
  salience: number;
  isManifest: boolean;
  location: { x: number; y: number; z: number };
}

export class Antic {
  public readonly id: string;
  public readonly type: AnticType;
  public participants: AnticParticipant[];
  public trigger: string;
  public startTime: number;
  public duration: number; // total expected duration in seconds
  public currentPhaseIndex: number = 0;
  public phases: string[];
  public status: AnticStatus = 'pending';
  public salience: number = 0.5; // 0 (ambient background) to 1 (prominent spectacle)
  public isManifest: boolean = false; // true if promoted to visible observer manifestation
  public location: Vector3D;
  public stateEffects: AnticStateEffect[] = [];

  constructor(config: {
    id?: string;
    type: AnticType;
    participants: AnticParticipant[];
    trigger: string;
    startTime: number;
    duration: number;
    phases: string[];
    salience?: number;
    isManifest?: boolean;
    location: Vector3D;
  }) {
    this.id = config.id || 'antic_' + Math.random().toString(36).substring(2, 9);
    this.type = config.type;
    this.participants = config.participants;
    this.trigger = config.trigger;
    this.startTime = config.startTime;
    this.duration = config.duration;
    this.phases = config.phases;
    this.salience = config.salience ?? 0.5;
    this.isManifest = config.isManifest ?? false;
    this.location = config.location.clone();
  }

  public get currentPhase(): string {
    return this.phases[this.currentPhaseIndex] || 'completed';
  }

  public get progress(): number {
    return this.phases.length > 0 ? (this.currentPhaseIndex / this.phases.length) : 1.0;
  }

  /**
   * Advances antic through its internal phases based on elapsed simulation time
   */
  public advance(simTime: number): void {
    if (this.status !== 'active') return;

    const elapsed = simTime - this.startTime;
    const phaseDuration = this.duration / Math.max(1, this.phases.length);
    const expectedIndex = Math.min(
      this.phases.length - 1,
      Math.floor(elapsed / Math.max(0.1, phaseDuration))
    );

    this.currentPhaseIndex = expectedIndex;

    if (elapsed >= this.duration) {
      this.status = 'completed';
    }
  }

  public interrupt(reason: string): void {
    this.status = 'interrupted';
    this.trigger += ` (Interrupted: ${reason})`;
  }

  public toJSON(): IAnticJSON {
    return {
      id: this.id,
      type: this.type,
      participants: [...this.participants],
      trigger: this.trigger,
      startTime: this.startTime,
      duration: this.duration,
      currentPhaseIndex: this.currentPhaseIndex,
      phases: [...this.phases],
      status: this.status,
      salience: this.salience,
      isManifest: this.isManifest,
      location: this.location.toJSON(),
    };
  }

  public static fromJSON(json: IAnticJSON): Antic {
    const a = new Antic({
      id: json.id,
      type: json.type,
      participants: json.participants,
      trigger: json.trigger,
      startTime: json.startTime,
      duration: json.duration,
      phases: json.phases,
      salience: json.salience,
      isManifest: json.isManifest,
      location: Vector3D.fromJSON(json.location),
    });
    a.currentPhaseIndex = json.currentPhaseIndex;
    a.status = json.status;
    return a;
  }
}

/**
 * Lightweight Agent Episodic Memory.
 *
 * Records episodic events (e.g. food found, predator evasion, friendly conspecific encounter)
 * with location, timestamp, valence (-1 to +1), strength (0 to 1), and decays over time.
 */

import { IVector3D, Vector3D } from '../../space/physical/Vector3D';

export interface MemoryRecord {
  id: string;
  eventType: string; // e.g. 'food_discovered', 'predator_evasion', 'social_encounter', 'hazard', 'shelter_found'
  entityId?: string;
  location: IVector3D;
  timestamp: number;
  valence: number;   // -1.0 (strongly negative / traumatic) to +1.0 (strongly positive / rewarding)
  strength: number;  // 0.0 to 1.0 (fades with decay, refreshed on reinforcement)
  details?: Record<string, any>;
}

export interface IMemoryJSON {
  memories: MemoryRecord[];
}

export class MemorySystem {
  private _memories: MemoryRecord[] = [];
  public maxMemories: number = 24;
  public decayHalfLifeSeconds: number = 120.0; // Decay rate

  constructor(maxMemories: number = 24, halfLife: number = 120.0) {
    this.maxMemories = maxMemories;
    this.decayHalfLifeSeconds = halfLife;
  }

  public addMemory(
    eventType: string,
    location: IVector3D,
    timestamp: number,
    valence: number,
    strength: number = 1.0,
    entityId?: string,
    details?: Record<string, any>
  ): MemoryRecord {
    // Check if a similar memory exists to reinforce it
    if (entityId) {
      const existing = this._memories.find(
        (m) => m.entityId === entityId && m.eventType === eventType
      );
      if (existing) {
        existing.strength = Math.min(1.0, existing.strength + strength * 0.6);
        existing.timestamp = timestamp;
        existing.location = { ...location };
        existing.valence = existing.valence * 0.5 + valence * 0.5;
        return existing;
      }
    }

    const rec: MemoryRecord = {
      id: Math.random().toString(36).substring(2, 9),
      eventType,
      entityId,
      location: { ...location },
      timestamp,
      valence: Math.max(-1, Math.min(1, valence)),
      strength: Math.max(0, Math.min(1, strength)),
      details,
    };

    this._memories.unshift(rec);
    if (this._memories.length > this.maxMemories) {
      this._memories.pop();
    }
    return rec;
  }

  public update(simDt: number): void {
    const decayFactor = Math.pow(0.5, simDt / this.decayHalfLifeSeconds);
    for (let i = this._memories.length - 1; i >= 0; i--) {
      this._memories[i].strength *= decayFactor;
      if (this._memories[i].strength < 0.05) {
        this._memories.splice(i, 1);
      }
    }
  }

  public findMemoriesNear(pos: IVector3D, radius: number): MemoryRecord[] {
    const radSq = radius * radius;
    return this._memories.filter((m) => {
      const dx = m.location.x - pos.x;
      const dy = m.location.y - pos.y;
      const dz = m.location.z - pos.z;
      return dx * dx + dy * dy + dz * dz <= radSq;
    });
  }

  public getMemoriesWithEntity(entityId: string): MemoryRecord[] {
    return this._memories.filter((m) => m.entityId === entityId);
  }

  public getMemoriesByType(eventType: string): MemoryRecord[] {
    return this._memories.filter((m) => m.eventType === eventType);
  }

  public getMostSalientMemory(eventType?: string): MemoryRecord | null {
    const list = eventType ? this.getMemoriesByType(eventType) : this._memories;
    if (list.length === 0) return null;
    let highest = list[0];
    for (let i = 1; i < list.length; i++) {
      const salience = Math.abs(list[i].valence) * list[i].strength;
      const highestSalience = Math.abs(highest.valence) * highest.strength;
      if (salience > highestSalience) {
        highest = list[i];
      }
    }
    return highest;
  }

  public toJSON(): IMemoryJSON {
    return {
      memories: this._memories.map((m) => ({ ...m })),
    };
  }

  public fromJSON(data: IMemoryJSON): void {
    if (!data?.memories) return;
    this._memories = data.memories.map((m) => ({
      ...m,
      location: { ...m.location },
    }));
  }
}

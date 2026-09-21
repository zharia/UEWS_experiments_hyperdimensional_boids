/**
 * World-level Antic History and Repetition Suppression.
 *
 * Records historical antic episodes and computes repetition penalties
 * to prevent repetitive, monotonous event sequences.
 */

import { Vector3D, IVector3D } from '../../space/physical/Vector3D';
import { AnticType, AnticParticipant } from '../antic/Antic';

export interface AnticHistoryRecord {
  anticId: string;
  type: AnticType;
  startTime: number;
  duration: number;
  participants: AnticParticipant[];
  location: IVector3D;
  outcome: 'completed' | 'interrupted';
  consequencesSummary: string;
}

export interface IAnticHistoryJSON {
  history: AnticHistoryRecord[];
}

export class AnticHistory {
  private _records: AnticHistoryRecord[] = [];
  public maxRecords: number = 50;

  constructor(maxRecords: number = 50) {
    this.maxRecords = maxRecords;
  }

  public record(
    anticId: string,
    type: AnticType,
    startTime: number,
    duration: number,
    participants: AnticParticipant[],
    location: Vector3D,
    outcome: 'completed' | 'interrupted',
    consequencesSummary: string
  ): void {
    const rec: AnticHistoryRecord = {
      anticId,
      type,
      startTime,
      duration,
      participants: [...participants],
      location: location.toJSON(),
      outcome,
      consequencesSummary,
    };

    this._records.unshift(rec);
    if (this._records.length > this.maxRecords) {
      this._records.pop();
    }
  }

  /**
   * Calculates repetition suppression penalty [0.0 to 1.0] for a candidate antic type.
   * Higher penalty if the same antic occurred recently.
   */
  public getRepetitionPenalty(type: AnticType, simTime: number, windowSeconds: number = 30.0): number {
    let count = 0;
    let mostRecentDelta = Infinity;

    for (const rec of this._records) {
      const delta = simTime - rec.startTime;
      if (delta > windowSeconds) break;

      if (rec.type === type) {
        count++;
        if (delta < mostRecentDelta) {
          mostRecentDelta = delta;
        }
      }
    }

    if (count === 0) return 0.0;

    // Penalty increases with frequency and recency
    const recencyFactor = Math.max(0, 1.0 - mostRecentDelta / windowSeconds);
    const frequencyFactor = Math.min(1.0, count * 0.3);
    return Math.min(0.9, recencyFactor * 0.6 + frequencyFactor * 0.4);
  }

  public getRecentAntics(count: number = 10): AnticHistoryRecord[] {
    return this._records.slice(0, count);
  }

  public toJSON(): IAnticHistoryJSON {
    return {
      history: this._records.map((r) => ({
        ...r,
        participants: [...r.participants],
        location: { ...r.location },
      })),
    };
  }

  public fromJSON(data: IAnticHistoryJSON): void {
    if (!data?.history) return;
    this._records = data.history.map((r) => ({
      ...r,
      participants: [...r.participants],
      location: { ...r.location },
    }));
  }
}

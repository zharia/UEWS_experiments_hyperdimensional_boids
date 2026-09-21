/**
 * Generic Agent Drive System.
 *
 * Models autonomous internal motivations:
 *  - hunger: rises with metabolic energy expenditure, reduced by feeding
 *  - fear: triggered by predators/disturbances, decays in calm environments
 *  - curiosity: drives inspection of novel entities, places, or objects
 *  - rest: fatigue accumulation, reduced by perching/resting
 *  - exploration: urge to patrol and cover unfamiliar regions
 *  - socialisation: drive to associate with conspecifics or schooling peers
 *  - territoriality: urge to defend home zone from intruders
 */

export type DriveType =
  | 'hunger'
  | 'fear'
  | 'curiosity'
  | 'rest'
  | 'exploration'
  | 'socialisation'
  | 'territoriality';

export interface DriveConfig {
  accumulationRate: number; // units per second
  decayRate: number;        // units per second when not triggered
  urgencyThreshold: number; // level above which drive dominates
}

export interface IDrivesJSON {
  values: Record<string, number>;
}

export class DriveSystem {
  private _drives: Map<string, number> = new Map();
  private _configs: Map<string, DriveConfig> = new Map();

  constructor() {
    this.registerDrive('hunger', { accumulationRate: 0.015, decayRate: 0.05, urgencyThreshold: 0.65 });
    this.registerDrive('fear', { accumulationRate: 0.0, decayRate: 0.25, urgencyThreshold: 0.40 });
    this.registerDrive('curiosity', { accumulationRate: 0.03, decayRate: 0.08, urgencyThreshold: 0.55 });
    this.registerDrive('rest', { accumulationRate: 0.01, decayRate: 0.15, urgencyThreshold: 0.70 });
    this.registerDrive('exploration', { accumulationRate: 0.02, decayRate: 0.06, urgencyThreshold: 0.50 });
    this.registerDrive('socialisation', { accumulationRate: 0.025, decayRate: 0.05, urgencyThreshold: 0.60 });
    this.registerDrive('territoriality', { accumulationRate: 0.01, decayRate: 0.04, urgencyThreshold: 0.60 });

    // Initial randomized baselines
    for (const [key] of this._configs) {
      this._drives.set(key, Math.random() * 0.35);
    }
  }

  public registerDrive(name: string, config: DriveConfig, initialValue: number = 0): void {
    this._configs.set(name, config);
    this._drives.set(name, Math.max(0, Math.min(1, initialValue)));
  }

  public get(name: DriveType | string): number {
    return this._drives.get(name) ?? 0;
  }

  public set(name: DriveType | string, val: number): void {
    this._drives.set(name, Math.max(0, Math.min(1, val)));
  }

  public add(name: DriveType | string, delta: number): void {
    const curr = this.get(name);
    this.set(name, curr + delta);
  }

  public satisfy(name: DriveType | string, amount: number): void {
    const curr = this.get(name);
    this.set(name, curr - amount);
  }

  public update(simDt: number): void {
    for (const [name, config] of this._configs.entries()) {
      let val = this._drives.get(name) ?? 0;
      val += config.accumulationRate * simDt;
      this._drives.set(name, Math.max(0, Math.min(1, val)));
    }
  }

  /**
   * Returns list of drives sorted by urgency (highest intensity first)
   */
  public getSortedDrives(): { name: string; value: number; isUrgent: boolean }[] {
    const list: { name: string; value: number; isUrgent: boolean }[] = [];
    for (const [name, val] of this._drives.entries()) {
      const config = this._configs.get(name);
      const isUrgent = config ? val >= config.urgencyThreshold : val >= 0.6;
      list.push({ name, value: val, isUrgent });
    }
    return list.sort((a, b) => b.value - a.value);
  }

  public getDominantDrive(): { name: string; value: number } | null {
    const sorted = this.getSortedDrives();
    return sorted.length > 0 ? sorted[0] : null;
  }

  public toJSON(): IDrivesJSON {
    const obj: Record<string, number> = {};
    for (const [k, v] of this._drives.entries()) {
      obj[k] = v;
    }
    return { values: obj };
  }

  public fromJSON(data: IDrivesJSON): void {
    if (!data?.values) return;
    for (const [k, v] of Object.entries(data.values)) {
      this._drives.set(k, Math.max(0, Math.min(1, v)));
    }
  }
}

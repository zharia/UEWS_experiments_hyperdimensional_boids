/**
 * SimulationClock manages multi-scalar temporal progression.
 * Distinguishes:
 *  - wall clock (real elapsed time)
 *  - simulation clock (world time with acceleration/pausing)
 *  - distinct process frequency channels (locomotion 60Hz, perception 10Hz, behaviour 2Hz, antics 1Hz, ecology 0.1Hz, succession 0.02Hz)
 */

export interface ProcessTickTrigger {
  locomotion: boolean;
  perception: boolean;
  behaviour: boolean;
  antics: boolean;
  ecology: boolean;
  succession: boolean;
}

export interface ClockSnapshot {
  wallTimeMs: number;
  simulationTimeSeconds: number;
  timeScale: number;
  isPaused: boolean;
  tickCount: number;
}

export class SimulationClock {
  // Real world tracking
  private _lastWallTimeMs: number = 0;
  private _wallTimeMs: number = 0;

  // Simulation time in seconds
  private _simulationTimeSeconds: number = 0;
  private _timeScale: number = 1.0;
  private _isPaused: boolean = false;
  private _tickCount: number = 0;

  // Process frequency period thresholds (seconds)
  public static readonly PERIOD_LOCOMOTION = 1.0 / 60.0; // 60 Hz
  public static readonly PERIOD_PERCEPTION = 1.0 / 10.0; // 10 Hz
  public static readonly PERIOD_BEHAVIOUR = 1.0 / 2.0;   // 2 Hz
  public static readonly PERIOD_ANTICS = 1.0 / 1.0;      // 1 Hz
  public static readonly PERIOD_ECOLOGY = 10.0;          // 0.1 Hz
  public static readonly PERIOD_SUCCESSION = 50.0;       // 0.02 Hz

  // Accumulated process timers
  private _accumLocomotion = 0;
  private _accumPerception = 0;
  private _accumBehaviour = 0;
  private _accumAntics = 0;
  private _accumEcology = 0;
  private _accumSuccession = 0;

  constructor(initialSimTime: number = 0, initialScale: number = 1.0) {
    this._simulationTimeSeconds = initialSimTime;
    this._timeScale = initialScale;
    this._wallTimeMs = typeof performance !== 'undefined' ? performance.now() : Date.now();
    this._lastWallTimeMs = this._wallTimeMs;
  }

  public get simulationTime(): number {
    return this._simulationTimeSeconds;
  }

  public set simulationTime(time: number) {
    this._simulationTimeSeconds = Math.max(0, time);
  }

  public get timeScale(): number {
    return this._timeScale;
  }

  public set timeScale(scale: number) {
    this._timeScale = Math.max(0, Math.min(100.0, scale));
  }

  public get isPaused(): boolean {
    return this._isPaused;
  }

  public set isPaused(paused: boolean) {
    this._isPaused = paused;
  }

  public get tickCount(): number {
    return this._tickCount;
  }

  /**
   * Advances the simulation clock by raw elapsed delta (or measures from wall time if dt not provided).
   * Returns a trigger mask indicating which multi-scalar processes should execute this tick.
   */
  public advance(rawDtSeconds?: number): {
    simDt: number;
    triggers: ProcessTickTrigger;
  } {
    const currentWallMs = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const wallDt = rawDtSeconds !== undefined 
      ? rawDtSeconds 
      : Math.min(0.1, (currentWallMs - this._lastWallTimeMs) / 1000);
    this._lastWallTimeMs = currentWallMs;
    this._wallTimeMs = currentWallMs;

    if (this._isPaused || this._timeScale <= 0) {
      return {
        simDt: 0,
        triggers: {
          locomotion: false,
          perception: false,
          behaviour: false,
          antics: false,
          ecology: false,
          succession: false,
        },
      };
    }

    const clampedWallDt = Math.min(0.2, wallDt);
    const simDt = clampedWallDt * this._timeScale;
    this._simulationTimeSeconds += simDt;
    this._tickCount++;

    // Accumulate for multi-scalar sub-processes
    this._accumLocomotion += simDt;
    this._accumPerception += simDt;
    this._accumBehaviour += simDt;
    this._accumAntics += simDt;
    this._accumEcology += simDt;
    this._accumSuccession += simDt;

    const triggers: ProcessTickTrigger = {
      locomotion: this._accumLocomotion >= SimulationClock.PERIOD_LOCOMOTION,
      perception: this._accumPerception >= SimulationClock.PERIOD_PERCEPTION,
      behaviour: this._accumBehaviour >= SimulationClock.PERIOD_BEHAVIOUR,
      antics: this._accumAntics >= SimulationClock.PERIOD_ANTICS,
      ecology: this._accumEcology >= SimulationClock.PERIOD_ECOLOGY,
      succession: this._accumSuccession >= SimulationClock.PERIOD_SUCCESSION,
    };

    if (triggers.locomotion) this._accumLocomotion %= SimulationClock.PERIOD_LOCOMOTION;
    if (triggers.perception) this._accumPerception %= SimulationClock.PERIOD_PERCEPTION;
    if (triggers.behaviour) this._accumBehaviour %= SimulationClock.PERIOD_BEHAVIOUR;
    if (triggers.antics) this._accumAntics %= SimulationClock.PERIOD_ANTICS;
    if (triggers.ecology) this._accumEcology %= SimulationClock.PERIOD_ECOLOGY;
    if (triggers.succession) this._accumSuccession %= SimulationClock.PERIOD_SUCCESSION;

    return { simDt, triggers };
  }

  public captureSnapshot(): ClockSnapshot {
    return {
      wallTimeMs: this._wallTimeMs,
      simulationTimeSeconds: this._simulationTimeSeconds,
      timeScale: this._timeScale,
      isPaused: this._isPaused,
      tickCount: this._tickCount,
    };
  }

  public restoreSnapshot(snapshot: ClockSnapshot): void {
    this._simulationTimeSeconds = snapshot.simulationTimeSeconds;
    this._timeScale = snapshot.timeScale;
    this._isPaused = snapshot.isPaused;
    this._tickCount = snapshot.tickCount;
    this._lastWallTimeMs = typeof performance !== 'undefined' ? performance.now() : Date.now();
  }
}

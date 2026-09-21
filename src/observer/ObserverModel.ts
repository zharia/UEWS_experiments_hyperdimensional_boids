/**
 * Observer Model.
 *
 * Implements observer presence abstraction:
 *  - ABSENT: no user watching; simulation continues independently at full fidelity
 *  - PRESENT: user tab is open or window in background
 *  - WATCHING: active viewport focus and camera gaze
 *  - INTERACTING: user is feeding, cleaning glass, stirring water, or tapping
 *  - INACTIVE: user idle for extended duration
 */

import { ObserverState } from '../antics/salience/AnticSalience';

export class ObserverModel {
  private _state: ObserverState = 'WATCHING';
  private _lastInteractionTimestamp: number = 0;
  private _idleTimeoutSeconds: number = 45.0;

  constructor(initialState: ObserverState = 'WATCHING') {
    this._state = initialState;
    this._lastInteractionTimestamp = Date.now() / 1000;
  }

  public get state(): ObserverState {
    return this._state;
  }

  public set state(s: ObserverState) {
    this._state = s;
  }

  public recordInteraction(): void {
    this._state = 'INTERACTING';
    this._lastInteractionTimestamp = Date.now() / 1000;
  }

  public recordFocus(): void {
    if (this._state !== 'INTERACTING') {
      this._state = 'WATCHING';
    }
  }

  public recordBlur(): void {
    this._state = 'ABSENT';
  }

  public update(): void {
    const now = Date.now() / 1000;
    const idleSeconds = now - this._lastInteractionTimestamp;

    if (this._state === 'INTERACTING' && idleSeconds > 5.0) {
      this._state = 'WATCHING';
    } else if (this._state === 'WATCHING' && idleSeconds > this._idleTimeoutSeconds) {
      this._state = 'INACTIVE';
    }
  }
}

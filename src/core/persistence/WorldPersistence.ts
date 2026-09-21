/**
 * Pluggable Persistence Abstraction.
 *
 * Implements IStorageProvider with:
 *  - MemoryStorageProvider (in-memory for tests, Node, or transient runs)
 *  - LocalStorageProvider (browser localStorage persistence)
 *  - WorldPersistenceService with versioned serialization/deserialization.
 */

import { IWorldStateV01, isValidWorldStateV01 } from '../state/WorldState';

export interface IStorageProvider {
  getItem(key: string): Promise<string | null> | (string | null);
  setItem(key: string, value: string): Promise<void> | void;
  removeItem(key: string): Promise<void> | void;
}

export class MemoryStorageProvider implements IStorageProvider {
  private _store = new Map<string, string>();

  public getItem(key: string): string | null {
    return this._store.get(key) ?? null;
  }

  public setItem(key: string, value: string): void {
    this._store.set(key, value);
  }

  public removeItem(key: string): void {
    this._store.delete(key);
  }

  public clear(): void {
    this._store.clear();
  }
}

export class LocalStorageProvider implements IStorageProvider {
  public getItem(key: string): string | null {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  public setItem(key: string, value: string): void {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      window.localStorage.setItem(key, value);
    } catch {
      // quota or private browsing error handling
    }
  }

  public removeItem(key: string): void {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      window.localStorage.removeItem(key);
    } catch {}
  }
}

export class WorldPersistenceService {
  public static readonly DEFAULT_KEY = 'uews_ecology_world_state_v0.1';
  private _storage: IStorageProvider;

  constructor(storageProvider?: IStorageProvider) {
    if (storageProvider) {
      this._storage = storageProvider;
    } else if (typeof window !== 'undefined' && window.localStorage) {
      this._storage = new LocalStorageProvider();
    } else {
      this._storage = new MemoryStorageProvider();
    }
  }

  public async saveWorld(state: IWorldStateV01, key: string = WorldPersistenceService.DEFAULT_KEY): Promise<boolean> {
    try {
      const json = JSON.stringify(state);
      await this._storage.setItem(key, json);
      return true;
    } catch (err) {
      console.warn('Failed to save world state:', err);
      return false;
    }
  }

  public async loadWorld(key: string = WorldPersistenceService.DEFAULT_KEY): Promise<IWorldStateV01 | null> {
    try {
      const raw = await this._storage.getItem(key);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (isValidWorldStateV01(parsed)) {
        return parsed;
      } else {
        console.warn('Loaded world state failed schema validation');
        return null;
      }
    } catch (err) {
      console.warn('Failed to parse or load world state:', err);
      return null;
    }
  }

  public async hasSavedWorld(key: string = WorldPersistenceService.DEFAULT_KEY): Promise<boolean> {
    const raw = await this._storage.getItem(key);
    return raw !== null && raw.length > 10;
  }

  public async clearSavedWorld(key: string = WorldPersistenceService.DEFAULT_KEY): Promise<void> {
    await this._storage.removeItem(key);
  }
}

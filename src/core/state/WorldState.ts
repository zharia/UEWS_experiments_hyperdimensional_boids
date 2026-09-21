/**
 * Versioned World State Schema (v0.1).
 *
 * Defines serializable representation of complete simulation state:
 *  - schemaVersion
 *  - timestamp
 *  - clock snapshot (simulationTime, timeScale)
 *  - ecological phase and history
 *  - agents (identity, physical, latent, drives, memory, relationships, behaviour)
 *  - ecological resources
 *  - environmental fields
 *  - antic history and active antics
 */

import { ClockSnapshot } from '../clock/SimulationClock';
import { IAgentJSON } from '../../agents/agent/EcologicalAgent';
import { IResourceSystemJSON } from '../../ecology/resources/ResourceSystem';
import { IPhaseStateJSON } from '../../phases/phase/EcologicalPhase';
import { IAnticHistoryJSON } from '../../antics/history/AnticHistory';
import { IAnticJSON } from '../../antics/antic/Antic';

export interface IWorldStateV01 {
  schemaVersion: '0.1';
  savedAtWallTime: number;
  clock: ClockSnapshot;
  phaseState: IPhaseStateJSON;
  agents: IAgentJSON[];
  resources: IResourceSystemJSON;
  fields: any;
  anticHistory: IAnticHistoryJSON;
  activeAntics: IAnticJSON[];
  metadata?: {
    tankName: string;
    description?: string;
  };
}

export function isValidWorldStateV01(data: any): data is IWorldStateV01 {
  if (!data || typeof data !== 'object') return false;
  if (data.schemaVersion !== '0.1') return false;
  if (!data.clock || typeof data.clock.simulationTimeSeconds !== 'number') return false;
  if (!data.phaseState || typeof data.phaseState.currentPhase !== 'string') return false;
  if (!Array.isArray(data.agents)) return false;
  return true;
}
